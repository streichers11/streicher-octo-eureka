// Mirror of API types for the frontend

export type BudgetCategory = 'restaurant_dues' | 'vendor_program';

export interface Budget {
  id: string;
  year: number;
  month: number;
  category: BudgetCategory;
  amount: number;
  updatedAt: string;
}

export interface TerritoryAllocation {
  territory: string;
  amount: number;
}

export interface ManualAdjustment {
  id: string;
  year: number;
  month: number;
  date: string;
  amount: number;
  category: BudgetCategory;
  allocations: TerritoryAllocation[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRecord {
  id: string;
  year: number;
  month: number;
  fileType: 'payments' | 'retention';
  originalFilename: string;
  storagePath: string;
  uploadedAt: string;
  rowCount: number;
  errors: string[];
}

export interface MoneyMetrics {
  territory: string;
  restaurantDuesCollected: number;
  vendorProgramCollected: number;
  totalCollected: number;
  newMoney: number;
  retainedMoney: number;
  manualAdjustments: number;
}

export interface RetentionMetrics {
  territory: string;
  totalInvoiceAmount: number;
  amountPaid: number;
  amountUnpaid: number;
  retentionPct: number;
  countDue: number;
  countPaid: number;
  countUnpaid: number;
}

export interface PastDueEntry {
  contactName: string;
  memberTerritory: string;
  invoiceAmount: number;
  amountDue: number;
  membershipInvoiceUrl: string;
}

export interface DashboardData {
  year: number;
  month: number;
  overallMoney: MoneyMetrics;
  territoryMoney: MoneyMetrics[];
  budgets: { restaurantDues: number; vendorProgram: number; total: number };
  overallRetention: RetentionMetrics;
  territoryRetention: RetentionMetrics[];
  pastDue: PastDueEntry[];
  uploads: UploadRecord[];
  manualAdjustments: ManualAdjustment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  warnings?: string[];
}
