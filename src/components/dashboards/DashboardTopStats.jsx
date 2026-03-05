import React from 'react';
import Card from '../common/Card';

export default function DashboardTopStats() {
  return (
    <Card className="w-full !p-0 overflow-hidden border border-[#d1d5db] rounded-[12px] bg-white">
      <div className="flex flex-col sm:flex-row justify-around items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px]">
          <div className="text-[#3b82f6] text-[32px] font-bold leading-none">41</div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Districts</div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px] bg-white">
          <div className="text-[#f59e0b] text-[32px] font-bold leading-none">780</div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Blocks</div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px] bg-white">
          <div className="text-[#8b5cf6] text-[32px] font-bold leading-none">12,000</div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Villages</div>
        </div>
      </div>
    </Card>
  );
}
