import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Label,
  Select,
  Spinner,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Textarea,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  ArrowUpload24Regular,
  Delete24Regular,
  Save24Regular,
} from '@fluentui/react-icons';
import MonthSelector from '../components/MonthSelector';
import {
  uploadFile,
  fetchBudgets,
  saveBudget,
  fetchAdjustments,
  createAdjustment,
  deleteAdjustmentApi,
  fetchUploadHistory,
} from '../services/api';
import { Budget, ManualAdjustment, UploadRecord } from '../types';
import {
  formatCurrencyExact,
  formatTimestamp,
  MONTH_NAMES,
  TERRITORIES,
} from '../utils/format';

const useStyles = makeStyles({
  section: {
    marginBottom: '32px',
  },
  card: {
    padding: '16px',
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  uploadArea: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  uploadCard: {
    flex: 1,
    minWidth: '300px',
    padding: '20px',
  },
  fileInput: {
    marginTop: '8px',
    marginBottom: '12px',
  },
  alert: {
    marginBottom: '12px',
  },
});

const AdminPage: React.FC = () => {
  const classes = useStyles();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Uploads
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null);
  const [retentionFile, setRetentionFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [restaurantBudget, setRestaurantBudget] = useState('');
  const [vendorBudget, setVendorBudget] = useState('');
  const [budgetMsg, setBudgetMsg] = useState<string | null>(null);

  // Adjustments
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([]);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjCategory, setAdjCategory] = useState<'restaurant_dues' | 'vendor_program'>('restaurant_dues');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjDate, setAdjDate] = useState(`${year}-${String(month).padStart(2, '0')}-15`);

  // Upload history
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);

  const loadData = useCallback(async () => {
    const [budgetRes, adjRes, uploadRes] = await Promise.all([
      fetchBudgets(year, month),
      fetchAdjustments(year, month),
      fetchUploadHistory(),
    ]);
    if (budgetRes.success && budgetRes.data) {
      setBudgets(budgetRes.data);
      const rb = budgetRes.data.find((b) => b.category === 'restaurant_dues');
      const vb = budgetRes.data.find((b) => b.category === 'vendor_program');
      setRestaurantBudget(rb ? String(rb.amount) : '');
      setVendorBudget(vb ? String(vb.amount) : '');
    }
    if (adjRes.success && adjRes.data) setAdjustments(adjRes.data);
    if (uploadRes.success && uploadRes.data) setUploadHistory(uploadRes.data);
  }, [year, month]);

  useEffect(() => {
    loadData();
    setAdjDate(`${year}-${String(month).padStart(2, '0')}-15`);
  }, [loadData, year, month]);

  // ── Upload Handler ─────────────────────────────────────────

  const handleUpload = async (type: 'payments' | 'retention') => {
    const file = type === 'payments' ? paymentsFile : retentionFile;
    if (!file) {
      setUploadMsg({ type: 'error', text: `Please select a ${type} file first.` });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await uploadFile(type, file, year, month);
      if (res.success) {
        const warnings = res.data?.warnings || [];
        setUploadMsg({
          type: 'success',
          text: `${type} file uploaded successfully (${res.data?.upload.rowCount} rows).${
            warnings.length > 0 ? ' Warnings: ' + warnings.join('; ') : ''
          }`,
        });
        loadData();
        if (type === 'payments') setPaymentsFile(null);
        else setRetentionFile(null);
      } else {
        const details = (res as any).details?.join('; ') || res.error;
        setUploadMsg({ type: 'error', text: `Upload failed: ${details}` });
      }
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // ── Budget Handler ─────────────────────────────────────────

  const handleSaveBudgets = async () => {
    setBudgetMsg(null);
    try {
      await Promise.all([
        saveBudget({
          year,
          month,
          category: 'restaurant_dues',
          amount: parseFloat(restaurantBudget) || 0,
        }),
        saveBudget({
          year,
          month,
          category: 'vendor_program',
          amount: parseFloat(vendorBudget) || 0,
        }),
      ]);
      setBudgetMsg('Budgets saved.');
      loadData();
    } catch (err: any) {
      setBudgetMsg('Error saving budgets: ' + err.message);
    }
  };

  // ── Adjustment Handlers ────────────────────────────────────

  const handleAddAdjustment = async () => {
    if (!adjAmount) return;
    try {
      await createAdjustment({
        year,
        month,
        date: adjDate,
        amount: parseFloat(adjAmount),
        category: adjCategory,
        allocations: [],
        notes: adjNotes,
      });
      setAdjAmount('');
      setAdjNotes('');
      loadData();
    } catch (err) {
      // ignore
    }
  };

  const handleDeleteAdj = async (id: string) => {
    await deleteAdjustmentApi(id);
    loadData();
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <MonthSelector
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </div>

      {/* ── File Uploads ────────────────────────────────────── */}
      <div className={classes.section}>
        <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
          Upload Files
        </Text>
        {uploadMsg && (
          <MessageBar
            intent={uploadMsg.type === 'success' ? 'success' : 'error'}
            className={classes.alert}
          >
            <MessageBarBody>{uploadMsg.text}</MessageBarBody>
          </MessageBar>
        )}
        <div className={classes.uploadArea}>
          <Card className={classes.uploadCard}>
            <Text weight="semibold" block>Payments Report (.xlsx)</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              GrowthZone "ORHA Membership Payment Report" export
            </Text>
            <div className={classes.fileInput}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPaymentsFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              appearance="primary"
              icon={<ArrowUpload24Regular />}
              disabled={!paymentsFile || uploading}
              onClick={() => handleUpload('payments')}
            >
              {uploading ? 'Uploading...' : 'Upload Payments'}
            </Button>
          </Card>

          <Card className={classes.uploadCard}>
            <Text weight="semibold" block>Retention Report (.xlsx)</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              GrowthZone "ORHA Membership Monthly Renewal" export
            </Text>
            <div className={classes.fileInput}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setRetentionFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              appearance="primary"
              icon={<ArrowUpload24Regular />}
              disabled={!retentionFile || uploading}
              onClick={() => handleUpload('retention')}
            >
              {uploading ? 'Uploading...' : 'Upload Retention'}
            </Button>
          </Card>
        </div>
      </div>

      <Divider />

      {/* ── Budgets ─────────────────────────────────────────── */}
      <div className={classes.section} style={{ marginTop: '24px' }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
          Monthly Budgets — {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Card className={classes.card}>
          <div className={classes.row}>
            <div className={classes.field}>
              <Label>Restaurant Dues Budget (GL 01-3200)</Label>
              <Input
                type="number"
                value={restaurantBudget}
                onChange={(_, data) => setRestaurantBudget(data.value)}
                contentBefore={<Text>$</Text>}
              />
            </div>
            <div className={classes.field}>
              <Label>Vendor Program Budget (GL 01-3202)</Label>
              <Input
                type="number"
                value={vendorBudget}
                onChange={(_, data) => setVendorBudget(data.value)}
                contentBefore={<Text>$</Text>}
              />
            </div>
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              onClick={handleSaveBudgets}
            >
              Save Budgets
            </Button>
          </div>
          {budgetMsg && (
            <Text size={200} style={{ color: tokens.colorPaletteGreenForeground1 }}>
              {budgetMsg}
            </Text>
          )}
        </Card>
      </div>

      <Divider />

      {/* ── Manual Adjustments ──────────────────────────────── */}
      <div className={classes.section} style={{ marginTop: '24px' }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
          Manual Adjustments — {MONTH_NAMES[month - 1]} {year}
        </Text>

        <Card className={classes.card}>
          <Text weight="semibold" block style={{ marginBottom: '8px' }}>
            Add Adjustment
          </Text>
          <div className={classes.row}>
            <div className={classes.field}>
              <Label>Date</Label>
              <Input
                type="date"
                value={adjDate}
                onChange={(_, data) => setAdjDate(data.value)}
              />
            </div>
            <div className={classes.field}>
              <Label>Amount</Label>
              <Input
                type="number"
                value={adjAmount}
                onChange={(_, data) => setAdjAmount(data.value)}
                contentBefore={<Text>$</Text>}
              />
            </div>
            <div className={classes.field}>
              <Label>Category</Label>
              <Select
                value={adjCategory}
                onChange={(_, data) =>
                  setAdjCategory(data.value as 'restaurant_dues' | 'vendor_program')
                }
              >
                <option value="restaurant_dues">Restaurant Dues</option>
                <option value="vendor_program">Vendor Program</option>
              </Select>
            </div>
          </div>
          <div className={classes.row}>
            <div className={classes.field} style={{ flex: 1 }}>
              <Label>Notes</Label>
              <Textarea
                value={adjNotes}
                onChange={(_, data) => setAdjNotes(data.value)}
                placeholder="Description of the adjustment..."
              />
            </div>
          </div>
          <Button
            appearance="primary"
            onClick={handleAddAdjustment}
            disabled={!adjAmount}
          >
            Add Adjustment
          </Button>
        </Card>

        {adjustments.length > 0 && (
          <Card className={classes.card}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Notes</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{adj.date}</TableCell>
                    <TableCell>{formatCurrencyExact(adj.amount)}</TableCell>
                    <TableCell>
                      <Badge appearance="tint">
                        {adj.category === 'restaurant_dues'
                          ? 'Restaurant'
                          : 'Vendor'}
                      </Badge>
                    </TableCell>
                    <TableCell>{adj.notes}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        onClick={() => handleDeleteAdj(adj.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Divider />

      {/* ── Upload History ──────────────────────────────────── */}
      <div className={classes.section} style={{ marginTop: '24px' }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
          Upload History
        </Text>
        <Card className={classes.card}>
          {uploadHistory.length === 0 ? (
            <Text>No uploads yet.</Text>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>File</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Month</TableHeaderCell>
                  <TableHeaderCell>Rows</TableHeaderCell>
                  <TableHeaderCell>Uploaded</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadHistory
                  .sort(
                    (a, b) =>
                      new Date(b.uploadedAt).getTime() -
                      new Date(a.uploadedAt).getTime()
                  )
                  .map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.originalFilename}</TableCell>
                      <TableCell>
                        <Badge appearance="tint">
                          {u.fileType === 'payments' ? 'Payments' : 'Retention'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {MONTH_NAMES[u.month - 1]} {u.year}
                      </TableCell>
                      <TableCell>{u.rowCount}</TableCell>
                      <TableCell>{formatTimestamp(u.uploadedAt)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
