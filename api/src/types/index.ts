// ============================================================
// Core domain types for ORHA Money & Retention Dashboard
// ============================================================

/** A single payment row parsed from the Payments export */
export interface PaymentRow {
  membershipStartDate: Date | null;
  txnType: string;
  txDate: Date | null;
  memberTerritory: string;
  credit: number;
  feeItem: string;
  rawRow: Record<string, unknown>;
}

/** A single renewal/retention row parsed from the Renewal export */
export interface RetentionRow {
  contactName: string;
  memberTerritory: string;
  renewalMonth: string;
  invoiceAmount: number;
  amountDue: number;
  paidDate: Date | null;
  membershipInvoiceUrl: string;
  membershipStatus: string;
  rawRow: Record<string, unknown>;
}

/** Budget category discriminator */
export type BudgetCategory = 'restaurant_dues' | 'vendor_program';

/** Monthly budget entry */
export interface Budget {
  id: string;
  year: number;
  month: number; // 1-12
  category: BudgetCategory;
  amount: number;
  updatedAt: string; // ISO date
}

/** Territory allocation for a manual adjustment */
export interface TerritoryAllocation {
  territory: string;
  amount: number;
}

/** Manual adjustment entry */
export interface ManualAdjustment {
  id: string;
  year: number;
  month: number; // 1-12
  date: string; // ISO date
  amount: number;
  category: BudgetCategory;
  allocations: TerritoryAllocation[]; // empty = "Unassigned"
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Metadata about an uploaded file */
export interface UploadRecord {
  id: string;
  year: number;
  month: number;
  fileType: 'payments' | 'retention';
  originalFilename: string;
  storagePath: string;
  uploadedAt: string; // ISO
  rowCount: number;
  errors: string[];
}

/** Aggregated money metrics for a territory (or overall) */
export interface MoneyMetrics {
  territory: string;
  restaurantDuesCollected: number;
  vendorProgramCollected: number;
  totalCollected: number;
  newMoney: number;
  retainedMoney: number;
  manualAdjustments: number;
}

/** Aggregated retention metrics for a territory (or overall) */
export interface RetentionMetrics {
  territory: string;
  totalInvoiceAmount: number;
  amountPaid: number;
  amountUnpaid: number;
  retentionPct: number; // 0-100
  countDue: number;
  countPaid: number;
  countUnpaid: number;
}

/** A past-due row for display */
export interface PastDueEntry {
  contactName: string;
  memberTerritory: string;
  invoiceAmount: number;
  amountDue: number;
  membershipInvoiceUrl: string;
}

/** Complete dashboard data for a month */
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

/** Parsing result wrapper */
export interface ParseResult<T> {
  rows: T[];
  errors: string[];
  warnings: string[];
}
