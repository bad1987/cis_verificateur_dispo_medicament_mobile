import axios from 'axios';
import Constants from 'expo-constants';
import authService from './authService';

// Get the API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
console.log('Drug Service using API URL:', API_URL);

// Create axios instance with auth token interceptor
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Drug {
  id: number;
  name: string;
  nameFR: string;
  nameEN: string;
  description?: string;
  descriptionFR?: string;
  descriptionEN?: string;
  dosageForm?: string;
  strength?: string;
  commonBrandNames?: string[];
  isActive: boolean;
}

export interface DrugSearchResponse {
  drugs: Drug[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DrugAvailabilityResponse {
  drug: Drug;
  reports: AvailabilityReport[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AvailabilityReport {
  id: number;
  pharmacyId: number;
  drugId: number;
  status: 'in_stock' | 'out_of_stock' | 'unknown';
  price?: number;
  notes?: string;
  confirmedCount: number;
  disputedCount: number;
  expiryDate?: string;
  createdAt: string;
  pharmacy?: {
    id: number;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  reporter?: {
    id: number;
    username: string;
  };
}

// Drug service
const drugService = {
  // Search drugs
  searchDrugs: async (
    query?: string,
    language: 'FR' | 'EN' = 'FR',
    page: number = 1,
    limit: number = 20
  ): Promise<DrugSearchResponse> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('language', language);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/drugs?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to search drugs');
      }
      throw new Error('Network error while searching drugs');
    }
  },

  // Get drug by ID
  getDrugById: async (drugId: number): Promise<Drug> => {
    try {
      if (!drugId || isNaN(drugId)) {
        throw new Error('Invalid drug ID');
      }

      console.log(`Fetching drug with ID: ${drugId}`);
      const response = await api.get(`/drugs/${drugId}`);

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('Drug data received successfully');
      return response.data;
    } catch (error) {
      console.error('Error in getDrugById:', error);
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Failed to fetch drug';
        console.error(`API error (${status}):`, message);
        throw new Error(message);
      }
      throw new Error('Network error while fetching drug');
    }
  },

  // Get drug availability reports
  getDrugAvailability: async (
    drugId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<DrugAvailabilityResponse> => {
    try {
      if (!drugId || isNaN(drugId)) {
        throw new Error('Invalid drug ID');
      }

      console.log(`Fetching availability reports for drug ID: ${drugId}`);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/drugs/${drugId}/availability?${params.toString()}`);

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      // Log the exact structure of the response
      console.log('EXACT DRUG AVAILABILITY RESPONSE:', JSON.stringify(response.data));

      // Check if the response has the expected structure
      // The backend might return { reports: [...] } or { availability: [...] }
      if (response.data.reports && Array.isArray(response.data.reports)) {
        console.log(`Received ${response.data.reports.length} availability reports`);
        return response.data;
      }
      // Handle the case where the backend returns { availability: [...] } instead of { reports: [...] }
      else if (response.data.availability && Array.isArray(response.data.availability)) {
        console.log(`Received ${response.data.availability.length} availability reports (in 'availability' field)`);
        // Transform the response to match our expected format
        return {
          drug: response.data.drug || null,
          reports: response.data.availability,
          total: response.data.availability.length,
          page: page,
          totalPages: 1
        };
      } else {
        console.error('Unexpected response format:', response.data);
        // Return a valid but empty response
        return {
          drug: response.data.drug || null,
          reports: [],
          total: 0,
          page: page,
          totalPages: 0
        };
      }
    } catch (error) {
      console.error('Error in getDrugAvailability:', error);
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Failed to fetch drug availability';
        console.error(`API error (${status}):`, message);
        throw new Error(message);
      }
      throw new Error('Network error while fetching drug availability');
    }
  },
};

export default drugService;
