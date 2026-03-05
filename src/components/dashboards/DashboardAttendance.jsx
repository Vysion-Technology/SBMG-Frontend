import React from 'react';
import Chart from 'react-apexcharts';
import { Info, Calendar, List, ChevronDown } from 'lucide-react';
import Card from '../common/Card';

export default function DashboardAttendance({ setActiveItem }) {
  const attendanceOptions = {
    chart: { type: 'radialBar' },
    plotOptions: {
      radialBar: {
        startAngle: -100,
        endAngle: 100,
        hollow: { margin: 15, size: '65%' },
        track: { background: '#ef4444', strokeWidth: '100%', margin: 0, strokeLinecap: 'round' },
        dataLabels: {
          name: { show: true, fontSize: '16px', color: '#4b5563', offsetY: 30 },
          value: { offsetY: -10, fontSize: '48px', fontWeight: 600, color: '#111827', formatter: function (val) { return val + "%"; } }
        }
      }
    },
    fill: { colors: ['#04ce9a'] },
    labels: ['Present'],
    stroke: { lineCap: 'round' }
  };

  const TopRightHeader = ({ title, width = "109px" }) => (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-[4px]">
        <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">{title}</h2>
        <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
      </div>
      <div className={`bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[${width}] cursor-pointer`}>
        <div className="flex items-center gap-[8px]">
          <Calendar className="w-[18px] h-[18px] text-[#4b5563]" />
          <span className="font-normal text-[#4b5563] text-[14px] leading-[normal]">Today</span>
        </div>
        <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-[24px] w-full">
      {/* Left: Attendance */}
      <Card className="flex flex-col h-full bg-white border border-[#d1d5db] rounded-[12px] p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveItem && setActiveItem('Attendance')}>
        <TopRightHeader title="Attendance" />
        
        <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative mb-8">
          <div className="h-[280px] w-full flex justify-center items-center">
            <Chart options={attendanceOptions} series={[82]} type="radialBar" height="350" />
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-white mt-auto w-full">
          <div className="flex items-center gap-[8px] bg-[#f3f4f6] p-[4px] rounded-[8px]">
            <div className="p-[4px]"><List className="w-[16px] h-[16px] text-[#4b5563]" /></div>
            <span className="text-[#111827] font-normal text-[16px] leading-[normal]">Total Vendor/Supervisors</span>
            <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[2px]" />
          </div>
          <span className="text-[28px] font-semibold text-[#111827] leading-[normal]">2</span>
        </div>
      </Card>

      {/* Right: Inspection, Contractor, Schemes, Events */}
      <div className="flex flex-col gap-[24px]">
        <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[25px] p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveItem && setActiveItem('Inspection')}>
           <TopRightHeader title="Inspection" />
           <div className="grid grid-cols-3 gap-[8px] text-center w-full">
             <div className="flex flex-col items-center gap-[4px]">
               <div className="text-[#ffa400] text-[28px] font-semibold leading-[normal]">60.9%</div>
               <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Statewide average score</div>
             </div>
             <div className="flex flex-col items-center gap-[4px]">
               <div className="text-[#111827] text-[28px] font-semibold leading-[normal]">39</div>
               <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Total Inspections</div>
             </div>
             <div className="flex flex-col items-center gap-[4px]">
               <div className="text-[#111827] text-[28px] font-semibold leading-[normal]">33/50</div>
               <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Village covered</div>
             </div>
           </div>
        </Card>

        <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[25px] p-[24px] shadow-none cursor-pointer transition-shadow hover:shadow-md" onClick={() => setActiveItem && setActiveItem('Contractor Details')}>
           <TopRightHeader title="Contractor Details" />
           <div className="grid grid-cols-2 gap-[8px] text-center w-full">
             <div className="flex flex-col items-center gap-[4px]">
               <div className="text-[#f05c51] text-[28px] font-semibold leading-[normal]">0.00 %</div>
               <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Contractor Data Filled</div>
             </div>
             <div className="flex flex-col items-center gap-[4px]">
               <div className="text-[#111827] text-[28px] font-semibold leading-[normal]">0/11,207</div>
               <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Data Filled covered</div>
             </div>
           </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px] w-full">
          <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[25px] p-[24px] shadow-none">
            <div className="flex items-center gap-[4px]">
              <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Schemes</h2>
              <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
            </div>
            <div className="flex justify-between gap-[8px] text-center w-full">
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#3b82f6] text-[28px] font-semibold leading-[normal]">15</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Total</div>
              </div>
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#04ce9a] text-[28px] font-semibold leading-[normal]">08</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Active</div>
              </div>
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#f05c51] text-[28px] font-semibold leading-[normal]">07</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Inactive</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col gap-[25px] p-[24px] shadow-none">
            <div className="flex items-center gap-[4px]">
              <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Events</h2>
              <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
            </div>
            <div className="flex justify-between gap-[8px] text-center w-full">
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#3b82f6] text-[28px] font-semibold leading-[normal]">11</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Total</div>
              </div>
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#04ce9a] text-[28px] font-semibold leading-[normal]">08</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Active</div>
              </div>
              <div className="flex flex-col items-center gap-[4px] flex-1">
                <div className="text-[#f05c51] text-[28px] font-semibold leading-[normal]">03</div>
                <div className="text-[14px] text-[#111827] font-normal leading-[normal]">Inactive</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
