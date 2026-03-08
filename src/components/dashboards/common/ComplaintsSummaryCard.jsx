import React from 'react';
import Chart from 'react-apexcharts';
import { InfoTooltip } from '../../common/Tooltip';

/**
 * Single complaint summary card with mini area chart.
 */
const ComplaintsSummaryCard = ({
  title = 'Total complaints',
  value = '0',
  color = '#3b82f6',
  backgroundColor = '#f8fafc',
  tooltipText = '',
  chartData = [1, 2, 3, 4],
  delay = 0
}) => {
  const chartSeries = [{
    data: Array.isArray(chartData) ? chartData : [1, 2, 3, 4]
  }];

  const chartOptions = {
    chart: {
      type: 'area',
      height: 40,
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: [color]
    },
    fill: {
      type: 'solid',
      opacity: 0.15,
      colors: [color]
    },
    tooltip: { enabled: false },
    grid: { show: false },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } }
  };

  return (
    <div
      style={{
        animation: `fadeInUp 0.5s ${delay}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        backgroundColor,
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        position: 'relative',
        minWidth: 180
      }}
    >
      {tooltipText && (
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <InfoTooltip text={tooltipText} size={16} />
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color
        }} />
        <span style={{
          fontSize: 14,
          color: '#6b7280',
          fontWeight: 500
        }}>
          {title}
        </span>
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color,
        marginBottom: 12
      }}>
        {value}
      </div>
      <div style={{ height: 40 }}>
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="area"
          height={40}
        />
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ComplaintsSummaryCard;
