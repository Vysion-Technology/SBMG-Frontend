import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, ChevronsUpDown, MoreVertical } from 'lucide-react';
import RightDrawer from '../../common/rightDrawer';
import apiClient, { attendanceAPI, contractorAnalyticsAPI, vehiclesAPI, inspectionsAPI } from '../../../services/api';
import { useLocation } from '../../../context/LocationContext';
import { ins } from 'framer-motion/client';

/** Dark tooltip with list of items (dot + label + count) - uses fixed positioning to escape scroll containers */
const TooltipPopover = ({ children, items, show }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' });
  const triggerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);

  React.useEffect(() => {
    if (!show || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.offsetHeight || 120;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const gap = 6;

      let placement = 'bottom';
      let top = rect.bottom + gap;

      // If not enough space below (less than 150px), show above
      if (spaceBelow < 150 && spaceAbove > tooltipHeight + gap) {
        placement = 'top';
        top = rect.top - tooltipHeight - gap;
      }

      setPosition({
        top,
        left: rect.left,
        placement
      });
    };

    // Update on show and on window events
    updatePosition();
    const timer = setTimeout(updatePosition, 0);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show]);

  return (
    <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      {show && items.length > 0 && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            padding: '10px 12px',
            backgroundColor: '#374151',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 99999,
            minWidth: 200,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {items.map(({ color, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, color: '#fff' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * List of Districts table.
 * Data sources:
 * - Districts, Blocks, GPs: from geography API (dynamic)
 * - Complaints: from /complaints/analytics/geo (dynamic)
 * - GP Data Coverage: derived from blocks/gps
 * - Attendance, Contractor Data Filled, GPS Tracking, Schemes, Events: use districtStats prop when provided;
 *   otherwise placeholder values until district-level APIs are wired.
 */

/**
 * Segmented horizontal bar for Complaints column with hover tooltip.
 * Colors: open=red, verified=orange, resolved=purple, disposed=green
 */
const ComplaintsBar = ({ open = 0, verified = 0, resolved = 0, disposed = 0, onClick }) => {
  const [hover, setHover] = useState(false);
  let total = open + verified + resolved + disposed;
  if (total === 0) return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;

  const segments = [
    { pct: (open / total) * 100, color: '#ef4444' },
    { pct: (verified / total) * 100, color: '#f97316' },
    { pct: (resolved / total) * 100, color: '#8b5cf6' },
    { pct: (disposed / total) * 100, color: '#10b981' }
  ].filter((s) => s.pct > 0);

  const tooltipItems = [
    { color: '#ef4444', label: 'Open complaints', value: open },
    { color: '#8b5cf6', label: 'Resolved complaints', value: resolved },
    { color: '#f97316', label: 'Verified complaints', value: verified },
    { color: '#10b981', label: 'Disposed complaints', value: disposed }
  ];

  return (
    <TooltipPopover items={tooltipItems} show={hover} position="bottom">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: onClick ? 'pointer' : 'default' }}
      >
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', minWidth: 24 }}>{total}</span>
        <div style={{ flex: 1, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', minWidth: 80, maxWidth: 120 }}>
          {segments.map((s, i) => (
            <div key={i} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
          ))}
        </div>
      </div>
    </TooltipPopover>
  );
};

/**
 * Attendance bar: present (green) vs absent (red) with hover tooltip
 */
const AttendanceBar = ({ present = 0, absent = 0, onClick }) => {
  const [hover, setHover] = useState(false);
  const total = present + absent;
  if (total === 0) return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;

  const presentPct = (present / total) * 100;
  const absentPct = (absent / total) * 100;

  const tooltipItems = [
    { color: '#10b981', label: 'CSC Cleaned', value: present },
    { color: '#ef4444', label: 'CSC Not Cleaned', value: absent }
  ];



  return (
    <TooltipPopover items={tooltipItems} show={hover}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: onClick ? 'pointer' : 'default' }}
      >
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', minWidth: 24 }}>{total === 151 ? 0 : total}</span>
        {total !== 151 && (
          <div style={{ flex: 1, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', minWidth: 80, maxWidth: 120 }}>
            <div style={{ width: `${absentPct}%`, backgroundColor: '#ef4444' }} />
            <div style={{ width: `${presentPct}%`, backgroundColor: '#10b981' }} />
          </div>
        )}
      </div>
    </TooltipPopover>
  );
};

/**
 * Contractor Data Filled: color-coded progress bar (red <50%, orange 50-80%, green >80%)
 */
/**
 * Contractor Data Filled: color-coded progress bar (red <50%, orange 50-80%, green >80%)
 */
const ContractorDataBar = ({ percentage = 0, onClick }) => {
  const [hover, setHover] = useState(false);
  const pct = Math.min(100, Math.max(0, percentage));

  if (pct === 0) return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;

  // Percentage ke base par color decide karna
  const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f97316' : '#ef4444';

  const tooltipItems = [
    { color: barColor, label: 'Data Filled', value: `${pct.toFixed(2)}%` }
  ];

  return (
    <TooltipPopover items={tooltipItems} show={hover}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', minWidth: 48 }}>
          {pct.toFixed(0)}%
        </span>
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#f3f4f6',
          overflow: 'hidden',
          minWidth: 80,
          maxWidth: 120
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </TooltipPopover>
  );
};

/**
 * GP Data Coverage: percentage with clickable interactive behavior
 */
/**
 * GP Data Coverage: percentage with hover tooltip and clickable behavior
 */
const GPDataCoverageBar = ({ percentage = 0, onClick }) => {
  const [hover, setHover] = useState(false); // Hover state add ki
  const pct = Math.min(100, Math.max(0, percentage));

  if (pct === 0) {
    return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;
  }

  const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f97316' : '#ef4444';

  // Tooltip ke liye items array
  const tooltipItems = [
    { color: barColor, label: 'GP Data Coverage', value: `${pct.toFixed(2)}%` }
  ];

  return (
    <TooltipPopover items={tooltipItems} show={hover}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            minWidth: 48
          }}
        >
          {pct.toFixed(0)}%
        </span>

        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#f3f4f6',
            overflow: 'hidden',
            minWidth: 80,
            maxWidth: 120
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    </TooltipPopover>
  );
};

/**
 * GPS Tracking: vehicles count only (with clickable interactive behavior)
 */
const GpsTrackingBar = ({ vehicles = 0, onClick }) => {
  if (vehicles === 0) return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{ fontSize: '14px', fontWeight: 500, color: '#374151', cursor: onClick ? 'pointer' : 'default' }}
    >
      {vehicles} Vehicles
    </span>
  );
};

/**
 * Inspection Score: displays average inspection score with color coding
 */
const InspectionScoreBar = ({ averageScore = 0, onClick }) => {
  // Show dash only if score is exactly 0 or null/undefined
  if (averageScore === 0 || averageScore === null || averageScore === undefined) {
    return <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>;
  }

  // Convert to number if it's a string
  const score = typeof averageScore === 'string' ? parseFloat(averageScore) : averageScore;

  // Color code based on score: red <50%, orange 50-75%, green >75%
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f97316' : '#ef4444';

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        color: scoreColor,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {score}
    </span>
  );
};

/**
 * Optional districtStats: map of districtId -> { schemes, events, gpsVehicles, gpsPct, attendance: {present, absent}, contractorPct }
 * When not provided, placeholder values are used until APIs are wired.
 */
const ListOfDistrictsTable = ({
  districts = [],
  analyticsData = null,
  blocks = [],
  gpStats = [],
  districtStats = null,
  dateDisplayText = 'Today',
  onDateClick,
  onComplaintsClick,
  onAttendanceClick,
  onGPDataCoverageClick,
  onGPSTrackingClick,
  onContractorDataClick,
  onGPDataStatusClick,
  onInspectionClick,
  loading = false
}) => {
  // Location context for updating selected block/district/gp when clicking rows
  const locationContext = useLocation();
  const {
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    updateLocationSelection,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    setActiveScope,
    setDropdownLevel
  } = locationContext || {};

  const [sortBy, setSortBy] = useState('district');
  const [sortDir, setSortDir] = useState('asc');
  const [blocksForDistrict, setBlocksForDistrict] = useState([]);
  const [blockStatsForDistrict, setBlockStatsForDistrict] = useState({});
  const [gpsForBlock, setGpsForBlock] = useState([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpForBlock, setGpForBlock] = useState([]);
  const [complaintsData, setComplaintsData] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [blockStats, setBlockStats] = useState([]);
  const [gpStatics, setGpStatics] = useState([]);
  const [inspectionData, setInspectionData] = useState([]);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [blockInspectionData, setBlockInspectionData] = useState({});
  const [gpInspectionData, setGpInspectionData] = useState({});
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-12-31`;
  });

  // Fetch complaints data from API
  useEffect(() => {
    const fetchComplaintsData = async () => {
      try {
        setLoadingComplaints(true);
        const response = await apiClient.get('/complaints', {
          params: {
            limit: 1000,
            order_by: 'newest'
          }
        });

        if (response.data) {
          setComplaintsData(Array.isArray(response.data) ? response.data : response.data.data || response.data.complaints || []);
        }
      } catch (error) {
        console.error('❌ Error fetching complaints data:', error);
        setComplaintsData([]);
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchComplaintsData();
  }, []);

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoadingAttendance(true);
        const response = await apiClient.get('/attendance/analytics', {
          params: {
            level: 'DISTRICT',
            start_date: '2026-01-01',
            end_date: '2026-12-31'
          }
        });

        if (response.data) {
          // Extract response array - handle different response structures
          const data = Array.isArray(response.data)
            ? response.data
            : (response.data.response || response.data.data || response.data.attendance || []);
          setAttendanceData(data);
        }
      } catch (error) {
        console.error('❌ Error fetching attendance data:', error);
        setAttendanceData([]);
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Fetch inspection analytics data from API
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        setLoadingInspection(true);

        // First try the bulk API call
        const response = await inspectionsAPI.analytics({
          level: 'DISTRICT',
          start_date: '2026-01-01',
          end_date: '2026-12-31'
        });

        if (response) {
          // Extract response array
          let data = [];

          if (Array.isArray(response)) {
            data = response;
          } else if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data?.response) {
            data = response.data.response;
          } else if (response.data?.data) {
            data = response.data.data;
          } else if (response.data?.inspections) {
            data = response.data.inspections;
          }

          // Check if we got per-district data or aggregated data
          const hasDistrictInfo = data.some(r => r.district_id || r.districtId || r.geography_id);

          if (hasDistrictInfo || data.length === 0) {
            // If we have per-district data or no data, use the result
            setInspectionData(Array.isArray(data) ? data : []);
          } else if (data.length === 1 && data[0].average_score && !data[0].district_id) {

            if (districts && districts.length > 0) {
              // Fetch inspection data for each district individually
              const districtInspections = await Promise.all(
                districts.map(district =>
                  inspectionsAPI.analytics({
                    geography_id: district.id,
                    geography_type: 'DISTRICT',
                    start_date: '2026-01-01',
                    end_date: '2026-12-31'
                  })
                    .then(res => {
                      // Extract score from response
                      let score = 0;
                      if (res && typeof res === 'object') {
                        if (Array.isArray(res)) {
                          score = res[0]?.average_score || 0;
                        } else if (Array.isArray(res.data)) {
                          score = res.data[0]?.average_score || res.data?.average_score || 0;
                        } else if (res.average_score) {
                          score = res.average_score;
                        } else if (res.data?.average_score) {
                          score = res.data.average_score;
                        }
                      }
                      return { district_id: district.id, average_score: score };
                    })
                    .catch(err => {
                      console.error(`Error fetching inspection for district ${district.id}:`, err);
                      return { district_id: district.id, average_score: 0 };
                    })
                )
              );
              setInspectionData(districtInspections);
            } else {
              setInspectionData(Array.isArray(data) ? data : []);
            }
          } else {
            setInspectionData(Array.isArray(data) ? data : []);
          }
        } else {
          setInspectionData([]);
        }
      } catch (error) {
        console.error('❌ Error fetching inspection data:', error);
        setInspectionData([]);
      } finally {
        setLoadingInspection(false);
      }
    };

    fetchInspectionData();
  }, []);

  // Filter complaints by district ID
  const filterComplaintsByDistrict = (districtId) => {
    return complaintsData.filter(complaint => {
      const compDistrictId = complaint.district_id || complaint.districtId || complaint.geography_id;
      return String(compDistrictId) === String(districtId);
    });
  };

  // Build attendance stats per district from fetched attendance data using district_id
  const attendanceByDistrict = useMemo(() => {
    const map = {};

    // Count attendance by district_id from fetched API data
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((record) => {
        const districtId = record.district_id || record.districtId || record.geo_id || record.geography_id;
        if (!districtId) return;

        const key = String(districtId);

        // Initialize with first occurrence
        map[key] = {
          present: record.present_count || 0,
          absent: record.absent_count || 0
        };
      });
      return map;
    }

    return map;
  }, [attendanceData]);

  // Build complaint stats per district from fetched complaints data using district_name
  const complaintsByDistrictName = useMemo(() => {
    const map = {};

    // Count complaints by district_name from fetched API data
    if (complaintsData && complaintsData.length > 0) {
      complaintsData.forEach((complaint) => {
        const districtName = complaint.district_name;
        if (!districtName) return;

        const key = String(districtName).toLowerCase().trim();

        if (!map[key]) {
          map[key] = {
            districtName: districtName,
            count: 0,
            open: 0,
            verified: 0,
            resolved: 0,
            disposed: 0
          };
        }

        // Increment total count
        map[key].count += 1;

        // Map complaint status to our categories
        const status = (complaint.status || complaint.complaint_status || '').toUpperCase();
        switch (status) {
          case 'OPEN':
          case 'PENDING':
            map[key].open += 1;
            break;
          case 'VERIFIED':
            map[key].verified += 1;
            break;
          case 'RESOLVED':
            map[key].resolved += 1;
            break;
          case 'CLOSED':
          case 'DISPOSED':
            map[key].disposed += 1;
            break;
          default:
            break;
        }
      });
      return map;
    }

    return map;
  }, [complaintsData]);

  // Build inspection stats per district from fetched inspection data using district_id or name
  const inspectionByDistrict = useMemo(() => {
    const map = {};

    // Map inspection data by district_id from fetched API data
    if (inspectionData && inspectionData.length > 0) {
      inspectionData.forEach((record, idx) => {

        // Try to get district ID from multiple possible field names
        const districtId = record.district_id || record.districtId || record.geo_id || record.geography_id || record.id;
        const districtName = record.district_name || record.districtName || record.name || record.geography_name;
        const score = record.average_score || 0;

        if (districtId) {
          const key = String(districtId);
          map[key] = {
            average_score: score !== 0 ? parseFloat(score).toFixed(2) : 0,
            by_id: true
          };
        } else if (districtName) {
          // Fallback: map by district name
          const key = String(districtName).toLowerCase().trim();
          map[key] = {
            average_score: score !== 0 ? parseFloat(score).toFixed(2) : 0,
            by_name: true
          };
        }
      });
      return map;
    }
    return map;
  }, [inspectionData]);

  // Build complaint stats per district from fetched complaints data

  const getGPsForBlock = async () => {
    const [gpResponses] = await Promise.all([
      Promise.all(
        blocksForDistrict.map((block) =>
          apiClient.get(`/annual-surveys/analytics/block/${block.id}`, {
            params: { fy_id: 1 }
          })
        )
      ),
    ]);

    const allGPs = gpResponses.flatMap((r) => r.data || []);
    setGpForBlock(allGPs);
  }

  const getBlockCount = (districtId) => {
    return blocks.filter(item => item.district_id === districtId).length;
  };

  const getGPCount = (districtId) => {
    return gpStats.find((gp) => gp.geography_id === districtId)?.total_gps ?? 0;
  };

  const getGPbyBlock = (blockId) => {
    return gpForBlock.find((gp) => gp.block_id === blockId) ?? 0;
  };

  useEffect(() => {
    if (blocksForDistrict.length > 0) {
      getGPsForBlock();
    }
  }, [blocksForDistrict]);

  const getGPDataCoverage = (districtId) => {
    return gpStats.find((gp) => gp.geography_id === districtId)?.coverage_percentage ?? 0;
  };

  /**
   * Compute block-wise statistics from all GPs data.
   * Returns an object with blockId as key and stats as value:
   * { blockId: { totalGPs, gpWithData, coverage } }
   */
  const computeBlockStats = (districtId) => {
    const stats = {};
    const districtBlocks = blocks.filter(b => b.district_id === districtId);

    // Find all GPs for this district from allGpsForDistricts
    const districtGpsData = gpStats.find(
      (d) => d.district_id === districtId || d.geography_id === districtId
    );

    districtBlocks.forEach((block) => {
      if (districtGpsData && districtGpsData.block_wise_coverage) {
        // Use aggregated data if available
        const blockWiseCoverage = districtGpsData.block_wise_coverage || {};
        const blockData = blockWiseCoverage[block.id] || blockWiseCoverage[block.name] || {};
        stats[block.id] = {
          totalGPs: blockData.total_gps ?? 0,
          gpWithData: blockData.gps_with_data ?? blockData.total_gps ?? 0,
          coverage: blockData.coverage_percentage ?? 0
        };
      } else {
        // If no aggregated data, compute from gpStats array by filtering for this block
        const blockGPs = gpStats.filter(
          (gp) => gp.block_id === block.id || gp.geography_id === block.id
        );

        stats[block.id] = {
          totalGPs: blockGPs.length,
          gpWithData: blockGPs.length, // Assuming all filtered GPs have data
          coverage: blockGPs.length > 0 ? 100 : 0 // 100% if they exist
        };
      }
    });

    return stats;
  };

  // Placeholder values when API data is missing (for visual display)
  // Placeholder values when API data is missing (for visual display)
  // For complaints we prefer showing zeros when no data is present
  const PLACEHOLDER_COMPLAINTS = { open: 0, verified: 0, resolved: 0, disposed: 0 };

  const rows = useMemo(() => {
    return districts.map((d, idx) => {
      // Match complaints by district name (normalize to lowercase for matching)
      const districtNameKey = String(d.name).toLowerCase().trim();
      const complaintsByName = complaintsByDistrictName[districtNameKey];

      const complaints = complaintsByName
        ? { open: complaintsByName.open, verified: complaintsByName.verified, resolved: complaintsByName.resolved, disposed: complaintsByName.disposed }
        : { open: 0, verified: 0, resolved: 0, disposed: 0 };

      const totalComplaints = complaintsByName ? complaintsByName.count : 0;

      // Get attendance data from  API by district ID
      const attendanceFromApi = attendanceByDistrict[String(d.id)];
      const attendance = attendanceFromApi
        ? { present: attendanceFromApi.present, absent: attendanceFromApi.absent }
        : (districtStats?.[d.id]?.attendance || districtStats?.[String(d.id)]?.attendance || { present: 0, absent: 0 });

      const blockCount = getBlockCount(d.id);
      const gpCount = getGPCount(d.id);
      let gpDataCoverage = getGPDataCoverage(d.id);
      const stats = districtStats?.[d.id] || districtStats?.[String(d.id)];
      const seed = (d.id ?? idx) % 100;
      const hasBlocksData = blockCount > 0;
      const hasComplaintsData = totalComplaints > 0;
      const hasGpCoverageData = hasBlocksData && gpDataCoverage > 0;
      // Get inspection score from API data by district ID, fallback to district name
      let inspectionScore = inspectionByDistrict[String(d.id)]?.average_score;
      if (!inspectionScore) {
        // Try looking up by district name (lowercase)
        const districtNameKey = String(d.name).toLowerCase().trim();
        inspectionScore = inspectionByDistrict[districtNameKey]?.average_score || 0;
      }
      // Use placeholders when no real data (so bars/numbers are visible)
      const blocksDisplay = hasBlocksData ? blockCount : 8 + (seed % 8);
      const gpsDisplay = hasBlocksData ? gpCount : 24 + (seed % 20);
      const complaintsDisplay = hasComplaintsData ? complaints : PLACEHOLDER_COMPLAINTS;
      const gpDataCoverageDisplay = hasGpCoverageData ? gpDataCoverage : 55 + (seed % 35);
      return {
        id: d.id,
        name: d.name,
        blocks: blockCount,
        gps: gpCount,
        blocksDisplay,
        gpsDisplay,
        complaints: complaintsDisplay,
        totalComplaints: hasComplaintsData ? totalComplaints : 0,
        attendance: attendance,
        gpDataCoverage: gpDataCoverageDisplay,
        contractorPct: stats?.contractorPct,
        gpsVehicles: stats?.gpsVehicles,
        gpsPct: stats?.gpsPct ?? (60 + (seed % 35)),
        inspectionScore: inspectionScore
      };
    });
  }, [districts, complaintsByDistrictName, attendanceByDistrict, blocks, gpStats, districtStats, inspectionByDistrict]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'district':
          va = (a.name || '').toLowerCase();
          vb = (b.name || '').toLowerCase();
          return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'block':
          va = a.blocksDisplay;
          vb = b.blocksDisplay;
          break;
        case 'gps':
          va = a.gpsDisplay;
          vb = b.gpsDisplay;
          break;
        case 'complaints':
          va = (Number(a.complaints.open) || 0) + (Number(a.complaints.verified) || 0) + (Number(a.complaints.resolved) || 0) + (Number(a.complaints.disposed) || 0);
          vb = (Number(b.complaints.open) || 0) + (Number(b.complaints.verified) || 0) + (Number(b.complaints.resolved) || 0) + (Number(b.complaints.disposed) || 0);
          break;
        case 'CSC Cleaning':
          va = a.attendance.present + a.attendance.absent;
          vb = b.attendance.present + b.attendance.absent;
          break;
        case 'gpCoverage':
          va = a.gpDataCoverage;
          vb = b.gpDataCoverage;
          break;
        case 'contr':
          va = a.contractorPct;
          vb = b.contractorPct;
          break;
        case 'inspection':
          va = a.inspectionScore;
          vb = b.inspectionScore;
          break;
        case 'gpsTrack':
          va = a.gpsVehicles;
          vb = b.gpsVehicles;
          break;
        default:
          return 0;
      }
      return sortDir === 'asc' ? (va - vb) : (vb - va);
    });
    return copy;
  }, [rows, sortBy, sortDir, blockStats.complaints]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronsUpDown style={{ width: 14, height: 14, color: '#9ca3af' }} />;
    return sortDir === 'asc' ? (
      <ChevronUp style={{ width: 14, height: 14, color: '#6b7280' }} />
    ) : (
      <ChevronDown style={{ width: 14, height: 14, color: '#6b7280' }} />
    );
  };

  // Handle district selection from table row click
  const handleDistrictRowClick = (districtId, districtName) => {
    if (updateLocationSelection) {
      updateLocationSelection('Districts', districtName, districtId, districtId, null, null, 'table_click');
      console.log('🔍 District selected from table:', districtName, 'ID:', districtId);

      // Also update the header's hierarchy display
      if (setSelectedDistrictForHierarchy) {
        setSelectedDistrictForHierarchy({ id: districtId, name: districtName });
      }
      if (setActiveScope) {
        setActiveScope('Districts');
      }
      if (setDropdownLevel) {
        setDropdownLevel('blocks');
      }
    }
  };

  // Handle block selection from table row click
  const handleBlockRowClick = (blockId, blockName, districtId, districtName) => {
    if (updateLocationSelection) {
      updateLocationSelection('Blocks', blockName, blockId, districtId, blockId, null, 'table_click');
      console.log('🔍 Block selected from table:', blockName, 'ID:', blockId);

      // Also update the header's hierarchy display for complete navigation
      if (setSelectedDistrictForHierarchy && districtId && districtName) {
        setSelectedDistrictForHierarchy({ id: districtId, name: districtName });
      }
      if (setSelectedBlockForHierarchy) {
        setSelectedBlockForHierarchy({ id: blockId, name: blockName });
      }
      if (setActiveScope) {
        setActiveScope('Blocks');
      }
      if (setDropdownLevel) {
        setDropdownLevel('gps');
      }
    }
  };

  // Handle GP selection from table row click
  const handleGPRowClick = (gpId, gpName, blockId, districtId, blockName, districtName) => {
    if (updateLocationSelection) {
      updateLocationSelection('GPs', gpName, gpId, districtId, blockId, gpId, 'table_click');
      console.log('🔍 GP selected from table:', gpName, 'ID:', gpId);

      // Also update the header's hierarchy display for complete navigation
      if (setSelectedDistrictForHierarchy && districtId && districtName) {
        setSelectedDistrictForHierarchy({ id: districtId, name: districtName });
      }
      if (setSelectedBlockForHierarchy && blockId && blockName) {
        setSelectedBlockForHierarchy({ id: blockId, name: blockName });
      }
      if (setActiveScope) {
        setActiveScope('GPs');
      }
      if (setDropdownLevel) {
        setDropdownLevel('gps');
      }
    }
  };

  const filterBlocksByDistrict = async (districtId) => {
    setBlocksForDistrict([]); // Clear previous data to show loading state in drawer

    const result = blocks.filter(block => block.district_id === districtId);

    // Count complaints and attendance for each block
    const blockComplaints = {};
    const blockAttendance = {};
    const contractorData = {};
    const gpsTrackingData = {};
    const inspectionData = {};

    // API for fetching block-wise attendance data
    const attendanceRes = await apiClient.get('/attendance/analytics', { params: { level: 'BLOCK', start_date: '2026-01-01', end_date: '2026-12-31' } });

    result.forEach(async (block) => {
      const blockName = block.name;

      // Filter complaints for this block
      const complaintsForBlock = complaintsData.filter(complaint => {
        const compBlockName = complaint.block_name;
        return String(compBlockName).toLowerCase().trim() === String(blockName).toLowerCase().trim();
      });

      // Count complaints by status
      const open = complaintsForBlock.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'OPEN' || (c.status || c.complaint_status || '').toUpperCase() === 'PENDING').length;
      const verified = complaintsForBlock.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'VERIFIED').length;
      const resolved = complaintsForBlock.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'RESOLVED').length;
      const disposed = complaintsForBlock.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'CLOSED' || (c.status || c.complaint_status || '').toUpperCase() === 'DISPOSED').length;

      blockComplaints[block.id] = {
        block_name: blockName,
        open,
        verified,
        resolved,
        disposed
      };

      // Filter attendance data for this block
      const attendanceForBlock = (attendanceRes.data.response).filter(record => {
        const recordBlockId = record.geography_id;
        const recordBlockName = record.geography_name;
        return (
          String(recordBlockId).toLowerCase().trim() === String(block.id).toLowerCase().trim() ||
          String(recordBlockName).toLowerCase().trim() === String(blockName).toLowerCase().trim()
        );
      });

      // Count attendance
      let present = 0;
      let absent = 0;
      attendanceForBlock.forEach(record => {
        present += record.present_count || 0;
        absent += record.absent_count || 0;
      });

      blockAttendance[block.id] = {
        block_name: blockName,
        present,
        absent
      };

      // Count contractor data filled percentage and GPS tracking vehicles for this block from respective APIs
      const [contrRes, gpsRes, inspectionRes] = await Promise.allSettled([
        contractorAnalyticsAPI.getBlock(block.id),
        vehiclesAPI.getVehiclesList ? vehiclesAPI.getVehiclesList({ block_id: block.id }) : vehiclesAPI.getVehiclesByLocation({ block_id: block.id }),
        inspectionsAPI.analytics({
          geography_id: block.id,
          geography_type: 'BLOCK',
          start_date: '2026-01-01',
          end_date: '2026-12-31'
        })
      ]);

      const contractorRes = contrRes.status === 'fulfilled' && contrRes.value?.data
        ? contrRes.value.data : null;

      const gpsResData = gpsRes.status === 'fulfilled' && gpsRes.value?.data ? gpsRes.value.data : null;

      let inspectionAPIData = null;
      if (inspectionRes.status === 'fulfilled' && inspectionRes.value) {
        // Try different extraction paths
        if (Array.isArray(inspectionRes.value)) {
          inspectionAPIData = inspectionRes.value;
        } else if (Array.isArray(inspectionRes.value.data)) {
          inspectionAPIData = inspectionRes.value.data;
        } else if (inspectionRes.value.data?.response) {
          inspectionAPIData = inspectionRes.value.data.response;
        } else if (Array.isArray(inspectionRes.value.data?.data)) {
          inspectionAPIData = inspectionRes.value.data.data;
        }
      }

      contractorData[block.id] = {
        block_name: blockName,
        contractorDataPercent: contractorRes.gps_with_contractor_data / contractorRes.total_contractors * 100 || 0
      };

      gpsTrackingData[block.id] = {
        block_name: blockName,
        gpsVehicles: gpsResData.length
      };

      // Filter to find the matching block record and get its average_score
      let blockScore = 0;
      if (inspectionAPIData && Array.isArray(inspectionAPIData)) {
        const matchingBlockRecord = inspectionAPIData.find(record => record.geography_id === block.id);
        blockScore = matchingBlockRecord?.average_score || 0;
      }

      inspectionData[block.id] = {
        block_name: blockName,
        average_score: blockScore
      };
    });

    setBlocksForDistrict(result);
    setBlockStats({ complaints: blockComplaints, attendance: blockAttendance, contractor: contractorData, gpsTracker: gpsTrackingData, inspection: inspectionData });


    // Compute block-wise statistics
    const stats = computeBlockStats(districtId);
    setBlockStatsForDistrict(stats);
  };

  const filterGPsByBlock = async (blockId) => {
    setGpsForBlock([]); // Clear previous data to show loading state in drawer

    let allGps = await apiClient.get('/geography/grampanchayats', {
      params: {
        block_id: blockId,
        skip: 0,
        limit: 100
      }
    });
    allGps = allGps.data || [];

    // Count complaints and attendance for each block
    const gpComplaints = {};
    const gpAttendance = {};
    const contractorData = {};
    const gpsTrackingData = {};
    const gpDataStatus = {};
    const inspectionData = {};

    // API for fetching block-wise attendance data
    const attendanceRes = await apiClient.get('/attendance/analytics', { params: { level: 'VILLAGE', start_date: '2026-01-01', end_date: '2026-12-31' } });

    await Promise.all(allGps.map(async (gp) => {
      const gpName = gp.name;

      // Filter complaints for this gp
      const complaintsForgp = complaintsData.filter(complaint => {
        const compGpName = complaint.village_name;
        return String(compGpName).toLowerCase().trim() === String(gpName).toLowerCase().trim();
      });

      // Count complaints by status
      const open = complaintsForgp.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'OPEN' || (c.status || c.complaint_status || '').toUpperCase() === 'PENDING').length;
      const verified = complaintsForgp.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'VERIFIED').length;
      const resolved = complaintsForgp.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'RESOLVED').length;
      const disposed = complaintsForgp.filter(c => (c.status || c.complaint_status || '').toUpperCase() === 'CLOSED' || (c.status || c.complaint_status || '').toUpperCase() === 'DISPOSED').length;

      gpComplaints[gp.id] = {
        gp_name: gpName,
        open,
        verified,
        resolved,
        disposed
      };

      // Filter attendance data for this GP
      const attendanceForGp = (attendanceRes.data.response).filter(record => {
        const recordGpId = record.geography_id;
        const recordGpName = record.geography_name;
        return (
          String(recordGpId).toLowerCase().trim() === String(gp.id).toLowerCase().trim() ||
          String(recordGpName).toLowerCase().trim() === String(gpName).toLowerCase().trim()
        );
      });

      // Count attendance
      let present = 0;
      let absent = 0;
      attendanceForGp.forEach(record => {
        present += record.present_count || 0;
        absent += record.absent_count || 0;
      });

      gpAttendance[gp.id] = {
        gp_name: gpName,
        present,
        absent
      };

      // Count contractor data filled percentage and GPS tracking vehicles for this block from respective APIs
      const [contrRes, gpsRes, gpAnalyticsRes, inspectionRes] = await Promise.allSettled([
        contractorAnalyticsAPI.getGP(gp.id),
        vehiclesAPI.getVehiclesList ? vehiclesAPI.getVehiclesList({ gp_id: gp.id }) : vehiclesAPI.getVehiclesByLocation({ gp_id: gp.id }),
        apiClient.get(`/annual-surveys/analytics/gp/${gp.id}`, { params: { fy_id: 1 } }),
        inspectionsAPI.analytics({
          geography_id: gp.id,
          geography_type: 'VILLAGE',
          start_date: '2026-01-01',
          end_date: '2026-12-31'
        })
      ]);

      const contractorRes = contrRes.status === 'fulfilled' && contrRes.value?.data
        ? contrRes.value.data : null;

      const gpsResData = gpsRes.status === 'fulfilled' && gpsRes.value?.data ? gpsRes.value.data : null;

      const gpAnalyticsData = gpAnalyticsRes.status === 'fulfilled' && gpAnalyticsRes.value?.data
        ? gpAnalyticsRes.value.data : null;

      const inspectionResData = inspectionRes.status === 'fulfilled' && inspectionRes.value?.data
        ? inspectionRes.value.data.response : null;


      contractorData[gp.id] = {
        gp_name: gpName,
        contractorDataPercent: contractorRes.total_contractors ? contractorRes.gps_with_contractor_data / contractorRes.total_contractors * 100 : 0,
        hasContractorData: contractorRes.contractor_data_status
      };

      gpsTrackingData[gp.id] = {
        gp_name: gpName,
        gpsVehicles: gpsResData.length
      };

      gpDataStatus[gp.id] = {
        gp_name: gpName,
        master_data_available: gpAnalyticsData?.master_data_available
      };

      inspectionData[gp.id] = {
        gp_name: gpName,
        average_score: inspectionResData?.[gp.id]?.average_score || 0
      };
    }));

    setGpsForBlock(allGps);

    setGpStatics({ complaints: gpComplaints, attendance: gpAttendance, contractor: contractorData, gpsTracker: gpsTrackingData, gpDataStatus: gpDataStatus, inspection: inspectionData });
  };

  return (
    <div
      className="list-of-districts-table"
      style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#111827',
          margin: 0
        }}>
          List of Districts
        </h2>
        {/* <button
          onClick={onDateClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            backgroundColor: 'white',
            color: '#6b7280',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <Calendar style={{ width: 16, height: 16 }} />
          {dateDisplayText}
          <ChevronDown style={{ width: 16, height: 16 }} />
        </button> */}
      </div>

      <div className="table-scroll-container [&::-webkit-scrollbar]:w-[8px]  [&::-webkit-scrollbar]:h-[8px] [&::-webkit-scrollbar-track]:bg-transparent 
  [&::-webkit-scrollbar-thumb]:bg-gray-300 
  [&::-webkit-scrollbar-thumb]:rounded-full " style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 320, WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
            <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('district')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>District <SortIcon col="district" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('block')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Block <SortIcon col="block" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('gps')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GPs <SortIcon col="gps" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('complaints')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Complaints <SortIcon col="complaints" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('CSC Cleaning')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>CSC Cleaning <SortIcon col="attendance" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('gpCoverage')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GP Data Coverage <SortIcon col="gpCoverage" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('contr')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Contractor Data Filled <SortIcon col="contr" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('inspection')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Inspection Avg. Score <SortIcon col="inspection" /></span>
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('gpsTrack')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GPS Tracking <SortIcon col="gpsTrack" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                  Loading...
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: selectedDistrictId === row.id ? '#f0f9ff' : 'white' }}
                  onClick={() => handleDistrictRowClick(row.id, row.name)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDistrictId === row.id ? '#f0f9ff' : 'white'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#059669', fontWeight: 500, fontSize: 14 }}>{row.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                    <RightDrawer
                      title={`${row.name} - Blocks`}
                      clickFunction={() => filterBlocksByDistrict(row.id)}
                      showBack
                      trigger={
                        <button
                          className="underline text-indigo-600 hover:text-indigo-800 cursor-pointer px-4 py-2 rounded flex gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDistrictRowClick(row.id, row.name);
                          }}
                        >
                          {row.blocksDisplay} Blocks
                        </button>
                      }
                    >
                      {/* Everything here appears inside the drawer */}
                      <div className="blocksContentDrawer">
                        <div className={`p-4! border rounded-xl space-base mb-4! border-[#D1D5DB]`}>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Block-wise Details</h3>
                          <div className="table-scroll-container  [&::-webkit-scrollbar]:w-[8px]  [&::-webkit-scrollbar]:h-[8px] [&::-webkit-scrollbar-track]:bg-transparent 
  [&::-webkit-scrollbar-thumb]:bg-gray-300 
  [&::-webkit-scrollbar-thumb]:rounded-full " style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 320, WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%', minWidth: 0 }}>
                            <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
                                <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Block</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GPs</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Complaints</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>CSC Cleaning</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GP Data Coverage</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Contractor Data Filled</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Inspection Avg. Score</span>
                                  </th>
                                  <th
                                    style={{
                                      padding: '12px 16px',
                                      textAlign: 'left',
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: '#374151',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GPS Tracking</span>
                                  </th>
                                  <th style={{ padding: '12px 16px', width: 40 }} />
                                </tr>
                              </thead>
                              <tbody>
                                {loading ? (
                                  <tr>
                                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                      Loading...
                                    </td>
                                  </tr>
                                ) : blocksForDistrict.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                      Loading...
                                    </td>
                                  </tr>
                                ) : (
                                  blocksForDistrict.map((block) => {
                                    const selectedBlockDetails = getGPbyBlock(block.id);
                                    const districtData = districts.find(d => d.id === selectedDistrictId);

                                    return (
                                      <tr
                                        key={block.id}
                                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: selectedBlockId === block.id ? '#f0f9ff' : 'white' }}
                                        onClick={() => handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedBlockId === block.id ? '#f0f9ff' : 'white'}
                                      >
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <span style={{ fontWeight: 500, color: '#059669' }}>{block.name}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <RightDrawer
                                            title={`${block.name} - GPs`}
                                            clickFunction={() => filterGPsByBlock(block.id, block.name)}
                                            showBack
                                            trigger={
                                              <button
                                                className="underline text-indigo-600 hover:text-indigo-800 cursor-pointer px-2 py-1 rounded text-sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                                }}
                                              >
                                                {selectedBlockDetails?.gp_wise_coverage?.length} GPs
                                              </button>
                                            }
                                          >
                                            <div className="gpContentDrawer">
                                              <div className={`p-4! border rounded-xl space-base mb-4! border-[#D1D5DB]`}>
                                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Gram Panchayats in {block.name}</h3>
                                                <div className="table-scroll-container  [&::-webkit-scrollbar]:w-[8px]  [&::-webkit-scrollbar]:h-[8px] [&::-webkit-scrollbar-track]:bg-transparent 
  [&::-webkit-scrollbar-thumb]:bg-gray-300 
  [&::-webkit-scrollbar-thumb]:rounded-full " style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 400, WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%', minWidth: 0 }}>
                                                  <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
                                                      <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GP</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Complaints</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>CSC Cleaning</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Inspection Avg. Score</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GPS Tracking</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>GP Data Status</span>
                                                        </th>
                                                        <th
                                                          style={{
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: '#374151',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Contractor Data Status</span>
                                                        </th>
                                                        <th style={{ padding: '12px 16px', width: 40 }} />
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {loadingGps ? (
                                                        <tr>
                                                          <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                                            Loading...
                                                          </td>
                                                        </tr>
                                                      ) : gpsForBlock.length === 0 ? (
                                                        <tr>
                                                          <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                                            Loading...
                                                          </td>
                                                        </tr>
                                                      ) : (
                                                        gpsForBlock.map((gp) => {
                                                          const blockData = blocksForDistrict.find(b => b.id === block.id);
                                                          const districtData = districts.find(d => d.id === selectedDistrictId);
                                                          return (
                                                            <tr
                                                              key={gp.id}
                                                              style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: selectedGPId === gp.id ? '#f0f9ff' : 'white' }}
                                                              onClick={() => handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name)}
                                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedGPId === gp.id ? '#f0f9ff' : 'white'}
                                                            >
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <span style={{ fontWeight: 500, color: '#059669' }}>{gp.name}</span>
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <ComplaintsBar
                                                                  {...gpStatics.complaints[gp.id]}
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onComplaintsClick?.();
                                                                  }}
                                                                />
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <AttendanceBar
                                                                  {...gpStatics.attendance[gp.id]}
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onAttendanceClick?.();
                                                                  }}
                                                                />
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <InspectionScoreBar
                                                                  averageScore={gpStatics.inspection[gp.id]?.average_score}
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onInspectionClick?.();
                                                                  }}
                                                                />
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <GpsTrackingBar
                                                                  vehicles={gpStatics.gpsTracker[gp.id]?.gpsVehicles}
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onGPSTrackingClick?.();
                                                                  }}
                                                                />
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <span
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onGPDataStatusClick?.();
                                                                  }}
                                                                  style={{
                                                                    fontWeight: 500,
                                                                    color: gpStatics.gpDataStatus?.[gp.id]?.master_data_available === 'Available' || gpStatics.gpDataStatus?.[gp.id]?.master_data_available === true ? '#059669' : '#dc2626',
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  {gpStatics.gpDataStatus?.[gp.id]?.master_data_available ? 'Available' : 'Not Available'}
                                                                </span>
                                                              </td>
                                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                                                <span
                                                                  onClick={() => {
                                                                    handleGPRowClick(gp.id, gp.name, block.id, selectedDistrictId, block.name, districtData?.name);
                                                                    onContractorDataClick?.();
                                                                  }}
                                                                  style={{
                                                                    fontWeight: 500,
                                                                    color: gpStatics.contractor?.[gp.id]?.hasContractorData === 'Available' || gpStatics.contractor?.[gp.id]?.hasContractorData === true ? '#059669' : '#dc2626',
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  {gpStatics.contractor?.[gp.id]?.hasContractorData}
                                                                </span>
                                                              </td>
                                                            </tr>
                                                          );
                                                        })
                                                      )}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                              <p className={`text-[#3B82F6] p-4! bg-[#D8E6FD] rounded-lg text-[16px]`}>Click on a GP to view detailed analysis and KPIs.</p>
                                            </div>
                                          </RightDrawer>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <ComplaintsBar
                                            {...blockStats.complaints[block.id]}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onComplaintsClick?.();
                                            }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <AttendanceBar
                                            {...blockStats.attendance[block.id]}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onAttendanceClick?.();
                                            }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <GPDataCoverageBar
                                            percentage={selectedBlockDetails?.village_master_data_coverage_percentage}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onGPDataCoverageClick?.();
                                            }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <ContractorDataBar
                                            percentage={blockStats.contractor[block.id]?.contractorDataPercent}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onContractorDataClick?.();
                                            }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <InspectionScoreBar
                                            averageScore={blockStats.inspection[block.id]?.average_score}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onInspectionClick?.();
                                            }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                                          <GpsTrackingBar
                                            vehicles={blockStats.gpsTracker[block.id]?.gpsVehicles}
                                            onClick={() => {
                                              handleBlockRowClick(block.id, block.name, selectedDistrictId, districtData?.name);
                                              onGPSTrackingClick?.();
                                            }}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <p className={`text-[#3B82F6] p-4! bg-[#D8E6FD] rounded-lg text-[16px]`}>Based on KPI Data Click of respective District/block/GP user will be redirected to detailed analysis/monitoring page of that particular KPI.</p>
                      </div>
                    </RightDrawer>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                    {row.gpsDisplay} GPs
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <ComplaintsBar
                      {...row.complaints}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onComplaintsClick?.();
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <AttendanceBar
                      {...row.attendance}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onAttendanceClick?.();
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                    <GPDataCoverageBar
                      percentage={row.gpDataCoverage}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onGPDataCoverageClick?.();
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <ContractorDataBar
                      percentage={row.contractorPct}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onContractorDataClick?.();
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <InspectionScoreBar
                      averageScore={row.inspectionScore}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onInspectionClick?.();
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}>
                    <GpsTrackingBar
                      vehicles={row.gpsVehicles}
                      onClick={() => {
                        handleDistrictRowClick(row.id, row.name);
                        onGPSTrackingClick?.();
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default ListOfDistrictsTable;
