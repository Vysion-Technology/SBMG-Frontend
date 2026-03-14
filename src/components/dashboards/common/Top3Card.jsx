import React, { useState } from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { InfoTooltip } from '../../common/Tooltip';
import number1 from '../../../assets/images/number1.png';
import number2 from '../../../assets/images/nnumber2.png';
import number3 from '../../../assets/images/number3.png';
import { inspectionsAPI } from '../../../services/api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const rankImages = [number1, number2, number3];

/**
 * Top 3 card: District/Month filters, Ranks table with Rating.
 */
const Top3Card = ({
  topPerformersByLoc = [],
  districtLabel = 'District',
  monthLabel = 'Month',
  tooltipText = 'Top 3 performers ranked by score. Filter by district and month.',
  fillHeight = false
}) => {
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const DropdownButton = ({ label, open, onToggle }) => (
    <button
      onClick={onToggle}
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
      {label}
      <ChevronDown size={14} />
    </button>
  );

  return (
    <div className="top3-card" style={{
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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Top 3</h3>
          <InfoTooltip text={tooltipText} size={14} color="#9ca3af" />
        </div>
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DropdownButton label={districtLabel} open={showDistrictDropdown} onToggle={() => setShowDistrictDropdown(!showDistrictDropdown)} />
          <DropdownButton label={monthLabel} open={showMonthDropdown} onToggle={() => setShowMonthDropdown(!showMonthDropdown)} />
        </div> */}
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
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Rank</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>District</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Score</th>
              <th style={{ padding: '10px 8px', width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {topPerformersByLoc?.map((row, index) => (
              <tr key={row.district_id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                  <img
                    src={rankImages[index] || number3}
                    alt={`Rank ${index + 1}`}
                    style={{ width: 56, height: 56, objectFit: 'contain' }}
                  />
                </td>
                <td style={{ padding: '10px 8px', color: '#374151' }}>{row.geography_name}</td>
                <td style={{ padding: '10px 8px', color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.average_score.toFixed(0)}%
                  <MoreVertical size={14} color="#9ca3af" style={{ cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '10px 8px' }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Top3Card;
