import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { InfoTooltip } from '../../common/Tooltip';

/**
 * Single semi-circle arc: left (180°) through top to right (0°).
 * One path used for track, present, and absent segments.
 */
const getArcPath = (cx, cy, r) => {
  const start = { x: cx - r, y: cy };
  const end = { x: cx + r, y: cy };
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
};

/**
 * Semi-circular gauge: one continuous arc, green (present) then red (absent).
 * Uses strokeDasharray to show segments of the same path - no overlap.
 */
const AttendanceGauge = ({ presentPercent, absentPercent }) => {
  const pathRef = useRef(null);
  const [totalLength, setTotalLength] = useState(0);

  const cx = 100;
  const cy = 95;
  const r = 70;
  const strokeWidth = 20;
  const arcPath = getArcPath(cx, cy, r);

  const total = presentPercent + absentPercent || 1;
  const presentRatio = total > 0 ? presentPercent / total : 0;
  const absentRatio = total > 0 ? absentPercent / total : 0;

  useEffect(() => {
    const el = pathRef.current;
    if (el) setTotalLength(el.getTotalLength());
  }, []);

  const presentLen = totalLength * presentRatio;
  const absentLen = totalLength * absentRatio;
  const transition = 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <svg viewBox="0 0 200 140" style={{ width: '100%', maxWidth: 260 }}>
      {/* Background track */}
      <path
        d={arcPath}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Present (green) - first segment along the arc */}
      <path
        ref={pathRef}
        d={arcPath}
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={totalLength ? `${presentLen} ${totalLength}` : undefined}
        strokeDashoffset={0}
        style={{ transition, visibility: totalLength ? 'visible' : 'hidden' }}
      />
      {/* Absent (red) - second segment, offset to start after present */}
      <path
        d={arcPath}
        fill="none"
        stroke="#ef4444"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={totalLength ? `${absentLen} ${totalLength}` : undefined}
        strokeDashoffset={totalLength ? -presentLen : 0}
        style={{ transition, visibility: totalLength ? 'visible' : 'hidden' }}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        style={{ fontSize: 32, fontWeight: 700, fill: '#111827' }}
      >
        {Math.round(presentPercent)}%
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        style={{ fontSize: 12, fill: '#6b7280' }}
      >
        Present
      </text>
    </svg>
  );
};

const formatCount = (n) => (n < 10 ? `0${n}` : String(n));

/**
 * Attendance card: Total/Present/Absent metrics + semi-circular gauge.
 * Props: total, present, absent (numbers). Absent defaults to total - present.
 */
const AttendanceCard = ({
  total = 15,
  present = 12,
  absent,
  dateLabel = 'Today',
  onDateChange,
  tooltipText = 'Vendor and supervisor attendance for the selected date.',
  fillHeight = false,
  loading = false,
  error = null
}) => {
  const absentCount = absent ?? Math.max(0, total - present);
  const presentPercent = total > 0 ? (present / total) * 100 : 0;
  const absentPercent = total > 0 ? (absentCount / total) * 100 : 0;

  const [showDateDropdown, setShowDateDropdown] = useState(false);

  return (
    <div className="attendance-card" style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      backgroundColor: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
      minHeight: 260,
      ...(fillHeight && { height: '100%', display: 'flex', flexDirection: 'column' })
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Attendance</h3>
          <InfoTooltip text={tooltipText} size={14} color="#9ca3af" />
        </div>
        <div style={{ position: 'relative' }}>
          {/* <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8,
              backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280'
            }}
          >
            <Calendar size={14} /> {dateLabel} <ChevronDown size={14} />
          </button> */}
          {showDateDropdown && (
            <div
              onClick={() => setShowDateDropdown(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 10
              }}
            />
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 8, marginBottom: 12, backgroundColor: '#fef2f2', color: '#991b1b', fontSize: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}
      {loading && total === 0 && present === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading...</div>
      )}
      {(!loading || total > 0 || present > 0) && (
        <>
          {/* Metrics */}
          <div className="attendance-metrics-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            marginBottom: 12,
            padding: '12px 0',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <div className="attendance-metric" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{formatCount(total)}</div>
              <div className="attendance-metric-label" style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Total</div>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: '#e5e7eb', flexShrink: 0 }} />
            <div className="attendance-metric" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{formatCount(present)}</div>
              <div className="attendance-metric-label" style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Present</div>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: '#e5e7eb', flexShrink: 0 }} />
            <div className="attendance-metric" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{formatCount(absentCount)}</div>
              <div className="attendance-metric-label" style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Absent</div>
            </div>
          </div>

          {/* Gauge */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: fillHeight ? 'center' : 'flex-start',
            ...(fillHeight && { flex: 1, minHeight: 0 })
          }}>
            <AttendanceGauge presentPercent={presentPercent} absentPercent={absentPercent} />
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceCard;
