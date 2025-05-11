import axios from 'axios';
import Constants from 'expo-constants';
import authService from './authService';

// Get the API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
console.log('Pharmacy Service using API URL:', API_URL);

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
export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  openingHours?: Record<string, string>;
  isVerified: boolean;
  isActive: boolean;
}

export interface PharmacySearchResponse {
  pharmacies: Pharmacy[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PharmacyAvailabilityResponse {
  pharmacy: Pharmacy;
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
  drug?: {
    id: number;
    name: string;
    nameFR: string;
    nameEN: string;
    dosageForm?: string;
    strength?: string;
  };
  reporter?: {
    id: number;
    username: string;
  };
}

// Pharmacy service
const pharmacyService = {
  // Search pharmacies
  searchPharmacies: async (
    query?: string,
    city?: string,
    page: number = 1,
    limit: number = 20,
    verified?: boolean
  ): Promise<PharmacySearchResponse> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (city) params.append('city', city);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (verified !== undefined) params.append('verified', verified.toString());

      const response = await api.get(`/pharmacies?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to search pharmacies');
      }
      throw new Error('Network error while searching pharmacies');
    }
  },

  // Get nearby pharmacies
  getNearbyPharmacies: async (
    latitude: number,
    longitude: number,
    radius: number = 5, // in kilometers
    limit: number = 20
  ): Promise<Pharmacy[]> => {
    try {
      // Validate parameters
      if (latitude === undefined || longitude === undefined) {
        throw new Error('Latitude and longitude are required');
      }

      const params = new URLSearchParams();
      // Use lat and lng as expected by the backend
      params.append('lat', latitude.toString());
      params.append('lng', longitude.toString());
      params.append('radius', radius.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/pharmacies/nearby?${params.toString()}`);
      // The backend returns an array of pharmacies directly
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch nearby pharmacies');
      }
      throw new Error('Network error while fetching nearby pharmacies');
    }
  },

  // Get pharmacy by ID
  getPharmacyById: async (pharmacyId: number): Promise<Pharmacy> => {
    try {
      if (!pharmacyId || isNaN(pharmacyId)) {
        throw new Error('Invalid pharmacy ID');
      }

      console.log(`Fetching pharmacy with ID: ${pharmacyId}`);
      const response = await api.get(`/pharmacies/${pharmacyId}`);

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('Pharmacy data received successfully');
      return response.data;
    } catch (error) {
      console.error('Error in getPharmacyById:', error);
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Failed to fetch pharmacy';
        console.error(`API error (${status}):`, message);
        throw new Error(message);
      }
      throw new Error('Network error while fetching pharmacy');
    }
  },

  // Get pharmacy availability reports
  getPharmacyAvailability: async (
    pharmacyId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PharmacyAvailabilityResponse> => {
    try {
      if (!pharmacyId || isNaN(pharmacyId)) {
        throw new Error('Invalid pharmacy ID');
      }

      console.log(`Fetching availability reports for pharmacy ID: ${pharmacyId}`);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/pharmacies/${pharmacyId}/availability?${params.toString()}`);

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      // Log the exact structure of the response
      console.log('EXACT PHARMACY AVAILABILITY RESPONSE:', JSON.stringify(response.data));

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
          pharmacy: response.data.pharmacy || null,
          reports: response.data.availability,
          total: response.data.availability.length,
          page: page,
          totalPages: 1
        };
      } else {
        console.error('Unexpected response format:', response.data);
        // Return a valid but empty response
        return {
          pharmacy: response.data.pharmacy || null,
          reports: [],
          total: 0,
          page: page,
          totalPages: 0
        };
      }
    } catch (error) {
      console.error('Error in getPharmacyAvailability:', error);
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Failed to fetch pharmacy availability';
        console.error(`API error (${status}):`, message);
        throw new Error(message);
      }
      throw new Error('Network error while fetching pharmacy availability');
    }
  },
};

export default pharmacyService;
