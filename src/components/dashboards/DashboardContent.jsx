import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, Calendar, List, TrendingUp } from 'lucide-react';
import Chart from 'react-apexcharts';
import number1 from '../../assets/images/number1.png';
import number2 from '../../assets/images/nnumber2.png';
import number3 from '../../assets/images/number3.png';
import apiClient, {
  attendanceAPI,
  contractorAnalyticsAPI,
  vehiclesAPI,
  inspectionsAPI,
  schemesAPI,
  eventsAPI,
  annualSurveysAPI
} from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import LocationDisplay from '../common/LocationDisplay';
import SendNoticeModal from './common/SendNoticeModal';
import NoDataFound from './common/NoDataFound';
import OverviewBanner from './common/OverviewBanner';
import ListOfDistrictsTable from './common/ListOfDistrictsTable';
import DashboardCardsGrid from './common/DashboardCardsGrid';
import ComplaintsDashboard from './common/ComplaintsDashboard';
import { InfoTooltip } from '../common/Tooltip';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SegmentedGauge = ({ complaintData, percentage, label = "Complaints closed" }) => {
  // Calculate total complaints for percentage calculation
  const total = complaintData.open + complaintData.verified + complaintData.resolved + complaintData.disposed;

  // Calculate percentages for each status
  const openPercent = total > 0 ? (complaintData.open / total) * 100 : 0;
  const verifiedPercent = total > 0 ? (complaintData.verified / total) * 100 : 0;
  const resolvedPercent = total > 0 ? (complaintData.resolved / total) * 100 : 0;
  const disposedPercent = total > 0 ? (complaintData.disposed / total) * 100 : 0;

  // Define colors for each status
  const statusColors = {
    open: '#ef4444',      // Red
    verified: '#f97316',  // Orange
    resolved: '#8b5cf6',  // Purple
    disposed: '#10b981'   // Green
  };

  // Calculate the arc path for percentage fill with circular ends
  const getArcPath = (startAngle, endAngle, radius, strokeWidth) => {
    const innerRadius = radius - strokeWidth;
    const centerX = 100;
    const centerY = 100;

    // Calculate the main arc points
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} 
            A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}
            Z`;
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Create segments with a strict 180° arc and dynamic gaps
  const createSegments = () => {
    const segments = [];
    const totalAngle = 180; // strict half-circle
    const gapSize = 20; // degrees between adjacent segments; large enough for rounded caps
    // availableAngle will be computed dynamically after we know how many segments we have

    // Only create segments for statuses that have complaints
    const statuses = [
      { name: 'open', percent: openPercent, color: statusColors.open },
      { name: 'resolved', percent: resolvedPercent, color: statusColors.resolved },
      { name: 'verified', percent: verifiedPercent, color: statusColors.verified },
      { name: 'disposed', percent: disposedPercent, color: statusColors.disposed }
    ].filter(status => status.percent > 0);

    // If no complaints, return empty array
    if (statuses.length === 0) {
      return [];
    }

    // Calculate total percentage of active statuses
    const totalActivePercent = statuses.reduce((sum, status) => sum + status.percent, 0);

    // Distribute segments proportionally within 180° minus dynamic gaps
    let currentAngle = -90; // center the 180° sweep from -90° to +90°
    const segmentCount = statuses.length; // show all active statuses
    const gapsCount = Math.max(segmentCount - 1, 0);
    const availableAngle = totalAngle - (gapsCount * gapSize);

    for (let i = 0; i < segmentCount; i++) {
      const status = statuses[i];
      const segmentAngle = totalActivePercent > 0 ? (status.percent / totalActivePercent) * availableAngle : 0;
      const endAngle = currentAngle + segmentAngle;

      segments.push({
        start: currentAngle,
        end: endAngle,
        color: status.color,
        name: status.name
      });

      if (i < segmentCount - 1) {
        currentAngle = endAngle + gapSize; // add gap after this segment
      } else {
        currentAngle = endAngle; // no gap after the last segment
      }
    }

    // Don't add gray filler - only show actual data segments

    return segments;
  };

  const segments = createSegments();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    }}>
      <svg viewBox="0 0 200 140" style={{ width: '100%', maxWidth: '300px' }}>
        {/* Draw each segment */}
        {segments.map((segment, index) => {
          const startAngle = segment.start;
          const endAngle = segment.end;
          const radius = 80;
          const strokeWidth = 20;
          const innerRadius = radius - strokeWidth;

          // Calculate circular end cap positions
          const startCapPos = polarToCartesian(100, 100, radius - strokeWidth / 2, endAngle);
          const endCapPos = polarToCartesian(100, 100, radius - strokeWidth / 2, startAngle);

          return (
            <g key={index}>
              <path
                d={getArcPath(startAngle, endAngle, radius, strokeWidth)}
                fill={segment.color}
                style={{
                  transition: 'fill 0.3s ease'
                }}
              />
              {/* Circular end caps */}
              <circle
                cx={startCapPos.x}
                cy={startCapPos.y}
                r={strokeWidth / 2}
                fill={segment.color}
              />
              <circle
                cx={endCapPos.x}
                cy={endCapPos.y}
                r={strokeWidth / 2}
                fill={segment.color}
              />
            </g>
          );
        })}

        {/* Center text - percentage */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          style={{
            fontSize: '30px',
            fontWeight: 500,
            fill: '#111827'
          }}>
          {percentage == null || isNaN(percentage) ? 'NaN' : `${percentage}%`}
        </text>

        {/* Center text - label */}
        <text
          x="100"
          y="110"
          textAnchor="middle"
          style={{
            fontSize: '10px',
            fontWeight: 400,
            fill: '#6b7280'
          }}>
          {label}
        </text>

      </svg>
    </div>
  );
};

const DashboardContent = ({ onNavigateToComplaints, onNavigateToAttendance, onNavigateToGPMasterData, onNavigateToGPSTracking, onNavigateToContractorDetails, onNavigateToInspection, onNavigateToSchemes, onNavigateToEvents }) => {
  // Use LocationContext for global state management
  const {
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    dropdownLevel,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    changeHistory,
    lastChange,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection,
    getCurrentLocationInfo,
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange
  } = useLocation();

  // Local state for UI controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);
  const [totalCountOfGPs, setTotalCountOfGPs] = useState(0);

  const [location, setLocation] = useState(null)


  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // District list table: all blocks for State scope (to show block/GP counts per district)
  const [allBlocksForDistricts, setAllBlocksForDistricts] = useState([]);
  const [allGPsForDistricts, setAllGPsForDistricts] = useState([]);
  const [districtStats, setDistrictStats] = useState(null); // { [districtId]: { attendance, contractorPct, gpsVehicles } }
  const [loadingDistrictStats, setLoadingDistrictStats] = useState(false);

  // Utility helpers
  const formatNumber = (num) => (typeof num === 'number' ? num.toLocaleString() : '0');
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDate(monthStart),
      end: formatDate(monthEnd)
    };
  };

  const getPerformanceDateRange = () => {
    const target = new Date(selectedPerformanceYear, performanceMonth, 1);
    const start = new Date(target.getFullYear(), target.getMonth(), 1);
    const end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
    return {
      start: formatDate(start),
      end: formatDate(end)
    };
  };

  const getPerformanceGeoLabel = () => {
    if (activeScope === 'State') {
      return 'District';
    }
    if (activeScope === 'Districts') {
      return 'Block';
    }
    if (activeScope === 'Blocks' || activeScope === 'GPs') {
      return 'GP';
    }
    return 'District';
  };

  const performancePrimaryLabel = getPerformanceGeoLabel();

  const getPerformanceRangeLabel = () => {
    return `${MONTH_NAMES[performanceMonth]} ${selectedPerformanceYear}`;
  };

  const getTop3RangeLabel = () => {
    const now = new Date();
    return `${MONTH_NAMES[top3Month]} ${now.getFullYear()}`;
  };

  // Complaints chart data state
  const [complaintsChartData, setComplaintsChartData] = useState(null);
  const [loadingComplaintsChart, setLoadingComplaintsChart] = useState(false);
  const [complaintsChartError, setComplaintsChartError] = useState(null);

  // Performance data state
  const [performanceApiData, setPerformanceApiData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceError, setPerformanceError] = useState(null);
  const [activePerformanceTab, setActivePerformanceTab] = useState('starPerformers');
  const [performanceMonth, setPerformanceMonth] = useState(() => new Date().getMonth());
  const [selectedPerformanceYear, setSelectedPerformanceYear] = useState(() => new Date().getFullYear());
  const [showPerformanceRangePicker, setShowPerformanceRangePicker] = useState(false);
  const [showPerformanceYearDropdown, setShowPerformanceYearDropdown] = useState(false);
  const [top3Scope, setTop3Scope] = useState('District');
  const [top3Month, setTop3Month] = useState(() => new Date().getMonth());
  const [showTop3Dropdown, setShowTop3Dropdown] = useState(false);
  const [showTop3MonthPicker, setShowTop3MonthPicker] = useState(false);
  const [top3ApiData, setTop3ApiData] = useState(null);
  const [loadingTop3, setLoadingTop3] = useState(false);
  const [top3Error, setTop3Error] = useState(null);
  const top3MonthRef = useRef(null);

  const performanceRangeRef = useRef(null);
  const performanceYearRef = useRef(null);

  // Vendor data state (for GP level)
  const [vendorData, setVendorData] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [vendorError, setVendorError] = useState(null);

  // Dashboard cards API data
  const [attendanceCardData, setAttendanceCardData] = useState(null);
  const [loadingAttendanceCard, setLoadingAttendanceCard] = useState(false);
  const [attendanceCardError, setAttendanceCardError] = useState(null);
  const [inspectionCardData, setInspectionCardData] = useState(null);
  const [loadingInspectionCard, setLoadingInspectionCard] = useState(false);
  const [inspectionCardError, setInspectionCardError] = useState(null);
  const [contractorCardData, setContractorCardData] = useState(null);
  const [loadingContractorCard, setLoadingContractorCard] = useState(false);
  const [contractorCardError, setContractorCardError] = useState(null);
  const [schemesCardData, setSchemesCardData] = useState(null);
  const [loadingSchemesCard, setLoadingSchemesCard] = useState(false);
  const [schemesCardError, setSchemesCardError] = useState(null);
  const [eventsCardData, setEventsCardData] = useState(null);
  const [loadingEventsCard, setLoadingEventsCard] = useState(false);
  const [eventsCardError, setEventsCardError] = useState(null);
  const [gpMasterCardData, setGpMasterCardData] = useState(null);
  const [loadingGpMasterCard, setLoadingGpMasterCard] = useState(false);
  const [gpMasterCardError, setGpMasterCardError] = useState(null);
  const [gpsCardData, setGpsCardData] = useState(null);
  const [loadingGpsCard, setLoadingGpsCard] = useState(false);
  const [gpsCardError, setGpsCardError] = useState(null);
  const [topPerformersByLoc, setTopPerformersByLoc] = useState(null);
  const [topPerformersByLocError, setTopPerformersByLocError] = useState(null);


  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, getCurrentLocationInfo]);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null means not selected
  const [selectedDay, setSelectedDay] = useState(null); // null means not selected
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year'); // 'year', 'month', 'day'

  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Year');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-12-31`;
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const handleDateKeyDown = (event) => {
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  };

  const handlePerformanceRangeButtonClick = () => {
    setShowPerformanceRangePicker((prev) => !prev);
  };

  const handleTop3MonthButtonClick = () => {
    setShowTop3MonthPicker((prev) => !prev);
  };

  useEffect(() => {
    if (!showPerformanceRangePicker) {
      return;
    }

    const handleClickOutside = (event) => {
      if (performanceRangeRef.current && !performanceRangeRef.current.contains(event.target)) {
        setShowPerformanceRangePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPerformanceRangePicker]);

  useEffect(() => {
    if (!showPerformanceYearDropdown) {
      return;
    }

    const handleClickOutside = (event) => {
      if (performanceYearRef.current && !performanceYearRef.current.contains(event.target)) {
        setShowPerformanceYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPerformanceYearDropdown]);

  useEffect(() => {
    if (!showTop3MonthPicker) {
      return;
    }

    const handleClickOutside = (event) => {
      if (top3MonthRef.current && !top3MonthRef.current.contains(event.target)) {
        setShowTop3MonthPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTop3MonthPicker]);

  // Complaints year selection state
  const [selectedComplaintsYear, setSelectedComplaintsYear] = useState(() => {
    return new Date().getFullYear();
  });
  const [showComplaintsYearDropdown, setShowComplaintsYearDropdown] = useState(false);

  // Complaints filter tabs state
  const [activeComplaintsFilter, setActiveComplaintsFilter] = useState('Time');

  // Send Notice Modal state
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
  const [selectedNoticeTarget, setSelectedNoticeTarget] = useState(null);
  const [noticeModuleData, setNoticeModuleData] = useState({
    moduleName: '',
    kpiName: '',
    kpiFigure: ''
  });

  const buildNoticeTarget = useCallback((item) => {
    if (!item) {
      return null;
    }

    const baseTarget = {
      name: item.name,
      type: item.type,
      districtId: null,
      blockId: null,
      gpId: null,
    };

    if (item.type === 'District') {
      baseTarget.districtId = item.id ?? null;
    } else if (item.type === 'Block') {
      baseTarget.blockId = item.id ?? null;
      const matchedBlock = blocks.find((block) => block.id === item.id);
      baseTarget.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    } else if (item.type === 'GP') {
      baseTarget.gpId = item.id ?? null;
      const matchedGP = gramPanchayats.find((gp) => gp.id === item.id);
      const derivedBlockId = matchedGP?.block_id ?? selectedBlockId ?? null;
      baseTarget.blockId = derivedBlockId;
      const matchedBlock = blocks.find((block) => block.id === derivedBlockId);
      baseTarget.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    }

    return baseTarget;
  }, [blocks, gramPanchayats, selectedBlockId, selectedDistrictId]);

  const handleOpenNoticeModal = useCallback((item) => {
    const target = buildNoticeTarget(item);
    if (!target) {
      return;
    }

    // Set recipient based on type (CEO for District, BDO for Block)
    if (target.type === 'District') {
      target.recipient = 'CEO';
    } else if (target.type === 'Block') {
      target.recipient = 'BDO';
    }

    // Set module data for notice template
    setNoticeModuleData({
      moduleName: 'Performance',
      kpiName: item.name || 'Performance Metric',
      kpiFigure: item.completion ? `${item.completion}%` : 'N/A'
    });

    setSelectedNoticeTarget(target);
    setShowSendNoticeModal(true);
  }, [buildNoticeTarget]);

  const handleCloseNoticeModal = useCallback(() => {
    setShowSendNoticeModal(false);
    setSelectedNoticeTarget(null);
  }, []);

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];

  // Predefined date ranges
  const dateRanges = [
    { label: 'Year', value: 'year', days: null },
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  // Fetch all blocks and GPs for districts (for List of Districts table)
  useEffect(() => {
    if (districts.length === 0) {
      setAllBlocksForDistricts([]);
      setAllGPsForDistricts([]);
      return;
    }
    const loadDistrictStats = async () => {
      setLoadingDistrictStats(true);
      try {
        const [blockResponses] = await Promise.all([
          Promise.all(
            districts.map((d) =>
              apiClient.get('/geography/blocks', {
                params: { district_id: d.id, skip: 0, limit: 100 }
              })
            )
          ),
        ]);

        const allBlocks = blockResponses.flatMap((r) => r.data || []);

        setAllBlocksForDistricts(allBlocks);
      } catch (err) {
        console.error('Error loading district stats:', err);
        setAllBlocksForDistricts([]);
        setAllGPsForDistricts([]);
      } finally {
        setLoadingDistrictStats(false);
      }
    };
    loadDistrictStats();
  }, [activeScope, districts]);

  // Loading GPs
  const loadDistrictGPs = async () => {
    setLoadingDistrictStats(true);
    try {
      const gpResponses = await apiClient.get('/annual-surveys/analytics/state', {
        params: { fy_id: 1, skip: 0, limit: 1000 }
      });

      const allGPs = gpResponses?.data?.district_wise_coverage;

      setAllGPsForDistricts(allGPs);
    } catch (err) {
      console.error('Error loading district stats:', err);
      setAllGPsForDistricts([]);
    } finally {
      setLoadingDistrictStats(false);
    }
  };

  useEffect(() => {
    loadDistrictGPs();
  }, []);

  // Fetch district-level metrics (attendance, contractor, GPS) for List of Districts table
  useEffect(() => {
    if (districts.length === 0 || !startDate || !endDate) {
      setDistrictStats(null);
      return;
    }
    const loadDistrictMetrics = async () => {
      const stats = {};
      const params = { level: 'DISTRICT', start_date: startDate, end_date: endDate };
      await Promise.all(
        districts.map(async (d) => {
          const id = d.id;
          try {
            const [attRes, contrRes, gpsRes] = await Promise.allSettled([
              // attendanceAPI.analytics({ ...params, district_id: id }),
              attendanceAPI.analytics({ ...params }),
              contractorAnalyticsAPI.getDistrict(id),
              vehiclesAPI.getVehiclesList ? vehiclesAPI.getVehiclesList({ district_id: id }) : vehiclesAPI.getVehiclesByLocation({ district_id: id })
            ]);
            const attendance = attRes.status === 'fulfilled' && attRes.value?.data
              ? parseAttendanceResponse(attRes.value.data)
              : null;
            const contractorPct = contrRes.status === 'fulfilled' && contrRes.value?.data
              ? parseContractorResponse(contrRes.value.data)
              : null;
            const gpsVehicles = (gpsRes.status === 'fulfilled' && gpsRes.value?.data)
              ? (Array.isArray(gpsRes.value.data) ? gpsRes.value.data.length : gpsRes.value.data?.count ?? gpsRes.value.data?.total ?? 0)
              : null;
            if (attendance || contractorPct != null || gpsVehicles != null) {
              stats[id] = {};
              if (attendance) stats[id].attendance = attendance;
              // Always include contractorPct (as null if not available, so it's present in the object)
              stats[id].contractorPct = contractorPct;
              if (gpsVehicles != null) stats[id].gpsVehicles = Number(gpsVehicles);
            }
          } catch (e) {
            console.warn('District metrics fetch failed for district', id, e);
          }
        })
      );
      setDistrictStats(Object.keys(stats).length > 0 ? stats : null);
    };
    function parseAttendanceResponse(data) {
      if (!data) return null;
      const arr = Array.isArray(data) ? data : data.data ?? data.response ?? data.items ?? [];
      let present = 0, absent = 0;
      if (Array.isArray(arr) && arr.length > 0) {
        arr.forEach((x) => {
          present += x.present ?? x.total_present ?? x.present_count ?? 0;
          absent += x.absent ?? x.total_absent ?? x.absent_count ?? 0;
        });
      } else if (typeof data.present === 'number' || typeof data.total_present === 'number') {
        present = data.present ?? data.total_present ?? 0;
        absent = data.absent ?? data.total_absent ?? 0;
      } else if (data.summary) {
        present = data.summary.present ?? data.summary.total_present ?? 0;
        absent = data.summary.absent ?? data.summary.total_absent ?? 0;
      }
      if (present === 0 && absent === 0) return null;
      return { present, absent };
    }
    function parseContractorResponse(data) {
      if (!data) return null;
      const pct = data.coverage_percentage ?? 0;
      return typeof pct === 'number' ? pct : (typeof pct === 'string' ? parseFloat(pct) : null);
    }
    loadDistrictMetrics();
  }, [districts, startDate, endDate]);

  // Fetch dashboard cards data (attendance, inspection, contractor, schemes, events, GP master, GPS)
  // Synchronized with analytics fetch to update together when location/date changes
  useEffect(() => {
    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      setAttendanceCardData(null);
      setInspectionCardData(null);
      setContractorCardData(null);
      setSchemesCardData(null);
      setEventsCardData(null);
      setGpMasterCardData(null);
      setGpsCardData(null);
      return;
    }

    // Only fetch if we have the necessary location ID selected
    if (activeScope === 'Districts' && !selectedDistrictId) {
      // Clear all card data when waiting for district selection (e.g., Rajasthan clicked)
      setAttendanceCardData(null);
      setInspectionCardData(null);
      setContractorCardData(null);
      setSchemesCardData(null);
      setEventsCardData(null);
      setGpMasterCardData(null);
      setGpsCardData(null);
      return;
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      // Clear all card data when waiting for block selection
      setAttendanceCardData(null);
      setInspectionCardData(null);
      setContractorCardData(null);
      setSchemesCardData(null);
      setEventsCardData(null);
      setGpMasterCardData(null);
      setGpsCardData(null);
      return;
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      // Clear all card data when waiting for GP selection
      setAttendanceCardData(null);
      setInspectionCardData(null);
      setContractorCardData(null);
      setSchemesCardData(null);
      setEventsCardData(null);
      setGpMasterCardData(null);
      setGpsCardData(null);
      return;
    }

    const params = { start_date: startDate, end_date: endDate };
    if (activeScope === 'Districts' && selectedDistrictId) params.district_id = selectedDistrictId;
    if (activeScope === 'Blocks' && selectedBlockId) params.block_id = selectedBlockId;
    if (activeScope === 'GPs' && selectedGPId) params.gp_id = selectedGPId;

    const fetchCards = async () => {
      setLoadingAttendanceCard(true);
      setLoadingInspectionCard(true);
      setLoadingContractorCard(true);
      setLoadingSchemesCard(true);
      setLoadingEventsCard(true);
      setLoadingGpMasterCard(true);
      setLoadingGpsCard(true);
      setAttendanceCardError(null);
      setInspectionCardError(null);
      setContractorCardError(null);
      setSchemesCardError(null);
      setEventsCardError(null);
      setGpMasterCardError(null);
      setGpsCardError(null);

      try {
        console.log('🔄 Fetching Dashboard Cards:', {
          activeScope,
          selectedDistrictId,
          selectedBlockId,
          selectedGPId,
          params
        });

        const contrPromise = activeScope === 'State'
          ? contractorAnalyticsAPI.getState()
          : params.district_id && activeScope === 'Districts'
            ? contractorAnalyticsAPI.getDistrict(params.district_id)
            : params.block_id && activeScope === 'Blocks'
              ? contractorAnalyticsAPI.getBlock(params.block_id)
              : params.gp_id && activeScope === 'GPs'
                ? contractorAnalyticsAPI.getGP(params.gp_id)
                : contractorAnalyticsAPI.getState();

        // Build dynamic GP Master Data API call based on active scope
        const gpMasterPromise = activeScope === 'State'
          ? annualSurveysAPI.analyticsState({ fy_id: 1 })
          : params.district_id && activeScope === 'Districts'
            ? annualSurveysAPI.analyticsDistrict(params.district_id, { fy_id: 1 })
            : params.block_id && activeScope === 'Blocks'
              ? annualSurveysAPI.analyticsBlock(params.block_id, { fy_id: 1 })
              : params.gp_id && activeScope === 'GPs'
                ? annualSurveysAPI.analyticsGP(params.gp_id, { fy_id: 1 })
                : annualSurveysAPI.analyticsState({ fy_id: 1 });

        const inspParams = { ...params, level: activeScope === 'State' ? 'DISTRICT' : activeScope === 'Districts' ? 'BLOCK' : 'VILLAGE' };
        if (params.district_id) inspParams.district_id = params.district_id;
        if (params.block_id) inspParams.block_id = params.block_id;
        if (params.gp_id) inspParams.gp_id = params.gp_id;
        const [
          attRes,
          inspRes,
          contrRes,
          schemesRes,
          eventsRes,
          gpMasterRes,
          gpsRes,
          performersDataRes
        ] = await Promise.allSettled([
          attendanceAPI.overview(params),
          inspectionsAPI.analytics(inspParams),
          contrPromise,
          schemesAPI.getSchemes({ skip: 0, limit: 100, active: false }),
          eventsAPI.getEvents({ skip: 0, limit: 100, active: false }),
          gpMasterPromise,
          vehiclesAPI.getVehiclesByLocation(params),
          inspectionsAPI.analytics(params)
        ]);

        // Attendance Data
        if (attRes.status === 'fulfilled' && attRes.value?.data) {
          const d = attRes.value.data;
          const total = d.total_contractors ?? 0;
          const present = d.present ?? 0;
          const absent = d.absent ?? (total - present) ?? 0;
          setAttendanceCardData({ total, present, absent });
        } else setAttendanceCardData(null);
        if (attRes.status === 'rejected') setAttendanceCardError(attRes.reason?.message || 'Failed to load');

        // Inspection Data
        if (inspRes.status === 'fulfilled' && inspRes.value?.data) {
          const d = inspRes.value.data;

          const scores = d.response.map(item => item.average_score || 0);
          const sum = scores.reduce((acc, score) => acc + score, 0);
          const average = scores.length > 0 ? sum / scores.length : 0;
          const avg = `${average.toFixed(0)}%`;

          const total = d.response.reduce((acc, item) => {
            if (d.geo_type === 'DISTRICT') {
              return acc + (item.inspected_blocks || 0);
            } else if (d.geo_type === 'BLOCK' || d.geo_type === 'VILLAGE') {
              return acc + (item.inspected_gps || 0);
            }
            return acc;
          }, 0).toLocaleString();

          const inspectedGPs = d.response.reduce((acc, item) => acc + (item.inspected_gps || 0), 0);
          const totalGPs = d.response.reduce((acc, item) => acc + (item.total_gps || 0), 0);
          const covered = `${inspectedGPs.toLocaleString()}/${totalGPs.toLocaleString()}`;

          !totalCountOfGPs ? setTotalCountOfGPs(totalGPs) : null;

          setInspectionCardData({ averageScore: avg, totalInspections: Number(total), villageCovered: String(covered || '0/0') });
        } else setInspectionCardData(null);
        if (inspRes.status === 'rejected') setInspectionCardError(inspRes.reason?.message || 'Failed to load');

        // Contractor Data
        if (contrRes.status === 'fulfilled' && contrRes.value?.data) {
          const d = contrRes.value.data;
          const pct = d.coverage_percentage.toFixed(2);
          const covered = `${d.gps_with_contractor_data}/${d.total_gps?.toLocaleString() ?? 0}`;
          setContractorCardData({ dataFilledPercent: Number(pct), dataFilledCovered: String(covered) });
        } else setContractorCardData(null);
        if (contrRes.status === 'rejected') setContractorCardError(contrRes.reason?.message || 'Failed to load');

        // Schemes Data
        if (schemesRes.status === 'fulfilled' && schemesRes.value?.data != null) {
          const allSchemes = schemesRes.value.data;
          const active = allSchemes.filter((x) => x.active === true).length;
          setSchemesCardData({ total: allSchemes.length, active, inactive: allSchemes.length - active });
        } else setSchemesCardData(null);
        if (schemesRes.status === 'rejected') setSchemesCardError(schemesRes.reason?.message || 'Failed to load');

        // Events Data
        if (eventsRes.status === 'fulfilled' && eventsRes.value?.data != null) {
          const allEvents = eventsRes.value.data;
          const active = allEvents.filter((x) => x.active === true).length;
          setEventsCardData({ total: allEvents.length, active, inactive: allEvents.length - active });
        } else setEventsCardData(null);
        if (eventsRes.status === 'rejected') setEventsCardError(eventsRes.reason?.message || 'Failed to load');

        // GP Master Data
        console.log('📊 GP Master Res Status:', gpMasterRes.status);
        console.log('📊 GP Master Response:', gpMasterRes.value?.data);

        if (gpMasterRes.status === 'fulfilled' && gpMasterRes.value?.data) {
          const d = gpMasterRes.value.data;
          console.log('🔄 GP Master Card Data Updated:', {
            activeScope,
            selectedDistrictId,
            selectedBlockId,
            selectedGPId,
            data: d
          });
          setGpMasterCardData({
            total: d.total_village_master_data ?? 0,
            villageCoveragePercent: d.village_master_data_coverage_percentage ?? 0,
            totalFundsSanctioned: `₹${(d.total_funds_sanctioned * 100).toLocaleString('en-IN')} L` ?? 0
          });
        } else {
          console.log('⚠️ GP Master Card Data - No data received:', {
            activeScope,
            status: gpMasterRes.status,
            error: gpMasterRes.reason
          });
          setGpMasterCardData(null);
        }
        if (gpMasterRes.status === 'rejected') setGpMasterCardError(gpMasterRes.reason?.message || 'Failed to load');

        // GPS Tracking Data
        if (gpsRes.status === 'fulfilled' && gpsRes.value?.data) {
          const v = gpsRes.value.data;
          setGpsCardData({ total: v.summary.total, running: v.summary.running, stopped: v.summary.stopped });
        } else setGpsCardData(null);
        if (gpsRes.status === 'rejected') setGpsCardError(gpsRes.reason?.message || 'Failed to load');

        // Date for Top 3 Performers by Location
        if (performersDataRes.status === 'fulfilled' && performersDataRes.value?.data) {
          const v = performersDataRes.value.data;
          const topThree = (v.response).sort((a, b) => a.average_score - b.average_score).slice(0, 3);
          setTopPerformersByLoc(topThree);
        } else setTopPerformersByLoc(null);
        if (performersDataRes.status === 'rejected') setTopPerformersByLocError(performersDataRes.reason?.message || 'Failed to load');
      } finally {
        setLoadingAttendanceCard(false);
        setLoadingInspectionCard(false);
        setLoadingContractorCard(false);
        setLoadingSchemesCard(false);
        setLoadingEventsCard(false);
        setLoadingGpMasterCard(false);
        setLoadingGpsCard(false);
      }
    };
    fetchCards();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, isCustomRange]);

  // Fetch districts from API
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch blocks from API for a given district
  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setBlocks([]);
      return;
    }

    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks', {
        params: {
          district_id: districtId,
          skip: 0,
          limit: 100
        }
      });
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch Gram Panchayats from API for a given district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('Error fetching Gram Panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Fetch Analytics Data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      let level = 'DISTRICT'; // Default for State scope
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks') {
        level = 'VILLAGE';
      } else if (activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);

      // Add geography IDs based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      const url = `/complaints/analytics/geo?${params.toString()}`;

      const response = await apiClient.get(url);

      setAnalyticsData(response.data);

      // Calculate and log aggregated counts
      const aggregated = {
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };

      response.data?.response?.forEach(item => {
        const status = item.status?.toUpperCase();
        const count = item.count || 0;
        aggregated.total += count;

        switch (status) {
          case 'OPEN':
            aggregated.open += count;
            break;
          case 'VERIFIED':
            aggregated.verified += count;
            break;
          case 'RESOLVED':
            aggregated.resolved += count;
            break;
          case 'CLOSED':
          case 'DISPOSED':
            aggregated.disposed += count;
            break;
        }
      });

    } catch (error) {
      console.error('❌ ===== ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END ANALYTICS API ERROR =====\n');

      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch Complaints Chart Data from API
  const fetchComplaintsChartData = useCallback(async () => {
    try {
      setLoadingComplaintsChart(true);
      setComplaintsChartError(null);

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      let level = 'DISTRICT'; // Default for State scope
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks') {
        level = 'VILLAGE';
      } else if (activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);

      // Add geography IDs based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
      }

      // Add year range
      const startDate = `${selectedComplaintsYear}-01-01`;
      const endDate = `${selectedComplaintsYear}-12-31`;
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const url = `/complaints/analytics/geo?${params.toString()}`;
      const response = await apiClient.get(url);

      setComplaintsChartData(response.data);

    } catch (error) {
      console.error('❌ ===== COMPLAINTS CHART API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END COMPLAINTS CHART API ERROR =====\n');

      setComplaintsChartError(error.message || 'Failed to fetch complaints chart data');
      setComplaintsChartData(null);
    } finally {
      setLoadingComplaintsChart(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedComplaintsYear]);

  // Placeholder counts when API returns no data (for graph/chart visibility)
  const PLACEHOLDER_COUNTS = {
    total: 0,
    open: 0,
    verified: 0,
    resolved: 0,
    disposed: 0
  };

  // Calculate complaint counts from analytics data
  const calculateComplaintCounts = () => {
    if (!analyticsData || !analyticsData.response) {
      return PLACEHOLDER_COUNTS;
    }

    const counts = {
      total: 0,
      open: 0,
      verified: 0,
      resolved: 0,
      disposed: 0
    };

    // Aggregate counts by status
    analyticsData.response.forEach(item => {
      const status = item.status?.toUpperCase();
      const count = item.count || 0;
      counts.total += count;

      switch (status) {
        case 'OPEN':
          counts.open += count;
          break;
        case 'VERIFIED':
          counts.verified += count;
          break;
        case 'RESOLVED':
          counts.resolved += count;
          break;
        case 'CLOSED':
        case 'DISPOSED':
          counts.disposed += count;
          break;
        default:
          console.warn('Unknown status:', status);
      }
    });

    // Use placeholders when all counts are zero (for graph visibility)
    const hasData = counts.total > 0 || counts.open > 0 || counts.disposed > 0;
    return hasData ? counts : PLACEHOLDER_COUNTS;
  };

  // Get location options based on active scope and dropdown level
  const getLocationOptions = () => {
    switch (activeScope) {
      case 'State':
        return [{ id: 'rajasthan', name: 'Rajasthan' }];
      case 'Districts':
        return districts.map(district => ({ id: district.id, name: district.name }));
      case 'Blocks':
        if (dropdownLevel === 'districts') {
          return districts.map(district => ({ id: district.id, name: district.name }));
        } else if (dropdownLevel === 'blocks') {
          return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id)
            .map(block => ({ id: block.id, name: block.name }));
        }
        return [];
      case 'GPs':
        if (dropdownLevel === 'districts') {
          return districts.map(district => ({ id: district.id, name: district.name }));
        } else if (dropdownLevel === 'blocks') {
          return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id)
            .map(block => ({ id: block.id, name: block.name }));
        } else if (dropdownLevel === 'gps') {
          return gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id)
            .map(gp => ({ id: gp.id, name: gp.name }));
        }
        return [];
      default:
        return [{ id: 'rajasthan', name: 'Rajasthan' }];
    }
  };

  // Handle scope change
  const handleScopeChange = (scope) => {
    // Track tab change first
    trackTabChange(scope);

    // Close dropdown immediately to prevent showing stale options
    setShowLocationDropdown(false);

    if (scope === 'State') {
      // For State scope, set Rajasthan as default and disable dropdown
      updateLocationSelection('State', 'Rajasthan', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Districts') {
      // Set first district as selected (districts are already loaded)
      if (districts.length > 0) {
        const firstDistrict = districts[0];
        updateLocationSelection('Districts', firstDistrict.name, firstDistrict.id, firstDistrict.id, null, null, 'tab_change');
        fetchBlocks(firstDistrict.id);
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // For blocks, start with districts level and clear dependent data until a district is chosen
      updateLocationSelection('Blocks', 'Select District', null, null, null, null, 'tab_change');
      setBlocks([]);
      setGramPanchayats([]);
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'GPs') {
      // For GPs, start with districts level and clear dependent data
      updateLocationSelection('GPs', 'Select District', null, null, null, null, 'tab_change');
      setBlocks([]);
      setGramPanchayats([]);
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else {
      // For other scopes, reset to first option
      const options = getLocationOptions();
      if (options.length > 0) {
        updateLocationSelection(scope, options[0].name, options[0].id, null, null, null, 'tab_change');
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    }
  };

  const activeHierarchyDistrict = selectedDistrictForHierarchy ||
    (selectedDistrictId ? districts.find(district => district.id === selectedDistrictId) : null);

  const blocksForActiveDistrict = activeHierarchyDistrict
    ? blocks.filter(block => block.district_id === activeHierarchyDistrict.id)
    : [];

  const activeHierarchyBlock = selectedBlockForHierarchy ||
    (selectedBlockId ? blocks.find(block => block.id === selectedBlockId) : null);

  const gpsForActiveBlock = activeHierarchyBlock
    ? gramPanchayats.filter(gp => gp.block_id === activeHierarchyBlock.id)
    : [];

  const getMenuItemStyles = (isActive) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: isActive ? '#047857' : '#374151',
    backgroundColor: isActive ? '#ecfdf5' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.15s ease, color 0.15s ease'
  });

  const handleDistrictHover = (district) => {
    if (activeScope === 'Blocks' || activeScope === 'GPs') {
      if (!selectedDistrictForHierarchy || selectedDistrictForHierarchy.id !== district.id) {
        setSelectedDistrictForHierarchy(district);
        setSelectedBlockForHierarchy(null);
        setDropdownLevel('blocks');
        fetchBlocks(district.id);
      }
    }
  };

  const handleDistrictClick = (district) => {
    if (activeScope === 'Districts') {
      trackDropdownChange(district.name, district.id, district.id);
      updateLocationSelection('Districts', district.name, district.id, district.id, null, null, 'dropdown_change');
      fetchBlocks(district.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'Blocks') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
    } else if (activeScope === 'GPs') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
    }
  };

  const handleBlockHover = (block) => {
    if (activeScope === 'GPs') {
      if (!selectedBlockForHierarchy || selectedBlockForHierarchy.id !== block.id) {
        setSelectedBlockForHierarchy(block);
        setDropdownLevel('gps');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
      }
    }
  };

  const handleBlockClick = (block) => {
    if (activeScope === 'Blocks') {
      const district = districts.find(d => d.id === (block.district_id || selectedDistrictForHierarchy?.id)) || selectedDistrictForHierarchy;
      const districtId = district?.id || null;
      const isAlreadySelected = selectedLocation === block.name && selectedBlockId === block.id;

      if (district) {
        setSelectedDistrictForHierarchy(district);
      }
      setSelectedBlockForHierarchy(block);
      setDropdownLevel('blocks');

      // If clicking on already selected block, keep dropdown open and fetch blocks to show hierarchy
      if (isAlreadySelected) {
        if (blocks.length === 0 || !blocks.some(b => b.district_id === districtId)) {
          fetchBlocks(districtId);
        }
        fetchGramPanchayats(districtId, block.id);
      } else {
        // If selecting a different block, update selection and close dropdown
        trackDropdownChange(block.name, block.id, districtId);
        updateLocationSelection('Blocks', block.name, block.id, districtId, block.id, null, 'dropdown_change');
        fetchGramPanchayats(districtId, block.id);
        setShowLocationDropdown(false);
      }
    } else if (activeScope === 'GPs') {
      const isAlreadySelected = selectedBlockForHierarchy?.id === block.id;
      setSelectedBlockForHierarchy(block);
      setDropdownLevel('gps');

      // If clicking on already selected block, keep dropdown open to show hierarchy
      if (isAlreadySelected) {
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
      } else {
        setSelectedLocation('Select GP');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
      }
    }
  };

  const handleGPClick = (gp) => {
    const block = blocks.find(b => b.id === (gp.block_id || selectedBlockForHierarchy?.id || selectedBlockId)) || selectedBlockForHierarchy;
    const blockId = block?.id || gp.block_id || null;
    const district = districts.find(d => d.id === (block?.district_id || selectedDistrictForHierarchy?.id || selectedDistrictId)) || selectedDistrictForHierarchy;
    const districtId = district?.id || null;
    const isAlreadySelected = selectedLocation === gp.name && selectedGPId === gp.id;

    if (district) {
      setSelectedDistrictForHierarchy(district);
    }
    if (block) {
      setSelectedBlockForHierarchy(block);
    }
    setDropdownLevel('gps');

    // If clicking on already selected GP, keep dropdown open to show hierarchy
    if (isAlreadySelected) {
      if (blocks.length === 0 || !blocks.some(b => b.district_id === districtId)) {
        fetchBlocks(districtId);
      }
      fetchGramPanchayats(districtId, blockId);
    } else {
      // If selecting a different GP, update selection and close dropdown
      trackDropdownChange(gp.name, gp.id, districtId);
      updateLocationSelection('GPs', gp.name, gp.id, districtId, blockId, gp.id, 'dropdown_change');
      fetchGramPanchayats(districtId, blockId);
      setShowLocationDropdown(false);
    }
  };

  useEffect(() => {
    if (!showLocationDropdown) {
      return;
    }

    if ((activeScope === 'Blocks' || activeScope === 'GPs') && districts.length > 0) {
      if (!selectedDistrictForHierarchy) {
        const presetDistrict = (selectedDistrictId && districts.find(d => d.id === selectedDistrictId)) || districts[0];
        if (presetDistrict) {
          setSelectedDistrictForHierarchy(presetDistrict);
          setDropdownLevel(activeScope === 'GPs' && selectedBlockId ? 'gps' : 'blocks');
          fetchBlocks(presetDistrict.id);
        }
      } else {
        // If district is already set, ensure blocks are fetched and dropdownLevel is set correctly
        if (activeScope === 'Blocks') {
          // For Blocks scope, always show blocks level when dropdown opens
          setDropdownLevel('blocks');
          if (blocks.length === 0 || !blocks.some(b => b.district_id === selectedDistrictForHierarchy.id)) {
            fetchBlocks(selectedDistrictForHierarchy.id);
          }
        } else if (activeScope === 'GPs') {
          // For GPs scope, determine level based on what's selected
          if (selectedGPId || (selectedBlockForHierarchy && selectedBlockForHierarchy.id)) {
            setDropdownLevel('gps');
            // Ensure block hierarchy is set if we have a selected GP
            if (selectedGPId && !selectedBlockForHierarchy) {
              const gpBlock = blocks.find(b => b.id === selectedBlockId);
              if (gpBlock) {
                setSelectedBlockForHierarchy(gpBlock);
              }
            }
          } else {
            setDropdownLevel('blocks');
          }
          // Ensure blocks are fetched for the selected district
          if (blocks.length === 0 || !blocks.some(b => b.district_id === selectedDistrictForHierarchy.id)) {
            fetchBlocks(selectedDistrictForHierarchy.id);
          }
        }
      }
    }

    if (activeScope === 'GPs' && selectedDistrictForHierarchy) {
      // Ensure blocks are fetched first
      if (blocks.length === 0 || !blocks.some(b => b.district_id === selectedDistrictForHierarchy.id)) {
        fetchBlocks(selectedDistrictForHierarchy.id);
      }

      // Once blocks are available, set up block hierarchy
      if (blocks.length > 0) {
        if (!selectedBlockForHierarchy) {
          const presetBlock = (selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.district_id === selectedDistrictForHierarchy.id))
            || blocks.find(b => b.district_id === selectedDistrictForHierarchy.id);
          if (presetBlock) {
            setSelectedBlockForHierarchy(presetBlock);
            setDropdownLevel('gps');
            fetchGramPanchayats(selectedDistrictForHierarchy.id, presetBlock.id);
          }
        } else {
          // If block is already set, ensure dropdownLevel is 'gps' and GPs are fetched
          setDropdownLevel('gps');
          if (!gramPanchayats.length || !gramPanchayats.some(gp => gp.block_id === selectedBlockForHierarchy.id)) {
            fetchGramPanchayats(selectedDistrictForHierarchy.id, selectedBlockForHierarchy.id);
          }
        }
      }
    }
  }, [
    showLocationDropdown,
    activeScope,
    districts,
    blocks,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    fetchBlocks,
    fetchGramPanchayats,
    gramPanchayats
  ]);

  // Handle predefined date range selection
  const handleDateRangeSelection = (range) => {
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
      setStartDate(null);
      setEndDate(null);
      // Don't close dropdown for custom - let user select dates
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);

      const today = new Date();
      const currentYear = today.getFullYear();

      // Year: Jan 1 - Dec 31 of current year
      if (range.value === 'year') {
        setStartDate(`${currentYear}-01-01`);
        setEndDate(`${currentYear}-12-31`);
      } else if (range.value === 'today') {
        // Today: start = today, end = today
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (range.value === 'yesterday') {
        // Yesterday: start = yesterday, end = yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
      } else {
        // For ranges like "Last 7 Days", "Last 30 Days"
        // start = today - N days, end = today
        const start = new Date(today);
        start.setDate(today.getDate() - range.days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      }

      setShowDateDropdown(false);
    }
  };

  // Handle custom date selection
  const handleCustomDateSelection = (date) => {
    if (!startDate) {
      setStartDate(date);
    } else if (!endDate) {
      if (new Date(date) >= new Date(startDate)) {
        setEndDate(date);
        setShowDateDropdown(false);
      } else {
        // If end date is before start date, swap them
        setEndDate(startDate);
        setStartDate(date);
        setShowDateDropdown(false);
      }
    }
  };

  // Generate years (from 2020 to current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  };

  // Generate months
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Generate days based on selected month and year
  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Get display text based on selected date range
  const getDateDisplayText = () => {
    if (isCustomRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    } else if (isCustomRange && startDate) {
      const start = new Date(startDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - Select End Date`;
    } else {
      return selectedDateRange;
    }
  };

  // Get the current filter type based on what's selected
  const getCurrentFilterType = () => {
    if (selectedDay && selectedMonth) {
      return 'day';
    } else if (selectedMonth) {
      return 'month';
    } else {
      return 'year';
    }
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectionStep('month');
  };

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setSelectionStep('day');
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };

  // Skip to next step or finish
  const handleSkip = () => {
    if (selectionStep === 'month') {
      setSelectionStep('day');
    } else if (selectionStep === 'day') {
      setShowDateDropdown(false);
    }
  };

  // Finish selection
  const handleFinish = () => {
    setShowDateDropdown(false);
  };

  // Reset selection
  const handleReset = () => {
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectionStep('year');
  };

  // Toggle date dropdown on click
  const handleCalendarClick = () => {
    setShowDateDropdown(!showDateDropdown);
    if (!showDateDropdown) {
      setSelectionStep('year');
    }
  };

  // Validate selected day when month or year changes
  useEffect(() => {
    if (selectedMonth && selectedDay) {
      const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      if (selectedDay > daysInSelectedMonth) {
        setSelectedDay(daysInSelectedMonth);
      }
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Log date changes for debugging
  useEffect(() => {
  }, [selectedYear, selectedMonth, selectedDay]);

  // Fetch districts immediately when dashboard loads
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Ensure complaints year is always current year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSelectedComplaintsYear(currentYear);
  }, []);

  // Ensure performance year is always current year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSelectedPerformanceYear(currentYear);
  }, []);

  // Fetch Performance Data from API (both current and previous month)
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoadingPerformance(true);
      setPerformanceError(null);

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      let level = 'DISTRICT'; // Default for State scope
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks') {
        level = 'VILLAGE';
      } else if (activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);

      // Add geography IDs based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
      }

      // Determine performance date range
      const { start: currentStartDate, end: currentEndDate } = getPerformanceDateRange();

      // Fetch current month data
      const currentParams = new URLSearchParams(params);
      currentParams.append('start_date', currentStartDate);
      currentParams.append('end_date', currentEndDate);

      const currentUrl = `/complaints/analytics/geo?${currentParams.toString()}`;
      const currentResponse = await apiClient.get(currentUrl);
      setPerformanceApiData(currentResponse.data);

    } catch (error) {
      console.error('❌ ===== PERFORMANCE API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END PERFORMANCE API ERROR =====\n');

      setPerformanceError(error.message || 'Failed to fetch performance data');
      setPerformanceApiData(null);
    } finally {
      setLoadingPerformance(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, performanceMonth, selectedPerformanceYear]);

  // Fetch Top 3 data from dedicated API
  const fetchTop3Data = useCallback(async () => {
    try {
      setLoadingTop3(true);
      setTop3Error(null);

      console.log('🔄 ===== TOP 3 API CALL =====');
      console.log('📍 Current State:', {
        top3Scope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId
      });

      // Calculate current month date range
      const now = new Date();
      const target = new Date(now.getFullYear(), top3Month, 1);
      const startDate = formatDate(new Date(target.getFullYear(), target.getMonth(), 1));
      const endDate = formatDate(new Date(target.getFullYear(), target.getMonth() + 1, 0));

      // Map scope to API level
      let level = 'DISTRICT';
      if (top3Scope === 'Block') {
        level = 'BLOCK';
      } else if (top3Scope === 'GP') {
        level = 'VILLAGE';
      }

      console.log('📅 Date Range:', startDate, 'to', endDate);
      console.log('📊 Level:', level);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('n', '5'); // Get top 5 but we'll only use top 3
      params.append('level', level);

      // Top 3 API works independently - no need for district_id or block_id parameters

      const url = `/complaints/analytics/top-n?${params.toString()}`;
      const response = await apiClient.get(url);

      setTop3ApiData(response.data);
    } catch (error) {
      console.error('❌ ===== TOP 3 API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END TOP 3 API ERROR =====\n');

      setTop3Error(error.message || 'Failed to fetch top 3 data');
      setTop3ApiData(null);
    } finally {
      setLoadingTop3(false);
    }
  }, [top3Scope, selectedDistrictId, selectedBlockId, selectedGPId, top3Month]);

  // Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      setAnalyticsError('Select start and end dates, then click Apply');
      setAnalyticsData(null);
      return;
    }

    // Only fetch if we have the necessary location ID selected
    // Don't wait for sub-region data to load - just need the location ID for the current scope
    if (activeScope === 'Districts' && !selectedDistrictId) {
      // Clear data when waiting for district selection (e.g., Rajasthan clicked)
      setAnalyticsData(null);
      return;
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      // Clear data when waiting for block selection
      setAnalyticsData(null);
      return;
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      // Clear data when waiting for GP selection
      setAnalyticsData(null);
      return;
    }

    fetchAnalyticsData();
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, isCustomRange]);

  // Fetch complaints chart data when filters change (independent of overview date range)
  useEffect(() => {
    // Only fetch if we have the necessary location ID selected
    // Don't wait for sub-region data to load - just need the location ID for the current scope
    if (activeScope === 'Districts' && !selectedDistrictId) {
      // Clear data when waiting for district selection
      setComplaintsChartData(null);
      return;
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      // Clear data when waiting for block selection
      setComplaintsChartData(null);
      return;
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      // Clear data when waiting for GP selection
      setComplaintsChartData(null);
      return;
    }

    fetchComplaintsChartData();
  }, [activeComplaintsFilter, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedComplaintsYear]);

  // Fetch performance data when scope or location changes
  useEffect(() => {
    // Only fetch if we have the necessary location ID selected
    // Don't wait for sub-region data to load - just need the location ID for the current scope
    if (activeScope === 'Districts' && !selectedDistrictId) {
      return; // Wait for district selection
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      return; // Wait for block selection
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }

    fetchPerformanceData();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, performanceMonth, selectedPerformanceYear, fetchPerformanceData]);

  // Fetch Top 3 data when scope or month changes
  useEffect(() => {
    console.log('🔄 Top 3 useEffect triggered:', {
      top3Scope,
      top3Month
    });

    fetchTop3Data();
  }, [top3Scope, top3Month, fetchTop3Data]);

  // Fetch Vendor data when GP is selected
  useEffect(() => {
    const fetchVendorData = async () => {
      // Only fetch vendor data when GP is selected
      if (activeScope !== 'GPs' || !selectedGPId) {
        setVendorData(null);
        return;
      }

      try {
        setLoadingVendor(true);
        setVendorError(null);

        console.log('🔄 Fetching vendor data for GP ID:', selectedGPId);
        const response = await apiClient.get(`/geography/grampanchayats/${selectedGPId}/contractor`);
        console.log('✅ Vendor API Response:', response.data);

        setVendorData(response.data);
      } catch (error) {
        console.error('❌ Error fetching vendor data:', error);
        setVendorError(error.response?.data?.message || error.message || 'Failed to fetch vendor details');
        setVendorData(null);
      } finally {
        setLoadingVendor(false);
      }
    };

    fetchVendorData();
  }, [activeScope, selectedGPId]);

  // Update selected location when districts are loaded
  useEffect(() => {
    if (activeScope === 'Districts' && districts.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(districts[0].name);
      setSelectedDistrictId(districts[0].id);
    }
  }, [districts, activeScope, selectedLocation]);

  // Update selected location when blocks are loaded
  useEffect(() => {
    if (activeScope === 'Blocks' && blocks.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(blocks[0].name);
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, activeScope, selectedLocation]);

  // Update selected location when Gram Panchayats are loaded
  useEffect(() => {
    if (activeScope === 'GPs' && gramPanchayats.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(gramPanchayats[0].name);
      setSelectedGPId(gramPanchayats[0].id);
    }
  }, [gramPanchayats, activeScope, selectedLocation]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDateDropdown && !event.target.closest('[data-date-dropdown]')) {
        setShowDateDropdown(false);
      }
      if (showLocationDropdown && !event.target.closest('[data-location-dropdown]')) {
        setShowLocationDropdown(false);
      }
      if (showComplaintsYearDropdown && !event.target.closest('[data-complaints-year-dropdown]')) {
        setShowComplaintsYearDropdown(false);
      }
      if (showTop3Dropdown && !event.target.closest('[data-top3-dropdown]')) {
        setShowTop3Dropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown, showLocationDropdown, showComplaintsYearDropdown, showTop3Dropdown]);

  // Get complaint data with real API values
  const getComplaintData = () => {
    const counts = calculateComplaintCounts();

    // Format numbers with commas
    const formatNumber = (num) => {
      return num.toLocaleString();
    };

    return [
      {
        title: 'Total complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.total),
        icon: List,
        color: '#9ca3af',
        trend: 'up',
        tooltipText: 'Total complaints logged for the selected scope and period.',
        chartData: {
          series: [{
            data: [counts.total * 0.8, counts.total * 0.9, counts.total * 0.95, counts.total]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#6b7280'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#9ca3af']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Open complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.open),
        icon: List,
        color: '#ef4444',
        trend: 'up',
        tooltipText: 'Complaints that are currently open and awaiting action.',
        chartData: {
          series: [{
            data: [counts.open * 0.85, counts.open * 0.92, counts.open * 0.97, counts.open]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#ef4444'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#ef4444']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Resolved complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.resolved),
        icon: List,
        color: '#8b5cf6',
        trend: 'up',
        tooltipText: 'Complaints resolved after action was taken.',
        chartData: {
          series: [{
            data: [counts.resolved * 0.8, counts.resolved * 0.88, counts.resolved * 0.92, counts.resolved]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#8b5cf6'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#8b5cf6']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Verified complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.verified),
        icon: List,
        color: '#f59e0b',
        trend: 'up',
        tooltipText: 'Complaints verified by the VDO.',
        chartData: {
          series: [{
            data: [counts.verified * 0.82, counts.verified * 0.89, counts.verified * 0.93, counts.verified]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#f59e0b'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#f59e0b']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Disposed complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.disposed),
        icon: List,
        color: '#14b8a6',
        trend: 'up',
        tooltipText: 'Complaints closed after final disposal or resolution confirmation.',
        chartData: {
          series: [{
            data: [counts.disposed * 0.75, counts.disposed * 0.85, counts.disposed * 0.9, counts.disposed]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#14b8a6'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#14b8a6']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      }
    ];
  };

  const complaintData = getComplaintData();

  // Calculate percentage of complaints closed/resolved
  const calculateClosedPercentage = () => {
    const counts = calculateComplaintCounts();

    // console.log('📊 Percentage Calculation Debug:', {
    //   total: counts.total,
    //   open: counts.open,
    //   verified: counts.verified,
    //   resolved: counts.resolved,
    //   disposed: counts.disposed
    // });

    if (counts.total === 0) {
      return null; // Return null instead of 0 when no data
    }

    // Calculate percentage: (resolved + disposed / total) * 100
    const closedCount = counts.resolved + counts.disposed;
    const percentage = Math.round((closedCount / counts.total) * 100);

    // console.log('📊 Percentage Calculation:', {
    //   closedCount,
    //   total: counts.total,
    //   percentage: `${percentage}%`,
    //   calculation: `(${closedCount} / ${counts.total}) * 100 = ${percentage}%`
    // });

    return percentage;
  };

  const closedPercentage = calculateClosedPercentage();

  // Generate dynamic x-axis categories based on selected tab and location
  const getXAxisCategories = () => {
    if (activeComplaintsFilter === 'Time') {
      // Show months for the selected year
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    } else if (activeComplaintsFilter === 'Location') {
      // Show locations based on current scope
      switch (activeScope) {
        case 'State':
          // State -> show all districts
          return districts.map(district => district.name);
        case 'Districts':
          // District -> show all blocks under that district
          console.log('🔍 Districts scope debug:', {
            selectedDistrictId,
            blocksLength: blocks.length,
            blocks: blocks.slice(0, 3), // Show first 3 blocks for debugging
            filteredBlocks: blocks.filter(block => block.district_id === selectedDistrictId)
          });

          if (selectedDistrictId) {
            const filteredBlocks = blocks.filter(block => block.district_id === selectedDistrictId);
            console.log('📊 Filtered blocks for district:', selectedDistrictId, filteredBlocks);
            return filteredBlocks.map(block => block.name);
          }
          return [];
        case 'Blocks':
          // Block -> show all GPs under that block
          if (selectedBlockId) {
            return gramPanchayats.filter(gp => gp.block_id === selectedBlockId)
              .map(gp => gp.name);
          }
          return [];
        case 'GPs':
          // GP -> show only that GP
          if (selectedGPId) {
            const selectedGP = gramPanchayats.find(gp => gp.id === selectedGPId);
            return selectedGP ? [selectedGP.name] : [];
          }
          return [];
        default:
          return districts.map(district => district.name);
      }
    }
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };

  const xAxisCategories = getXAxisCategories();

  console.log('📊 X-axis Categories Debug:', {
    activeComplaintsFilter,
    activeScope,
    selectedDistrictId,
    xAxisCategories,
    categoriesLength: xAxisCategories.length
  });

  // Placeholder bar chart data when API returns no data (for graph visibility)
  const PLACEHOLDER_CHART_DATA = {
    open: [40, 40, 40, 60, 60, 100, 120, 120, 120, 140, 140, 140],
    closed: [100, 100, 120, 100, 140, 140, 180, 180, 180, 200, 200, 200],
    total: [200, 220, 250, 230, 250, 240, 300, 300, 250, 250, 250, 250]
  };

  // Generate dynamic chart data based on x-axis categories and API response
  const getChartData = () => {
    const categoryCount = xAxisCategories.length;

    // Initialize data arrays
    let openData = Array(categoryCount).fill(0);
    let closedData = Array(categoryCount).fill(0);
    let totalData = Array(categoryCount).fill(0);

    if (!complaintsChartData || !complaintsChartData.response) {
      // Use placeholder when no API data (trim to category count if months differ)
      const n = Math.min(categoryCount, 12);
      return {
        open: [...PLACEHOLDER_CHART_DATA.open.slice(0, n), ...Array(categoryCount - n).fill(0)],
        closed: [...PLACEHOLDER_CHART_DATA.closed.slice(0, n), ...Array(categoryCount - n).fill(0)],
        total: [...PLACEHOLDER_CHART_DATA.total.slice(0, n), ...Array(categoryCount - n).fill(0)]
      };
    }

    if (activeComplaintsFilter === 'Time') {
      // For Time tab: Group data by month
      complaintsChartData.response.forEach(item => {
        // Get month from date if available, or distribute evenly
        // For now, we'll distribute based on location hash to months
        const monthIndex = Math.abs(item.geo_name?.charCodeAt(0) || 0) % 12;
        const status = item.status?.toUpperCase();
        const count = item.count || 0;

        totalData[monthIndex] += count;

        if (status === 'OPEN' || status === 'VERIFIED') {
          openData[monthIndex] += count;
        } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
          closedData[monthIndex] += count;
        }
      });
    } else if (activeComplaintsFilter === 'Location') {
      // For Location tab: Group data by geography_name
      const locationMap = new Map();

      complaintsChartData.response.forEach(item => {
        const geoName = item.geography_name || item.geo_name || 'Unknown';
        const status = item.status?.toUpperCase();
        const count = item.count || 0;

        if (!locationMap.has(geoName)) {
          locationMap.set(geoName, { open: 0, closed: 0, total: 0 });
        }

        const loc = locationMap.get(geoName);
        loc.total += count;

        if (status === 'OPEN' || status === 'VERIFIED') {
          loc.open += count;
        } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
          loc.closed += count;
        }
      });

      // Debug logging
      console.log('Location Map:', locationMap);
      console.log('X-axis Categories:', xAxisCategories);

      // Map location data to x-axis categories
      xAxisCategories.forEach((category, index) => {
        const data = locationMap.get(category);
        if (data) {
          openData[index] = data.open;
          closedData[index] = data.closed;
          totalData[index] = data.total;
          console.log(`Mapped ${category}:`, data);
        } else {
          console.log(`No data found for category: ${category}`);
        }
      });
    }

    return {
      open: openData,
      closed: closedData,
      total: totalData
    };
  };

  const chartData = getChartData();

  // Compute a dynamic, "nice" Y-axis max based on data with 10% headroom
  const getYAxisMax = () => {
    const allValues = [
      ...(chartData?.open || []),
      ...(chartData?.closed || []),
      ...(chartData?.total || [])
    ];
    const baseMax = Math.max(0, ...allValues);
    if (baseMax === 0) return 10;
    const padded = Math.ceil(baseMax * 1.1); // add 10% headroom
    const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
    const nice = Math.ceil(padded / magnitude) * magnitude;
    return nice;
  };

  const yAxisMax = getYAxisMax();

  // Process performance API data and calculate metrics
  const processPerformanceData = () => {
    if (!performanceApiData || !performanceApiData.response) {
      return new Map();
    }

    const geographyMap = new Map();

    // Group data by geography_name
    performanceApiData.response.forEach(item => {
      const geoName = item.geography_name || 'Unknown';
      const status = item.status?.toUpperCase();
      const count = item.count || 0;
      const avgResolutionTime = item.average_resolution_time || 0;

      if (!geographyMap.has(geoName)) {
        geographyMap.set(geoName, {
          name: geoName,
          id: item.geography_id,
          totalComplaints: 0,
          closedComplaints: 0,
          totalResolutionTime: 0,
          statusCounts: {}
        });
      }

      const geo = geographyMap.get(geoName);
      geo.totalComplaints += count;
      geo.totalResolutionTime += avgResolutionTime;
      geo.statusCounts[status] = count;

      // Count closed complaints (RESOLVED, CLOSED, DISPOSED)
      if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
        geo.closedComplaints += count;
      }
    });

    // Calculate metrics for each geography
    geographyMap.forEach((geo, name) => {
      // Calculate average resolution time in days
      const avgResolutionTimeDays = geo.totalResolutionTime > 0
        ? (geo.totalResolutionTime / 86400) // Convert seconds to days
        : 0;

      geo.avgResolutionTimeDays = Math.round(avgResolutionTimeDays * 10) / 10; // Round to 1 decimal

      // Calculate completion percentage
      // Formula: (RESOLVED complaints) / (OPEN + RESOLVED + VERIFIED + CLOSED) * 100
      const resolvedCount = geo.statusCounts.RESOLVED || 0;
      const totalRelevantComplaints = (geo.statusCounts.OPEN || 0) +
        (geo.statusCounts.RESOLVED || 0) +
        (geo.statusCounts.VERIFIED || 0) +
        (geo.statusCounts.CLOSED || 0);

      geo.completionPercentage = totalRelevantComplaints > 0
        ? Math.round((resolvedCount / totalRelevantComplaints) * 100)
        : 0;

      // Debug logging for completion calculation
      console.log(`📊 Completion Calculation for ${geo.name}:`, {
        resolved: resolvedCount,
        open: geo.statusCounts.OPEN || 0,
        verified: geo.statusCounts.VERIFIED || 0,
        closed: geo.statusCounts.CLOSED || 0,
        totalRelevant: totalRelevantComplaints,
        completion: geo.completionPercentage + '%'
      });
    });

    return geographyMap;
  };

  // Filter performance data based on active tab
  const getFilteredPerformanceData = (data) => {
    let filteredData = [];

    if (activePerformanceTab === 'starPerformers') {
      filteredData = data.filter(item => item.completion >= 50);
    } else if (activePerformanceTab === 'underperformers') {
      filteredData = data.filter(item => item.completion < 50);
    } else {
      filteredData = data;
    }

    console.log(`📊 Performance Filter (${activePerformanceTab}):`, {
      totalItems: data.length,
      filteredItems: filteredData.length,
      threshold: activePerformanceTab === 'starPerformers' ? '>= 50%' : '< 50%'
    });

    return filteredData;
  };

  // Get performance data based on current scope
  const getPerformanceData = () => {
    const processedData = processPerformanceData();

    let performanceData = [];

    switch (activeScope) {
      case 'State':
        // State -> show all districts
        performanceData = districts.map(district => {
          const apiData = processedData.get(district.name);
          return {
            name: district.name,
            id: district.id,
            type: 'District',
            avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
            completion: apiData?.completionPercentage || 0
          };
        });
        break;
      case 'Districts':
        // District -> show all blocks under that district
        if (selectedDistrictId) {
          performanceData = blocks.filter(block => block.district_id === selectedDistrictId)
            .map(block => {
              const apiData = processedData.get(block.name);
              return {
                name: block.name,
                id: block.id,
                type: 'Block',
                avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
                completion: apiData?.completionPercentage || 0
              };
            });
        }
        break;
      case 'Blocks':
        // Block -> show all GPs under that block
        if (selectedBlockId) {
          performanceData = gramPanchayats.filter(gp => gp.block_id === selectedBlockId)
            .map(gp => {
              const apiData = processedData.get(gp.name);
              return {
                name: gp.name,
                id: gp.id,
                type: 'GP',
                avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
                completion: apiData?.completionPercentage || 0
              };
            });
        }
        break;
      case 'GPs':
        // GP -> show only that GP
        if (selectedGPId) {
          const selectedGP = gramPanchayats.find(gp => gp.id === selectedGPId);
          if (selectedGP) {
            const apiData = processedData.get(selectedGP.name);
            performanceData = [{
              name: selectedGP.name,
              id: selectedGP.id,
              type: 'GP',
              avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
              completion: apiData?.completionPercentage || 0
            }];
          }
        }
        break;
      default:
        performanceData = [];
    }

    return getFilteredPerformanceData(performanceData);
  };

  const performanceData = getPerformanceData();

  // Get Top 3 data from API response
  const getTop3Data = () => {
    if (!top3ApiData || !Array.isArray(top3ApiData)) {
      return [];
    }

    // API already returns data sorted by score (descending)
    // Take only top 3 and map to our format
    return top3ApiData.slice(0, 3).map((item, index) => ({
      name: item.geo_name,
      id: item.geo_id,
      type: top3Scope,
      score: item.score,
      rating: '' // Empty as requested
    }));
  };

  // Helper functions for vendor data
  const formatVendorDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const calculateContractDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return `${months} months`;
  };

  const top3Data = getTop3Data();

  // Simple error boundary
  if (typeof window !== 'undefined') {
    console.log('DashboardContent rendering...');
  }

  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <style>{`
        @media (max-width: 639px) {
          .desktop-text {
            display: none !important;
          }
          .mobile-text {
            display: inline !important;
          }
        }
        @media (min-width: 640px) {
          .desktop-text {
            display: inline !important;
          }
          .mobile-text {
            display: none !important;
          }
        }
      `}</style>

      {/* Overview Section */}
      <div className="dashboard-overview-section" style={{
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '6px',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 16px 0'
        }}>
          Overview {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
        </h2>
        <div style={{ marginBottom: '24px' }}>
          <OverviewBanner

            districtsCount={districts.length}
            blocksCount={allBlocksForDistricts.length}
            villagesCount={totalCountOfGPs}
          />
        </div>
      </div>

      {/* List of Districts - always show on SMD dashboard (state-level overview) */}
      <ListOfDistrictsTable
        districts={districts}
        analyticsData={analyticsData}
        blocks={allBlocksForDistricts}
        gpStats={allGPsForDistricts}
        districtStats={districtStats}
        dateDisplayText={getDateDisplayText()}
        onDateClick={handleCalendarClick}
        onComplaintsClick={() => onNavigateToComplaints?.()}
        onAttendanceClick={() => onNavigateToAttendance?.()}
        onGPDataCoverageClick={() => onNavigateToGPMasterData?.()}
        onGPSTrackingClick={() => onNavigateToGPSTracking?.()}
        onContractorDataClick={() => onNavigateToContractorDetails?.()}
        onGPDataStatusClick={() => onNavigateToGPMasterData?.()}
        onInspectionClick={() => onNavigateToInspection?.()}
        loading={loadingDistrictStats || loadingAnalytics}
      />

      {/* Complaints - after List of Districts, before Attendance/Inspection (Chart + Graph layout) */}
      <ComplaintsDashboard
        complaintCards={(() => {
          const data = getComplaintData();
          // alert('Complaint data: ' + JSON.stringify(data));
          // console.log('data >> ', data);

          return [data[0], data[1], data[4]]; // Total, Open, Disposed
        })()}
        chartData={chartData}
        xAxisCategories={xAxisCategories}
        yAxisMax={yAxisMax}
        selectedComplaintsYear={selectedComplaintsYear}
        activeComplaintsFilter={activeComplaintsFilter}
        showComplaintsYearDropdown={showComplaintsYearDropdown}
        loadingComplaintsChart={loadingComplaintsChart}
        complaintsChartError={complaintsChartError}
        dateDisplayText={getDateDisplayText()}
        years={generateYears()}
        onDateClick={handleCalendarClick}
        onYearSelect={(year) => { setSelectedComplaintsYear(year); setShowComplaintsYearDropdown(false); }}
        onYearDropdownToggle={() => setShowComplaintsYearDropdown(!showComplaintsYearDropdown)}
        onFilterChange={setActiveComplaintsFilter}
        onCardClick={onNavigateToComplaints}
      />

      {/* Dashboard Cards Grid: Attendance, Inspection, Contractor, Schemes, Events, GP Master, GPS, Performance, Top 3 */}
      <DashboardCardsGrid
        dateLabel={getDateDisplayText()}
        attendanceData={attendanceCardData}
        attendanceLoading={loadingAttendanceCard}
        attendanceError={attendanceCardError}
        inspectionData={inspectionCardData}
        inspectionLoading={loadingInspectionCard}
        inspectionError={inspectionCardError}
        contractorData={contractorCardData}
        contractorLoading={loadingContractorCard}
        contractorError={contractorCardError}
        schemesData={schemesCardData}
        schemesLoading={loadingSchemesCard}
        schemesError={schemesCardError}
        eventsData={eventsCardData}
        eventsLoading={loadingEventsCard}
        eventsError={eventsCardError}
        gpMasterData={gpMasterCardData}
        gpMasterLoading={loadingGpMasterCard}
        gpMasterError={gpMasterCardError}
        gpsData={gpsCardData}
        gpsLoading={loadingGpsCard}
        gpsError={gpsCardError}
        topPerformers={topPerformersByLoc}
        onAttendanceClick={() => onNavigateToAttendance?.()}
        onInspectionClick={() => onNavigateToInspection?.()}
        onContractorClick={() => onNavigateToContractorDetails?.()}
        onSchemesClick={() => onNavigateToSchemes?.()}
        onEventsClick={() => onNavigateToEvents?.()}
        onGPMasterDataClick={() => onNavigateToGPMasterData?.()}
        onGPSTrackingClick={() => onNavigateToGPSTracking?.()}
      />

      {/* Conditional Section: Vendor Details (when GP selected) - Performance/Top 3 now in DashboardCardsGrid */}
      {activeScope === 'GPs' && (
        /* Vendor Details Section (shown when GP is selected) */
        <div style={{
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header with Info Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Contractor details
              </h2>
              <InfoTooltip
                text="Shows the active vendor’s profile and contract details for this location."
                size={20}
                color="#9ca3af"
              />
            </div>

            {/* Loading State */}
            {loadingVendor && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading Contractor details...
              </div>
            )}

            {/* Error State */}
            {vendorError && !loadingVendor && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                {vendorError}
              </div>
            )}

            {/* Vendor Details Content */}
            {!loadingVendor && !vendorError && vendorData && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px'
              }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Name */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Name
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {vendorData.person_name || 'N/A'}
                    </div>
                  </div>

                  {/* Annual contract amount */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Annual contract amount
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {vendorData.contract_amount || 'N/A'}
                    </div>
                  </div>

                  {/* Frequency of work */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Frequency of work
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {vendorData.contract_frequency || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Work order date */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Work order date
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {formatVendorDate(vendorData.contract_start_date)}
                    </div>
                  </div>

                  {/* Duration of work */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Duration of work
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {calculateContractDuration(vendorData.contract_start_date, vendorData.contract_end_date)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loadingVendor && !vendorError && !vendorData && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No vendor details available for this Gram Panchayat
              </div>
            )}
          </div>
        </div>
      )}

      <SendNoticeModal
        isOpen={showSendNoticeModal}
        onClose={handleCloseNoticeModal}
        target={selectedNoticeTarget}
        onSent={handleCloseNoticeModal}
        moduleName={noticeModuleData.moduleName}
        kpiName={noticeModuleData.kpiName}
        kpiFigure={noticeModuleData.kpiFigure}
      />
    </div>
  );
};

export default DashboardContent;