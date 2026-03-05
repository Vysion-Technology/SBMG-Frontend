import React from 'react';
import DashboardTopStats from './DashboardTopStats';
import DashboardComplaints from './DashboardComplaints';
import DashboardAttendance from './DashboardAttendance';
import DashboardGPData from './DashboardGPData';
import DashboardPerformance from './DashboardPerformance';

const DashboardContent = ({ setActiveItem }) => {
  return (
    <div className="flex flex-col gap-[24px] p-[24px] bg-[#f9fafb] min-h-screen font-sans w-full max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-[24px]">
          <h1 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Overview</h1>
          <span className="text-[#6b7280] text-[16px] font-normal leading-[normal]">January 2025</span>
        </div>
        
        <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between overflow-clip px-[3px] py-[4px] rounded-[8px] w-[176px]">
          <div className="bg-[#009b56] flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[6px] cursor-pointer h-full">
            <span className="font-medium text-[#f9fafb] text-[14px] leading-[normal]">Overview</span>
          </div>
          <div className="flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[8px] cursor-pointer h-full">
            <span className="font-medium text-[#6b7280] text-[14px] leading-[normal]">Summary</span>
          </div>
        </div>
      </div>
      
      <DashboardTopStats />
      <DashboardComplaints setActiveItem={setActiveItem} />
      <DashboardAttendance setActiveItem={setActiveItem} />
      <DashboardGPData setActiveItem={setActiveItem} />
      <DashboardPerformance setActiveItem={setActiveItem} />
    </div>
  );
};

export default DashboardContent;
