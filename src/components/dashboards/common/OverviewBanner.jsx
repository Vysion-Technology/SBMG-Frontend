import React from 'react';

import visualsImg from '../../../assets/header/visuals.png';

/**
 * Overview banner with rural illustration theme.
 * Displays three metrics: Districts, Blocks, Villages.
 * Uses visuals.png as background (repeat-x, low opacity).
 */
const OverviewBanner = ({ districtsCount = 0, blocksCount = 0, villagesCount = 0 }) => {
  const metrics = [
    { value: districtsCount, label: 'Districts', color: '#2563eb' },
    { value: blocksCount, label: 'Blocks', color: '#ea580c' },
    { value: villagesCount, label: 'GPs', color: '#9333ea' }
  ];

  return (
    <div
      className="overview-banner"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        minHeight: 140,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* visuals.png background - repeat, low opacity (no gradient) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${visualsImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto 100%',
          opacity: 0.45
        }}
      />
      {/* Content overlay */}
      <div
        className="overview-banner-content"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          minHeight: 140,
          backgroundColor: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 40px'
        }}
      >
      {metrics.map((m) => (
        <div
          key={m.label}
          className="overview-metric overview-metric-hover"
          style={{
            '--metric-color': m.color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '24px 40px',
            minWidth: 300,
            minHeight: 100,
            borderRadius: 12,
            cursor: 'default',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            border: '2px solid transparent'
          }}
        >
          <span
            className="overview-metric-value"
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: m.color,
              lineHeight: 1.2,
              transition: 'color 0.2s ease, text-decoration 0.2s ease'
            }}
          >
            {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#6b7280'
            }}
          >
            {m.label}
          </span>
        </div>
      ))}
      </div>
    </div>
  );
};

export default OverviewBanner;
