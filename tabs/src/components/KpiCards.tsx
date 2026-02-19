import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Badge,
} from '@fluentui/react-components';
import { DashboardData } from '../types';
import { formatCurrency, formatPct, formatVariance } from '../utils/format';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    padding: '16px',
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginTop: '4px',
    display: 'block',
  },
  subtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
    display: 'block',
  },
  positive: {
    color: tokens.colorPaletteGreenForeground1,
  },
  negative: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface KpiCardsProps {
  data: DashboardData;
}

const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
  const classes = useStyles();
  const { overallMoney, budgets, overallRetention } = data;

  const totalVariance = overallMoney.totalCollected - budgets.total;
  const restaurantVariance = overallMoney.restaurantDuesCollected - budgets.restaurantDues;
  const vendorVariance = overallMoney.vendorProgramCollected - budgets.vendorProgram;

  const cards = [
    {
      label: 'Total Collected vs Budget',
      value: formatCurrency(overallMoney.totalCollected),
      sub: `Budget: ${formatCurrency(budgets.total)}`,
      variance: formatVariance(overallMoney.totalCollected, budgets.total),
      isPositive: totalVariance >= 0,
    },
    {
      label: 'Restaurant Dues',
      value: formatCurrency(overallMoney.restaurantDuesCollected),
      sub: `Budget: ${formatCurrency(budgets.restaurantDues)}`,
      variance: formatVariance(overallMoney.restaurantDuesCollected, budgets.restaurantDues),
      isPositive: restaurantVariance >= 0,
    },
    {
      label: 'Vendor Program',
      value: formatCurrency(overallMoney.vendorProgramCollected),
      sub: `Budget: ${formatCurrency(budgets.vendorProgram)}`,
      variance: formatVariance(overallMoney.vendorProgramCollected, budgets.vendorProgram),
      isPositive: vendorVariance >= 0,
    },
    {
      label: 'New Money',
      value: formatCurrency(overallMoney.newMoney),
      sub: `From new members (started in ${data.year})`,
    },
    {
      label: 'Retained Money',
      value: formatCurrency(overallMoney.retainedMoney),
      sub: 'From existing members',
    },
    {
      label: 'Retention Rate',
      value: formatPct(overallRetention.retentionPct),
      sub: `${overallRetention.countPaid} of ${overallRetention.countDue} paid`,
    },
  ];

  return (
    <div className={classes.grid}>
      {cards.map((card, idx) => (
        <Card key={idx} className={classes.card}>
          <Text className={classes.label}>{card.label}</Text>
          <Text className={classes.value}>{card.value}</Text>
          <Text className={classes.subtext}>{card.sub}</Text>
          {card.variance && (
            <Text
              className={`${classes.subtext} ${
                card.isPositive ? classes.positive : classes.negative
              }`}
            >
              {card.variance}
            </Text>
          )}
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;
