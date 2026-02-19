import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { parsePaymentsFile, parseRetentionFile } from '../services/excelParser';
import {
  getUploadsDir,
  saveUploadRecord,
  savePaymentRows,
  saveRetentionRows,
} from '../storage/store';
import { UploadRecord } from '../types';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadsDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed.'));
    }
  },
});

/**
 * POST /api/upload/payments
 * Body: multipart/form-data with file + year + month
 */
router.post('/payments', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const year = parseInt(req.body.year, 10);
    const month = parseInt(req.body.month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid year or month.' });
    }

    const buffer = require('fs').readFileSync(req.file.path);
    const result = parsePaymentsFile(buffer);

    if (result.errors.length > 0) {
      return res.status(422).json({
        success: false,
        error: 'File parsing failed.',
        details: result.errors,
        warnings: result.warnings,
      });
    }

    // Save parsed rows
    savePaymentRows(year, month, result.rows);

    // Save upload record
    const record: UploadRecord = {
      id: uuid(),
      year,
      month,
      fileType: 'payments',
      originalFilename: req.file.originalname,
      storagePath: req.file.path,
      uploadedAt: new Date().toISOString(),
      rowCount: result.rows.length,
      errors: [],
    };
    saveUploadRecord(record);

    return res.json({
      success: true,
      data: {
        upload: record,
        warnings: result.warnings,
      },
    });
  } catch (err: any) {
    console.error('Upload payments error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/upload/retention
 * Body: multipart/form-data with file + year + month
 */
router.post('/retention', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const year = parseInt(req.body.year, 10);
    const month = parseInt(req.body.month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid year or month.' });
    }

    const buffer = require('fs').readFileSync(req.file.path);
    const result = parseRetentionFile(buffer);

    if (result.errors.length > 0) {
      return res.status(422).json({
        success: false,
        error: 'File parsing failed.',
        details: result.errors,
        warnings: result.warnings,
      });
    }

    saveRetentionRows(year, month, result.rows);

    const record: UploadRecord = {
      id: uuid(),
      year,
      month,
      fileType: 'retention',
      originalFilename: req.file.originalname,
      storagePath: req.file.path,
      uploadedAt: new Date().toISOString(),
      rowCount: result.rows.length,
      errors: [],
    };
    saveUploadRecord(record);

    return res.json({
      success: true,
      data: {
        upload: record,
        warnings: result.warnings,
      },
    });
  } catch (err: any) {
    console.error('Upload retention error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
