import React from 'react';
import { MoreVertical, Info, ChevronDown } from 'lucide-react';
import Card from '../common/Card';

const img104115521286803889B1549Be80E8Cab384Bb301F1 = "https://www.figma.com/api/mcp/asset/e3d90f80-1cec-4fb5-a64a-6b4fa52feb0c";
const imgFrame = "https://www.figma.com/api/mcp/asset/c4380a14-34a1-4e4a-80c3-41d015bbed88";

export default function DashboardPerformance() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] w-full">
      {/* Performance */}
      <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col p-[24px] shadow-none overflow-clip">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[16px] gap-4 w-full">
          <div className="flex items-center gap-[4px]">
            <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Performance</h2>
            <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
          </div>
          
          <div className="flex items-center gap-[8px]">
            <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between overflow-clip px-[3px] py-[4px] rounded-[8px] w-[275px]">
              <div className="bg-[#009b56] flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[6px] cursor-pointer h-full">
                <span className="font-medium text-[#f9fafb] text-[14px] leading-[normal]">Star Performers</span>
              </div>
              <div className="flex flex-[1_0_0] items-center justify-center px-[16px] py-[4px] rounded-[8px] cursor-pointer h-full">
                <span className="font-medium text-[#6b7280] text-[14px] leading-[normal]">Underperformers</span>
              </div>
            </div>
            
            <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[85px] cursor-pointer">
              <span className="font-normal text-[#4b5563] text-[14px] leading-[normal] flex-1">Month</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
            </div>
          </div>
        </div>
        
        <div className="w-full">
          <table className="w-full text-left text-[14px] whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="px-[24px] py-[12px] font-semibold text-[#111827] rounded-tl-[8px] rounded-bl-[8px]">
                  <div className="flex items-center gap-[4px]">
                    District
                    <img alt="" className="w-[16px] h-[16px]" src={imgFrame} />
                  </div>
                </th>
                <th className="px-[16px] py-[12px] font-semibold text-[#111827]">
                  <div className="flex items-center gap-[4px]">
                    Avg Resolution time
                    <img alt="" className="w-[16px] h-[16px]" src={imgFrame} />
                  </div>
                </th>
                <th className="px-[16px] py-[12px] font-semibold text-[#111827]">
                  <div className="flex items-center gap-[4px]">
                    Complaints closed
                    <img alt="" className="w-[16px] h-[16px]" src={imgFrame} />
                  </div>
                </th>
                <th className="px-[24px] py-[12px] font-semibold text-[#111827] rounded-tr-[8px] rounded-br-[8px]">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#101828]">
              {[
                { district: 'District', time: '3 days', closed: '56%' },
                { district: 'District', time: '3.3 days', closed: '56%' },
                { district: 'District', time: '4 days', closed: '56%' },
                { district: 'District', time: '4.5 days', closed: '56%' },
                { district: 'District', time: '5 days', closed: '56%' },
                { district: 'District', time: '5 days', closed: '56%' },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-[#d1d5db]">
                  <td className="px-[24px] py-[8px] h-[72px] font-medium align-middle">{row.district}</td>
                  <td className="px-[16px] py-[8px] h-[72px] font-medium align-middle">{row.time}</td>
                  <td className="px-[16px] py-[8px] h-[72px] font-medium align-middle">{row.closed}</td>
                  <td className="px-[12px] py-[8px] h-[72px] align-middle">
                    <button className="border border-[#d1d5db] rounded-[8px] px-[12px] py-[8px] h-[32px] flex items-center justify-center text-[#111827] text-[14px] font-medium hover:bg-gray-50 transition-colors w-[103px]">
                      Send notice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top 3 */}
      <Card className="bg-white border border-[#d1d5db] rounded-[12px] flex flex-col p-[24px] shadow-none overflow-clip">
        <div className="flex justify-between items-center w-full mb-[16px]">
          <div className="flex items-center gap-[4px]">
            <h2 className="text-[20px] font-semibold text-[#111827] leading-[normal]">Top 3</h2>
            <Info className="w-[16px] h-[16px] text-[#9ca3af] ml-[4px]" />
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[132px] cursor-pointer">
              <span className="font-normal text-[#4b5563] text-[14px] leading-[normal] flex-1">District</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
            </div>
            <div className="bg-white border border-[#d1d5db] flex h-[32px] items-center justify-between px-[8px] py-[9px] rounded-[8px] w-[85px] cursor-pointer">
              <span className="font-normal text-[#4b5563] text-[14px] leading-[normal] flex-1">Month</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#4b5563]" />
            </div>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-left text-[14px] whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="px-[24px] py-[12px] font-semibold text-[#111827] rounded-tl-[8px] rounded-bl-[8px]">Ranks</th>
                <th className="px-[24px] py-[12px] font-semibold text-[#111827]">District</th>
                <th className="px-[16px] py-[12px] font-semibold text-[#111827]">Rating</th>
                <th className="px-[24px] py-[12px] font-semibold text-[#111827] rounded-tr-[8px] rounded-br-[8px]"></th>
              </tr>
            </thead>
            <tbody className="text-[#101828]">
              {[
                { offset: '-23px', district: 'District name', rating: '9.8' },
                { offset: '-126px', district: 'District name', rating: '9' },
                { offset: '-230px', district: 'District name', rating: '8.2' },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-[#d1d5db]">
                  <td className="px-[16px] py-[8px] h-[121px] align-middle">
                    <div className="bg-white overflow-hidden relative shrink-0 w-[115px] h-[105px]">
                      <div className="absolute h-[234px] top-[-59px] w-[369.35px]" style={{ left: row.offset }}>
                        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none w-full h-full" src={img104115521286803889B1549Be80E8Cab384Bb301F1} />
                      </div>
                    </div>
                  </td>
                  <td className="px-[24px] py-[8px] h-[121px] font-medium align-middle">{row.district}</td>
                  <td className="px-[16px] py-[8px] h-[121px] font-medium align-middle">{row.rating}</td>
                  <td className="px-[12px] py-[8px] h-[121px] text-right align-middle">
                    <button className="bg-white p-[8px] rounded-[6px] flex items-center justify-center h-[32px] w-[32px] transition-colors">
                      <MoreVertical className="w-[20px] h-[20px] text-[#4b5563]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
