import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { InfoTooltip } from '../../common/Tooltip';

const formatNumber = (n) => {
  if (typeof n === 'number') return n.toLocaleString();
  return String(n);
};

/**
 * GPS Tracking card: Active, Running %, Stopped %.
 */
const GPSTrackingCard = ({
  active = 8453,
  runningPercent = 75.43,
  stoppedPercent = 0,
  dateLabel = 'Today',
  tooltipText = 'GPS tracking status: active vehicles, running and stopped percentages for the selected date.',
  loading = false,
  error = null
}) => {
  const metrics = [
    { value: formatNumber(active), label: 'Active', color: '#3b82f6' },
    { value: `${runningPercent}%`, label: 'Running', color: '#22c55e' },
    { value: `${stoppedPercent}%`, label: 'Stopped', color: '#ef4444' }
  ];

  return (
    <div className="gps-tracking-card" style={{
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>GPS Tracking</h3>
          <InfoTooltip text={tooltipText} size={14} color="#9ca3af" />
        </div>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8,
            backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280'
          }}
        >
          <Calendar size={14} /> {dateLabel} <ChevronDown size={14} />
        </button>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default GPSTrackingCard;
