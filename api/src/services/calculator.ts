import {
  PaymentRow,
  RetentionRow,
  ManualAdjustment,
  Budget,
  MoneyMetrics,
  RetentionMetrics,
  PastDueEntry,
  DashboardData,
  UploadRecord,
} from '../types';

const KNOWN_TERRITORIES = [
  'Territory 1',
  'Territory 2',
  'Territory 3',
  'Territory 4',
  'Vendor Territory 1',
];

// ── Classification helpers (exported for testing) ────────────

/**
 * Determine if a fee item belongs to the Vendor Program.
 * Rule: Fee Item contains "Vendor" (case-insensitive).
 */
export function isVendorFeeItem(feeItem: string): boolean {
  return feeItem.toLowerCase().includes('vendor');
}

/**
 * Determine if a payment represents "new money".
 * Rule: Membership Start Date year == the selected year.
 */
export function isNewMoney(membershipStartDate: Date | string | null, selectedYear: number): boolean {
  if (!membershipStartDate) return false;
  const d = membershipStartDate instanceof Date ? membershipStartDate : new Date(membershipStartDate);
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === selectedYear;
}

/**
 * Determine if a retention row is "paid".
 * Rule: Amount Due == 0 OR Paid Date is not empty.
 */
export function isPaid(amountDue: number, paidDate: Date | string | null): boolean {
  if (amountDue === 0) return true;
  if (paidDate == null) return false;
  if (paidDate instanceof Date) return !isNaN(paidDate.getTime());
  const s = String(paidDate).trim();
  if (!s) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

/**
 * Check if a raw row is the totals/summary row that should be excluded.
 */
export function isTotalsRow(row: PaymentRow): boolean {
  // The totals row has no real txnType and the rawRow's membership start date
  // field contains "Count\Average\Totals" or similar.
  const raw = row.rawRow || {};
  for (const val of Object.values(raw)) {
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower.includes('count') && lower.includes('totals')) {
        return true;
      }
    }
  }
  return false;
}

// ── Filtering ────────────────────────────────────────────────

/**
 * Filter payment rows for a selected month.
 * - TxnType must be non-empty
 * - TxDate must fall within the selected year/month
 * - Exclude totals rows
 */
export function filterPaymentsForMonth(
  rows: PaymentRow[],
  year: number,
  month: number
): PaymentRow[] {
  return rows.filter((r) => {
    // Must have a txnType
    if (!r.txnType || r.txnType.trim() === '') return false;

    // Exclude totals rows
    if (isTotalsRow(r)) return false;

    // TxDate must be in the selected month
    const txDate = r.txDate instanceof Date ? r.txDate : new Date(r.txDate as any);
    if (isNaN(txDate.getTime())) return false;
    if (txDate.getFullYear() !== year) return false;
    if (txDate.getMonth() + 1 !== month) return false;

    return true;
  });
}

/**
 * Filter retention rows for a selected month name.
 */
export function filterRetentionForMonth(
  rows: RetentionRow[],
  monthName: string
): RetentionRow[] {
  const target = monthName.toLowerCase().trim();
  return rows.filter((r) => {
    // Renewal Month must match
    if (r.renewalMonth.toLowerCase().trim() !== target) return false;
    // Membership Status must be Active (if present)
    if (r.membershipStatus && r.membershipStatus.toLowerCase() !== 'active') return false;
    return true;
  });
}

// ── Month name helper ────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

// ── Money Calculation ────────────────────────────────────────

function emptyMoneyMetrics(territory: string): MoneyMetrics {
  return {
    territory,
    restaurantDuesCollected: 0,
    vendorProgramCollected: 0,
    totalCollected: 0,
    newMoney: 0,
    retainedMoney: 0,
    manualAdjustments: 0,
  };
}

export function calculateMoneyMetrics(
  payments: PaymentRow[],
  adjustments: ManualAdjustment[],
  year: number,
  month: number
): { overall: MoneyMetrics; byTerritory: MoneyMetrics[] } {
  const filtered = filterPaymentsForMonth(payments, year, month);

  // Initialize territory buckets
  const territoryMap = new Map<string, MoneyMetrics>();
  for (const t of KNOWN_TERRITORIES) {
    territoryMap.set(t, emptyMoneyMetrics(t));
  }
  // Also add "Unassigned"
  territoryMap.set('Unassigned', emptyMoneyMetrics('Unassigned'));

  for (const row of filtered) {
    const territory = row.memberTerritory || 'Unassigned';
    if (!territoryMap.has(territory)) {
      territoryMap.set(territory, emptyMoneyMetrics(territory));
    }
    const bucket = territoryMap.get(territory)!;

    const isVendor = isVendorFeeItem(row.feeItem);
    const credit = row.credit;

    if (isVendor) {
      bucket.vendorProgramCollected += credit;
    } else {
      bucket.restaurantDuesCollected += credit;
    }

    if (isNewMoney(row.membershipStartDate, year)) {
      bucket.newMoney += credit;
    } else {
      bucket.retainedMoney += credit;
    }
  }

  // Apply manual adjustments
  const monthAdj = adjustments.filter((a) => a.year === year && a.month === month);
  for (const adj of monthAdj) {
    if (adj.allocations && adj.allocations.length > 0) {
      // Allocated across territories
      for (const alloc of adj.allocations) {
        const t = alloc.territory || 'Unassigned';
        if (!territoryMap.has(t)) {
          territoryMap.set(t, emptyMoneyMetrics(t));
        }
        const bucket = territoryMap.get(t)!;
        bucket.manualAdjustments += alloc.amount;
        if (adj.category === 'vendor_program') {
          bucket.vendorProgramCollected += alloc.amount;
        } else {
          bucket.restaurantDuesCollected += alloc.amount;
        }
      }
    } else {
      // Unassigned
      if (!territoryMap.has('Unassigned')) {
        territoryMap.set('Unassigned', emptyMoneyMetrics('Unassigned'));
      }
      const bucket = territoryMap.get('Unassigned')!;
      bucket.manualAdjustments += adj.amount;
      if (adj.category === 'vendor_program') {
        bucket.vendorProgramCollected += adj.amount;
      } else {
        bucket.restaurantDuesCollected += adj.amount;
      }
    }
  }

  // Compute totals for each territory
  for (const bucket of territoryMap.values()) {
    bucket.totalCollected =
      bucket.restaurantDuesCollected + bucket.vendorProgramCollected;
  }

  // Compute overall
  const overall = emptyMoneyMetrics('Overall');
  for (const bucket of territoryMap.values()) {
    overall.restaurantDuesCollected += bucket.restaurantDuesCollected;
    overall.vendorProgramCollected += bucket.vendorProgramCollected;
    overall.totalCollected += bucket.totalCollected;
    overall.newMoney += bucket.newMoney;
    overall.retainedMoney += bucket.retainedMoney;
    overall.manualAdjustments += bucket.manualAdjustments;
  }

  // Remove territories with no data
  const byTerritory = Array.from(territoryMap.values()).filter(
    (t) => t.totalCollected !== 0 || t.manualAdjustments !== 0
  );

  return { overall, byTerritory };
}

// ── Retention Calculation ────────────────────────────────────

function emptyRetentionMetrics(territory: string): RetentionMetrics {
  return {
    territory,
    totalInvoiceAmount: 0,
    amountPaid: 0,
    amountUnpaid: 0,
    retentionPct: 0,
    countDue: 0,
    countPaid: 0,
    countUnpaid: 0,
  };
}

export function calculateRetentionMetrics(
  rows: RetentionRow[],
  month: number
): { overall: RetentionMetrics; byTerritory: RetentionMetrics[]; pastDue: PastDueEntry[] } {
  const mName = monthName(month);
  const filtered = filterRetentionForMonth(rows, mName);

  const territoryMap = new Map<string, RetentionMetrics>();
  for (const t of KNOWN_TERRITORIES) {
    territoryMap.set(t, emptyRetentionMetrics(t));
  }
  territoryMap.set('Unassigned', emptyRetentionMetrics('Unassigned'));

  const pastDue: PastDueEntry[] = [];

  for (const row of filtered) {
    const territory = row.memberTerritory || 'Unassigned';
    if (!territoryMap.has(territory)) {
      territoryMap.set(territory, emptyRetentionMetrics(territory));
    }
    const bucket = territoryMap.get(territory)!;

    bucket.totalInvoiceAmount += row.invoiceAmount;
    bucket.countDue += 1;

    const paid = isPaid(row.amountDue, row.paidDate);
    if (paid) {
      bucket.amountPaid += row.invoiceAmount;
      bucket.countPaid += 1;
    } else {
      bucket.amountUnpaid += row.invoiceAmount;
      bucket.countUnpaid += 1;

      if (row.amountDue > 0) {
        pastDue.push({
          contactName: row.contactName,
          memberTerritory: row.memberTerritory || 'Unassigned',
          invoiceAmount: row.invoiceAmount,
          amountDue: row.amountDue,
          membershipInvoiceUrl: row.membershipInvoiceUrl,
        });
      }
    }
  }

  // Calculate retention percentages
  for (const bucket of territoryMap.values()) {
    bucket.retentionPct =
      bucket.totalInvoiceAmount > 0
        ? (bucket.amountPaid / bucket.totalInvoiceAmount) * 100
        : 0;
  }

  // Overall
  const overall = emptyRetentionMetrics('Overall');
  for (const bucket of territoryMap.values()) {
    overall.totalInvoiceAmount += bucket.totalInvoiceAmount;
    overall.amountPaid += bucket.amountPaid;
    overall.amountUnpaid += bucket.amountUnpaid;
    overall.countDue += bucket.countDue;
    overall.countPaid += bucket.countPaid;
    overall.countUnpaid += bucket.countUnpaid;
  }
  overall.retentionPct =
    overall.totalInvoiceAmount > 0
      ? (overall.amountPaid / overall.totalInvoiceAmount) * 100
      : 0;

  // Sort past due by amount descending
  pastDue.sort((a, b) => b.amountDue - a.amountDue);

  const byTerritory = Array.from(territoryMap.values()).filter(
    (t) => t.countDue > 0
  );

  return { overall, byTerritory, pastDue };
}

// ── Full Dashboard Assembly ──────────────────────────────────

export function buildDashboard(
  paymentRows: PaymentRow[],
  retentionRows: RetentionRow[],
  budgets: Budget[],
  adjustments: ManualAdjustment[],
  uploads: UploadRecord[],
  year: number,
  month: number
): DashboardData {
  const money = calculateMoneyMetrics(paymentRows, adjustments, year, month);
  const retention = calculateRetentionMetrics(retentionRows, month);

  const restaurantBudget =
    budgets.find(
      (b) => b.year === year && b.month === month && b.category === 'restaurant_dues'
    )?.amount || 0;
  const vendorBudget =
    budgets.find(
      (b) => b.year === year && b.month === month && b.category === 'vendor_program'
    )?.amount || 0;

  return {
    year,
    month,
    overallMoney: money.overall,
    territoryMoney: money.byTerritory,
    budgets: {
      restaurantDues: restaurantBudget,
      vendorProgram: vendorBudget,
      total: restaurantBudget + vendorBudget,
    },
    overallRetention: retention.overall,
    territoryRetention: retention.byTerritory,
    pastDue: retention.pastDue,
    uploads: uploads.filter((u) => u.year === year && u.month === month),
    manualAdjustments: adjustments.filter(
      (a) => a.year === year && a.month === month
    ),
  };
}
