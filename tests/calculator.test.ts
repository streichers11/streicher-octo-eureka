import {
  isVendorFeeItem,
  isNewMoney,
  isPaid,
  isTotalsRow,
  filterPaymentsForMonth,
  filterRetentionForMonth,
  calculateMoneyMetrics,
  calculateRetentionMetrics,
  monthName,
} from '../api/src/services/calculator';
import { PaymentRow, RetentionRow, ManualAdjustment } from '../api/src/types';

// ── isVendorFeeItem ──────────────────────────────────────────

describe('isVendorFeeItem', () => {
  it('returns true for fee items containing "Vendor" (case-insensitive)', () => {
    expect(isVendorFeeItem('Vendor Membership')).toBe(true);
    expect(isVendorFeeItem('vendor membership')).toBe(true);
    expect(isVendorFeeItem('VENDOR ANNUAL FEE')).toBe(true);
    expect(isVendorFeeItem('Something Vendor Something')).toBe(true);
  });

  it('returns false for non-vendor fee items', () => {
    expect(isVendorFeeItem('Starter Business Membership')).toBe(false);
    expect(isVendorFeeItem('The Works Business Membership')).toBe(false);
    expect(isVendorFeeItem('Opening Shift')).toBe(false);
    expect(isVendorFeeItem('')).toBe(false);
  });
});

// ── isNewMoney ───────────────────────────────────────────────

describe('isNewMoney', () => {
  it('returns true when membership start date year matches selected year', () => {
    expect(isNewMoney(new Date('2026-03-15'), 2026)).toBe(true);
    expect(isNewMoney(new Date('2026-01-01'), 2026)).toBe(true);
  });

  it('returns false when membership start date year does not match', () => {
    expect(isNewMoney(new Date('2025-06-15'), 2026)).toBe(false);
    expect(isNewMoney(new Date('2024-12-31'), 2026)).toBe(false);
  });

  it('returns false for null or invalid dates', () => {
    expect(isNewMoney(null, 2026)).toBe(false);
    expect(isNewMoney('', 2026)).toBe(false);
  });

  it('handles string dates correctly', () => {
    expect(isNewMoney('2026-02-01', 2026)).toBe(true);
    expect(isNewMoney('2025-12-15', 2026)).toBe(false);
  });
});

// ── isPaid ───────────────────────────────────────────────────

describe('isPaid', () => {
  it('returns true when amountDue is 0', () => {
    expect(isPaid(0, null)).toBe(true);
    expect(isPaid(0, '')).toBe(true);
  });

  it('returns true when paidDate is a valid date', () => {
    expect(isPaid(100, new Date('2026-02-10'))).toBe(true);
    expect(isPaid(50, '2026-01-15')).toBe(true);
  });

  it('returns false when amountDue > 0 and no paid date', () => {
    expect(isPaid(100, null)).toBe(false);
    expect(isPaid(50, '')).toBe(false);
  });

  it('returns false for invalid paid date strings', () => {
    expect(isPaid(100, 'not-a-date')).toBe(false);
  });
});

// ── isTotalsRow ──────────────────────────────────────────────

describe('isTotalsRow', () => {
  it('detects rows with "Count\\Average\\Totals" text', () => {
    const row: PaymentRow = {
      membershipStartDate: null,
      txnType: '',
      txDate: null,
      memberTerritory: '',
      credit: 0,
      feeItem: '',
      rawRow: { 'Membership Start Date': 'Count\\Average\\Totals' },
    };
    expect(isTotalsRow(row)).toBe(true);
  });

  it('does not flag normal rows', () => {
    const row: PaymentRow = {
      membershipStartDate: new Date('2026-01-05'),
      txnType: 'Payment',
      txDate: new Date('2026-02-01'),
      memberTerritory: 'Territory 1',
      credit: 500,
      feeItem: 'Starter Business Membership',
      rawRow: { 'Membership Start Date': '2026-01-05' },
    };
    expect(isTotalsRow(row)).toBe(false);
  });
});

// ── filterPaymentsForMonth ───────────────────────────────────

describe('filterPaymentsForMonth', () => {
  const rows: PaymentRow[] = [
    {
      membershipStartDate: new Date('2026-01-10'),
      txnType: 'Payment',
      txDate: new Date('2026-02-05'),
      memberTerritory: 'Territory 1',
      credit: 1000,
      feeItem: 'Starter Business Membership',
      rawRow: {},
    },
    {
      membershipStartDate: new Date('2025-06-01'),
      txnType: 'Payment',
      txDate: new Date('2026-02-15'),
      memberTerritory: 'Territory 2',
      credit: 500,
      feeItem: 'Vendor Membership',
      rawRow: {},
    },
    {
      // January transaction — should be excluded for Feb
      membershipStartDate: new Date('2025-06-01'),
      txnType: 'Payment',
      txDate: new Date('2026-01-20'),
      memberTerritory: 'Territory 1',
      credit: 300,
      feeItem: 'Opening Shift',
      rawRow: {},
    },
    {
      // No TxnType — should be excluded
      membershipStartDate: new Date('2026-02-01'),
      txnType: '',
      txDate: new Date('2026-02-10'),
      memberTerritory: 'Territory 3',
      credit: 200,
      feeItem: 'Something',
      rawRow: {},
    },
  ];

  it('returns only rows in the selected month with non-empty TxnType', () => {
    const result = filterPaymentsForMonth(rows, 2026, 2);
    expect(result).toHaveLength(2);
    expect(result[0].credit).toBe(1000);
    expect(result[1].credit).toBe(500);
  });

  it('returns empty for months with no data', () => {
    const result = filterPaymentsForMonth(rows, 2026, 3);
    expect(result).toHaveLength(0);
  });
});

// ── calculateMoneyMetrics ────────────────────────────────────

describe('calculateMoneyMetrics', () => {
  const payments: PaymentRow[] = [
    {
      membershipStartDate: new Date('2026-01-10'),
      txnType: 'Payment',
      txDate: new Date('2026-02-05'),
      memberTerritory: 'Territory 1',
      credit: 1000,
      feeItem: 'Starter Business Membership',
      rawRow: {},
    },
    {
      membershipStartDate: new Date('2025-06-01'),
      txnType: 'Payment',
      txDate: new Date('2026-02-15'),
      memberTerritory: 'Territory 2',
      credit: 500,
      feeItem: 'Vendor Membership',
      rawRow: {},
    },
    {
      membershipStartDate: new Date('2025-03-01'),
      txnType: 'Payment',
      txDate: new Date('2026-02-20'),
      memberTerritory: 'Territory 1',
      credit: 750,
      feeItem: 'The Works Business Membership',
      rawRow: {},
    },
  ];

  it('correctly categorizes vendor vs restaurant dues', () => {
    const result = calculateMoneyMetrics(payments, [], 2026, 2);
    expect(result.overall.vendorProgramCollected).toBe(500);
    expect(result.overall.restaurantDuesCollected).toBe(1750); // 1000 + 750
  });

  it('correctly categorizes new vs retained money', () => {
    const result = calculateMoneyMetrics(payments, [], 2026, 2);
    // New: started in 2026 → 1000 (Territory 1, started 2026-01-10)
    expect(result.overall.newMoney).toBe(1000);
    // Retained: started before 2026 → 500 + 750 = 1250
    expect(result.overall.retainedMoney).toBe(1250);
  });

  it('includes manual adjustments in totals', () => {
    const adjustments: ManualAdjustment[] = [
      {
        id: 'adj-1',
        year: 2026,
        month: 2,
        date: '2026-02-15',
        amount: 5000,
        category: 'restaurant_dues',
        allocations: [],
        notes: 'Test',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = calculateMoneyMetrics(payments, adjustments, 2026, 2);
    expect(result.overall.restaurantDuesCollected).toBe(1750 + 5000);
    expect(result.overall.totalCollected).toBe(1000 + 500 + 750 + 5000);
    expect(result.overall.manualAdjustments).toBe(5000);
  });

  it('attributes territory data correctly', () => {
    const result = calculateMoneyMetrics(payments, [], 2026, 2);
    const t1 = result.byTerritory.find((t) => t.territory === 'Territory 1');
    expect(t1).toBeDefined();
    expect(t1!.restaurantDuesCollected).toBe(1750);
    expect(t1!.vendorProgramCollected).toBe(0);

    const t2 = result.byTerritory.find((t) => t.territory === 'Territory 2');
    expect(t2).toBeDefined();
    expect(t2!.vendorProgramCollected).toBe(500);
  });
});

// ── calculateRetentionMetrics ────────────────────────────────

describe('calculateRetentionMetrics', () => {
  const rows: RetentionRow[] = [
    {
      contactName: 'Alice Restaurant',
      memberTerritory: 'Territory 1',
      renewalMonth: 'February',
      invoiceAmount: 1000,
      amountDue: 0,
      paidDate: new Date('2026-02-01'),
      membershipInvoiceUrl: 'https://example.com/1',
      membershipStatus: 'Active',
      rawRow: {},
    },
    {
      contactName: 'Bob Bistro',
      memberTerritory: 'Territory 1',
      renewalMonth: 'February',
      invoiceAmount: 800,
      amountDue: 800,
      paidDate: null,
      membershipInvoiceUrl: 'https://example.com/2',
      membershipStatus: 'Active',
      rawRow: {},
    },
    {
      contactName: 'Carol Cafe',
      memberTerritory: 'Territory 2',
      renewalMonth: 'February',
      invoiceAmount: 1200,
      amountDue: 0,
      paidDate: new Date('2026-02-10'),
      membershipInvoiceUrl: 'https://example.com/3',
      membershipStatus: 'Active',
      rawRow: {},
    },
    {
      // March row — should be excluded for February
      contactName: 'Dave Diner',
      memberTerritory: 'Territory 1',
      renewalMonth: 'March',
      invoiceAmount: 500,
      amountDue: 500,
      paidDate: null,
      membershipInvoiceUrl: '',
      membershipStatus: 'Active',
      rawRow: {},
    },
  ];

  it('filters by renewal month', () => {
    const result = calculateRetentionMetrics(rows, 2);
    expect(result.overall.countDue).toBe(3);
  });

  it('correctly identifies paid and unpaid', () => {
    const result = calculateRetentionMetrics(rows, 2);
    expect(result.overall.countPaid).toBe(2);
    expect(result.overall.countUnpaid).toBe(1);
  });

  it('calculates retention percentage correctly', () => {
    const result = calculateRetentionMetrics(rows, 2);
    // Paid amount: 1000 + 1200 = 2200, Total: 1000 + 800 + 1200 = 3000
    expect(result.overall.retentionPct).toBeCloseTo(73.33, 1);
  });

  it('produces past-due entries for unpaid rows', () => {
    const result = calculateRetentionMetrics(rows, 2);
    expect(result.pastDue).toHaveLength(1);
    expect(result.pastDue[0].contactName).toBe('Bob Bistro');
    expect(result.pastDue[0].amountDue).toBe(800);
  });

  it('breaks down by territory', () => {
    const result = calculateRetentionMetrics(rows, 2);
    const t1 = result.byTerritory.find((t) => t.territory === 'Territory 1');
    expect(t1).toBeDefined();
    expect(t1!.countDue).toBe(2);
    expect(t1!.countPaid).toBe(1);

    const t2 = result.byTerritory.find((t) => t.territory === 'Territory 2');
    expect(t2).toBeDefined();
    expect(t2!.countDue).toBe(1);
    expect(t2!.countPaid).toBe(1);
    expect(t2!.retentionPct).toBeCloseTo(100, 0);
  });
});
