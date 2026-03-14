import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import Chart from 'react-apexcharts';
import { InfoTooltip } from '../../common/Tooltip';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CARD_BG_COLORS = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', // Total - light blue
  'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', // Open - light red
  'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)'  // Disposed - light green
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

/**
 * Complaints Dashboard - Layout: Header → 3 summary cards (chart) → Bar graph
 * Placed after List of Districts, before Attendance/Inspection.
 */
/** Map card title to Complaints page filter: Total=null (all), Open='Open', Disposed='Closed' */
const getFilterFromCardTitle = (title) => {
  if (!title) return null;
  const t = String(title).toLowerCase();
  if (t.includes('total')) return null;
  if (t.includes('open')) return 'Open';
  if (t.includes('disposed')) return 'Closed';
  return null;
};

const ComplaintsDashboard = ({
  complaintCards = [],
  chartData = { open: [], closed: [], total: [] },
  xAxisCategories = [],
  yAxisMax = 60,
  selectedComplaintsYear,
  activeComplaintsFilter,
  showComplaintsYearDropdown,
  loadingComplaintsChart,
  complaintsChartError,
  dateDisplayText,
  years = [],
  onDateClick,
  onYearSelect,
  onYearDropdownToggle,
  onFilterChange,
  onCardClick
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="complaints-dashboard"
      style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '12px',
        border: '1px solid lightgray',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Header: Complaints + month/year + date dropdown */}
      <motion.div variants={itemVariants} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Complaints
          </h2>
          <span style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {MONTH_NAMES[new Date().getMonth()]} {selectedComplaintsYear}
          </span>
        </div>
        {/* <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDateClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          <Calendar style={{ width: '16px', height: '16px' }} />
          <span>{dateDisplayText}</span>
          <ChevronDown style={{ width: '16px', height: '16px' }} />
        </motion.div> */}
      </motion.div>

      {/* Chart: 3 Summary Cards (Total, Open, Disposed) */}
      <motion.div
        variants={containerVariants}
        className="complaints-cards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {complaintCards.map((item, index) => (
          <motion.div
            key={index}
            className="complaints-card-item"
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            onClick={() => onCardClick?.(getFilterFromCardTitle(item.title))}
            style={{
              background: CARD_BG_COLORS[index] || '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              position: 'relative',
              transition: 'box-shadow 0.2s',
              cursor: onCardClick ? 'pointer' : 'default'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <InfoTooltip text={item.tooltipText} size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>{item.title}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: item.color, marginBottom: '12px' }}>
              {item.value}
            </div>
            <div style={{ height: 40 }}>
              <Chart
                options={item.chartData?.options || {}}
                series={item.chartData?.series || []}
                type="area"
                height={40}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Legend + Time/Location + Year selector */}
      <motion.div variants={itemVariants} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
            <span style={{ fontSize: 14, color: '#374151' }}>Total</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: 14, color: '#374151' }}>Closed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: 14, color: '#374151' }}>Open</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, gap: 2 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange?.('Time')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: activeComplaintsFilter === 'Time' ? '#10b981' : 'transparent',
                color: activeComplaintsFilter === 'Time' ? 'white' : '#6b7280'
              }}
            >
              Time
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange?.('Location')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: activeComplaintsFilter === 'Location' ? '#10b981' : 'transparent',
                color: activeComplaintsFilter === 'Location' ? 'white' : '#6b7280'
              }}
            >
              Location
            </motion.button>
          </div>
          <div data-complaints-year-dropdown style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onYearDropdownToggle}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 14,
                color: '#6b7280'
              }}
            >
              <Calendar style={{ width: 16, height: 16, color: '#9ca3af' }} />
              <span>{selectedComplaintsYear}</span>
              <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af' }} />
            </motion.button>
            {showComplaintsYearDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  marginTop: 4,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}
              >
                {years.map((year) => (
                  <div
                    key={year}
                    onClick={() => onYearSelect?.(year)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#374151',
                      backgroundColor: selectedComplaintsYear === year ? '#f3f4f6' : 'transparent'
                    }}
                  >
                    {year}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Graph: Bar chart */}
      {complaintsChartError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: 16,
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 14,
            marginBottom: 16
          }}
        >
          <strong>Error:</strong> {complaintsChartError}
        </motion.div>
      )}
      <motion.div
        variants={itemVariants}
        style={{
          height: 300,
          opacity: loadingComplaintsChart ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}
      >
        <Chart
          options={{
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: xAxisCategories },
            yaxis: {
              title: { text: 'Number of Complaints' },
              min: 0,
              max: yAxisMax,
              tickAmount: 5
            },
            fill: { opacity: 1 },
            colors: ['#ef4444', '#10b981', '#9ca3af'],
            legend: { show: false },
            grid: { borderColor: '#f1f5f9' }
          }}
          series={[
            { name: 'Open', data: chartData.open },
            { name: 'Closed', data: chartData.closed },
            { name: 'Total', data: chartData.total }
          ]}
          type="bar"
          height={300}
        />
      </motion.div>
    </motion.div>
  );
};

export default ComplaintsDashboard;
