import React from 'react';
import Chart from 'react-apexcharts';
import { Info, List, Calendar, ChevronDown } from 'lucide-react';
import Card from '../common/Card';

export default function DashboardComplaints({ setActiveItem }) {
  const handleNavigation = () => {
    if (setActiveItem) setActiveItem('Complaints');
  };

  const chartOptions = {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false, parentHeightOffset: 0 },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ['transparent'] },
    xaxis: { 
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: { show: true, color: '#d1d5db' },
      axisTicks: { show: false },
      labels: { style: { colors: '#38394e', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' } }
    },
    yaxis: {
      labels: { style: { colors: '#000000b3', fontSize: '12px', fontFamily: 'Lato' } },
      min: 0,
      max: 300,
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
        <div className="flex items-center gap-[24px]">
          <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Complaints</h2>
          <span className="text-[16px] font-normal text-[#6b7280] leading-[normal]">January 2025</span>
        </div>
        
        <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[109px] cursor-pointer">
          <div className="flex items-center gap-[8px]">
            <Calendar className="w-[18px] h-[18px] text-[#4b5563]" />
            <span className="font-normal text-[#4b5563] text-[14px] leading-[normal]">Today</span>
          </div>
          <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] w-full">
        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[24px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="bg-[#f3f4f6] flex items-center justify-center p-[4px] rounded-[8px]">
                <List className="w-[16px] h-[16px] text-[#4b5563]" />
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Total complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">3,452</span>
              </div>
            </div>
            <Info className="w-[16px] h-[16px] text-[#9ca3af]" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[67px]">
            <Chart options={getSparklineOptions('#9ca3af')} series={[{ data: [10, 12, 20, 22, 25, 30, 40, 45, 55] }]} type="area" height="100%" />
          </div>
        </div>
        
        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[24px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="p-[4px] flex items-center">
                <div className="bg-[#ef5d51] w-[16px] h-[16px] rounded-[8px]"></div>
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Open complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">452</span>
              </div>
            </div>
            <Info className="w-[16px] h-[16px] text-[#9ca3af]" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[67px]">
            <Chart options={getSparklineOptions('#ef5d51')} series={[{ data: [5, 10, 8, 20, 25, 22, 30, 35, 40] }]} type="area" height="100%" />
          </div>
        </div>

        <div className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[8px] p-[24px] relative overflow-hidden h-[140px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-[8px] items-start">
              <div className="p-[4px] flex items-center">
                <div className="bg-[#04ce9a] w-[16px] h-[16px] rounded-[8px]"></div>
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-normal text-[#111827] leading-[normal]">Disposed complaints</span>
                <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">2,000</span>
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
        <div className="flex items-center gap-[8px]">
          <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between overflow-clip px-[3px] py-[4px] rounded-[8px] w-[176px]">
            <div className="bg-[#009b56] flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[6px] cursor-pointer h-full">
              <span className="font-medium text-[#f9fafb] text-[14px] leading-[normal]">Time</span>
            </div>
            <div className="flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[8px] cursor-pointer h-full">
              <span className="font-medium text-[#6b7280] text-[14px] leading-[normal]">Location</span>
            </div>
          </div>
          
          <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[141px] cursor-pointer">
            <div className="flex items-center gap-[8px]">
              <Calendar className="w-[18px] h-[18px] text-[#4b5563]" />
              <span className="font-normal text-[#4b5563] text-[14px] leading-[normal]">Select Year</span>
            </div>
            <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
      </div>
    </Card>
  );
}
