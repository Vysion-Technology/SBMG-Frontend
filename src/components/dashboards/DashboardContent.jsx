import React from 'react';
import DashboardTopStats from './DashboardTopStats';
import DashboardComplaints from './DashboardComplaints';
import DashboardAttendance from './DashboardAttendance';
import DashboardGPData from './DashboardGPData';
import DashboardPerformance from './DashboardPerformance';
import DashboardHeader from '../common/DashboardHeader';

const DashboardContent = ({ setActiveItem }) => {
  return (
    <div className="bg-[#f9fafb] min-h-screen font-sans w-full">
      {/* Top Header strictly matching ComplaintsContent Layout */}
      <DashboardHeader title="Overview" />
      
      {/* Main Content Area */}
      <div className="flex flex-col gap-[24px] p-[24px] max-w-[1400px] mx-auto w-full">
        <DashboardTopStats />
        <DashboardComplaints setActiveItem={setActiveItem} />
        <DashboardAttendance setActiveItem={setActiveItem} />
        <DashboardGPData setActiveItem={setActiveItem} />
        <DashboardPerformance setActiveItem={setActiveItem} />
      </div>
    </div>
  );
};

export default DashboardContent;