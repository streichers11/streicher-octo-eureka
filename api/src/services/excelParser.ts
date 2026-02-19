import * as XLSX from 'xlsx';
import { PaymentRow, RetentionRow, ParseResult } from '../types';

/**
 * Normalize a column header: lowercase, trim whitespace.
 */
function normalizeHeader(h: string): string {
  return (h || '').toString().trim().toLowerCase();
}

/**
 * Find column index by normalized name from the header row.
 * Returns the original key name from the sheet or null.
 */
function findColumn(
  row: Record<string, unknown>,
  target: string
): string | null {
  const targetNorm = target.toLowerCase().trim();
  for (const key of Object.keys(row)) {
    if (normalizeHeader(key) === targetNorm) return key;
  }
  return null;
}

/**
 * Parse an Excel date value (serial number or string) into a Date or null.
 */
function parseExcelDate(val: unknown): Date | null {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === 'string') {
    const str = val.trim();
    if (!str) return null;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function parseNumber(val: unknown): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[$,]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Detect if a row is the "totals" row in the payments report.
 * The totals row has "Count\Average\Totals" (or similar) in the
 * Membership Start Date column.
 */
function isTotalsRow(row: Record<string, unknown>, startDateKey: string | null): boolean {
  if (!startDateKey) return false;
  const val = row[startDateKey];
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    return lower.includes('count') || lower.includes('average') || lower.includes('totals');
  }
  return false;
}

// ── Payments Parser ──────────────────────────────────────────

const PAYMENT_REQUIRED_COLUMNS = [
  'membership start date',
  'txntype',
  'txdate',
  'member territory',
  'credit',
  'fee item',
];

export function parsePaymentsFile(buffer: Buffer): ParseResult<PaymentRow> {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find the payments sheet (match partial name, case-insensitive)
  let sheetName = workbook.SheetNames.find((s) =>
    s.toLowerCase().includes('payment')
  );
  if (!sheetName) {
    // Fall back to first sheet
    sheetName = workbook.SheetNames[0];
    warnings.push(
      `Could not find a sheet with "payment" in its name. Using first sheet: "${sheetName}".`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    errors.push('The payments sheet is empty.');
    return { rows: [], errors, warnings };
  }

  // Validate required columns
  const firstRow = rawRows[0];
  const columnMap: Record<string, string | null> = {};
  for (const col of PAYMENT_REQUIRED_COLUMNS) {
    const found = findColumn(firstRow, col);
    columnMap[col] = found;
    if (!found) {
      errors.push(
        `Missing required column "${col}". Found columns: ${Object.keys(firstRow).join(', ')}. ` +
          `Please check your GrowthZone export includes this column.`
      );
    }
  }

  if (errors.length > 0) {
    return { rows: [], errors, warnings };
  }

  const startDateKey = columnMap['membership start date']!;
  const txnTypeKey = columnMap['txntype']!;
  const txDateKey = columnMap['txdate']!;
  const territoryKey = columnMap['member territory']!;
  const creditKey = columnMap['credit']!;
  const feeItemKey = columnMap['fee item']!;

  const rows: PaymentRow[] = [];
  for (const raw of rawRows) {
    // Skip totals row
    if (isTotalsRow(raw, startDateKey)) {
      warnings.push('Detected and removed totals/summary row.');
      continue;
    }

    rows.push({
      membershipStartDate: parseExcelDate(raw[startDateKey]),
      txnType: String(raw[txnTypeKey] || '').trim(),
      txDate: parseExcelDate(raw[txDateKey]),
      memberTerritory: String(raw[territoryKey] || '').trim(),
      credit: parseNumber(raw[creditKey]),
      feeItem: String(raw[feeItemKey] || '').trim(),
      rawRow: raw,
    });
  }

  return { rows, errors, warnings };
}

// ── Retention Parser ─────────────────────────────────────────

const RETENTION_REQUIRED_COLUMNS = [
  'contact name',
  'member territory',
  'renewal month',
  'invoice amount',
  'amount due',
];

export function parseRetentionFile(buffer: Buffer): ParseResult<RetentionRow> {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const errors: string[] = [];
  const warnings: string[] = [];

  let sheetName = workbook.SheetNames.find((s) =>
    s.toLowerCase().includes('renewal')
  );
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
    warnings.push(
      `Could not find a sheet with "renewal" in its name. Using first sheet: "${sheetName}".`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    errors.push('The retention sheet is empty.');
    return { rows: [], errors, warnings };
  }

  const firstRow = rawRows[0];
  const columnMap: Record<string, string | null> = {};
  for (const col of RETENTION_REQUIRED_COLUMNS) {
    const found = findColumn(firstRow, col);
    columnMap[col] = found;
    if (!found) {
      errors.push(
        `Missing required column "${col}". Found columns: ${Object.keys(firstRow).join(', ')}. ` +
          `Please check your GrowthZone export includes this column.`
      );
    }
  }

  // Optional columns
  const paidDateKey = findColumn(firstRow, 'paid date');
  const urlKey = findColumn(firstRow, 'membership invoice url');
  const statusKey = findColumn(firstRow, 'membership status');

  if (errors.length > 0) {
    return { rows: [], errors, warnings };
  }

  const nameKey = columnMap['contact name']!;
  const territoryKey = columnMap['member territory']!;
  const renewalKey = columnMap['renewal month']!;
  const invoiceKey = columnMap['invoice amount']!;
  const dueKey = columnMap['amount due']!;

  const rows: RetentionRow[] = [];
  for (const raw of rawRows) {
    rows.push({
      contactName: String(raw[nameKey] || '').trim(),
      memberTerritory: String(raw[territoryKey] || '').trim(),
      renewalMonth: String(raw[renewalKey] || '').trim(),
      invoiceAmount: parseNumber(raw[invoiceKey]),
      amountDue: parseNumber(raw[dueKey]),
      paidDate: paidDateKey ? parseExcelDate(raw[paidDateKey]) : null,
      membershipInvoiceUrl: urlKey ? String(raw[urlKey] || '').trim() : '',
      membershipStatus: statusKey ? String(raw[statusKey] || '').trim() : '',
      rawRow: raw,
    });
  }

  return { rows, errors, warnings };
}
