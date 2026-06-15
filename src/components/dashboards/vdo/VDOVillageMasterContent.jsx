import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar, Check } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import { useAuth } from '../../../context/AuthContext';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { HINDI_FONT } from '../../../utils/font';
import EditGPMasterModal from '../common/EditGPMasterModal';
import { useTranslation } from 'react-i18next';

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

  const { user, refreshMe } = useAuth();
  const { t } = useTranslation(["common", "table", "gpMaster"])

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
  const [reconfirming, setReconfirming] = useState(false);

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
  const handleDownloadPDF = useCallback(async (surveyId = 1, action = 'download') => {
    try {
      console.log(`📥 ${action === 'download' ? 'Downloading' : 'Viewing'} PDF for survey ID:`, surveyId);

      // Fetch annual survey data
      const response = await apiClient.get(`/annual-surveys/${surveyId}`);
      const surveyData = response.data;

      console.log('✅ Survey data fetched:', surveyData);

      // Generate PDF
      generatePDF(surveyData, action);

    } catch (error) {
      console.error(`❌ Error ${action === 'download' ? 'downloading' : 'viewing'} PDF:`, error);
      alert(`Failed to ${action === 'download' ? 'download' : 'view'} PDF. Please try again.`);
    }
  }, []);

  // Function to generate PDF from survey data
  // Function to generate PDF from survey data
  const generatePDF = (data, action = 'download') => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // --- Date Formatting Helper ---
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === "N/A") return "N/A";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // 1. FONT REGISTRATION (Hindi Support ke liye)
    try {
      // Base64 ko clean kar rahe hain taaki 'atob' error na aaye
      const fontContent = HINDI_FONT.includes(",") ? HINDI_FONT.split(",")[1] : HINDI_FONT;
      const cleanFont = fontContent.replace(/\s/g, "");

      doc.addFileToVFS("HindiFont.ttf", cleanFont);
      doc.addFont("HindiFont.ttf", "HindiFont", "normal");
    } catch (error) {
      console.error("Font Load Error:", error);
    }

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) return '0';
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)} L`;
      }
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    const checkPageBreak = (neededHeight = 10) => {
      if (y + neededHeight > 275) {
        doc.addPage();
        y = 20;
      }
    };

    const secureString = (val) => (val === null || val === undefined || val === "" ? "N/A" : String(val));

    // ===== HEADER =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text("GP Master Data", pageWidth / 2, y, { align: "center" });
    y += 4;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Survey Date: ${formatDate(data.survey_date)}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // ===== Section Helper (Updated for Hindi Support) =====
    const addSection = (title, fields) => {
      checkPageBreak(25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81);
      doc.text(title, 20, y);

      y += 3;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(20, y, pageWidth - 20, y);

      y += 8;

      fields.forEach(([label, value]) => {
        const labelMaxWidth = 45;   // label ke liye width
        const valueMaxWidth = 90;   // value ke liye width

        const labelLines = doc.splitTextToSize(label, labelMaxWidth);
        const valueLines = doc.splitTextToSize(secureString(value), valueMaxWidth);

        const lineHeight = 6;
        const blockHeight = Math.max(labelLines.length, valueLines.length) * lineHeight;

        checkPageBreak(blockHeight);

        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(labelLines, 20, y);

        // Value
        doc.setFont("HindiFont", "normal");
        doc.setTextColor(17, 24, 39);
        doc.text(valueLines, 70, y);

        y += blockHeight + 2; // dynamic spacing
      });

      y += 5;
    };

    // ===== SABHI SECTIONS (Aapka Sara Data) =====

    addSection(data.gp_name || "GP Details", [
      ["GP Name:", data.gp_name],
      ["Block Name:", data.block_name],
      ["District Name:", data.district_name],

      ["Agency Name:", data.agency_name],
    ]);

    if (data.vdo) {
      addSection("VDO Details", [
        ["Name:", data.vdo_name],
        ["Contact Number:", data.vdo_contact_number],
      ]);
    }
    if (data.gp_name) {
      addSection("Sarpanch Details", [
        ["Name:", data.sarpanch_name],
        ["Contact Number:", data.sarpanch_contact],
        ["Number of Ward Panchs:", data.num_ward_panchs],
      ]);
    }


    if (data.work_order) {
      addSection("Work Order", [
        ["Dispatch No:", data.work_order.work_order_no],
        ["Date:", formatDate(data.work_order.work_order_date)],
        ["Amount:", formatCurrency(data.work_order.work_order_amount)],
      ]);
    }

    if (data.fund_sanctioned) {
      addSection("Fund Sanctioned", [
        ["Head:", data.fund_sanctioned.head],
        ["Amount:", formatCurrency(data.fund_sanctioned.amount)],
      ]);
    }

    if (data.door_to_door_collection) {
      addSection("Door to Door Collection", [
        ["Households:", data.door_to_door_collection.num_households],
        ["Shops:", data.door_to_door_collection.num_shops],
        ["Frequency:", data.door_to_door_collection.collection_frequency],
      ]);
    }

    if (data.csc_details) {
      addSection("CSC Details", [
        ["Numbers:", data.csc_details.numbers],
        ["Frequency:", data.csc_details.cleaning_frequency],
      ]);
    }


    if (data.drain_cleaning) {
      addSection("Drain Cleaning", [
        ["Length:", data.drain_cleaning.length + " m"],
        ["Frequency:", data.drain_cleaning.cleaning_frequency],
      ]);
    }

    if (data.road_sweeping) {
      addSection("Road Sweeping", [
        ["Width:", data.road_sweeping.width + " m"],
        ["Length:", data.road_sweeping.length + " m"],
        ["Frequency:", data.road_sweeping.cleaning_frequency],
      ]);
    }

    if (data.odf_sustainability) {
      addSection("ODF Sustainability", [
        ["IHHL:", data.odf_sustainability.ihhl],
        ["Community Sanitary Complex (CSC):", data.odf_sustainability.csc],
        ["Total No. of CSCs in Shala Darpan (Schools):", data.odf_sustainability.csc_shala_darpan],
      ]);
    }

    if (data.swm_assets) {
      addSection("SLWM Assets", [
        ["Segregation Bins at HH Level:", data.swm_assets.bins_hh_level],
        ["Segregation Bins at Public Places:", data.swm_assets.bins_public_places],
        ["Community Compost Pit:", data.swm_assets.community_compost_pits],
        ["Segregation Sheds(RRC):", data.swm_assets.segregation_sheds],
        ["Tricycles (Manual):", data.swm_assets.tricycles_manual],
        ["E-Rickshaws/Battery operated Vehicles:", data.swm_assets.e_rickshaws],
        ["Motorized Vehicles:", data.swm_assets.motorized_vehicles],
      ]);
    }
    if (data.lwm_assets) {
      addSection("Liquid Waste Management", [
        ["Soak/Magic/Leach pits at HH Level:", data.lwm_assets.pits_hh_level],
        ["Community Soak/Magic/Leach pits:", data.lwm_assets.community_pits],
        ["WSP (Waste Stabilization Pond):", data.lwm_assets.wsp],
        ["Dewats:", data.lwm_assets.dewats],
        ["Wetland:", data.lwm_assets.wetlands],
        ["Any Other (Trenching, Phytorids, etc.):", data.lwm_assets.other_treatments],
        ["Drainage channels (meters):", data.lwm_assets.drainage_channels],
      ]);
    }
    if (data.pwmu_details) {
      addSection("Plastic Waste Management Unit(PWMUs)", [
        ["Total No. of Established PWMU:", data.pwmu_details.established_pwmu],
        ["Total No. of Blocks Covered Under PWMU:", data.pwmu_details.blocks_covered_pwmu],
        ["Total No. of Urban MRFs:", data.pwmu_details.urban_mrfs],
        ["Total No. of Blocks Covered Under Urban MRFs:", data.pwmu_details.blocks_covered_urban_mrf],
      ]);
    }

    if (data.fsm_details) {
      addSection("Faecal Sludge Management (FSM)", [
        ["No. of twin pits Toilets:", data.fsm_details.twin_pit_toilets],
        ["No. of Single pits Toilets:", data.fsm_details.single_pit_toilets],
        ["No. of Septic tank Toilets:", data.fsm_details.septic_tank_toilets],
        ["No. of Retrofitted toilets:", data.fsm_details.retrofitted_toilets],
        ["Mechanized De-Sludging:", data.fsm_details.mechanized_desludging],
        ["No. of FSTPs Rural:", data.fsm_details.fstps_rural],
        ["No. of FSTPs Urban:", data.fsm_details.fstps_urban],
      ]);
    }
    if (data.gobardhan_projects) {
      addSection("GOBAR-dhan Project", [
        ["GOBAR-dhan Project:", data.gobardhan_projects.total_projects],
      ]);
    }

    if (data.d2d_activities) {
      addSection("Door to Door Waste Collection, Segregation & Disposal Activities", [
        ["Door to Door Service available in this gp:", data.d2d_activities.is_active ? "Yes" : "No"],
        ["Total No. of Work Sanctioned Through Tender:", data.d2d_activities.sanctioned_tender],
        ["Total No. of Work Sanctioned Self by GPs:", data.d2d_activities.sanctioned_self_gp],
        ["Total No. of Work Sanctioned Through CSR/NGOs:", data.d2d_activities.sanctioned_csr_ngo],
        ["Total No. of Work Sanctioned Through SHGs:", data.d2d_activities.sanctioned_shg],
        ["Total Expenditure Amt. (Rs in Lakhs):", data.d2d_activities.total_expenditure],
        ["Vehicles Deployed:", data.d2d_activities.vehicles_deployed],
        ["Persons Deployed:", data.d2d_activities.persons_deployed],
        ["Households Covered:", data.d2d_activities.households_covered],
        ["Work Start:", data.d2d_activities.status_start],
        ["Work Running:", data.d2d_activities.status_running],
        ["Work Completed:", data.d2d_activities.status_completed],
      ]);
    }




    // ===== Village Table (Full Hindi Support) =====
    if (data.village_data?.length) {
      checkPageBreak(30);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81);
      doc.text("Village Details", 20, y);

      y += 5;

      autoTable(doc, {
        startY: y,
        head: [[
          "Village", "Population", "Households", "IHHL", "CSC",
          "Soak Pit", "Magic pit", "Leach pit", "WSP", "DEWATS"
        ]],
        body: data.village_data.map((v) => [
          secureString(v.village_name),
          v.population,
          v.num_households,
          v.sbmg_assets?.ihhl || 0,
          v.sbmg_assets?.csc || 0,
          v.gwm_assets?.soak_pit || 0,
          v.gwm_assets?.magic_pit || 0,
          v.gwm_assets?.leach_pit || 0,
          v.gwm_assets?.leach_pit || 0, // Aapke code mein repeat tha, maine rehne diya
          v.gwm_assets?.wsp || 0,
          v.gwm_assets?.dewats || 0,
        ]),
        theme: "grid",
        styles: {
          font: "HindiFont", // Table ke andar Hindi support
          fontSize: 8
        },
        headStyles: { font: "helvetica", fontStyle: "bold" }
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // ===== Footer =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);

      const now = new Date();
      const formattedNow = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString()}`;
      doc.text(`Generated on: ${formattedNow}`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 170, 285);
    }

    if (action === 'view') {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      doc.save(`Survey-${data.gp_name}.pdf`);
    }
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

  const handleReconfirm = async (surveyId) => {
    if (reconfirming) return;

    try {
      setReconfirming(true);
      await annualSurveysAPI.reconfirmSurvey(surveyId);
      alert('GP Data reconfirmed successfully ✅');

      // Refresh user data to update gp_data_status (and hide lock/banner)
      await refreshMe();

      // Optional: refresh surveys or analytics
      fetchGpSurveys();
    } catch (error) {
      console.error('Reconfirmation failed:', error);
      alert(error.response?.data?.detail || 'Reconfirmation failed. Please try again.');
    } finally {
      setReconfirming(false);
    }
  };

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
    if (amount >= 100000) {
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
        justifyContent: 'space-between',
        position: 'sticky',
        top: '53px',
        zIndex: 999,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                {t('gpmaster:totalFundsSanctioned')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_FUNDS_SANCTIONED" size={16} color="#6b7280" />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : `₹${(getAnalyticsValue('total_funds_sanctioned', 0) * 100).toLocaleString('en-IN')} L`}
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
                 {t('gpmaster:totalWorkOrderAmount')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_WORK_ORDER_AMOUNT" size={16} color="#6b7280" />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : `₹${(getAnalyticsValue('total_work_order_amount', 0) * 100).toLocaleString('en-IN')} L`}
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
              {t('table:report')}
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
              gridTemplateColumns: '120px 1fr 280px',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>

              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                 {t('table:year')}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('table:masterData')}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                 {t('table:action')}
              </div>
            </div>

            {/* Table Body */}
            {(() => {
              const survey = gpSurveyList[0];
              const fyLabel = fyList.find((f) => f.id === selectedFyId)?.fy || selectedFyId || '—';
              const hasData = !!survey;
              const masterDataLabel = loadingGpSurvey ? '...' : (hasData ? t('table:available') : t('table:notAvailable'));

              // Check if reconfirmation is needed for this specific survey (current year)
              const isCurrentYear = fyList[0]?.id === selectedFyId;
              const needsReconfirm = isCurrentYear && hasData && user?.gp_data_status?.is_overdue;

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 280px',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {fyLabel}
                  </div>
                  <div style={{ fontSize: '14px', color: hasData ? '#10b981' : '#6b7280', fontWeight: '600' }}>
                    {masterDataLabel}
                    {needsReconfirm && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Reconfirmation Required
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>

                    {hasData ? (
                      <>
                        {/* RECONFIRM BUTTON */}
                        {(needsReconfirm || (isCurrentYear && user?.gp_data_status)) && (
                          <button
                            onClick={() => handleReconfirm(survey.id)}
                            disabled={reconfirming}
                            title="Verify & Reconfirm GP Data"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: reconfirming ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              boxShadow: needsReconfirm ? '0 0 0 2px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                          >
                            {reconfirming ? '...' : <><Check size={14} /> Reconfirm</>}
                          </button>
                        )}
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

                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(survey.id, 'view')}
                          title="View PDF"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#374151',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                           {t('table:view')}
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
