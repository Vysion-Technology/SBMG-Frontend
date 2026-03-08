import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { InfoTooltip } from '../../common/Tooltip';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const defaultData = [
  { id: 1, district: 'District', avgResolutionDays: 3, complaintsClosedPercent: 56 },
  { id: 2, district: 'District', avgResolutionDays: 3.3, complaintsClosedPercent: 56 }
];

/**
 * Performance card: Star Performers / Underperformers toggle, Month filter, table with Send notice.
 */
const PerformanceCard = ({
  data = defaultData,
  monthLabel,
  tooltipText = 'Performance metrics: avg resolution time and complaint closure rate. Send notice to underperformers.',
  fillHeight = false
}) => {
  const [activeTab, setActiveTab] = useState('starPerformers');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0);

  const rows = data;
  const displayMonthLabel = monthLabel ?? MONTH_NAMES[selectedMonth];

  return (
    <div className="performance-card" style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      backgroundColor: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
      minHeight: 280,
      ...(fillHeight && { height: '100%', display: 'flex', flexDirection: 'column' })
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Performance</h3>
          <InfoTooltip text={tooltipText} size={14} color="#9ca3af" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: 10,
            padding: 4,
            gap: 2
          }}>
            <button
              onClick={() => setActiveTab('starPerformers')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: activeTab === 'starPerformers' ? '#10b981' : 'transparent',
                color: activeTab === 'starPerformers' ? 'white' : '#6b7280'
              }}
            >
              Star Performers
            </button>
            <button
              onClick={() => setActiveTab('underperformers')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: activeTab === 'underperformers' ? '#10b981' : 'transparent',
                color: activeTab === 'underperformers' ? 'white' : '#6b7280'
              }}
            >
              Underperformers
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: 13,
                color: '#6b7280'
              }}
            >
              <Calendar size={14} />
              {displayMonthLabel}
              <ChevronDown size={14} />
            </button>
            {showMonthDropdown && (
              <>
                <div
                  onClick={() => setShowMonthDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <div
                      key={name}
                      onClick={() => {
                        setSelectedMonth(i);
                        setShowMonthDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: selectedMonth === i ? '#10b981' : '#374151',
                        backgroundColor: selectedMonth === i ? '#f0fdf4' : 'transparent'
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{
        overflowX: 'auto',
        maxHeight: 260,
        overflowY: 'auto',
        ...(fillHeight && { flex: 1, minHeight: 0 })
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  District <ChevronsUpDown size={12} color="#9ca3af" />
                </span>
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Avg Resolution time <ChevronsUpDown size={12} color="#9ca3af" />
                </span>
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Complaints <ChevronsUpDown size={12} color="#9ca3af" />
                </span>
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 8px', color: '#374151' }}>{row.district}</td>
                <td style={{ padding: '10px 8px', color: '#374151' }}>{row.avgResolutionDays} days</td>
                <td style={{ padding: '10px 8px', color: '#374151' }}>{row.complaintsClosedPercent}%</td>
                <td style={{ padding: '10px 8px' }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: '#6b7280'
                    }}
                  >
                    Send notice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceCard;
