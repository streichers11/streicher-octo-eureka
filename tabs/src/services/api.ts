import {
  ApiResponse,
  DashboardData,
  Budget,
  ManualAdjustment,
  UploadRecord,
} from '../types';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────

export async function fetchDashboard(
  year: number,
  month: number
): Promise<ApiResponse<DashboardData>> {
  return request(`/dashboard?year=${year}&month=${month}`);
}

// ── Uploads ──────────────────────────────────────────────────

export async function uploadFile(
  fileType: 'payments' | 'retention',
  file: File,
  year: number,
  month: number
): Promise<ApiResponse<{ upload: UploadRecord; warnings: string[] }>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('year', String(year));
  formData.append('month', String(month));

  const res = await fetch(`${API_BASE}/upload/${fileType}`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

// ── Budgets ──────────────────────────────────────────────────

export async function fetchBudgets(
  year?: number,
  month?: number
): Promise<ApiResponse<Budget[]>> {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  return request(`/admin/budgets?${params}`);
}

export async function saveBudget(budget: {
  year: number;
  month: number;
  category: string;
  amount: number;
}): Promise<ApiResponse<Budget>> {
  return request('/admin/budgets', {
    method: 'PUT',
    body: JSON.stringify(budget),
  });
}

// ── Manual Adjustments ───────────────────────────────────────

export async function fetchAdjustments(
  year?: number,
  month?: number
): Promise<ApiResponse<ManualAdjustment[]>> {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  return request(`/admin/adjustments?${params}`);
}

export async function createAdjustment(
  adj: Omit<ManualAdjustment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<ManualAdjustment>> {
  return request('/admin/adjustments', {
    method: 'POST',
    body: JSON.stringify(adj),
  });
}

export async function deleteAdjustmentApi(
  id: string
): Promise<ApiResponse<void>> {
  return request(`/admin/adjustments/${id}`, { method: 'DELETE' });
}

// ── Upload History ───────────────────────────────────────────

export async function fetchUploadHistory(): Promise<
  ApiResponse<UploadRecord[]>
> {
  return request('/admin/uploads');
}
