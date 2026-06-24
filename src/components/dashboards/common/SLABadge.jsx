import React from 'react';

const config = {
  GP: {
    label: "GP Escalated (7+ Days)",
    classes: "bg-yellow-50 text-yellow-800 border-yellow-200",
    dotClass: "bg-yellow-500",
    tooltip: "Escalated to GP level: unresolved for more than 7 days.",
    styles: {
      backgroundColor: '#fefce8',
      color: '#854d0e',
      borderColor: '#fef08a'
    }
  },
  BLOCK: {
    label: "Block Escalated (15+ Days)",
    classes: "bg-orange-50 text-orange-800 border-orange-200",
    dotClass: "bg-orange-500",
    tooltip: "Escalated to Block level: unresolved for more than 15 days.",
    styles: {
      backgroundColor: '#fff7ed',
      color: '#c2410c',
      borderColor: '#fed7aa'
    }
  },
  DISTRICT: {
    label: "District Escalated (30+ Days)",
    classes: "bg-red-50 text-red-800 border-red-200 animate-pulse",
    dotClass: "bg-red-500",
    tooltip: "Critical breach: escalated to District level, unresolved for more than 30 days.",
    styles: {
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      borderColor: '#fecaca'
    }
  },
  NONE: {
    label: "Within SLA",
    classes: "bg-green-50 text-green-700 border-green-200",
    dotClass: "bg-green-500",
    tooltip: "Complaint is on track and within standard SLA resolution timelines.",
    styles: {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      borderColor: '#bbf7d0'
    }
  }
};

export const SLABadge = ({ level }) => {
  const currentLevel = level || 'NONE';
  if (!config[currentLevel]) return null;

  const { label, classes, dotClass, styles, tooltip } = config[currentLevel];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${classes}`}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        borderWidth: '1px',
        borderStyle: 'solid',
        cursor: 'help',
        ...styles
      }}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotClass}`}
        style={{
          marginRight: '6px',
          height: '6px',
          width: '6px',
          borderRadius: '50%',
          backgroundColor: currentLevel === 'DISTRICT' ? '#ef4444' : currentLevel === 'BLOCK' ? '#f97316' : currentLevel === 'GP' ? '#eab308' : '#16a34a',
          display: 'inline-block'
        }}
      />
      {label}
    </span>
  );
};

export default SLABadge;
