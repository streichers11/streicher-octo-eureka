import React from 'react';
import {
  makeStyles,
  tokens,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Card,
  CardHeader,
} from '@fluentui/react-components';
import { MoneyMetrics, RetentionMetrics } from '../types';
import { formatCurrency, formatPct } from '../utils/format';

const useStyles = makeStyles({
  card: {
    marginBottom: '24px',
    overflow: 'auto',
  },
  table: {
    minWidth: '900px',
  },
  headerCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  numCell: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
});

interface TerritoryTableProps {
  moneyData: MoneyMetrics[];
  retentionData: RetentionMetrics[];
}

const TerritoryTable: React.FC<TerritoryTableProps> = ({
  moneyData,
  retentionData,
}) => {
  const classes = useStyles();

  // Build a merged view: for each territory, join money + retention data
  const territories = new Set([
    ...moneyData.map((m) => m.territory),
    ...retentionData.map((r) => r.territory),
  ]);

  const rows = Array.from(territories).map((t) => {
    const money = moneyData.find((m) => m.territory === t);
    const retention = retentionData.find((r) => r.territory === t);
    return { territory: t, money, retention };
  });

  // Sort: known territories first, then alphabetical
  const order = ['Territory 1', 'Territory 2', 'Territory 3', 'Territory 4', 'Vendor Territory 1', 'Unassigned'];
  rows.sort((a, b) => {
    const ai = order.indexOf(a.territory);
    const bi = order.indexOf(b.territory);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.territory.localeCompare(b.territory);
  });

  return (
    <Card className={classes.card}>
      <CardHeader header={<Text weight="semibold">Territory Breakdown</Text>} />
      <div style={{ overflowX: 'auto' }}>
        <Table className={classes.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={classes.headerCell}>Territory</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Dues Collected</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Vendor Collected</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Total Collected</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>New Money</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Retained Money</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Retention %</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Retention $ Due</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Retention $ Paid</TableHeaderCell>
              <TableHeaderCell className={`${classes.headerCell} ${classes.numCell}`}>Retention $ Unpaid</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.territory}>
                <TableCell>
                  <Text weight="semibold">{row.territory}</Text>
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.money?.restaurantDuesCollected || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.money?.vendorProgramCollected || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.money?.totalCollected || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.money?.newMoney || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.money?.retainedMoney || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {row.retention ? formatPct(row.retention.retentionPct) : '—'}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.retention?.totalInvoiceAmount || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.retention?.amountPaid || 0)}
                </TableCell>
                <TableCell className={classes.numCell}>
                  {formatCurrency(row.retention?.amountUnpaid || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default TerritoryTable;
