import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import EditGPMasterModal from '../EditGPMasterModal';

const VDOVillageMasterContent = () => {
  // Refs to prevent duplicate API calls
  const hasFetchedInitialData = useRef(false);

  // VDO: Location context - fixed district, block, and GP
  const {
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    getLocationPath,
  } = useVDOLocation();

  // VDO: Always works at villages level (no geo tabs)
  const activeScope = 'GPs';
  const selectedLocation = vdoGPName || 'Village';
  const selectedLocationId = vdoGPId;
  const selectedGPId = vdoGPId;
  const selectedDistrictId = vdoDistrictId;
  const selectedBlockId = vdoBlockId;
  const selectedDistrictForHierarchy = vdoDistrictId ? { id: vdoDistrictId, name: vdoDistrictName } : null;
  const selectedBlockForHierarchy = vdoBlockId ? { id: vdoBlockId, name: vdoBlockName } : null;
  const selectedGPForHierarchy = vdoGPId ? { id: vdoGPId, name: vdoGPName } : null;
  const dropdownLevel = 'villages';

  // No-op functions for VDO
  const setActiveScope = () => { };
  const setSelectedLocation = () => { };
  const setSelectedLocationId = () => { };
  const setSelectedGPId = () => { };
  const setDropdownLevel = () => { };
  const setSelectedGPForHierarchy = () => { };
  const setSelectedDistrictForHierarchy = () => { };
  const setSelectedBlockForHierarchy = () => { };
  const setSelectedDistrictId = () => { };
  const setSelectedBlockId = () => { };
  const contextUpdateLocationSelection = undefined;
  const contextTrackTabChange = undefined;
  const contextTrackDropdownChange = undefined;
  const contextGetCurrentLocationInfo = () => ({ vdoDistrictId, vdoBlockId, vdoGPId, vdoDistrictName, vdoBlockName, vdoGPName });

  // UI controls state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Existing state
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePerformance, setActivePerformance] = useState('Time');


  // Year / FY state for master data (current and previous years)
  const [fyList, setFyList] = useState([]);
  const [selectedFyId, setSelectedFyId] = useState(null);
  const [loadingFy, setLoadingFy] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // GP Report: surveys for selected GP + FY, and edit modal
  const [gpSurveyList, setGpSurveyList] = useState([]);
  const [loadingGpSurvey, setLoadingGpSurvey] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSurveyId, setEditSurveyId] = useState(null);

  const scopeButtons = ['GPs']; // BDO can only view GPs
  const performanceButtons = ['Time', 'Location'];


  // Helper functions for location management
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

  const updateLocationSelection = useCallback((scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    if (typeof contextUpdateLocationSelection === 'function') {
      contextUpdateLocationSelection(scope, location, locationId, districtId, blockId, gpId, changeType);
    }
  }, [contextUpdateLocationSelection]);

  // Handler for downloading PDF with master data
  const handleDownloadPDF = useCallback(async (surveyId = 1) => {
    try {
      console.log('📥 Downloading PDF for survey ID:', surveyId);

      // Fetch annual survey data
      const response = await apiClient.get(`/annual-surveys/${surveyId}`);
      const surveyData = response.data;

      console.log('✅ Survey data fetched:', surveyData);

      // Generate PDF
      generatePDF(surveyData);

    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }, []);

  // Function to generate PDF from survey data
  const generatePDF = (data) => {
    // Create a formatted HTML content for the PDF
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Annual Survey Report - ${data.gp_name || 'GP'}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                    h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                    .section { margin-bottom: 20px; }
                    .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
                    .label { font-weight: bold; color: #6b7280; }
                    .value { color: #111827; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                    th { background-color: #f9fafb; font-weight: 600; color: #374151; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Annual Survey Report</h1>
                    <p class="date">Survey Date: ${data.survey_date || 'N/A'}</p>
                </div>

                <div class="section">
                    <h2>Basic Information</h2>
                    <div class="info-grid">
                        <div class="label">GP Name:</div>
                        <div class="value">${data.gp_name || 'N/A'}</div>
                        <div class="label">Block Name:</div>
                        <div class="value">${data.block_name || 'N/A'}</div>
                        <div class="label">District Name:</div>
                        <div class="value">${data.district_name || 'N/A'}</div>
                        <div class="label">Sarpanch Name:</div>
                        <div class="value">${data.sarpanch_name || 'N/A'}</div>
                        <div class="label">Sarpanch Contact:</div>
                        <div class="value">${data.sarpanch_contact || 'N/A'}</div>
                        <div class="label">Number of Ward Panchs:</div>
                        <div class="value">${data.num_ward_panchs || 0}</div>
                    </div>
                </div>

                ${data.vdo ? `
                <div class="section">
                    <h2>VDO Details</h2>
                    <div class="info-grid">
                        <div class="label">Name:</div>
                        <div class="value">${data.vdo.first_name} ${data.vdo.middle_name || ''} ${data.vdo.last_name}</div>
                        <div class="label">Username:</div>
                        <div class="value">${data.vdo.username || 'N/A'}</div>
                        <div class="label">Email:</div>
                        <div class="value">${data.vdo.email || 'N/A'}</div>
                        <div class="label">Date of Joining:</div>
                        <div class="value">${data.vdo.date_of_joining || 'N/A'}</div>
                        <div class="label">Role:</div>
                        <div class="value">${data.vdo.role_name || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.work_order ? `
                <div class="section">
                    <h2>Work Order</h2>
                    <div class="info-grid">
                        <div class="label">Work Order No:</div>
                        <div class="value">${data.work_order.work_order_no || 'N/A'}</div>
                        <div class="label">Date:</div>
                        <div class="value">${data.work_order.work_order_date || 'N/A'}</div>
                        <div class="label">Amount:</div>
                        <div class="value">₹${data.work_order.work_order_amount?.toLocaleString() || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.fund_sanctioned ? `
                <div class="section">
                    <h2>Fund Sanctioned</h2>
                    <div class="info-grid">
                        <div class="label">Head:</div>
                        <div class="value">${data.fund_sanctioned.head || 'N/A'}</div>
                        <div class="label">Amount:</div>
                        <div class="value">₹${data.fund_sanctioned.amount?.toLocaleString() || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.door_to_door_collection ? `
                <div class="section">
                    <h2>Door to Door Collection</h2>
                    <div class="info-grid">
                        <div class="label">Number of Households:</div>
                        <div class="value">${data.door_to_door_collection.num_households || 0}</div>
                        <div class="label">Number of Shops:</div>
                        <div class="value">${data.door_to_door_collection.num_shops || 0}</div>
                        <div class="label">Collection Frequency:</div>
                        <div class="value">${data.door_to_door_collection.collection_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.road_sweeping ? `
                <div class="section">
                    <h2>Road Sweeping</h2>
                    <div class="info-grid">
                        <div class="label">Width:</div>
                        <div class="value">${data.road_sweeping.width || 0} m</div>
                        <div class="label">Length:</div>
                        <div class="value">${data.road_sweeping.length || 0} m</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.road_sweeping.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.drain_cleaning ? `
                <div class="section">
                    <h2>Drain Cleaning</h2>
                    <div class="info-grid">
                        <div class="label">Length:</div>
                        <div class="value">${data.drain_cleaning.length || 0} m</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.drain_cleaning.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.csc_details ? `
                <div class="section">
                    <h2>CSC Details</h2>
                    <div class="info-grid">
                        <div class="label">Numbers:</div>
                        <div class="value">${data.csc_details.numbers || 0}</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.csc_details.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.swm_assets ? `
                <div class="section">
                    <h2>SWM Assets</h2>
                    <div class="info-grid">
                        <div class="label">RRC:</div>
                        <div class="value">${data.swm_assets.rrc || 0}</div>
                        <div class="label">PWMU:</div>
                        <div class="value">${data.swm_assets.pwmu || 0}</div>
                        <div class="label">Compost Pit:</div>
                        <div class="value">${data.swm_assets.compost_pit || 0}</div>
                        <div class="label">Collection Vehicle:</div>
                        <div class="value">${data.swm_assets.collection_vehicle || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.sbmg_targets ? `
                <div class="section">
                    <h2>SBMG Targets</h2>
                    <div class="info-grid">
                        <div class="label">IHHL:</div>
                        <div class="value">${data.sbmg_targets.ihhl || 0}</div>
                        <div class="label">CSC:</div>
                        <div class="value">${data.sbmg_targets.csc || 0}</div>
                        <div class="label">RRC:</div>
                        <div class="value">${data.sbmg_targets.rrc || 0}</div>
                        <div class="label">PWMU:</div>
                        <div class="value">${data.sbmg_targets.pwmu || 0}</div>
                        <div class="label">Soak Pit:</div>
                        <div class="value">${data.sbmg_targets.soak_pit || 0}</div>
                        <div class="label">Magic Pit:</div>
                        <div class="value">${data.sbmg_targets.magic_pit || 0}</div>
                        <div class="label">Leach Pit:</div>
                        <div class="value">${data.sbmg_targets.leach_pit || 0}</div>
                        <div class="label">WSP:</div>
                        <div class="value">${data.sbmg_targets.wsp || 0}</div>
                        <div class="label">DEWATS:</div>
                        <div class="value">${data.sbmg_targets.dewats || 0}</div>
                    </div>
                </div>
                ` : ''}

                <div class="section">
                    <p class="date">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      printWindow.print();

      // Close the window after printing (optional)
      // printWindow.onafterprint = () => printWindow.close();
    };
  };

  // Handler for downloading annual surveys by district as PDF (District Wise Coverage table)
  const handleDownloadAnnualSurveys = useCallback(async (item) => {
    const districtId = item.district_id ?? (activeScope === 'State' ? item.geography_id : (selectedDistrictId || selectedDistrictForHierarchy?.id));
    if (!districtId) {
      alert('District information not available for download.');
      return;
    }
    try {
      setDownloadingId(item.geography_id);
      const response = await apiClient.get(`/annual-surveys/?skip=0&limit=100&district_id=${districtId}`);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? raw?.results ?? []);
      const title = `Annual Surveys — ${item.geography_name || 'District ' + districtId}`;
      const filename = `annual-surveys-${(item.geography_name || 'data').replace(/\s+/g, '-')}-district-${districtId}.pdf`;
      generateAnnualSurveysPDF(list, title, filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }, [activeScope, selectedDistrictId, selectedDistrictForHierarchy]);

  // BDO: Districts are not fetched - district is fixed from /me API
  const fetchDistricts = () => {
    // No-op for CEO - district ID comes from /me API (vdoDistrictId)
    console.log('BDO: Skipping fetchDistricts - using vdoDistrictId:', vdoDistrictId);
  };

  // Fetch blocks from API for a specific district
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

  // Fetch gram panchayats from API for a specific district & block
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

  // Fetch FYs (years) for master data from /annual-surveys/fy/active
  // Response: [{"id":1,"fy":"2025-26","active":true}, ...]
  const fetchFyList = async () => {
    try {
      setLoadingFy(true);
      const res = await apiClient.get('/annual-surveys/fy/active');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
      const list = raw.filter((x) => x && (x.id != null) && (x.fy != null));
      const sorted = [...list].sort((a, b) => String(b.fy || '').localeCompare(String(a.fy || '')));
      setFyList(sorted);
    } catch (error) {
      console.error('❌ Error fetching FY list from /annual-surveys/fy/active:', error);
      setFyList([]);
    } finally {
      setLoadingFy(false);
    }
  };

  // Fetch annual surveys for the selected GP and FY (for Report table and Edit)
  const fetchGpSurveys = useCallback(async () => {
    if (activeScope !== 'GPs' || !selectedGPId || !selectedFyId) {
      setGpSurveyList([]);
      return;
    }
    try {
      setLoadingGpSurvey(true);
      const res = await annualSurveysAPI.listSurveys({ gp_id: selectedGPId, fy_id: selectedFyId, limit: 10 });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.items ?? []);
      const list = (raw || []).filter((x) => x && x.id != null);
      const filtered = list.filter((x) =>
        (x.gp_id == null || Number(x.gp_id) === Number(selectedGPId)) &&
        (x.fy_id == null || Number(x.fy_id) === Number(selectedFyId))
      );
      setGpSurveyList(filtered.length > 0 ? filtered : list);
    } catch (err) {
      console.error('Error fetching GP surveys:', err);
      setGpSurveyList([]);
    } finally {
      setLoadingGpSurvey(false);
    }
  }, [activeScope, selectedGPId, selectedFyId]);

  // Fetch analytics data (state or district level)
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        selectedFyId
      });

      const fyId = selectedFyId;

      if (!fyId) {
        console.log('⚠️ No year selected, skipping analytics call');
        setAnalyticsError('No year selected');
        return;
      }

      let url = '';

      // Build URL based on active scope
      if (activeScope === 'State') {
        url = `/annual-surveys/analytics/state?fy_id=${fyId}`;
        console.log('🏛️ Calling STATE analytics API');
      } else if (activeScope === 'Districts' && selectedDistrictId) {
        url = `/annual-surveys/analytics/district/${selectedDistrictId}?fy_id=${fyId}`;
        console.log('🏙️ Calling DISTRICT analytics API');
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        url = `/annual-surveys/analytics/block/${selectedBlockId}?fy_id=${fyId}`;
        console.log('🏘️ Calling BLOCK analytics API');
      } else if (activeScope === 'GPs' && selectedGPId) {
        url = `/annual-surveys/analytics/gp/${selectedGPId}?fy_id=${fyId}`;
        console.log('🏡 Calling GP analytics API');
      } else {
        console.log('⏸️ Waiting for location selection or FY data');
        return;
      }

      console.log('🌐 Analytics API URL:', url);
      console.log('📅 FY ID:', fyId);

      const response = await apiClient.get(url);

      console.log('✅ Analytics API Response:', {
        status: response.status,
        data: response.data
      });

      // Log annual_overview specifically
      if (response.data) {
        console.log('📊 Annual Overview Data:', response.data.annual_overview);
        console.log('📈 Scheme Data:', response.data.scheme_wise_target_achievement);
      }

      setAnalyticsData(response.data);
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
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedFyId]);


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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-location-dropdown]')) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch districts and active FY data immediately when component loads
  useEffect(() => {
    if (hasFetchedInitialData.current) {
      console.log('⏸️ Initial data already fetched, skipping...');
      return;
    }
    console.log('🔄 Fetching initial data (FY list)...');
    hasFetchedInitialData.current = true;
    fetchFyList();
  }, []);

  // Set default selected year when fyList loads or selection becomes invalid
  useEffect(() => {
    if (fyList.length > 0 && (selectedFyId == null || !fyList.some((f) => f.id === selectedFyId))) {
      setSelectedFyId(fyList[0].id);
    }
  }, [fyList, selectedFyId]);

  // Fetch analytics data when scope, location, or selected year changes
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered:', {
      activeScope,
      selectedDistrictId,
      selectedBlockId,
      selectedGPId,
      selectedFyId,
      loadingAnalytics
    });

    if (activeScope === 'State' && selectedFyId) {
      console.log('📡 Calling state analytics API');
      fetchAnalytics();
    } else if (activeScope === 'GPs' && selectedGPId && selectedFyId) {
      console.log('📡 Calling GP analytics API');
      fetchAnalytics();
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedFyId, fetchAnalytics]);

  // Fetch GP surveys when in GP scope with selected GP and FY
  useEffect(() => {
    if (activeScope === 'GPs' && selectedGPId && selectedFyId) {
      fetchGpSurveys();
    } else {
      setGpSurveyList([]);
    }
  }, [activeScope, selectedGPId, selectedFyId, fetchGpSurveys]);

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Helper function to get analytics data with defaults
  const getAnalyticsValue = (key, defaultValue = 0) => {
    if (!analyticsData) return defaultValue;
    const value = analyticsData[key];
    return value !== null && value !== undefined ? value : defaultValue;
  };

  console.log('VillageMasterContent rendering...');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      {/* Header Section */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* VDO: Title and Year dropdown - no geo tabs or location selection */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            GP Master Data
          </h1>
        </div>
      </div>

      {/* Location Indicator - VDO fixed location, no generic "District DISTRICT" / "Block" / "Village" */}
      <div style={{ padding: '10px 0px 0px 16px' }}>
        <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
          {getLocationPath ? getLocationPath() : 'Rajasthan'}
        </span>
      </div>

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
          </div>
          {/* Year dropdown - view previous years' master data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#9ca3af', flexShrink: 0 }} />
            <select
              aria-label="Select year"
              value={selectedFyId ?? ''}
              onChange={(e) => setSelectedFyId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingFy || fyList.length === 0}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '5px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                color: fyList.length === 0 ? '#9ca3af' : '#374151',
                backgroundColor: loadingFy || fyList.length === 0 ? '#f9fafb' : 'white',
                cursor: loadingFy || fyList.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingFy ? (
                <option value="">Loading...</option>
              ) : fyList.length === 0 ? (
                <option value="">No years</option>
              ) : (
                fyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fy}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeScope === 'GPs' ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: '16px'
        }}>
          {/* Total funds sanctioned */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total funds sanctioned
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_FUNDS_SANCTIONED" size={16} color="#6b7280" />
                <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_funds_sanctioned', 0))}
            </div>
          </div>

          {/* Total work order Amount */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total work order Amount
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_WORK_ORDER_AMOUNT" size={16} color="#6b7280" />
                <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_work_order_amount', 0))}
            </div>
          </div>

          {/* SBMG Target Achievement Rate */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                SBMG Target Achievement Rate
              </h3>
              <InfoTooltip tooltipKey="SBMG_TARGET_ACHIEVEMENT_RATE" size={16} color="#6b7280" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : `${getAnalyticsValue('sbmg_target_achievement_rate', 0)}%`}
            </div>
          </div>
        </div>

        {/* SBMG Target vs Achievement and Annual Overview Section */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px'
        }}>
          <divider />

          {/* Annual Overview */}
          <div style={{
            flex: activeScope === 'GPs' ? 'none' : 1,
            width: activeScope === 'GPs' ? '100%' : 'auto',
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '2px'
            }}>
              Annual Overview
            </h3>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            <divider />

            {/* Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Fund Utilization rate */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>Fund Utilization rate</span>
                  <InfoTooltip tooltipKey="FUND_UTILIZATION_RATE" size={14} color="#6b7280" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.fund_utilization_rate !== undefined && analyticsData?.annual_overview?.fund_utilization_rate !== null ? `${analyticsData.annual_overview.fund_utilization_rate}%` : analyticsData?.fund_utilization_rate !== undefined && analyticsData?.fund_utilization_rate !== null ? `${analyticsData.fund_utilization_rate}%` : '0%')}
                </span>
              </div>

              {/* Average Cost Per Household */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>Average Cost Per Household(D2D)</span>
                  <InfoTooltip tooltipKey="AVERAGE_COST_PER_HOUSEHOLD_D2D" size={14} color="#6b7280" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.average_cost_per_household_d2d !== undefined && analyticsData?.annual_overview?.average_cost_per_household_d2d !== null ? `₹${formatNumber(analyticsData.annual_overview.average_cost_per_household_d2d)}` : '₹0')}
                </span>
              </div>

              {/* Active Sanitation Bidders - Hidden in GP view */}
              {activeScope !== 'GPs' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#6b7280' }}>Active Sanitation Bidders</span>
                    <InfoTooltip tooltipKey="ACTIVE_SANITATION_BIDDERS" size={14} color="#6b7280" />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.active_sanitation_bidders !== undefined && analyticsData?.annual_overview?.active_sanitation_bidders !== null ? formatNumber(analyticsData.annual_overview.active_sanitation_bidders) : '0')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Report Section - Only for GP view */}
      {activeScope === 'GPs' && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            Report
          </h3>

          {/* Table */}
          <div style={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 200px',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Year
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Master Data
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Action
              </div>
            </div>

            {/* Table Body */}
            {(() => {
              const survey = gpSurveyList[0];
              const fyLabel = fyList.find((f) => f.id === selectedFyId)?.fy || selectedFyId || '—';
              const hasData = !!survey;
              const masterDataLabel = loadingGpSurvey ? '...' : (hasData ? 'Available' : 'Not Available');
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 200px',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {fyLabel}
                  </div>
                  <div style={{ fontSize: '14px', color: hasData ? '#10b981' : '#6b7280', fontWeight: '600' }}>
                    {masterDataLabel}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>

                    {hasData ? (
                      <>
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setEditSurveyId(survey.id);
                            setShowEditModal(true);
                          }}
                          title="Edit GP Master Data"
                          style={{
                            padding: '6px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit style={{ width: '16px', height: '16px', color: '#374151' }} />
                        </button>

                        {/* DOWNLOAD BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(survey.id)}
                          title="Download PDF"
                          style={{
                            padding: '6px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Download style={{ width: '16px', height: '16px', color: '#374151' }} />
                        </button>
                      </>
                    ) : (
                      /* ADD BUTTON */
                      <button
                        onClick={() => {
                          setEditSurveyId(null); // IMPORTANT
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        + Add GP Master Data
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit GP Master Data modal */}
      <EditGPMasterModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditSurveyId(null); }}
        surveyId={editSurveyId}
        gpName={selectedLocation}
        onSuccess={() => { fetchGpSurveys(); fetchAnalytics(); }}
        vdoGPId={vdoGPId}
        fy_id={selectedFyId}

      />
    </div>
  );
};

export default VDOVillageMasterContent;