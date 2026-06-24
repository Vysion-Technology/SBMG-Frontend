import React from 'react';
import { InfoTooltip } from '../../common/Tooltip';
import { useTranslation } from 'react-i18next';

const formatCount = (n) => (n < 10 ? `0${n}` : String(n));

/**
 * Reusable card for Schemes and Events: Total (blue), Active (green), Inactive (red).
 * White background, no date picker.
 */

const getFilterFromCardTitle = (title) => {
  if (!title) return null;
  const t = String(title).toLowerCase();
  if (t.includes('total')) return null;
  if (t.includes('active')) return 'Active';
  if (t.includes('inactive')) return 'Inactive';
  return null;
};

const SchemesEventsCard = ({
  title,
  total = 0,
  active = 0,
  inactive = 0,
  tooltipText = '',
  loading = false,
  error = null
}) => {
   const { t } = useTranslation(['dashboard', 'common']);
  const metrics = [
    { value: total, label: t('total'), color: '#3B82F6' },
    { value: active, label: t('active'), color: '#22C55E' },
    { value: inactive, label: t('inactive'), color: '#EF4444' }
  ];

  return (
    <div className="schemes-events-card" style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      backgroundColor: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
      minHeight: 140
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
        <InfoTooltip text={tooltipText} size={14} color="#9ca3af" />
      </div>
      {error && (
        <div style={{ padding: 8, marginBottom: 12, backgroundColor: '#fef2f2', color: '#991b1b', fontSize: 12, borderRadius: 8 }}>{error}</div>
      )}
      {loading && total === 0 && (
        <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading...</div>
      )}
      {(!loading || total > 0) && (
        <div className="schemes-metrics-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          {metrics.map((m, i) => (
            <div key={i} className="schemes-metric cursor-pointer" onClick={() => getFilterFromCardTitle(m.label)} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{formatCount(m.value)}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchemesEventsCard;
