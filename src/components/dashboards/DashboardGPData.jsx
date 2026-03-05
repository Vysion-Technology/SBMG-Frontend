import React from 'react';
import { Info, Calendar, ChevronDown } from 'lucide-react';
import Card from '../common/Card';

export default function DashboardGPData({ setActiveItem }) {
  const Header = ({ title }) => (
    <div className="flex justify-between items-center w-full mb-[25px]">
      <div className="flex items-center gap-[4px]">
        <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">{title}</h2>
        <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
      </div>
      <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[109px] cursor-pointer">
        <div className="flex items-center gap-[8px]">
          <Calendar className="w-[18px] h-[18px] text-[#4b5563]" />
          <span className="font-normal text-[#4b5563] text-[14px] leading-[normal]">Today</span>
        </div>
        <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] w-full">
      <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveItem && setActiveItem('GP Master Data')}>
        <Header title="GP Master Data" />
        <div className="flex gap-[8px] items-start w-full">
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#111827] text-[28px] font-semibold leading-[normal]">8,453</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Total GP Master Data</div>
          </div>
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#04ce9a] text-[28px] font-semibold leading-[normal]">75.43%</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Village GP Data Coverage</div>
          </div>
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#f05c51] text-[28px] font-semibold leading-[normal]">0%</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Target Achievement Rate</div>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveItem && setActiveItem('GPS Tracking')}>
        <Header title="GPS Tracking" />
        <div className="flex gap-[8px] items-start w-full">
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#3b82f6] text-[28px] font-semibold leading-[normal]">8,453</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Active</div>
          </div>
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#04ce9a] text-[28px] font-semibold leading-[normal]">75.43%</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Running</div>
          </div>
          <div className="flex flex-col items-center gap-[4px] flex-1">
            <div className="text-[#f05c51] text-[28px] font-semibold leading-[normal]">0%</div>
            <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Stopped</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
