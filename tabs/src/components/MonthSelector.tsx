import React from 'react';
import {
  makeStyles,
  tokens,
  Select,
  Label,
} from '@fluentui/react-components';
import { MONTH_NAMES } from '../utils/format';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  selectWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
});

interface MonthSelectorProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
}) => {
  const classes = useStyles();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className={classes.container}>
      <div className={classes.selectWrapper}>
        <Label htmlFor="year-select" size="small">Year</Label>
        <Select
          id="year-select"
          value={String(year)}
          onChange={(_, data) => onYearChange(parseInt(data.value, 10))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>
      <div className={classes.selectWrapper}>
        <Label htmlFor="month-select" size="small">Month</Label>
        <Select
          id="month-select"
          value={String(month)}
          onChange={(_, data) => onMonthChange(parseInt(data.value, 10))}
        >
          {MONTH_NAMES.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>{name}</option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default MonthSelector;
