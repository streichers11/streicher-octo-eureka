import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  getBudgets,
  upsertBudget,
  getManualAdjustments,
  getAdjustmentsForMonth,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment,
  getUploadRecords,
} from '../storage/store';
import { Budget, ManualAdjustment } from '../types';

const router = Router();

// ── Budgets ──────────────────────────────────────────────────

/** GET /api/admin/budgets?year=2026&month=2 (optional filters) */
router.get('/budgets', (_req: Request, res: Response) => {
  try {
    let budgets = getBudgets();
    const year = _req.query.year ? parseInt(_req.query.year as string, 10) : null;
    const month = _req.query.month ? parseInt(_req.query.month as string, 10) : null;
    if (year) budgets = budgets.filter((b) => b.year === year);
    if (month) budgets = budgets.filter((b) => b.month === month);
    return res.json({ success: true, data: budgets });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** PUT /api/admin/budgets */
router.put('/budgets', (req: Request, res: Response) => {
  try {
    const { year, month, category, amount } = req.body;
    if (!year || !month || !category || amount == null) {
      return res.status(400).json({
        success: false,
        error: 'year, month, category, and amount are required.',
      });
    }
    if (!['restaurant_dues', 'vendor_program'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'category must be "restaurant_dues" or "vendor_program".',
      });
    }
    const budget = upsertBudget({
      id: `budget-${year}-${month}-${category}`,
      year,
      month,
      category,
      amount: parseFloat(amount),
    });
    return res.json({ success: true, data: budget });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Manual Adjustments ───────────────────────────────────────

/** GET /api/admin/adjustments?year=2026&month=2 */
router.get('/adjustments', (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : null;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : null;
    let adjustments = getManualAdjustments();
    if (year) adjustments = adjustments.filter((a) => a.year === year);
    if (month) adjustments = adjustments.filter((a) => a.month === month);
    return res.json({ success: true, data: adjustments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /api/admin/adjustments */
router.post('/adjustments', (req: Request, res: Response) => {
  try {
    const { year, month, date, amount, category, allocations, notes } = req.body;
    if (!year || !month || !date || amount == null || !category) {
      return res.status(400).json({
        success: false,
        error: 'year, month, date, amount, and category are required.',
      });
    }

    const adj: ManualAdjustment = {
      id: uuid(),
      year,
      month,
      date,
      amount: parseFloat(amount),
      category,
      allocations: allocations || [],
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createAdjustment(adj);
    return res.status(201).json({ success: true, data: adj });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** PUT /api/admin/adjustments/:id */
router.put('/adjustments/:id', (req: Request, res: Response) => {
  try {
    const updated = updateAdjustment(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Adjustment not found.' });
    }
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE /api/admin/adjustments/:id */
router.delete('/adjustments/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteAdjustment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Adjustment not found.' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Upload History ───────────────────────────────────────────

/** GET /api/admin/uploads */
router.get('/uploads', (_req: Request, res: Response) => {
  try {
    return res.json({ success: true, data: getUploadRecords() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
