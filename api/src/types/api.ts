import { Budget, ManualAdjustment, DashboardData, UploadRecord } from './index';

// API request/response types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  upload: UploadRecord;
  warnings: string[];
}

export interface BudgetUpdateRequest {
  year: number;
  month: number;
  category: 'restaurant_dues' | 'vendor_program';
  amount: number;
}

export interface ManualAdjustmentCreateRequest {
  year: number;
  month: number;
  date: string;
  amount: number;
  category: 'restaurant_dues' | 'vendor_program';
  allocations?: { territory: string; amount: number }[];
  notes: string;
}

export interface DashboardRequest {
  year: number;
  month: number;
}
