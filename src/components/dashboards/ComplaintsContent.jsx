import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Plus, X, Star, User } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { noticesAPI } from '../../services/api';
import LocationDisplay from '../common/LocationDisplay';
import { useLocation } from '../../context/LocationContext';
import NoDataFound from './common/NoDataFound';
import { InfoTooltip } from '../common/Tooltip';

const ComplaintsContent = ({ initialFilter, onFilterConsumed }) => {
  // Shared location state via context
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
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection: contextUpdateLocationSelection,
    trackTabChange: contextTrackTabChange,
    trackDropdownChange: contextTrackDropdownChange,
    getCurrentLocationInfo: contextGetCurrentLocationInfo
  } = useLocation();

  const trackTabChange = useCallback((scope) => {
    console.log('Tab changed to:', scope);
    if (typeof contextTrackTabChange === 'function') {
      contextTrackTabChange(scope);
    }
  }, [contextTrackTabChange]);

  const trackDropdownChange = useCallback((location, locationId, districtId, blockId, gpId) => {
    console.log('Dropdown changed to:', location);
    if (typeof contextTrackDropdownChange === 'function') {
      contextTrackDropdownChange(location, locationId, districtId, blockId, gpId);
    }
  }, [contextTrackDropdownChange]);

  const getCurrentLocationInfo = useCallback(() => {
    if (typeof contextGetCurrentLocationInfo === 'function') {
      return contextGetCurrentLocationInfo();
    }
    return {
      scope: activeScope,
      location: selectedLocation,
      districtId: selectedDistrictId,
      blockId: selectedBlockId,
      gpId: selectedGPId
    };
  }, [contextGetCurrentLocationInfo, activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId]);

  const updateLocationSelection = useCallback((scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    if (typeof contextUpdateLocationSelection === 'function') {
      contextUpdateLocationSelection(scope, location, locationId, districtId, blockId, gpId, changeType);
    }
  }, [contextUpdateLocationSelection]);

  // Local state for UI controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Complaints specific state
  const [activeFilter, setActiveFilter] = useState('Open');
  const [searchTerm, setSearchTerm] = useState('');

  // Raise Complaint Modal state
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [complaintCategories, setComplaintCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Notice Modal state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedComplaintForNotice, setSelectedComplaintForNotice] = useState(null);
  const [noticeCategories, setNoticeCategories] = useState([]);
  const [loadingNoticeCategories, setLoadingNoticeCategories] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);

  // Notice form state
  const [noticeForm, setNoticeForm] = useState({
    to: '',
    subject: '',
    categoryId: '',
    categoryName: '',
    details: ''
  });

  // Form state
  const [complaintForm, setComplaintForm] = useState({
    complaintTypeId: '',
    details: '',
    phone_number: '',
    districtId: '',
    blockId: '',
    gpId: '',
    village: '',
    wardArea: ''
  });

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Complaints list data state from API
  const [complaintsListData, setComplaintsListData] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

  // District summary table state
  const [districtSummaryData, setDistrictSummaryData] = useState([]);
  const [loadingDistrictSummary, setLoadingDistrictSummary] = useState(false);
  const [districtSummaryError, setDistrictSummaryError] = useState(null);

  // All complaints data state (fetched from /complaints API)
  const [allComplaintsData, setAllComplaintsData] = useState([]);
  const [loadingAllComplaints, setLoadingAllComplaints] = useState(false);
  const [allComplaintsError, setAllComplaintsError] = useState(null);

  // Blocks summary table state
  const [blocksSummaryData, setBlocksSummaryData] = useState([]);
  const [loadingBlocksSummary, setLoadingBlocksSummary] = useState(false);
  const [blocksSummaryError, setBlocksSummaryError] = useState(null);
  const [selectedDistrictForBlocks, setSelectedDistrictForBlocks] = useState(null);
  const [viewingBlocksForDistrict, setViewingBlocksForDistrict] = useState(false);

  // GPs summary table state
  const [gpsSummaryData, setGpsSummaryData] = useState([]);
  const [loadingGpsSummary, setLoadingGpsSummary] = useState(false);
  const [gpsSummaryError, setGpsSummaryError] = useState(null);
  const [selectedBlockForGPs, setSelectedBlockForGPs] = useState(null);
  const [viewingGPsForBlock, setViewingGPsForBlock] = useState(false);

  // Individual GP complaints view state
  const [selectedGPForComplaints, setSelectedGPForComplaints] = useState(null);
  const [viewingGPComplaints, setViewingGPComplaints] = useState(false);

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
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return startOfYear.toISOString().split('T')[0];
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

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];

  const filterButtons = ['Open', 'Resolved', 'Verified', 'Closed'];

  // Apply initial filter when navigating from dashboard cards
  useEffect(() => {
    if (initialFilter === undefined) return;
    const valid = ['Open', 'Resolved', 'Verified', 'Closed'].includes(initialFilter);
    setActiveFilter(valid ? initialFilter : '');
    onFilterConsumed?.();
  }, [initialFilter]);

  // Predefined date ranges
  const dateRanges = [
    { label: 'Year', value: 'year' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Month', value: 'month' },
    { label: 'Week', value: 'week' },
    { label: 'Today', value: 'today' },
    { label: 'Custom', value: 'custom' }
  ];

  // Months array
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

  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    console.log('Current Location Info:', locationInfo);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, getCurrentLocationInfo]);

  // Fetch districts from API
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      console.log('Districts API Response:', response.data);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
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
      console.log('Blocks API Response:', response.data);
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch gram panchayats from API for a given district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      console.log('🔄 Fetching GPs...');
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      console.log('✅ GPs API Response:', response.data);
      console.log('📊 Number of GPs fetched:', response.data?.length || 0);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('❌ Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Fetch complaint categories
  const fetchComplaintCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.get('/public/complaint-types');
      console.log('Complaint Categories API Response:', response.data);
      setComplaintCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching complaint categories:', error);
      setComplaintCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch villages from API for a given GP
  const fetchVillages = useCallback(async (gpId) => {
    if (!gpId) {
      setVillages([]);
      return;
    }

    try {
      setLoadingVillages(true);
      const response = await apiClient.get('/geography/villages', {
        params: {
          gp_id: gpId,
          skip: 0,
          limit: 100
        }
      });
      console.log('Villages API Response:', response.data);
      setVillages(response.data || []);
    } catch (error) {
      console.error('Error fetching villages:', error);
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  // Fetch notice categories from API
  const fetchNoticeCategories = useCallback(async () => {
    try {
      setLoadingNoticeCategories(true);
      const response = await noticesAPI.getTypes();
      console.log('Notice Types API Response:', response.data);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setNoticeCategories(response.data);
      } else {
        setNoticeCategories([]);
      }
    } catch (error) {
      console.error('Error fetching notice categories:', error);
      setNoticeCategories([]);
    } finally {
      setLoadingNoticeCategories(false);
    }
  }, []);

  // Generate notice body template based on complaint
  const generateNoticeBody = (complaint) => {
    const moduleName = 'Complaints';
    const kpiName = complaint.title || complaint.complaint_type || 'Complaint Type';
    const kpiFigure = complaint.statusDisplay || complaint.status || complaint.id || 'N/A';

    return `You have been notified for poor performance in "${moduleName}" domain. Your "${kpiName}" is "${kpiFigure}", which needs to be improved. Revert with reason of poor performance and increase your performance within a month to avoid any consequent action.`;
  };

  // Open notice modal with complaint data
  const handleOpenNoticeModal = (complaint) => {
    setSelectedComplaintForNotice(complaint);

    // For complaints module, recipient is always VDO
    const recipient = 'VDO';
    const subject = `Notice regarding Complaint ${complaint.id}`;
    const details = generateNoticeBody(complaint);

    setNoticeForm({
      to: recipient,
      subject,
      categoryId: '',
      categoryName: '',
      details
    });

    fetchNoticeCategories();
    setShowNoticeModal(true);
  };

  // Handle scope change
  const handleScopeChange = (scope) => {
    console.log('Scope changed to:', scope);
    trackTabChange(scope);
    setActiveScope(scope);
    setShowLocationDropdown(false);

    // Use updateLocationSelection like dashboard for proper state management
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
      // For blocks, start with districts level
      setBlocks([]);
      setGramPanchayats([]);
      updateLocationSelection('Blocks', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'GPs') {
      // For GPs, start with districts level
      setBlocks([]);
      setGramPanchayats([]);
      updateLocationSelection('GPs', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    }
  };

  // Get location options based on current scope and dropdown level
  const getLocationOptions = () => {
    if (activeScope === 'Districts') {
      return districts;
    } else if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      } else if (dropdownLevel === 'gps') {
        const filteredGPs = gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id);
        console.log('🔍 Filtering GPs:', {
          totalGPs: gramPanchayats.length,
          selectedBlockId: selectedBlockForHierarchy?.id,
          filteredGPsCount: filteredGPs.length,
          filteredGPs: filteredGPs
        });
        return filteredGPs;
      }
    }
    return [];
  };

  // Handle hierarchical selection for blocks and GPs
  const handleHierarchicalSelection = (location) => {
    if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks(location.id);
      } else if (dropdownLevel === 'blocks') {
        // Block selected
        trackDropdownChange(location.name, location.id, selectedDistrictForHierarchy.id);
        updateLocationSelection('Blocks', location.name, location.id, selectedDistrictForHierarchy.id, location.id, null, 'dropdown_change');
        fetchGramPanchayats(selectedDistrictForHierarchy.id, location.id);
        console.log('Selected block ID:', location.id, 'Name:', location.name, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks(location.id);
      } else if (dropdownLevel === 'blocks') {
        // Block selected, now show GPs
        setSelectedBlockForHierarchy(location);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, location.id);
      } else if (dropdownLevel === 'gps') {
        // GP selected
        trackDropdownChange(location.name, location.id, selectedBlockForHierarchy.id);
        updateLocationSelection('GPs', location.name, location.id, selectedDistrictForHierarchy.id, selectedBlockForHierarchy.id, location.id, 'dropdown_change');
        console.log('Selected GP ID:', location.id, 'Name:', location.name, 'Block ID:', selectedBlockForHierarchy.id, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-location-dropdown]') &&
        !event.target.closest('[data-date-dropdown]') &&
        !event.target.closest('[data-top3-dropdown]') &&
        !event.target.closest('[data-filter-dropdown]')) {
        setShowLocationDropdown(false);
        setShowDateDropdown(false);
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch districts immediately when complaints page loads
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch data immediately when complaints tab is selected
  useEffect(() => {
    console.log('🚀 Complaints tab selected - fetching initial data');
    // For State scope, we can call API immediately
    if (activeScope === 'State') {
      console.log('📡 Calling initial API for State scope');
      fetchAnalyticsData();
      fetchComplaintsData();
    }
  }, []); // Empty dependency array means this runs only once when component mounts

  // Load additional data based on scope
  useEffect(() => {
    if (activeScope === 'Districts' && districts.length === 0) {
      fetchDistricts();
    }
  }, [activeScope, districts.length]);

  // Helper function to calculate complaint counts from API data
  const calculateComplaintCounts = () => {
    if (!analyticsData?.response) {
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
      }
    });

    return counts;
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    // Display whole numbers with commas for thousands
    return num.toLocaleString();
  };

  // Build district summary data
  const buildDistrictSummary = useCallback(() => {
    if (!complaintsListData || complaintsListData.length === 0) {
      return [];
    }

    const districtMap = {};

    // Group complaints by district
    complaintsListData.forEach(complaint => {
      const districtName = complaint.district || 'Unknown District';
      const districtId = complaint.district_id || districtName;

      if (!districtMap[districtId]) {
        districtMap[districtId] = {
          id: districtId,
          name: districtName,
          totalComplaints: 0,
          openComplaints: 0,
          verifiedComplaints: 0,
          resolvedComplaints: 0,
          disposedComplaints: 0,
          resolutionTimes: [], // Array of resolution times in days
          complaints: []
        };
      }

      const district = districtMap[districtId];
      district.totalComplaints += 1;
      district.complaints.push(complaint);

      // Count by status
      const status = complaint.status?.toUpperCase() || 'UNKNOWN';
      switch (status) {
        case 'OPEN':
          district.openComplaints += 1;
          break;
        case 'VERIFIED':
          district.verifiedComplaints += 1;
          break;
        case 'RESOLVED':
          district.resolvedComplaints += 1;
          break;
        case 'CLOSED':
        case 'DISPOSED':
          district.disposedComplaints += 1;
          break;
      }

      // Calculate resolution time if available
      if (complaint.created_at && complaint.resolved_at) {
        const createdDate = new Date(complaint.created_at);
        const resolvedDate = new Date(complaint.resolved_at);
        const resolutionDays = Math.ceil((resolvedDate - createdDate) / (1000 * 60 * 60 * 24));
        district.resolutionTimes.push(resolutionDays);
      }
    });

    // Convert to array and calculate averages
    const summaryArray = Object.values(districtMap).map(district => {
      const avgResolution = district.resolutionTimes.length > 0
        ? (district.resolutionTimes.reduce((a, b) => a + b, 0) / district.resolutionTimes.length).toFixed(1)
        : 'N/A';

      const closedPercent = district.totalComplaints > 0
        ? ((district.disposedComplaints / district.totalComplaints) * 100).toFixed(1)
        : 0;

      const status = parseFloat(closedPercent) > 50
        ? 'Star Performer'
        : 'Under Performer';

      return {
        ...district,
        avgResolution,
        closedPercent,
        status
      };
    });

    return summaryArray.sort((a, b) => b.totalComplaints - a.totalComplaints);
  }, [complaintsListData]);

  // Fetch complaints list from API
  const fetchComplaintsData = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintsError(null);

      console.log('🔄 ===== COMPLAINTS LIST API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '500');
      params.append('order_by', 'newest');

      // Add date range filters
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      // Add geography filters based on active scope
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
        console.log('🏙️  District ID:', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
        console.log('🏘️  Block ID:', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      const url = `/complaints?${params.toString()}`;
      console.log('🌐 Full API URL:', url);

      const response = await apiClient.get(url);

      console.log('✅ Complaints List API Response:', {
        status: response.status,
        count: response.data?.length || 0,
        sample: response.data?.slice(0, 2)
      });

      setComplaintsListData(response.data || []);
      console.log('📊 Complaints data set:', response.data?.length || 0, 'complaints');
      console.log('🔄 ===== END COMPLAINTS LIST API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== COMPLAINTS LIST API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END COMPLAINTS LIST API ERROR =====\n');

      setComplaintsError(error.message || 'Failed to fetch complaints data');
      setComplaintsListData([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch all complaints from API without filters
  const fetchAllComplaintsData = useCallback(async () => {
    try {
      setLoadingAllComplaints(true);
      setAllComplaintsError(null);

      console.log('🔄 ===== FETCH ALL COMPLAINTS API CALL =====');

      // Fetch all complaints with a high limit
      const response = await apiClient.get('/complaints', {
        params: { limit: 1000, order_by: 'newest' }
      });

      console.log('✅ All Complaints API Response:', {
        status: response.status,
        count: response.data?.length || 0,
        sample: response.data?.slice(0, 2)
      });

      setAllComplaintsData(response.data || []);
      console.log('📊 All complaints data set:', response.data?.length || 0, 'total complaints');
      console.log('🔄 ===== END ALL COMPLAINTS API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== ALL COMPLAINTS API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END ALL COMPLAINTS API ERROR =====\n');

      setAllComplaintsError(error.message || 'Failed to fetch all complaints data');
      setAllComplaintsData([]);
    } finally {
      setLoadingAllComplaints(false);
    }
  }, []);

  // Fetch all districts from API and enrich with complaint data
  const fetchDistrictSummaryData = useCallback(async () => {
    try {
      setLoadingDistrictSummary(true);
      setDistrictSummaryError(null);

      console.log('🔄 ===== DISTRICTS API CALL =====');

      // Fetch all districts
      const districtResponse = await apiClient.get('/geography/districts?skip=0&limit=100');
      const allDistricts = districtResponse.data || [];

      // console.log('✅ Districts API Response:', {
      //   status: districtResponse.status,
      //   count: allDistricts.length,
      //   sample: allDistricts.slice(0, 2)
      // });

      // Enrich districts with complaint data from allComplaintsData
      const enrichedDistricts = allDistricts.map(district => {
        // Filter complaints for this district by matching district_name with name
        const districtComplaints = allComplaintsData.filter(
          complaint => complaint.district_name?.toLowerCase() === district.name?.toLowerCase()
        );

        // console.log(`📍 District "${district.name}" matched with ${districtComplaints.length} complaints`);

        // Calculate metrics
        const totalComplaints = districtComplaints.length;
        const openComplaints = districtComplaints.filter(
          c => c.status?.toUpperCase() === 'OPEN'
        ).length;
        const verifiedComplaints = districtComplaints.filter(
          c => c.status?.toUpperCase() === 'VERIFIED'
        ).length;
        const resolvedComplaints = districtComplaints.filter(
          c => c.status?.toUpperCase() === 'RESOLVED'
        ).length;
        const disposedComplaints = districtComplaints.filter(
          c => (c.status?.toUpperCase() === 'CLOSED' || c.status?.toUpperCase() === 'DISPOSED')
        ).length;

        // Calculate average resolution time
        const resolutionTimes = districtComplaints
          .filter(c => c.created_at && c.resolved_at)
          .map(c => {
            const createdDate = new Date(c.created_at);
            const resolvedDate = new Date(c.resolved_at);
            return Math.ceil((resolvedDate - createdDate) / (1000 * 60 * 60 * 24));
          });

        const avgResolution = resolutionTimes.length > 0
          ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
          : 'N/A';

        // Calculate closed percentage
        const closedPercent = totalComplaints > 0
          ? ((disposedComplaints / totalComplaints) * 100).toFixed(2)
          : 0;

        // Determine status
        const status = parseFloat(closedPercent) > 50
          ? 'Star Performer'
          : 'Under Performer';

        return {
          id: district.id,
          name: district.name,
          totalComplaints,
          openComplaints,
          verifiedComplaints,
          resolvedComplaints,
          disposedComplaints,
          avgResolution,
          closedPercent,
          status,
          complaints: districtComplaints // Include all complaints for this district
        };
      });

      // Sort by total complaints (highest first)
      enrichedDistricts.sort((a, b) => b.totalComplaints - a.totalComplaints);

      setDistrictSummaryData(enrichedDistricts);
      console.log('📊 District summary data set:', enrichedDistricts.length, 'districts with matched complaints');
      console.log('🔄 ===== END DISTRICTS API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== DISTRICTS API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END DISTRICTS API ERROR =====\n');

      setDistrictSummaryError(error.message || 'Failed to fetch districts data');
      setDistrictSummaryData([]);
    } finally {
      setLoadingDistrictSummary(false);
    }
  }, [allComplaintsData]);

  // Fetch all blocks for a specific district and enrich with complaint data
  const fetchBlocksSummaryData = useCallback(async (district) => {
    try {
      setLoadingBlocksSummary(true);
      setBlocksSummaryError(null);

      console.log('🔄 ===== BLOCKS API CALL =====');

      // Fetch all blocks for the district
      const blocksResponse = await apiClient.get(`/geography/blocks?district_id=${district.id}&skip=0&limit=100`);
      const allBlocks = blocksResponse.data || [];

      console.log('✅ Blocks API Response:', {
        status: blocksResponse.status,
        count: allBlocks.length,
        districtId: district.id,
        districtName: district.name
      });

      // Enrich blocks with complaint data from allComplaintsData
      const enrichedBlocks = allBlocks.map(block => {
        // Filter complaints for this block by matching block_name with name
        const blockComplaints = allComplaintsData.filter(
          complaint => complaint.block_name?.toLowerCase() === block.name?.toLowerCase()
        );

        console.log(`📍 Block "${block.name}" matched with ${blockComplaints.length} complaints`);

        // Calculate metrics
        const totalComplaints = blockComplaints.length;
        const openComplaints = blockComplaints.filter(
          c => c.status?.toUpperCase() === 'OPEN'
        ).length;
        const verifiedComplaints = blockComplaints.filter(
          c => c.status?.toUpperCase() === 'VERIFIED'
        ).length;
        const resolvedComplaints = blockComplaints.filter(
          c => c.status?.toUpperCase() === 'RESOLVED'
        ).length;
        const disposedComplaints = blockComplaints.filter(
          c => (c.status?.toUpperCase() === 'CLOSED' || c.status?.toUpperCase() === 'DISPOSED')
        ).length;

        // Calculate average resolution time
        const resolutionTimes = blockComplaints
          .filter(c => c.created_at && c.resolved_at)
          .map(c => {
            const createdDate = new Date(c.created_at);
            const resolvedDate = new Date(c.resolved_at);
            return Math.ceil((resolvedDate - createdDate) / (1000 * 60 * 60 * 24));
          });

        const avgResolution = resolutionTimes.length > 0
          ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
          : 'N/A';

        // Calculate closed percentage
        const closedPercent = totalComplaints > 0
          ? ((disposedComplaints / totalComplaints) * 100).toFixed(1)
          : 0;

        // Determine status
        const status = parseFloat(closedPercent) > 50
          ? 'Star Performer'
          : 'Under Performer';

        return {
          id: block.id,
          name: block.name,
          totalComplaints,
          openComplaints,
          verifiedComplaints,
          resolvedComplaints,
          disposedComplaints,
          avgResolution,
          closedPercent,
          status,
          complaints: blockComplaints // Include all complaints for this block
        };
      });

      // Sort by total complaints (highest first)
      enrichedBlocks.sort((a, b) => b.totalComplaints - a.totalComplaints);

      setBlocksSummaryData(enrichedBlocks);
      setSelectedDistrictForBlocks(district);  // Store full district object with totalComplaints
      setViewingBlocksForDistrict(true);
      console.log('📊 Block summary data set:', enrichedBlocks.length, 'blocks with matched complaints');
      console.log('🔄 ===== END BLOCKS API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== BLOCKS API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END BLOCKS API ERROR =====\n');

      setBlocksSummaryError(error.message || 'Failed to fetch blocks data');
      setBlocksSummaryData([]);
    } finally {
      setLoadingBlocksSummary(false);
    }
  }, [allComplaintsData]);

  // Fetch all GPs for a specific block and enrich with complaint data
  const fetchGPsSummaryData = useCallback(async (block) => {
    try {
      setLoadingGpsSummary(true);
      setGpsSummaryError(null);

      console.log('🔄 ===== GPs API CALL =====');

      // Fetch all GPs for the block
      const gpsResponse = await apiClient.get(`/geography/grampanchayats?block_id=${block.id}&skip=0&limit=100`);
      const allGPs = gpsResponse.data || [];

      console.log('✅ GPs API Response:', {
        status: gpsResponse.status,
        count: allGPs.length,
        blockId: block.id,
        blockName: block.name
      });

      // Enrich GPs with complaint data from allComplaintsData
      const enrichedGPs = allGPs.map(gp => {
        // Filter complaints for this GP by matching village_name with name
        const gpComplaints = allComplaintsData.filter(
          complaint => complaint.village_name?.toLowerCase() === gp.name?.toLowerCase()
        );

        console.log(`📍 GP "${gp.name}" matched with ${gpComplaints.length} complaints`);

        // Calculate metrics
        const totalComplaints = gpComplaints.length;
        const openComplaints = gpComplaints.filter(
          c => c.status?.toUpperCase() === 'OPEN'
        ).length;
        const verifiedComplaints = gpComplaints.filter(
          c => c.status?.toUpperCase() === 'VERIFIED'
        ).length;
        const resolvedComplaints = gpComplaints.filter(
          c => c.status?.toUpperCase() === 'RESOLVED'
        ).length;
        const disposedComplaints = gpComplaints.filter(
          c => (c.status?.toUpperCase() === 'CLOSED' || c.status?.toUpperCase() === 'DISPOSED')
        ).length;

        // Calculate average resolution time
        const resolutionTimes = gpComplaints
          .filter(c => c.created_at && c.resolved_at)
          .map(c => {
            const createdDate = new Date(c.created_at);
            const resolvedDate = new Date(c.resolved_at);
            return Math.ceil((resolvedDate - createdDate) / (1000 * 60 * 60 * 24));
          });

        const avgResolution = resolutionTimes.length > 0
          ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
          : 'N/A';

        // Calculate closed percentage
        const closedPercent = totalComplaints > 0
          ? ((disposedComplaints / totalComplaints) * 100).toFixed(1)
          : 0;

        // Determine status
        const status = parseFloat(closedPercent) > 50
          ? 'Star Performer'
          : 'Under Performer';

        return {
          id: gp.id,
          name: gp.name,
          totalComplaints,
          openComplaints,
          verifiedComplaints,
          resolvedComplaints,
          disposedComplaints,
          avgResolution,
          closedPercent,
          status,
          complaints: gpComplaints // Include all complaints for this GP
        };
      });

      // Sort by total complaints (highest first)
      enrichedGPs.sort((a, b) => b.totalComplaints - a.totalComplaints);

      setGpsSummaryData(enrichedGPs);
      setSelectedBlockForGPs(block);  // Store full block object with totalComplaints
      setViewingGPsForBlock(true);
      console.log('📊 GP summary data set:', enrichedGPs.length, 'GPs with matched complaints');
      console.log('🔄 ===== END GPs API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== GPs API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END GPs API ERROR =====\n');

      setGpsSummaryError(error.message || 'Failed to fetch GPs data');
      setGpsSummaryData([]);
    } finally {
      setLoadingGpsSummary(false);
    }
  }, [allComplaintsData]);

  // Fetch analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== COMPLAINTS ANALYTICS API CALL =====');
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
      let level = 'DISTRICT'; // Default for State scope
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks') {
        level = 'VILLAGE';
      } else if (activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);
      console.log('📊 Level:', level);

      // Add geography IDs based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
        console.log('🏙️  District ID:', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
        console.log('🏘️  Block ID:', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
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

      console.log('✅ Complaints Analytics API Response:', {
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
      console.log('🔄 ===== END COMPLAINTS ANALYTICS API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== COMPLAINTS ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END COMPLAINTS ANALYTICS API ERROR =====\n');

      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered:', {
      activeScope,
      districtsLength: districts.length,
      selectedDistrictId,
      selectedBlockId,
      selectedGPId,
      startDate,
      endDate,
      isCustomRange
    });

    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      console.log('⏸️ Custom selected without dates – skipping API until Apply');
      setAnalyticsError('Select start and end dates, then click Apply');
      setAnalyticsData(null);
      return;
    }

    // For State scope, we can call API immediately (no need to wait for districts)
    if (activeScope === 'State') {
      console.log('📡 Calling API for State scope');
      fetchAnalyticsData();
      fetchComplaintsData();
      return;
    }

    // For other scopes, check if we have the necessary location data loaded
    if (activeScope === 'Districts' && !selectedDistrictId) {
      console.log('⏳ Waiting for district selection');
      return; // Wait for district selection
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      console.log('⏳ Waiting for block selection');
      return; // Wait for block selection
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      console.log('⏳ Waiting for GP selection');
      return; // Wait for GP selection
    }

    console.log('📡 Calling API for other scopes');
    fetchAnalyticsData();
    fetchComplaintsData();
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, isCustomRange, districts, blocks, gramPanchayats, fetchComplaintsData]);

  // Date range functions
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

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

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      let start = new Date();

      switch (range.value) {
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'week':
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          start = new Date(now.setDate(diff));
          break;
        case 'today':
          start = now;
          break;
        default:
          start = now;
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
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

  // Get dynamic complaint metrics from API data
  const getComplaintMetrics = () => {
    const counts = calculateComplaintCounts();

    return [
      {
        title: 'Total Complaints',
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
              height: 60,
              sparkline: { enabled: false },
              toolbar: { show: false },
              zoom: { enabled: false }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#6b7280'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#9ca3af']
            },
            tooltip: { enabled: false },
            grid: {
              show: false,
              padding: {
                top: -10,
                right: 0,
                bottom: -10,
                left: 0
              }
            },
            xaxis: {
              labels: { show: false },
              axisBorder: { show: false },
              axisTicks: { show: false },
              crosshairs: { show: false }
            },
            yaxis: {
              show: false,
              labels: { show: false },
              min: counts.total * 0.7,
              max: counts.total * 1.1,
              forceNiceScale: false,
              floating: false
            },
            dataLabels: { enabled: false },
            markers: { size: 0 },
            legend: { show: false }
          }
        }
      },
      {
        title: 'Open Complaints',
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
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
              }
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: {
              labels: { show: false },
              min: 0,
              max: counts.open * 1.1
            },
            dataLabels: { enabled: false }
          }
        }
      }, {
        title: 'Resolved',
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
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
              }
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: {
              labels: { show: false },
              min: 0,
              max: counts.resolved * 1.1
            },
            dataLabels: { enabled: false }
          }
        }
      },
      {
        title: 'Verified',
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
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
              }
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: {
              labels: { show: false },
              min: 0,
              max: counts.verified * 1.1
            },
            dataLabels: { enabled: false }
          }
        }
      },

      {
        title: 'Disposed',
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
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
              }
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: {
              labels: { show: false },
              min: 0,
              max: counts.disposed * 1.1
            },
            dataLabels: { enabled: false }
          }
        }
      }
    ];
  };

  const complaintMetrics = getComplaintMetrics();

  // Use dynamic complaints data from API, or empty array if loading/error
  // CSV Export Function
  const exportToCSV = () => {
    try {
      // Use filtered complaints so the export respects current filters and search
      const dataToExport = filteredComplaints;

      if (dataToExport.length === 0) {
        alert('No complaints to export');
        return;
      }

      // Define CSV headers
      const headers = [
        'Complaint ID',
        'User/Mobile',
        'Type of Complaint',
        'Description',
        'Location (GP)',
        'Village',
        'Block',
        'District',
        'Date of Complaint',
        'Status',
        'Assigned To',
        'Priority',
        'Latitude',
        'Longitude'
      ];

      // Convert data to CSV rows
      const csvRows = dataToExport.map(complaint => [
        complaint.id || 'N/A',
        complaint.submittedBy || 'N/A',
        complaint.title || 'N/A',
        (complaint.description || 'No description').replace(/"/g, '""'), // Escape quotes
        complaint.location || 'N/A',
        complaint.village || 'N/A',
        complaint.block || 'N/A',
        complaint.district || 'N/A',
        complaint.submittedDate || 'N/A',
        complaint.statusDisplay || complaint.status || 'N/A',
        complaint.assignedTo || 'Unassigned',
        complaint.priority || 'Medium',
        complaint.lat || 'N/A',
        complaint.long || 'N/A'
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Generate filename with current date and filter
      const date = new Date().toISOString().split('T')[0];
      const filterText = activeFilter ? `_${activeFilter}` : '';
      const filename = `complaints_export${filterText}_${date}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Exported ${dataToExport.length} complaints to ${filename}`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Deduplicate complaints by ID to avoid duplicate keys
  const uniqueComplaintsMap = new Map();
  complaintsListData.forEach((complaint, idx) => {
    const complaintId = complaint.id;
    if (!uniqueComplaintsMap.has(complaintId)) {
      uniqueComplaintsMap.set(complaintId, { ...complaint, _originalIndex: idx });
    }
  });
  const uniqueComplaintsList = Array.from(uniqueComplaintsMap.values());

  // Helper function to get status color
  const getStatusColor = (status) => {
    const s = status?.toUpperCase() || 'OPEN';
    switch (s) {
      case 'OPEN':
        return '#ef4444';
      case 'VERIFIED':
        return '#f97316';
      case 'RESOLVED':
        return '#8b5cf6';
      case 'CLOSED':
      case 'DISPOSED':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const complaintsData = uniqueComplaintsList.map((complaint, idx) => {
    const status = complaint.status || 'OPEN';
    const statusColor = getStatusColor(status);

    return {
      id: `COMP-${complaint.id}`,
      title: complaint.complaint_type || 'N/A',
      description: complaint.description || 'No description',
      status,
      priority: 'Medium', // API doesn't provide priority, using default
      location: complaint.location || `${complaint.village_name}, ${complaint.block_name}`,
      submittedBy: complaint.mobile_number || 'N/A',
      submittedDate: complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      assignedTo: complaint.assigned_worker || 'Unassigned',
      statusColor,
      village: complaint.village_name,
      block: complaint.block_name,
      district: complaint.district_name,
      lat: complaint.lat,
      long: complaint.long,
      media: complaint.media_urls || [],
      comments: complaint.comments || []
    };
  });


  const getStatusIcon = (status) => {
    // Handle both old format ("Open") and new API format ("OPEN", "VERIFIED")
    const normalizedStatus = status?.toUpperCase();

    switch (normalizedStatus) {
      case 'OPEN':
        return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'VERIFIED':
      case 'IN PROGRESS':
        return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'RESOLVED':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />;
      case 'CLOSED':
      case 'DISPOSED':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      default:
        return <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // Normalize the active filter once
  const normalizedFilterStatus = activeFilter?.trim().toUpperCase() || null;

  const filteredComplaints = complaintsData.filter(complaint => {
    // Match status directly (case-insensitive)
    const matchesFilter = normalizedFilterStatus
      ? (complaint.status?.toUpperCase() === normalizedFilterStatus)
      : true; // if no filter selected, show all

    const q = searchTerm?.toLowerCase() || '';
    const matchesSearch =
      complaint.title.toLowerCase().includes(q) ||
      complaint.description.toLowerCase().includes(q) ||
      complaint.id.toLowerCase().includes(q) ||
      (complaint.location || '').toLowerCase().includes(q) ||
      (complaint.submittedBy || '').toLowerCase().includes(q) ||
      (complaint.submittedDate || '').toLowerCase().includes(q) ||
      (complaint.status || '').toLowerCase().includes(q) ||
      (complaint.assignedTo || '').toLowerCase().includes(q) ||
      (complaint.village || '').toLowerCase().includes(q) ||
      (complaint.block || '').toLowerCase().includes(q) ||
      (complaint.district || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Debug logging with detailed filter analysis
  const sampleRawStatuses = complaintsListData.slice(0, 5).map(c => c.status);
  console.log('🔍 Complaints Data Debug:', {
    rawDataLength: complaintsListData.length,
    transformedDataLength: complaintsData.length,
    loadingComplaints,
    complaintsError,
    sampleRawStatusesFromAPI: sampleRawStatuses,
    sampleTransformed: complaintsData.slice(0, 3).map(c => ({
      id: c.id,
      status: c.status
    })),
    filteredComplaintsLength: filteredComplaints.length,
    activeFilter,
    normalizedFilterStatus,
    searchTerm,
    uniqueStatuses: [...new Set(complaintsData.map(c => c.status))],
    filterBreakdown: {
      open: complaintsData.filter(c => c.status?.toUpperCase() === 'OPEN').length,
      verified: complaintsData.filter(c => c.status?.toUpperCase() === 'VERIFIED').length,
      resolved: complaintsData.filter(c => c.status?.toUpperCase() === 'RESOLVED').length,
      closed: complaintsData.filter(c => c.status?.toUpperCase() === 'CLOSED').length
    },
    filteredByStatus: normalizedFilterStatus ? filteredComplaints.length : 'N/A (showing all)'
  });

  const activeHierarchyDistrict = selectedDistrictForHierarchy ||
    (selectedDistrictId ? districts.find(d => d.id === selectedDistrictId) : null);

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
      fetchBlocks(district.id);
    } else if (activeScope === 'GPs') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
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

  useEffect(() => {
    if ((activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId) {
      fetchBlocks(selectedDistrictId);
    }
  }, [activeScope, selectedDistrictId, fetchBlocks]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId && selectedBlockId) {
      fetchGramPanchayats(selectedDistrictId, selectedBlockId);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, fetchGramPanchayats]);

  // Fetch district summary data whenever complaints data changes
  useEffect(() => {
    fetchDistrictSummaryData();
  }, [fetchDistrictSummaryData]);

  // Fetch all complaints data on component mount
  useEffect(() => {
    fetchAllComplaintsData();
  }, [fetchAllComplaintsData]);

  return (
    <div>
      

      {/* Overview Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '6px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Overview Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
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
              Overview
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              • {getDateDisplayText()}
            </span>
          </div>
          <div
            onClick={handleCalendarClick}
            data-date-dropdown
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>{getDateDisplayText()}</span>
            <ChevronDown style={{ width: '16px', height: '16px' }} />

            {/* Modern Date Range Picker */}
            {showDateDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px',
                  width: '600px',
                  maxWidth: '90vw',
                  display: 'flex',
                  overflow: 'hidden'
                }}
              >
                {/* Left Sidebar - Predefined Ranges */}
                <div style={{
                  width: '200px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1px solid #e2e8f0',
                  padding: '16px 0'
                }}>
                  <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Quick Select
                    </h3>
                  </div>

                  {dateRanges.map((range, index) => (
                    <div
                      key={range.value}
                      onClick={() => handleDateRangeSelection(range)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: range.value === 'custom' ? '#10b981' : '#475569',
                        backgroundColor: selectedDateRange === range.label ? '#f0fdf4' : 'transparent',
                        borderLeft: selectedDateRange === range.label ? '3px solid #10b981' : '3px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {range.label}
                    </div>
                  ))}
                </div>

                {/* Right Side - Calendar View */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  minHeight: '300px'
                }}>
                  {isCustomRange ? (
                    <div>
                      <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        Select Date Range
                      </h3>

                      {/* Custom Date Inputs */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#64748b',
                            marginBottom: '4px'
                          }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate || ''}
                            onKeyDown={handleDateKeyDown}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#64748b',
                            marginBottom: '4px'
                          }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate || ''}
                            onKeyDown={handleDateKeyDown}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            setStartDate(todayStr);
                            setEndDate(todayStr);
                            setIsCustomRange(false);
                            setSelectedDateRange('Today');
                          }}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() => setShowDateDropdown(false)}
                          disabled={!startDate || !endDate}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: startDate && endDate ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: startDate && endDate ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        Selected Range
                      </h3>

                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                          {selectedDateRange}
                        </div>
                        {startDate && endDate && (
                          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setShowDateDropdown(false)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {analyticsError && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            Error loading analytics data: {analyticsError}
          </div>
        )}

        {/* Metrics Cards */}
        <div style={{
          display: 'flex',
          gap: '48px',
          width: '100%',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap'
        }}>
          {complaintMetrics.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              style={{
                flex: '0 1 17%',
                maxWidth: '250px',
                backgroundColor: 'white',
                padding: '18px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '220px',
                overflow: 'hidden'
              }}
            >
              {/* Info icon */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px'
              }}>
                <InfoTooltip
                  text={item.tooltipText}
                  size={16}
                />
              </div>

              {/* Card content */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: item.color
                }}></div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '16px'
              }}>
                {item.value}
              </div>

              {/* Chart */}
              <div style={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'flex-end',
                width: '100%',
                paddingRight: '16px',
                paddingBottom: '12px',
                boxSizing: 'border-box'
              }}>
                <div style={{ width: '100%' }}>
                  <Chart
                    options={item.chartData.options}
                    series={item.chartData.series}
                    type="area"
                    height={80}
                    width="100%"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District Summary Table Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Complaints
            </h2>
            {viewingGPsForBlock && !viewingGPComplaints && (
              <span style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {selectedBlockForGPs?.name}
              </span>
            )}
            {viewingGPComplaints && (
              <span style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {selectedBlockForGPs?.name} / {selectedGPForComplaints?.name}
              </span>
            )}
            {viewingBlocksForDistrict && !viewingGPsForBlock && (
              <span style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {selectedDistrictForBlocks?.name}
              </span>
            )}
          </div>
          {viewingGPComplaints && (
            <button
              onClick={() => {
                setSelectedGPForComplaints(null);
                setViewingGPComplaints(false);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              ← Back to GPs
            </button>
          )}
          {viewingGPsForBlock && !viewingGPComplaints && (
            <button
              onClick={() => {
                setViewingGPsForBlock(false);
                setSelectedBlockForGPs(null);
                setGpsSummaryData([]);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              ← Back to Blocks
            </button>
          )}
          {viewingBlocksForDistrict && !viewingGPsForBlock && (
            <button
              onClick={() => {
                setViewingBlocksForDistrict(false);
                setSelectedDistrictForBlocks(null);
                setBlocksSummaryData([]);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              ← Back to Districts
            </button>
          )}
        </div>

        {/* District Table or GP Complaints Table */}
        <div style={{
          overflowX: 'auto',
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10
            }}>
              <tr style={{
                borderBottom: '2px solid #e5e7eb'
              }}>
                {viewingGPComplaints ? (
                  <>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Complaint ID
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Complaint Type
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Created Date
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Resolved Date
                    </th>
                  </>
                ) : (
                  <>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {viewingGPsForBlock ? `GP Name (${gpsSummaryData.length})` : viewingBlocksForDistrict ? `Block Name (${blocksSummaryData.length})` : `District Name (${districtSummaryData.length})`}
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Open Complaints ({viewingGPsForBlock ? selectedBlockForGPs?.totalComplaints || 0 : viewingBlocksForDistrict ? selectedDistrictForBlocks?.totalComplaints || 0 : allComplaintsData.length})
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Avg. Resolution (Days)
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Complaints Closed %
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody key={viewingGPComplaints ? 'complaints-view' : 'summary-view'}>
              {viewingGPComplaints ? (
                // Individual complaints view for a GP
                selectedGPForComplaints?.complaints && selectedGPForComplaints.complaints.length > 0 ? (
                  selectedGPForComplaints.complaints.map((complaint) => (
                    <tr key={complaint.id} style={{
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {complaint.id}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {complaint.complaint_type || 'N/A'}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: complaint.status?.toUpperCase() === 'OPEN'
                            ? '#fef2f2'
                            : complaint.status?.toUpperCase() === 'RESOLVED'
                              ? '#f0fdf4'
                              : complaint.status?.toUpperCase() === 'VERIFIED'
                                ? '#fef3c7'
                                : '#f3f4f6',
                          color: complaint.status?.toUpperCase() === 'OPEN'
                            ? '#ef4444'
                            : complaint.status?.toUpperCase() === 'RESOLVED'
                              ? '#10b981'
                              : complaint.status?.toUpperCase() === 'VERIFIED'
                                ? '#f59e0b'
                                : '#6b7280',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {complaint.status || 'N/A'}
                        </div>
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {complaint.created_at
                          ? new Date(complaint.created_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {complaint.resolved_at
                          ? new Date(complaint.resolved_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      No complaints found for this GP
                    </td>
                  </tr>
                )
              ) : (
                // Summary table view
                (viewingGPsForBlock ? loadingGpsSummary : viewingBlocksForDistrict ? loadingBlocksSummary : loadingDistrictSummary) ? (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      Loading {viewingGPsForBlock ? 'GP' : viewingBlocksForDistrict ? 'block' : 'district'} data...
                    </td>
                  </tr>
                ) : (() => {
                  const dataToDisplay = viewingGPsForBlock ? gpsSummaryData : viewingBlocksForDistrict ? blocksSummaryData : districtSummaryData;
                  const isEmpty = dataToDisplay.length === 0;

                  return isEmpty ? (
                    <tr>
                      <td colSpan="5" style={{
                        padding: '40px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        No {viewingGPsForBlock ? 'GP' : viewingBlocksForDistrict ? 'block' : 'district'} data available
                      </td>
                    </tr>
                  ) : (
                    dataToDisplay.map((item) => (
                      <tr key={item.id} style={{
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          <div>
                            <div
                              onClick={() => {
                                if (viewingGPsForBlock) {
                                  // GPs are now clickable - show their individual complaints
                                  setSelectedGPForComplaints(item);
                                  setViewingGPComplaints(true);
                                } else if (viewingBlocksForDistrict) {
                                  // Clicking on block to view GPs
                                  fetchGPsSummaryData(item);
                                } else {
                                  // Clicking on district to view blocks
                                  fetchBlocksSummaryData(item);
                                }
                              }}
                              style={{
                                cursor: 'pointer',
                                color: '#0866c6',
                                textDecoration: 'none',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.color = '#0550a3';
                                e.target.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = '#0866c6';
                                e.target.style.textDecoration = 'none';
                              }}
                            >
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              marginTop: '4px'
                            }}>
                              Total Complaints: {item.totalComplaints}
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {item.openComplaints}
                          </div>
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {item.avgResolution === 'N/A' ? (
                            <span style={{ color: '#9ca3af' }}>N/A</span>
                          ) : (
                            <span>{item.avgResolution}</span>
                          )}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: parseFloat(item.closedPercent) >= 75
                              ? '#f0fdf4'
                              : parseFloat(item.closedPercent) >= 50
                                ? '#fef3c7'
                                : '#fef2f2',
                            color: parseFloat(item.closedPercent) >= 75
                              ? '#10b981'
                              : parseFloat(item.closedPercent) >= 50
                                ? '#f59e0b'
                                : '#ef4444',
                            padding: '6px 12px',
                            borderRadius: '12px'
                          }}>
                            {item.closedPercent}%
                          </div>
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '14px'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: item.status === 'Star Performer'
                              ? '#f0fdf4'
                              : '#fef2f2',
                            color: item.status === 'Star Performer'
                              ? '#10b981'
                              : '#ef4444',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {item.status}
                          </div>
                        </td>
                      </tr>
                    ))
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaints Table Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Complaints
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {getDateDisplayText()}
            </span>

            {/* Status Filter */}
            <div
              data-filter-dropdown
              style={{
                position: 'relative',
                minWidth: '140px'
              }}
            >
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                <span>{activeFilter}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '4px'
                }}>
                  {filterButtons.map((filter) => (
                    <div
                      key={filter}
                      onClick={() => {
                        console.log('🎯 Filter clicked:', filter);
                        setActiveFilter(filter);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        backgroundColor: activeFilter === filter ? '#f3f4f6' : 'transparent',
                        borderBottom: filter !== filterButtons[filterButtons.length - 1] ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      {filter}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Search Bar */}
            <div style={{
              position: 'relative',
              width: '200px'
            }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />

            </button>

            {/* Add Complaint Button */}
            <button
              onClick={() => {
                setShowComplaintModal(true);
                fetchComplaintCategories();
                fetchDistricts();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add complaint
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        <div style={{
          overflowX: 'auto',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10
            }}>
              <tr style={{
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  User
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  District
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Address(GP)
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Type of complaint
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Date of complaint
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Status
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
              </tr>
            </thead>
            <tbody key={`complaints-${activeFilter}-${filteredComplaints.length}`}>
              {loadingComplaints ? (
                <tr>
                  <td colSpan="6" style={{
                    padding: '40px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Loading complaints...
                  </td>
                </tr>
              ) : (complaintsError || filteredComplaints.length === 0) ? (
                <tr>
                  <td colSpan="6" style={{ padding: 0 }}>
                    <NoDataFound size="small" />
                  </td>
                </tr>
              ) : (() => {
                console.log('📊 Rendering table with', filteredComplaints.length, 'complaints. Active filter:', activeFilter, 'Sample statuses:', filteredComplaints.slice(0, 3).map(c => ({ id: c.id, status: c.statusDisplay })));
                return filteredComplaints.map((complaint, index) => (
                  <tr key={complaint.id || `complaint-${index}`} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          marginBottom: '2px'
                        }}>
                          {complaint.submittedBy || 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {complaint.submittedBy || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.district || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.location || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.title || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.submittedDate || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '90%'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: complaint.statusColor === '#ef4444' ? '#fef2f2' :
                            complaint.statusColor === '#f97316' ? '#fff7ed' :
                              complaint.statusColor === '#8b5cf6' ? '#faf5ff' : '#f0fdf4',
                          color: complaint.statusColor,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }} title={complaint.status || 'N/A'}>
                          {complaint.statusDisplay || complaint.status || 'N/A'}
                        </div>
                        <button
                          onClick={() => handleOpenNoticeModal(complaint)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          Send notice
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Scroll Indicator */}
        {filteredComplaints.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <span>
              {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''} total
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>Scroll to see all</span>
              <div style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ↕
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raise Complaint Modal */}
      {showComplaintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowComplaintModal(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Raise Complaint
              </h2>
              <button
                onClick={() => setShowComplaintModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Complaint Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Select Type of Complaint
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={complaintForm.complaintTypeId}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, complaintTypeId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    backgroundColor: 'white',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select option</option>
                  {complaintCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Details */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Details
              </label>
              <textarea
                value={complaintForm.details}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setComplaintForm(prev => ({ ...prev, details: value }));
                  }
                }}
                placeholder="Details"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {complaintForm.details.length}/100
              </div>
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={complaintForm.phone_number}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Phone number"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </div>

            {/* District and Block */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* District */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  District
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={complaintForm.districtId}
                    onChange={(e) => {
                      const districtId = e.target.value;
                      setComplaintForm(prev => ({
                        ...prev,
                        districtId,
                        blockId: '',
                        gpId: '',
                        village: ''
                      }));
                      if (districtId) {
                        fetchBlocks(districtId);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: 'white',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Block */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Block
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={complaintForm.blockId}
                    onChange={(e) => {
                      const blockId = e.target.value;
                      setComplaintForm(prev => ({
                        ...prev,
                        blockId,
                        gpId: '',
                        village: ''
                      }));
                      if (blockId && complaintForm.districtId) {
                        fetchGramPanchayats(complaintForm.districtId, blockId);
                      }
                    }}
                    disabled={!complaintForm.districtId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: complaintForm.districtId ? '#374151' : '#9ca3af',
                      backgroundColor: complaintForm.districtId ? 'white' : '#f9fafb',
                      appearance: 'none',
                      cursor: complaintForm.districtId ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select Block</option>
                    {blocks.filter(b => b.district_id === parseInt(complaintForm.districtId)).map(block => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
            </div>

            {/* Gram Panchayat */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Gram Panchayat
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={complaintForm.gpId}
                  onChange={(e) => {
                    const gpId = e.target.value;
                    setComplaintForm(prev => ({
                      ...prev,
                      gpId,
                      village: ''
                    }));
                    if (gpId) {
                      fetchVillages(gpId);
                    }
                  }}
                  disabled={!complaintForm.blockId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: complaintForm.blockId ? '#374151' : '#9ca3af',
                    backgroundColor: complaintForm.blockId ? 'white' : '#f9fafb',
                    appearance: 'none',
                    cursor: complaintForm.blockId ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">Select Gram Panchayat</option>
                  {gramPanchayats.filter(gp => gp.block_id === parseInt(complaintForm.blockId)).map(gp => (
                    <option key={gp.id} value={gp.id}>
                      {gp.name}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Village and Ward/Area */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Village */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Village
                </label>
                <input
                  type="text"
                  value={complaintForm.village}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, village: e.target.value }))}
                  placeholder="Enter Village"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                />
              </div>

              {/* Ward/Area */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Ward/Area
                </label>
                <input
                  type="text"
                  value={complaintForm.wardArea}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, wardArea: e.target.value }))}
                  placeholder="Enter Ward/Area"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setShowComplaintModal(false);
                  setComplaintForm({
                    complaintTypeId: '',
                    details: '',
                    phone_number: '',
                    districtId: '',
                    blockId: '',
                    gpId: '',
                    village: '',
                    wardArea: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSubmittingComplaint(true);

                    const location = [complaintForm.village, complaintForm.wardArea].filter(Boolean).join(', ');
                    const params = {
                      phone_number: complaintForm.phone_number,
                      description: complaintForm.details,
                      complaint_type_id: complaintForm.complaintTypeId,
                      gp_id: complaintForm.gpId,
                      location
                    };
                    const body = new URLSearchParams(params).toString();

                    await apiClient.post('/complaints/smd/complaints', body, {
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    setComplaintForm({
                      complaintTypeId: '',
                      details: '',
                      phone_number: '',
                      districtId: '',
                      blockId: '',
                      gpId: '',
                      village: '',
                      wardArea: ''
                    });
                    setShowComplaintModal(false);
                    setShowSuccessDialog(true);
                    fetchComplaintsData();
                  } catch (error) {
                    console.error('Error submitting complaint:', error);
                    alert('Failed to submit complaint. Please try again.');
                  } finally {
                    setSubmittingComplaint(false);
                  }
                }}
                disabled={submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? 'not-allowed' : 'pointer',
                  opacity: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? 0.6 : 1
                }}
              >
                {submittingComplaint ? 'Submitting...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuccessDialog(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Star Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Star style={{
                width: '48px',
                height: '48px',
                color: '#f97316',
                fill: '#f97316'
              }} />
            </div>

            {/* Success Message */}
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '24px',
              lineHeight: '1.4'
            }}>
              Your Complaint has been
              <br />
              submitted successfully
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessDialog(false)}
              style={{
                padding: '12px 32px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '200px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notice Location Modal */}
      {showNoticeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNoticeModal(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Notice Location
                </h2>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User style={{ width: '18px', height: '18px', color: '#6b7280' }} />
                </div>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
            </div>

            {/* To: Recipient */}
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151'
            }}>
              <strong>To:</strong> {noticeForm.to}
            </div>

            {/* Subject Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Subject
              </label>
              <input
                type="text"
                value={noticeForm.subject}
                onChange={(e) => setNoticeForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter scheme"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </div>

            {/* Category Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Category
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={noticeForm.categoryId}
                  onChange={(e) => {
                    const selectedCategory = noticeCategories.find(cat => cat.id.toString() === e.target.value);
                    setNoticeForm(prev => ({
                      ...prev,
                      categoryId: e.target.value,
                      categoryName: selectedCategory ? selectedCategory.name : ''
                    }));
                  }}
                  disabled={loadingNoticeCategories || noticeCategories.length === 0}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: loadingNoticeCategories || noticeCategories.length === 0 ? '#9ca3af' : '#374151',
                    backgroundColor: loadingNoticeCategories || noticeCategories.length === 0 ? '#f9fafb' : 'white',
                    appearance: 'none',
                    cursor: loadingNoticeCategories || noticeCategories.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {loadingNoticeCategories ? 'Loading categories...' : 'Select'}
                  </option>
                  {noticeCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} />
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '8px'
              }}>
                <User style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </div>
            </div>

            {/* Details Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Details
              </label>
              <textarea
                value={noticeForm.details}
                onChange={(e) => setNoticeForm(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Enter notice details"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  minHeight: '150px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowNoticeModal(false);
                  setNoticeForm({
                    to: '',
                    subject: '',
                    categoryId: '',
                    categoryName: '',
                    details: ''
                  });
                  setSelectedComplaintForNotice(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSendingNotice(true);

                    // Get current user info (authority giving notice)
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const senderName = currentUser.name || currentUser.username || 'System Admin';

                    // Create notice payload
                    const noticeData = {
                      recipient: noticeForm.to,
                      title: noticeForm.subject,
                      notice_type_id: parseInt(noticeForm.categoryId),
                      text: noticeForm.details,
                      module: 'Complaints',
                      complaint_id: selectedComplaintForNotice?.id,
                      sender_name: senderName,
                      recipient_name: noticeForm.to,
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toTimeString().split(' ')[0]
                    };

                    await noticesAPI.createNotice(noticeData);

                    // Close modal and reset form
                    setShowNoticeModal(false);
                    setNoticeForm({
                      to: '',
                      subject: '',
                      categoryId: '',
                      categoryName: '',
                      details: ''
                    });
                    setSelectedComplaintForNotice(null);

                    // Show success message
                    alert('Notice sent successfully!');
                  } catch (error) {
                    console.error('Error sending notice:', error);
                    alert('Failed to send notice. Please try again.');
                  } finally {
                    setSendingNotice(false);
                  }
                }}
                disabled={!noticeForm.to || !noticeForm.subject || !noticeForm.categoryId || !noticeForm.details || sendingNotice || loadingNoticeCategories}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!noticeForm.to || !noticeForm.subject || !noticeForm.categoryId || !noticeForm.details || sendingNotice || loadingNoticeCategories) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!noticeForm.to || !noticeForm.subject || !noticeForm.categoryId || !noticeForm.details || sendingNotice || loadingNoticeCategories) ? 'not-allowed' : 'pointer',
                  opacity: (!noticeForm.to || !noticeForm.subject || !noticeForm.categoryId || !noticeForm.details || sendingNotice || loadingNoticeCategories) ? 0.6 : 1
                }}
              >
                {sendingNotice ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsContent;