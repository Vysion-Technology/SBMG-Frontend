import React from 'react';
import { MapPin, Layers3 } from 'lucide-react';

const BDONavigationHeader = ({
  districtName,
  blockName,
  moduleName
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        margin: '12px 16px 0',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Layers3 size={18} color="#059669" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            {moduleName || 'Block-level navigation'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} />
            {districtName || 'District'}
          </span>
          <span>•</span>
          <span>{blockName || 'Block'}</span>
          <span>•</span>
          <span>Restricted to block and GP data only</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} />
    </div>
  );
};

export default BDONavigationHeader;
