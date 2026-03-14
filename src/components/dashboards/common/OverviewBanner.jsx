import React, { useState } from 'react';
import visualsImg from '../../../assets/header/visuals.png';
import LocationHierarchyPopup from './LocationHierarchyPopup';

const OverviewBanner = ({
  districtsCount = 0,
  blocksCount = 0,
  villagesCount = 0,
  onLocationChange,
  selectedLocation
}) => {

  const [openPopup, setOpenPopup] = useState(false);

  const metrics = [
    { value: districtsCount, label: 'Districts', color: '#2563eb' },
    { value: blocksCount, label: 'Blocks', color: '#ea580c' },
    { value: villagesCount, label: 'GPs', color: '#9333ea' }
  ];

  return (
    <>
      <div
        style={{
          width: '100%',
          minHeight: 140,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          position: 'relative',
          overflow: 'hidden'
        }}
      >

        {/* background */}
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

        {/* content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 40px'
          }}
        >

          {metrics.map((m) => (
            <div
              key={m.label}
              onClick={() => setOpenPopup(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '24px 40px',
                minWidth: 220,
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >

              <span
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: m.color
                }}
              >
                {typeof m.value === 'number'
                  ? m.value.toLocaleString()
                  : m.value}
              </span>

              <span
                style={{
                  fontSize: 14,
                  color: '#6b7280'
                }}
              >
                {m.label}
              </span>

            </div>
          ))}

        </div>
      </div>

      {/* Popup render condition */}
      {openPopup && (
        <LocationHierarchyPopup
          selectedLocation={selectedLocation}
          onClose={() => setOpenPopup(false)}
          onSelect={(location) => {

            // send location to dashboard
            if (onLocationChange) {
              onLocationChange(location);
            }

            // close popup
            setOpenPopup(false);

          }}
        />
      )}

    </>
  );
};

export default OverviewBanner;