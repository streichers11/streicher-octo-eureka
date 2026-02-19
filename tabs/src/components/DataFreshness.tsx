import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Badge,
} from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { UploadRecord } from '../types';
import { formatTimestamp } from '../utils/format';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '8px 0',
    alignItems: 'center',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface DataFreshnessProps {
  uploads: UploadRecord[];
}

const DataFreshness: React.FC<DataFreshnessProps> = ({ uploads }) => {
  const classes = useStyles();

  const paymentsUpload = uploads.find((u) => u.fileType === 'payments');
  const retentionUpload = uploads.find((u) => u.fileType === 'retention');

  return (
    <div className={classes.container}>
      <div className={classes.item}>
        <Info16Regular />
        <Text size={200}>
          Payments:{' '}
          {paymentsUpload ? (
            <>
              <Badge appearance="tint" color="success" size="small">Uploaded</Badge>{' '}
              {paymentsUpload.originalFilename} ({paymentsUpload.rowCount} rows) &mdash;{' '}
              {formatTimestamp(paymentsUpload.uploadedAt)}
            </>
          ) : (
            <Badge appearance="tint" color="warning" size="small">Not uploaded</Badge>
          )}
        </Text>
      </div>
      <div className={classes.item}>
        <Info16Regular />
        <Text size={200}>
          Retention:{' '}
          {retentionUpload ? (
            <>
              <Badge appearance="tint" color="success" size="small">Uploaded</Badge>{' '}
              {retentionUpload.originalFilename} ({retentionUpload.rowCount} rows) &mdash;{' '}
              {formatTimestamp(retentionUpload.uploadedAt)}
            </>
          ) : (
            <Badge appearance="tint" color="warning" size="small">Not uploaded</Badge>
          )}
        </Text>
      </div>
    </div>
  );
};

export default DataFreshness;
