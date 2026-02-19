import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Link,
  Input,
  Select,
  Badge,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { PastDueEntry } from '../types';
import { formatCurrencyExact, TERRITORIES } from '../utils/format';

const useStyles = makeStyles({
  card: {
    marginBottom: '24px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    padding: '0 16px',
    flexWrap: 'wrap',
  },
  table: {
    minWidth: '600px',
  },
  numCell: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  count: {
    marginLeft: '8px',
  },
});

interface PastDuePanelProps {
  entries: PastDueEntry[];
}

const PastDuePanel: React.FC<PastDuePanelProps> = ({ entries }) => {
  const classes = useStyles();
  const [search, setSearch] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = entries;
    if (territoryFilter !== 'all') {
      result = result.filter((e) => e.memberTerritory === territoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.contactName.toLowerCase().includes(q) ||
          e.memberTerritory.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 15);
  }, [entries, search, territoryFilter]);

  return (
    <Card className={classes.card}>
      <CardHeader
        header={
          <Text weight="semibold">
            Past Due
            <Badge className={classes.count} appearance="filled" color="danger">
              {entries.length}
            </Badge>
          </Text>
        }
      />
      <div className={classes.filters}>
        <Input
          placeholder="Search by name..."
          contentBefore={<Search24Regular />}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
        />
        <Select
          value={territoryFilter}
          onChange={(_, data) => setTerritoryFilter(data.value)}
        >
          <option value="all">All Territories</option>
          {TERRITORIES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
          <option value="Unassigned">Unassigned</option>
        </Select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <Table className={classes.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Contact Name</TableHeaderCell>
              <TableHeaderCell>Territory</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>Invoice Amount</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>Amount Due</TableHeaderCell>
              <TableHeaderCell>Invoice Link</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Text style={{ padding: '16px', display: 'block', textAlign: 'center' }}>
                    {entries.length === 0 ? 'No past due entries.' : 'No matching results.'}
                  </Text>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell>{entry.contactName}</TableCell>
                  <TableCell>{entry.memberTerritory}</TableCell>
                  <TableCell className={classes.numCell}>
                    {formatCurrencyExact(entry.invoiceAmount)}
                  </TableCell>
                  <TableCell className={classes.numCell}>
                    {formatCurrencyExact(entry.amountDue)}
                  </TableCell>
                  <TableCell>
                    {entry.membershipInvoiceUrl ? (
                      <Link href={entry.membershipInvoiceUrl} target="_blank">
                        View Invoice
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default PastDuePanel;
