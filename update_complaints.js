const fs = require('fs');

const content = fs.readFileSync('src/components/dashboards/DashboardComplaints.jsx', 'utf8');

const newCode = `import React, { useState, useEffect, useCallback, useRef } from 'react';
import Chart from 'react-apexcharts';
import { Info, List, Calendar, ChevronDown } from 'lucide-react';
import Card from '../common/Card';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';

export default function DashboardComplaints({ setActiveItem }) {
  const {
    activeScope,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
  } = useLocation();

  const handleNavigation = () => {
    if (setActiveItem) setActiveItem('Complaints');
  };

  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Year');
  const [startDate, setStartDate] = useState(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    return startOfYear.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const dropdownRef = useRef(null);

  // Complaints data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch Analytics Data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const params = new URLSearchParams();

      let level = 'DISTRICT';
      if (activeScope === 'Districts') level = 'BLOCK';
      else if (activeScope === 'Blocks' || activeScope === 'GPs') level = 'VILLAGE';
      
      params.append('level', level);

      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
      }

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get(\`/complaints/analytics/geo?\${params.toString()}\`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Click outside for date dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateRanges = [
    { label: 'Year', value: 'year' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Month', value: 'month' },
    { label: 'Week', value: 'week' },
    { label: 'Today', value: 'today' },
    { label: 'Custom', value: 'custom' }
  ];

  const handleDateRangeSelection = (range) => {
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
      setStartDate(null);
      setEndDate(null);
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      let start = new Date();

      switch (range.value) {
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case 'quarter':
          start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'week':
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          start = new Date(now.setDate(diff));
          break;
        case 'today':
          start = now;
          break;
        default:
          start = new Date(now.getFullYear(), 0, 1);
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
      setShowDateDropdown(false);
    }
  };

  const calculateCounts = () => {
    const counts = { total: 0, open: 0, disposed: 0 };
    if (!analyticsData?.response) return counts;

    analyticsData.response.forEach(item => {
      const count = item.count || 0;
      counts.total += count;
      const status = item.status?.toUpperCase();
      if (status === 'OPEN') counts.open += count;
      else if (status === 'CLOSED' || status === 'DISPOSED' || status === 'RESOLVED') counts.disposed += count;
    });
    return counts;
  };

  const counts = calculateCounts();

  // Chart configuration
  const chartOptions = {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ['transparent'] },
    xaxis: { 
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: { show: true, color: '#d1d5db' },
      axisTicks: { show: false },
      labels: { style: { colors: '#38394e', fontSize: '10px', fontWeight: 600 } }
    },
    yaxis: {
      labels: { style: { colors: '#000000b3', fontSize: '12px' } },
      min: 0,
      tickAmount: 5
    },
    colors: ['#9ca3af', '#04ce9a', '#f05c51'],
    legend: { show: false },
    grid: { show: false, padding: { left: 10, right: 0, bottom: 0, top: 0 } }
  };

  const chartSeries = [
    { name: 'Total', data: [210, 230, 250, 260, 240, 250, 310, 310, 260, 260, 260, 260] },
    { name: 'Closed', data: [100, 100, 130, 130, 140, 150, 170, 170, 170, 190, 210, 220] },
    { name: 'Open', data: [30, 30, 30, 50, 60, 100, 110, 110, 110, 130, 140, 150] },
  ];

  const getSparklineOptions = (color) => ({
    chart: { type: 'area', sparkline: { enabled: true } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] } },
    colors: [color],
    tooltip: { fixed: { enabled: false }, x: { show: false }, marker: { show: false } }
  });

  return (
    <Card 
      onClick={handleNavigation} 
      className="flex flex-col gap-[24px] w-full bg-white border border-[#d1d5db] rounded-[12px] p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
        <div className="flex items-center gap-[16px]">
          <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Complaints</h2>
          <span className="text-[16px] font-normal text-[#6b7280] leading-[normal]">{selectedDateRange}</span>
        </div>
        
        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <div 
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] min-w-[109px] cursor-pointer"
          >
            <div className="flex items-center gap-[8px]">
              <Calendar className="w-[18px] h-[18px] text-[#4b5563]" />
              <span className="font-normal text-[#4b5563] text-[14px] leading-[normal]">{selectedDateRange}</span>
            </div>
            <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
          </div>
          
          {showDateDropdown && (
            <div className="absolute top-[100%] right-0 mt-1 bg-white border border-[#d1d5db] rounded-[10px] shadow-lg z-[1000] w-[150px] overflow-hidden">
              {dateRanges.map((range) => (
                <div
                  key={range.value}
                  onClick={() => handleDateRangeSelection(range)}
                  className={\`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors \${selectedDateRange === range.label ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}\`}
                >
                  {range.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] w-full">
        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[16px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="bg-[#f3f4f6] flex items-center justify-center p-[4px] rounded-[8px]">
                <List className="w-[16px] h-[16px] text-[#4b5563]" />
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Total complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">{loadingAnalytics ? '...' : counts.total}</span>
              </div>
            </div>
            <Info className="w-[16px] h-[16px] text-[#9ca3af]" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[67px]">
            <Chart options={getSparklineOptions('#9ca3af')} series={[{ data: [10, 12, 20, 22, 25, 30, 40, 45, 55] }]} type="area" height="100%" />
          </div>
        </div>
        
        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[16px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="p-[4px] flex items-center">
                <div className="bg-[#ef5d51] w-[16px] h-[16px] rounded-[8px]"></div>
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Open complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">{loadingAnalytics ? '...' : counts.open}</span>
              </div>
            </div>
            <Info className="w-[16px] h-[16px] text-[#9ca3af]" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[67px]">
            <Chart options={getSparklineOptions('#ef5d51')} series={[{ data: [5, 10, 8, 20, 25, 22, 30, 35, 40] }]} type="area" height="100%" />
          </div>
        </div>

        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[16px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="p-[4px] flex items-center">
                <div className="bg-[#04ce9a] w-[16px] h-[16px] rounded-[8px]"></div>
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Disposed complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">{loadingAnalytics ? '...' : counts.disposed}</span>
              </div>
            </div>
            <Info className="w-[16px] h-[16px] text-[#9ca3af]" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[67px]">
            <Chart options={getSparklineOptions('#04ce9a')} series={[{ data: [15, 20, 25, 22, 35, 40, 45, 55, 60] }]} type="area" height="100%" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full mt-[8px]">
        <div className="flex items-center gap-[12px] py-[8px]">
           <div className="flex items-center gap-[4px]">
             <div className="w-[10px] h-[10px] rounded-full bg-[#9ca3af]"></div>
             <span className="text-[12px] font-medium text-[#4b5563] tracking-[0.5px]">Total</span>
           </div>
           <div className="flex items-center gap-[4px]">
             <div className="w-[10px] h-[10px] rounded-full bg-[#04ce9a]"></div>
             <span className="text-[12px] font-medium text-[#4b5563] tracking-[0.5px]">Closed</span>
           </div>
           <div className="flex items-center gap-[4px]">
             <div className="w-[10px] h-[10px] rounded-full bg-[#f05c51]"></div>
             <span className="text-[12px] font-medium text-[#4b5563] tracking-[0.5px]">Open</span>
           </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
      </div>
    </Card>
  );
}
`;

fs.writeFileSync('src/components/dashboards/DashboardComplaints.jsx', newCode);
