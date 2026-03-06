const fs = require('fs');

const newCode = `import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import apiClient from '../../services/api';

export default function DashboardTopStats() {
  const [stats, setStats] = useState({ districts: 0, blocks: 0, villages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [districtsRes, blocksRes, villagesRes] = await Promise.all([
          apiClient.get('/geography/districts?skip=0&limit=1000'),
          apiClient.get('/geography/blocks?skip=0&limit=10000'),
          apiClient.get('/geography/villages?skip=0&limit=100000') // Assuming village endpoint exists and limit handles the scale
        ]);

        setStats({
          districts: districtsRes.data?.length || 0,
          blocks: blocksRes.data?.length || 0,
          villages: villagesRes.data?.length || 0
        });
      } catch (error) {
        console.error('Error fetching Top Stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Card className="w-full !p-0 overflow-hidden border border-[#d1d5db] rounded-[12px] bg-white">
      <div className="flex flex-col sm:flex-row justify-around items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px]">
          <div className="text-[#3b82f6] text-[32px] font-bold leading-none">
            {loading ? '...' : stats.districts.toLocaleString()}
          </div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Districts</div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px] bg-white">
          <div className="text-[#f59e0b] text-[32px] font-bold leading-none">
            {loading ? '...' : stats.blocks.toLocaleString()}
          </div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Blocks</div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 w-full py-[16px] bg-white">
          <div className="text-[#8b5cf6] text-[32px] font-bold leading-none">
            {loading ? '...' : stats.villages.toLocaleString()}
          </div>
          <div className="text-[#374151] text-[15px] font-normal mt-2">Villages</div>
        </div>
      </div>
    </Card>
  );
}
`;

fs.writeFileSync('src/components/dashboards/DashboardTopStats.jsx', newCode);
