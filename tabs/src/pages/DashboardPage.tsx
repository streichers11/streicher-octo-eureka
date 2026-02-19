import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { DashboardData } from '../types';
import { fetchDashboard } from '../services/api';
import MonthSelector from '../components/MonthSelector';
import DataFreshness from '../components/DataFreshness';
import KpiCards from '../components/KpiCards';
import TerritoryTable from '../components/TerritoryTable';
import PastDuePanel from '../components/PastDuePanel';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colorNeutralForeground3,
  },
});

const DashboardPage: React.FC = () => {
  const classes = useStyles();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard(year, month);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard data.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={classes.loading}>
        <Spinner label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>{error}</MessageBarBody>
      </MessageBar>
    );
  }

  const hasData = data && (data.uploads.length > 0 || data.manualAdjustments.length > 0);

  return (
    <div>
      <div className={classes.header}>
        <MonthSelector
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
        {data && <DataFreshness uploads={data.uploads} />}
      </div>

      {!hasData ? (
        <div className={classes.empty}>
          <Text size={400}>
            No data uploaded for this month yet. Go to the Admin tab to upload
            your GrowthZone exports.
          </Text>
        </div>
      ) : data ? (
        <>
          <KpiCards data={data} />
          <TerritoryTable
            moneyData={data.territoryMoney}
            retentionData={data.territoryRetention}
          />
          <PastDuePanel entries={data.pastDue} />
        </>
      ) : null}
    </div>
  );
};

export default DashboardPage;
