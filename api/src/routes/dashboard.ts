import { Router, Request, Response } from 'express';
import {
  getPaymentRows,
  getRetentionRows,
  getBudgets,
  getAdjustmentsForMonth,
  getUploadsForMonth,
} from '../storage/store';
import { buildDashboard } from '../services/calculator';

const router = Router();

/**
 * GET /api/dashboard?year=2026&month=2
 * Returns the full dashboard data for a given month.
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month. Provide ?year=YYYY&month=M (1-12).',
      });
    }

    const payments = getPaymentRows(year, month);
    const retention = getRetentionRows(year, month);
    const budgets = getBudgets();
    const adjustments = getAdjustmentsForMonth(year, month);
    const uploads = getUploadsForMonth(year, month);

    const data = buildDashboard(
      payments,
      retention,
      budgets,
      adjustments,
      uploads,
      year,
      month
    );

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
