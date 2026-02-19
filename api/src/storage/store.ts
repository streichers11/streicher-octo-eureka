import * as fs from 'fs';
import * as path from 'path';
import {
  Budget,
  ManualAdjustment,
  UploadRecord,
  PaymentRow,
  RetentionRow,
} from '../types';

/**
 * JSON-file-based storage for MVP.
 * In production, swap for Azure Table Storage / Cosmos DB.
 * Each collection is stored as a separate JSON file under DATA_DIR.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(file: string): T[] {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, 'utf-8');
  return JSON.parse(raw) as T[];
}

function writeJson<T>(file: string, data: T[]): void {
  ensureDir(DATA_DIR);
  const fp = path.join(DATA_DIR, file);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Budgets ──────────────────────────────────────────────────

export function getBudgets(): Budget[] {
  return readJson<Budget>('budgets.json');
}

export function getBudgetsForMonth(year: number, month: number): Budget[] {
  return getBudgets().filter((b) => b.year === year && b.month === month);
}

export function upsertBudget(budget: Omit<Budget, 'updatedAt'> & { updatedAt?: string }): Budget {
  const budgets = getBudgets();
  const idx = budgets.findIndex(
    (b) => b.year === budget.year && b.month === budget.month && b.category === budget.category
  );
  const record: Budget = {
    ...budget,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    budgets[idx] = record;
  } else {
    budgets.push(record);
  }
  writeJson('budgets.json', budgets);
  return record;
}

// ── Manual Adjustments ───────────────────────────────────────

export function getManualAdjustments(): ManualAdjustment[] {
  return readJson<ManualAdjustment>('adjustments.json');
}

export function getAdjustmentsForMonth(year: number, month: number): ManualAdjustment[] {
  return getManualAdjustments().filter((a) => a.year === year && a.month === month);
}

export function createAdjustment(adj: ManualAdjustment): ManualAdjustment {
  const all = getManualAdjustments();
  all.push(adj);
  writeJson('adjustments.json', all);
  return adj;
}

export function updateAdjustment(id: string, updates: Partial<ManualAdjustment>): ManualAdjustment | null {
  const all = getManualAdjustments();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJson('adjustments.json', all);
  return all[idx];
}

export function deleteAdjustment(id: string): boolean {
  const all = getManualAdjustments();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  all.splice(idx, 1);
  writeJson('adjustments.json', all);
  return true;
}

// ── Upload Records ───────────────────────────────────────────

export function getUploadRecords(): UploadRecord[] {
  return readJson<UploadRecord>('uploads.json');
}

export function getUploadsForMonth(year: number, month: number): UploadRecord[] {
  return getUploadRecords().filter((u) => u.year === year && u.month === month);
}

export function saveUploadRecord(rec: UploadRecord): void {
  const all = getUploadRecords();
  // Replace previous upload of same type for same month
  const idx = all.findIndex(
    (u) => u.year === rec.year && u.month === rec.month && u.fileType === rec.fileType
  );
  if (idx >= 0) {
    all[idx] = rec;
  } else {
    all.push(rec);
  }
  writeJson('uploads.json', all);
}

// ── Parsed Row Storage ───────────────────────────────────────

function parsedFileName(year: number, month: number, type: 'payments' | 'retention'): string {
  return `parsed_${type}_${year}_${String(month).padStart(2, '0')}.json`;
}

export function savePaymentRows(year: number, month: number, rows: PaymentRow[]): void {
  writeJson(parsedFileName(year, month, 'payments'), rows);
}

export function getPaymentRows(year: number, month: number): PaymentRow[] {
  return readJson<PaymentRow>(parsedFileName(year, month, 'payments'));
}

export function saveRetentionRows(year: number, month: number, rows: RetentionRow[]): void {
  writeJson(parsedFileName(year, month, 'retention'), rows);
}

export function getRetentionRows(year: number, month: number): RetentionRow[] {
  return readJson<RetentionRow>(parsedFileName(year, month, 'retention'));
}

// ── File Storage ─────────────────────────────────────────────

export function getUploadsDir(): string {
  ensureDir(UPLOADS_DIR);
  return UPLOADS_DIR;
}

// ── Seed Data ────────────────────────────────────────────────

export function seedIfEmpty(): void {
  ensureDir(DATA_DIR);

  // Seed budgets
  if (getBudgets().length === 0) {
    const seedBudgets: Budget[] = [
      {
        id: 'seed-budget-2026-02-restaurant',
        year: 2026,
        month: 2,
        category: 'restaurant_dues',
        amount: 71799.48,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-budget-2026-02-vendor',
        year: 2026,
        month: 2,
        category: 'vendor_program',
        amount: 20634.64,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-budget-2026-01-restaurant',
        year: 2026,
        month: 1,
        category: 'restaurant_dues',
        amount: 110822.68,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-budget-2026-01-vendor',
        year: 2026,
        month: 1,
        category: 'vendor_program',
        amount: 25339.68,
        updatedAt: new Date().toISOString(),
      },
    ];
    writeJson('budgets.json', seedBudgets);
  }

  // Seed manual adjustments
  if (getManualAdjustments().length === 0) {
    const seedAdj: ManualAdjustment[] = [
      {
        id: 'seed-adj-2026-02-01',
        year: 2026,
        month: 2,
        date: '2026-02-15',
        amount: 57000.0,
        category: 'restaurant_dues',
        allocations: [], // Unassigned
        notes: 'Accounting company check for multiple Mexican restaurants.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    writeJson('adjustments.json', seedAdj);
  }
}
