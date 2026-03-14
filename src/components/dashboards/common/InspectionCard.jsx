import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { InfoTooltip } from '../../common/Tooltip';

const accentColor = '#EF773E';
const labelColor = accentColor;

/**
 * Inspection card: Statewide avg score, Total Inspections, Village covered.
 * Light peach background, orange accent.
 */
const InspectionCard = ({
  averageScore,
  totalInspections,
  villageCovered,
  dateLabel = 'Today',
  tooltipText = 'Inspection scores and coverage for the selected date.',
  loading = false,
  error = null
}) => {
  const metrics = [
    { value: `${averageScore}`, label: 'Statewide average score' },
    { value: totalInspections, label: 'Total Inspections' },
    { value: villageCovered, label: 'Village covered' }
  ];

  return (
    <div className="inspection-card" style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      backgroundColor: '#FEE8DC',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
      minHeight: 160,
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: accentColor, margin: 0 }}>Inspection</h3>
          <InfoTooltip text={tooltipText} size={14} color={accentColor} />
        </div>
        {/* <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8,
            backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280'
          }}
        >
          <Calendar size={14} /> {dateLabel} <ChevronDown size={14} />
        </button> */}
      </div>
      {error && (
        <div style={{ padding: 8, marginBottom: 12, backgroundColor: '#fef2f2', color: '#991b1b', fontSize: 12, borderRadius: 8 }}>{error}</div>
      )}
      {loading && averageScore === 0 && totalInspections === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading...</div>
      )}
      {(!loading || averageScore > 0 || totalInspections > 0) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          {metrics.map((m, i) => (
            <div key={i} className="metric-box" style={{ flex: 1, minWidth: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{m.value}</div>
              <div style={{ fontSize: 12, color: labelColor, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionCard;
