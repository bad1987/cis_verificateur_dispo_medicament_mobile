import axios from 'axios';
import Constants from 'expo-constants';
import authService from './authService';

// Get the API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
console.log('Report Service using API URL:', API_URL);

// Create axios instance with auth token interceptor
const api = axios.create({
  baseURL: API_URL,
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
  updatedAt: string;
  pharmacy?: {
    id: number;
    name: string;
    address: string;
    city: string;
  };
  drug?: {
    id: number;
    name: string;
    nameFR: string;
    nameEN: string;
    dosageForm?: string;
    strength?: string;
  };
}

export interface CreateReportRequest {
  pharmacyId: number;
  drugId: number;
  status: 'in_stock' | 'out_of_stock' | 'unknown';
  price?: number;
  notes?: string;
  expiryDate?: string;
}

export interface ReportResponse {
  message: string;
  report: AvailabilityReport;
}

export interface UserReportsResponse {
  reports: AvailabilityReport[];
  total: number;
  page: number;
  totalPages: number;
}

// Report service
const reportService = {
  // Create a new availability report
  createReport: async (reportData: CreateReportRequest): Promise<ReportResponse> => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to create report');
      }
      throw new Error('Network error while creating report');
    }
  },

  // Get user's own reports
  getUserReports: async (
    page: number = 1,
    limit: number = 20,
    status?: 'in_stock' | 'out_of_stock' | 'unknown'
  ): Promise<UserReportsResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const response = await api.get(`/reports/me?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch user reports');
      }
      throw new Error('Network error while fetching user reports');
    }
  },

  // Confirm a report
  confirmReport: async (reportId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/reports/${reportId}/confirm`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to confirm report');
      }
      throw new Error('Network error while confirming report');
    }
  },

  // Dispute a report
  disputeReport: async (reportId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/reports/${reportId}/dispute`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to dispute report');
      }
      throw new Error('Network error while disputing report');
    }
  },

  // Update a report (only if user is the creator)
  updateReport: async (
    reportId: number,
    reportData: Partial<CreateReportRequest>
  ): Promise<ReportResponse> => {
    try {
      const response = await api.put(`/reports/${reportId}`, reportData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to update report');
      }
      throw new Error('Network error while updating report');
    }
  },

  // Delete a report (only if user is the creator)
  deleteReport: async (reportId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to delete report');
      }
      throw new Error('Network error while deleting report');
    }
  },
};

export default reportService;
