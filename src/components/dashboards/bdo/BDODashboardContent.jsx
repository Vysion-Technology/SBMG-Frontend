import { ChevronDown, List } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import number2 from '../../../assets/images/nnumber2.png';
import number1 from '../../../assets/images/number1.png';
import number3 from '../../../assets/images/number3.png';
import { assetsSections } from '../../../config/assetsConfig';
import { useBDOLocation } from '../../../context/BDOLocationContext';
import apiClient from '../../../services/api';
import { mapAssetsApiToUI } from '../../../utils/assetsMapper';
import SlideDrawer from '../../common/SideDrawer';
import { InfoTooltip } from '../../common/Tooltip';
import AssetsTable from '../common/AssetsTable';
import DashBoardCards from '../common/DashBoardCards';
import NoDataFound from '../common/NoDataFound';
import OverviewBanner from '../common/OverviewBanner';
import SendNoticeModal from '../common/SendNoticeModal';

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

const BDODashboardContent = () => {
  // Use BDOLocationContext for global state management
  const {
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedGPId,
    dropdownLevel,
    selectedGPForHierarchy,
    changeHistory,
    lastChange,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedGPForHierarchy,
    updateLocationSelection,
    getCurrentLocationInfo,
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange,
    bdoDistrictId,
    bdoDistrictName,
    bdoBlockId,
    bdoBlockName,
    loadingBDOData
  } = useBDOLocation();

  // BDO always uses their district ID and block ID from /me API
  const selectedDistrictId = bdoDistrictId || null;
  const selectedBlockId = bdoBlockId ?? null;
  const selectedDistrictForHierarchy = bdoDistrictId ? { id: bdoDistrictId, name: bdoDistrictName } : null;
  const selectedBlockForHierarchy = bdoBlockId ? { id: bdoBlockId, name: bdoBlockName } : null;
  const setSelectedDistrictForHierarchy = () => { }; // No-op for BDO
  const setSelectedBlockId = () => { }; // No-op for BDO
  const setSelectedBlockForHierarchy = () => { }; // No-op for BDO

  // Local state for UI controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);


  // card data store
  const [apiDataCard, setApiDataCard] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDis, setLoadingDis] = useState(false);
  const [error, setError] = useState(null);
  const [fyList, setFyList] = useState([]);
  const [selectedFyId, setSelectedFyId] = useState(null);
  const [loadingFy, setLoadingFy] = useState(false);
  // Assets table data state
  const [districtTableData, setDistrictTableData] = useState([]);

  // Utility helpers
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
    const now = new Date();
    const target = new Date(now.getFullYear(), performanceMonth, 1);
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
    const now = new Date();
    return `${MONTH_NAMES[performanceMonth]} ${now.getFullYear()}`;
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
  const [showPerformanceRangePicker, setShowPerformanceRangePicker] = useState(false);
  const [top3Scope, setTop3Scope] = useState('GP'); // BDO: Only GP available
  const [top3Month, setTop3Month] = useState(() => new Date().getMonth());
  const [showTop3Dropdown, setShowTop3Dropdown] = useState(false);
  const [showTop3MonthPicker, setShowTop3MonthPicker] = useState(false);
  const [top3ApiData, setTop3ApiData] = useState(null);
  const [loadingTop3, setLoadingTop3] = useState(false);
  const [top3Error, setTop3Error] = useState(null);
  const top3MonthRef = useRef(null);

  const performanceRangeRef = useRef(null);

  // Vendor data state (for GP level)
  const [vendorData, setVendorData] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [vendorError, setVendorError] = useState(null);


  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    console.log('Current Location Info:', locationInfo);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, getCurrentLocationInfo]);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null means not selected
  const [selectedDay, setSelectedDay] = useState(null); // null means not selected
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year'); // 'year', 'month', 'day'

  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  const scopeButtons = ['Blocks', 'GPs']; // BDO can only view GPs, Districts and Blocks are disabled

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];



  // BDO: Blocks are not fetched from API - block is fixed from /me API
  const fetchBlocks = useCallback(async (districtId) => {
    if (!bdoDistrictId || !bdoBlockId) {
      console.log('BDO: No block IDs available yet, clearing blocks.');
      setBlocks([]);
      return;
    }

    console.log('BDO: Populating block from /me API:', bdoBlockId, 'for district:', bdoDistrictId);
    const blockEntry = {
      id: bdoBlockId,
      blockId: bdoBlockId,
      block_id: bdoBlockId,
      name: bdoBlockName || 'BDO Block',
      blockName: bdoBlockName || 'BDO Block',
      district_id: bdoDistrictId,
      districtId: bdoDistrictId,
    };
    setBlocks([blockEntry]);
    return [blockEntry];
  }, [bdoBlockId, bdoBlockName, bdoDistrictId]);

  // Fetch Gram Panchayats from API for BDO's block
  const fetchGramPanchayats = useCallback(async (districtIdParam = bdoDistrictId, blockIdParam = bdoBlockId) => {
    const districtId = districtIdParam || bdoDistrictId;
    const blockId = blockIdParam || bdoBlockId;

    if (!districtId || !blockId) {
      console.log('BDO: Missing district/block ID for GP fetch.', { districtId, blockId });
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
      console.log('Gram Panchayats fetched for BDO:', districtId, blockId, response.data);
    } catch (error) {
      console.error('Error fetching Gram Panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, [bdoDistrictId, bdoBlockId]);

  // Fetch Analytics Data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedLocation,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      const level = 'VILLAGE'; // BDO: Always VILLAGE level
      params.append('level', level);
      console.log('📊 Level:', level);

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      const url = `/complaints/analytics/geo?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);

      // Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token Status:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('🔑 Token Preview:', token.substring(0, 20) + '...');
      }

      const response = await apiClient.get(url);

      console.log('✅ Analytics API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      console.log('📦 Response Data Structure:', {
        geo_type: response.data?.geo_type,
        response_count: response.data?.response?.length,
        sample_data: response.data?.response?.slice(0, 2)
      });

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

      console.log('📈 Aggregated Counts:', aggregated);
      console.log('🔄 ===== END ANALYTICS API CALL =====\n');

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

      console.log('🔄 ===== COMPLAINTS CHART API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        selectedComplaintsYear
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      const level = 'VILLAGE'; // BDO: Always VILLAGE level
      params.append('level', level);
      console.log('📊 Level:', level);

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add year range
      const startDate = `${selectedComplaintsYear}-01-01`;
      const endDate = `${selectedComplaintsYear}-12-31`;
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      console.log('📅 Year Range:', startDate, 'to', endDate);

      const url = `/complaints/analytics/geo?${params.toString()}`;
      console.log('🌐 Full API URL:', url);

      const response = await apiClient.get(url);

      console.log('✅ Complaints Chart API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      setComplaintsChartData(response.data);
      console.log('🔄 ===== END COMPLAINTS CHART API CALL =====\n');

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

  // Calculate complaint counts from analytics data
  const calculateComplaintCounts = () => {
    if (!analyticsData || !analyticsData.response) {
      return {
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };
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

      // console.log('🔍 Processing complaint item:', {
      //   status: status,
      //   count: count,
      //   originalStatus: item.status
      // });

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
          // console.log('✅ Added to disposed:', count);
          break;
        default:
          console.warn('Unknown status:', status);
      }
    });

    return counts;
  };

  // BDO: Get location options - only GPs from assigned block
  const getLocationOptions = () => {
    // BDO can only select GPs from their assigned block
    return gramPanchayats.map(gp => ({ id: gp.id, name: gp.name }));
  };

  // Handle scope change
  const handleScopeChange = (scope) => {
    // Track tab change first
    trackTabChange(scope);

    // Close dropdown immediately to prevent showing stale options
    setShowLocationDropdown(false);

    if (scope === 'Blocks') {
      // CEO: Reset to show block selection
      updateLocationSelection('Blocks', 'Select Block', null, bdoDistrictId, null, null, 'tab_change');
      setGramPanchayats([]);
      setDropdownLevel('blocks');
      setSelectedBlockForHierarchy(null);
      // Blocks are already loaded from bdoDistrictId
    } else if (scope === 'GPs') {

      updateLocationSelection(
        'GPs',
        'Select GP',
        null,
        bdoDistrictId,
        selectedBlockId,   // 👈 BLOCK PASS KARO
        null,
        'tab_change'
      );

      setDropdownLevel('blocks');

      // 👇 FETCH GPs when entering GPs tab
      if (selectedBlockId) {
        fetchGramPanchayats(selectedBlockId);
      }
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



  const handleGPClick = (gp) => {
    // BDO: Use fixed district and block from /me API
    trackDropdownChange(gp.name, gp.id, bdoDistrictId, bdoBlockId, gp.id);
    updateLocationSelection('GPs', gp.name, gp.id, bdoDistrictId, bdoBlockId, gp.id, 'dropdown_change');
    setShowLocationDropdown(false);
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
      }
    }

    if (activeScope === 'GPs' && selectedDistrictForHierarchy && blocks.length > 0) {
      if (!selectedBlockForHierarchy) {
        const presetBlock = (selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.district_id === selectedDistrictForHierarchy.id))
          || blocks.find(b => b.district_id === selectedDistrictForHierarchy.id);
        if (presetBlock) {
          setSelectedBlockForHierarchy(presetBlock);
          setDropdownLevel('gps');
          fetchGramPanchayats(selectedDistrictForHierarchy.id, presetBlock.id);
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
    fetchBlocks,
    fetchGramPanchayats
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

      // For "Today" and "Yesterday", both start and end dates should be the same
      if (range.value === 'today') {
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
    console.log(`Year selected: ${year}`);
  };

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setSelectionStep('day');
    console.log(`Month selected: ${months[month - 1].name} ${selectedYear}`);
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    console.log(`Day selected: ${months[selectedMonth - 1].name} ${day}, ${selectedYear}`);
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
    console.log(`Final selection: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
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
    console.log(`Selected date: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
  }, [selectedYear, selectedMonth, selectedDay]);

  // BDO: Fetch GPs immediately using district ID and block ID from /me API
  useEffect(() => {
    if (bdoDistrictId && bdoBlockId) {
      console.log('🔄 BDO Dashboard: Auto-fetching GPs for district/block:', bdoDistrictId, bdoBlockId);
      fetchGramPanchayats();
    }
  }, [bdoDistrictId, bdoBlockId, fetchGramPanchayats]);

  // Ensure complaints year is always current year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSelectedComplaintsYear(currentYear);
  }, []);

  // Fetch Performance Data from API (both current and previous month)
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoadingPerformance(true);
      setPerformanceError(null);

      console.log('🔄 ===== PERFORMANCE API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      const level = 'VILLAGE'; // BDO: Always VILLAGE level
      params.append('level', level);
      console.log('📊 Level:', level);

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Determine performance date range
      const { start: currentStartDate, end: currentEndDate } = getPerformanceDateRange();
      console.log('📅 Performance Range:', currentStartDate, 'to', currentEndDate);

      // Fetch current month data
      const currentParams = new URLSearchParams(params);
      currentParams.append('start_date', currentStartDate);
      currentParams.append('end_date', currentEndDate);

      const currentUrl = `/complaints/analytics/geo?${currentParams.toString()}`;
      console.log('🌐 Current Month API URL:', currentUrl);

      const currentResponse = await apiClient.get(currentUrl);
      console.log('✅ Current Month API Response:', currentResponse.data);

      setPerformanceApiData(currentResponse.data);
      console.log('🔄 ===== END PERFORMANCE API CALL =====\n');

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
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, performanceMonth]);

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

      // CEO: Always use VILLAGE level for analytics
      const level = 'VILLAGE';

      console.log('📅 Date Range:', startDate, 'to', endDate);
      console.log('📊 Level:', level);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('n', '5');
      params.append('level', level);

      // ============================
      // Geography Handling
      // ============================

      // Priority: GP > Block > District
      // Ensure only ONE geography param is sent
      // BDO default
      if (activeScope === "Blocks") {
        if (!selectedBlockId) {
          console.warn("⚠️ Block not available");
          return;
        }
        params.set("block_id", selectedBlockId);

      } else if (activeScope === "GPs") {
        if (!selectedGPId) {
          console.warn("⚠️ GP scope but no GP selected");
          return;
        }
        params.set("gp_id", selectedGPId);

      } else {
        console.warn("⚠️ Invalid scope");
        return;
      }

      // Debug check
      console.log("📦 Final Query Params:", params.toString());

      const url = `/complaints/analytics/top-n?${params.toString()}`;
      const response = await apiClient.get(url);

      console.log('✅ Top 3 API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      setTop3ApiData(response.data);
      console.log('🔄 ===== END TOP 3 API CALL =====\n');

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

  // BDO: Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      setAnalyticsError('Select start and end dates, then click Apply');
      setAnalyticsData(null);
      return;
    }

    console.log('🔄 BDO Analytics useEffect triggered:', {
      activeScope,
      bdoDistrictId,
      selectedGPId,
      startDate,
      endDate
    });

    // BDO only has Blocks and GPs scopes
    if (activeScope === 'Blocks') {
      // For Blocks scope, call API immediately (shows district-level data)
      console.log('📡 BDO: Calling analytics for Blocks scope');
      fetchAnalyticsData();
      return;
    }

    if (activeScope === 'GPs' && !selectedGPId) {
      console.log('⏳ BDO: Waiting for GP selection');
      return; // Wait for GP selection
    }

    console.log('📡 BDO: Calling analytics API');
    fetchAnalyticsData();
  }, [activeScope, selectedGPId, startDate, endDate, isCustomRange, bdoDistrictId, fetchAnalyticsData]);

  // CEO: Fetch complaints chart data when filters change (independent of overview date range)
  useEffect(() => {
    // CEO: Fetch for Blocks scope immediately (don't wait for districts)
    // CEO: No Districts scope
    if (activeScope === 'Blocks') {
      // CEO: Call API immediately for Blocks scope
      console.log('📡 CEO: Calling API for Blocks scope');
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }

    fetchComplaintsChartData();
  }, [activeComplaintsFilter, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedComplaintsYear]);

  // Fetch performance data when scope or location changes
  useEffect(() => {
    // Only fetch if we have the necessary location data loaded
    // CEO: No State scope
    // CEO: No Districts scope
    if (activeScope === 'Blocks') {
      // CEO: Call API immediately for Blocks scope
      console.log('📡 CEO: Calling API for Blocks scope');
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }

    fetchPerformanceData();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, performanceMonth]);

  // Fetch Top 3 data when scope or month changes
  useEffect(() => {
    // Wait until BDO district & block are loaded
    if (!selectedDistrictId || !selectedBlockId) {
      console.log("⏳ Waiting for BDO geography to initialize...");
      return;
    }

    // If GPs scope but GP not selected yet → wait
    if (activeScope === "GPs" && !selectedGPId) {
      console.log("⏳ Waiting for GP selection...");
      return;
    }

    console.log('🔄 Top 3 useEffect triggered:', {
      top3Scope,
      top3Month
    });

    fetchTop3Data();

  }, [
    top3Scope,
    top3Month,
    selectedDistrictId,
    selectedGPId,
    activeScope
  ]);

  // Fetch Vendor data when GP is selected
  useEffect(() => {

    if (activeScope !== 'GPs' || !selectedGPId) {
      setVendorData(null);
      return;
    }

    const fetchVendorData = async () => {
      try {
        setLoadingVendor(true);
        setVendorError(null);

        const response = await apiClient.get(
          `/geography/grampanchayats/${selectedGPId}/contractor`
        );

        setVendorData(response.data ?? []);

      } catch (error) {

        if (error.response?.status === 404) {
          setVendorData([]); // No contractor case
          return;
        }

        setVendorError(
          error.response?.data?.message ||
          "Failed to fetch vendor details"
        );
        setVendorData(null);
      } finally {
        setLoadingVendor(false);
      }
    };

    fetchVendorData();

  }, [activeScope, selectedGPId]);


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

  // Generate dynamic chart data based on x-axis categories and API response
  const getChartData = () => {
    const categoryCount = xAxisCategories.length;

    // Initialize data arrays
    const openData = Array(categoryCount).fill(0);
    const closedData = Array(categoryCount).fill(0);
    const totalData = Array(categoryCount).fill(0);

    if (!complaintsChartData || !complaintsChartData.response) {
      return { open: openData, closed: closedData, total: totalData };
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

  useEffect(() => {
    if (!loadingBDOData && bdoBlockId && bdoBlockName) {

      setActiveScope("Blocks");

      updateLocationSelection(
        "Blocks",
        bdoBlockName,   // 👈 Button me ye show hoga
        bdoBlockId,
        bdoDistrictId,
        bdoBlockId,
        null,
        "initial_load"
      );

    }
  }, [loadingBDOData, bdoBlockId, bdoBlockName]);

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


  useEffect(() => {
    const fetchAssetsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get(
          'annual-surveys/analytics/assets'
        );

        const mapped = mapAssetsApiToUI(res?.data || {});
        setApiDataCard(mapped);

        console.log("✅ Assets API:", mapped);

      } catch (err) {
        console.error("❌ Assets API Error:", err);
        setError(err?.message || "Something went wrong");

      } finally {
        setLoading(false);
      }
    };

    fetchAssetsData();
  }, []);

  const fetchDistrictsAssets = async () => {
    setLoadingDis(true);
    try {
      const res = await apiClient.get(
        "annual-surveys/analytics/assets/drill-down"
      );

      return (res.data?.items || []).map(item => ({
        districtName: item.geography_name,
        districtId: item.geography_id,

        ...mapAssetsApiToUI(item.assets)
      }));
    } catch (error) {
      console.error("❌ Error fetching districts assets:", error);
      return [];
    } finally {
      setLoadingDis(false);
    }

  };

  const fetchBlocksDataAssets = async (districtId) => {
    const res = await apiClient.get(
      "annual-surveys/analytics/assets/drill-down",
      {
        params: {
          district_id: districtId,
        }
      }
    );

    return (res.data?.items || []).map(item => ({
      ...item,

      blockName: item.geography_name,
      blockId: item.geography_id,

      districtId: districtId,

      ...mapAssetsApiToUI(item.assets)
    }));
  };

  const fetchGPDataAssets = async (districtId, blockId) => {

    const res = await apiClient.get(
      "annual-surveys/analytics/assets/drill-down",
      {
        params: {
          district_id: districtId,
          block_id: blockId,
        }
      }
    );
    return (res.data?.items || []).map(item => ({
      gpName: item.geography_name,
      gpId: item.geography_id,

      ...mapAssetsApiToUI(item.assets)
    }));
  };


  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const data = await fetchDistrictsAssets();
        setDistrictTableData(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadDistricts();
  }, []);


  const formatValue = (key, value) => {
    if (key === "Drainage_channels") {
      const num = Number(value);
      if (isNaN(num)) return "-";
      return `${(num / 1000).toFixed(2)} kms`;
    }
    return value;
  };

  return (
    <div>
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
      <div style={{
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '6px'
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
            districtsCount={1}
            blocksCount={1}
            villagesCount={gramPanchayats.length}
          />
        </div>
      </div>
      {/* cards Assets */}
      <div
        style={{
          margin: "16px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          width: '100%',
          maxWidth: '100%',
          minWidth: 0
        }}
      >
        {/* Top Heading */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: "600" }}>Assets</h1>
        </div>

        {/* Sections */}
        {assetsSections.map((section, i) => (
          <div key={i} style={{ marginBottom: "24px" }}>

            {/* Section Heading */}
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#374151",
              }}
            >
              {section.title}
            </h2>

            {/* Cards */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                // gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "15px",
              }}
            >
              {section.cards.map((card, j) => (
                <SlideDrawer
                  key={j}
                  title={`${section.title} - ${card.label}`}
                  clickFunction={() => {
                    console.log("API call", card.key);
                  }}
                  trigger={
                    <DashBoardCards
                      title={card.label}
                      value={
                        loading
                          ? "..."
                          : formatValue(card.key, apiDataCard?.[card.key] ?? '-')
                      }
                      bgColorOverlay={card.bgColor}
                      textColor={card.textColor}
                      border={card.border}
                      bgImg={card.bgImg}
                      width={card.width}
                    />
                  }
                >
                  {({ closeDrawer }) => (
                    <AssetsTable
                      section={section.title}
                      cards={section.cards}
                      apiData={districtTableData}
                      loadingDis={loadingDis}
                      fetchBlocksData={fetchBlocksDataAssets}
                      fetchGPData={fetchGPDataAssets}
                      initialLevel="gp"
                      selectedDistrict={selectedDistrictForHierarchy}
                      selectedDistrictId={selectedDistrictId}
                      selectedBlock={selectedBlockForHierarchy}
                      selectedBlockId={selectedBlockId}
                      fetchBlocks={fetchBlocks}
                      fetchGramPanchayats={fetchGramPanchayats}
                      AssetsTable={AssetsTable}
                      mapApiToUI={mapAssetsApiToUI}
                      closeParentDrawer={closeDrawer}
                    />
                  )}
                </SlideDrawer>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Conditional Section: Performance and Top 3 OR Vendor Details */}
      {activeScope === 'GPs' ? (
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
                style={{ cursor: 'pointer' }}
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
      ) : (
        /* Performance and Top 3 Section (shown when State/District/Block is selected) */
        <div style={{
          display: 'flex',
          gap: '16px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px'
        }}>
          {/* Performance Section */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '14px',
            paddingBottom: '24px',
            borderRadius: '12px',
            border: '1px solid lightgray'
          }}>
            {/* Performance Header with Toggle Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Performance
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Toggle Buttons */}
                <div style={{
                  display: 'flex',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '4px',
                  gap: '2px'
                }}>
                  <button
                    onClick={() => setActivePerformanceTab('starPerformers')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: activePerformanceTab === 'starPerformers' ? '#10b981' : 'transparent',
                      color: activePerformanceTab === 'starPerformers' ? 'white' : '#6b7280'
                    }}>
                    <span className="desktop-text">Star Performers</span>
                    <span className="mobile-text">Star Perform...</span>
                  </button>
                  <button
                    onClick={() => setActivePerformanceTab('underperformers')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: activePerformanceTab === 'underperformers' ? '#10b981' : 'transparent',
                      color: activePerformanceTab === 'underperformers' ? 'white' : '#6b7280'
                    }}>
                    <span className="desktop-text">Underperformers</span>
                    <span className="mobile-text">Under perform...</span>
                  </button>
                </div>

                {/* Range Selector */}
                <div ref={performanceRangeRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={handlePerformanceRangeButtonClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '10px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      minWidth: '140px',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{getPerformanceRangeLabel()}</span>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  </button>

                  {showPerformanceRangePicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '220px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.35)',
                        padding: '8px',
                        zIndex: 1200
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((monthName, index) => (
                          <button
                            key={monthName}
                            type="button"
                            onClick={() => {
                              setPerformanceMonth(index);
                              setShowPerformanceRangePicker(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: performanceMonth === index ? '#f0fdf4' : 'transparent',
                              color: performanceMonth === index ? '#059669' : '#111827',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <span>{monthName}</span>
                            {performanceMonth === index && (
                              <span style={{ fontSize: '12px', color: '#059669' }}>Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading/Error State */}
            {performanceError && (
              <div style={{ marginBottom: '16px' }}>
                <NoDataFound size="medium" />
              </div>
            )}

            {/* Performance Table */}
            <div style={{
              overflowX: 'auto',
              opacity: loadingPerformance ? 0.6 : 1,
              transition: 'opacity 0.3s'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed' // Ensures consistent column widths
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {performancePrimaryLabel}
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Avg Resolution Time
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Complaints closed
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Action
                    </th>
                  </tr>
                </thead>
              </table>
              <div style={{
                maxHeight: '350px', // Approximately 5 rows * 60px per row
                overflowY: 'auto',
                borderTop: '1px solid #e5e7eb',
                // Custom scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed' // Ensures consistent column widths
                }}>
                  <tbody>
                    {performanceData.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: 0 }}>
                          <NoDataFound size="small" />
                        </td>
                      </tr>
                    ) : (
                      performanceData.map((item, index) => (
                        <tr key={item.id || index} style={{
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <td style={{
                            padding: '12px',
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: '500'
                          }}>
                            {item.name}
                          </td>
                          <td style={{
                            padding: '12px',
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            {item.avgResolutionTime > 0 ? `${item.avgResolutionTime} days` : '-'}
                          </td>
                          <td style={{
                            padding: '12px',
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            {item.completion > 0 ? `${item.completion}%` : '-'}
                          </td>
                          <td style={{
                            padding: '12px'
                          }}>
                            <button
                              onClick={() => handleOpenNoticeModal(item)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#374151',
                                cursor: 'pointer'
                              }}>
                              Send notice
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top 3 Section */}
          <div className="w-full lg:flex-1 lg:min-w-0 px-4 sm:px-6 py-3.5 sm:py-6" style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid lightgray',
            overflow: 'hidden'
          }}>
            {/* Top 3 Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0" style={{
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Top 3
                </h2>
                <InfoTooltip
                  text="Highlights the top three performing districts, blocks, or GPs based on the selected metric."
                  size={16}
                  color="#9ca3af"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                <div
                  data-top3-dropdown
                  className="w-full sm:w-auto"
                  style={{
                    position: 'relative',
                    minWidth: '100px',
                    flex: '1 1 auto'
                  }}>
                  <button
                    onClick={() => setShowTop3Dropdown(!showTop3Dropdown)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                    <span>{top3Scope}</span>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  </button>

                  {showTop3Dropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      marginTop: '4px'
                    }}>
                      {/* BDO: Only GP option (no District or Block) */}
                      {['GP'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTop3Scope(option);
                            setShowTop3Dropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            backgroundColor: top3Scope === option ? '#f3f4f6' : 'transparent',
                            color: top3Scope === option ? '#111827' : '#6b7280',
                            fontSize: '14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            margin: '2px'
                          }}>
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={top3MonthRef} className="w-full sm:w-auto" style={{
                  position: 'relative',
                  flex: '1 1 auto'
                }}>
                  <button
                    type="button"
                    onClick={handleTop3MonthButtonClick}
                    className="w-full sm:w-auto"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '10px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      minWidth: '130px',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <span>{getTop3RangeLabel()}</span>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  </button>

                  {showTop3MonthPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '220px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.35)',
                        padding: '8px',
                        zIndex: 1200
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {MONTH_NAMES.map((monthName, index) => (
                          <button
                            key={monthName}
                            type="button"
                            onClick={() => {
                              setTop3Month(index);
                              setShowTop3MonthPicker(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: top3Month === index ? '#f0fdf4' : 'transparent',
                              color: top3Month === index ? '#059669' : '#111827',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <span>{monthName}</span>
                            {top3Month === index && (
                              <span style={{ fontSize: '12px', color: '#059669' }}>Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Loading/Error State */}
            {top3Error && (
              <div style={{ marginBottom: '16px' }}>
                <NoDataFound size="medium" />
              </div>
            )}

            {/* Top 3 Table */}
            <div style={{
              overflowX: 'auto',
              opacity: loadingTop3 ? 0.6 : 1,
              transition: 'opacity 0.3s',
              width: '100%',
              maxWidth: '100%'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Rank
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {top3Scope}
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {top3Data.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: 0 }}>
                        {loadingTop3 ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                            Loading...
                          </div>
                        ) : (
                          <NoDataFound size="small" />
                        )}
                      </td>
                    </tr>
                  ) : (
                    top3Data.map((item, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <img
                            src={index === 0 ? number1 : index === 1 ? number2 : number3}
                            alt={`Rank ${index + 1}`}
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'contain'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {item.name}
                        </td>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          {item.rating || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

export default BDODashboardContent;