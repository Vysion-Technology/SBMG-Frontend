import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';

const BDOLocationContext = createContext();

export const useBDOLocation = () => {
  const context = useContext(BDOLocationContext);
  if (!context) {
    // Return null instead of throwing to allow conditional usage in Header
    return null;
  }
  return context;
};

export const BDOLocationProvider = ({ children }) => {
  const { user } = useAuth();

  // BDO's district ID and block ID from /me API (constant for BDO)
  const [bdoDistrictId, setBdoDistrictId] = useState(null);
  const [bdoDistrictName, setBdoDistrictName] = useState(null);
  const [bdoBlockId, setBdoBlockId] = useState(null);
  const [bdoBlockName, setBdoBlockName] = useState(null);
  const [loadingBDOData, setLoadingBDOData] = useState(true);

  // Global state for location selection (BDO can only select GPs within their block)
  const [activeScope, setActiveScope] = useState('GPs'); // Default to GPs for BDO

  const enforceBlockScope = useCallback((scope) => {
    if (scope === 'Districts' || scope === 'State') {
      return 'GPs';
    }
    return scope || 'GPs';
  }, []);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // Hierarchical selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState(null); // Will be set from BDO data
  const [selectedBlockId, setSelectedBlockId] = useState(null); // Will be set from BDO data
  const [selectedGPId, setSelectedGPId] = useState(null);

  // Hierarchical dropdown state (BDO only sees GP level)
  const [dropdownLevel, setDropdownLevel] = useState('gps'); // Start with gps for BDO
  const [selectedGPForHierarchy, setSelectedGPForHierarchy] = useState(null);

  // Breadcrumb dropdown UI state - persists across module switches
  const [openBreadcrumbDropdown, setOpenBreadcrumbDropdown] = useState(null);
  const [breadcrumbDistricts, setBreadcrumbDistricts] = useState([]);
  const [breadcrumbBlocks, setBreadcrumbBlocks] = useState([]);
  const [breadcrumbGps, setBreadcrumbGps] = useState([]);
  const [loadingBreadcrumb, setLoadingBreadcrumb] = useState(false);

  // Change tracking state
  const [changeHistory, setChangeHistory] = useState([]);
  const [lastChange, setLastChange] = useState(null);


  // Get BDO district and block data directly from user object (from /me API)

  useEffect(() => {
    const fetchDistrictAndBlockName = async () => {
      if (user?.district_id && user?.block_id) {
        try {
          const districtId = user.district_id;
          const blockId = user.block_id;

          // ✅ Fetch districts
          const districtRes = await apiClient.get(`/geography/districts?skip=0&limit=100`);
          const districts = districtRes.data?.items || districtRes.data || [];
          const matchedDistrict = districts.find(d => d.id === districtId);
          const districtName = matchedDistrict?.name || null;

          // ✅ Fetch blocks
          const blockRes = await apiClient.get(`/geography/blocks?skip=0&limit=100`);
          const blocks = blockRes.data?.items || blockRes.data || [];
          const matchedBlock = blocks.find(b => b.id === blockId);
          const blockName = matchedBlock?.name || null;

          // ✅ Set everything
          setBdoDistrictId(districtId);
          setBdoDistrictName(districtName);
          setSelectedDistrictId(districtId);

          setBdoBlockId(blockId);
          setBdoBlockName(blockName);
          setSelectedBlockId(blockId);

          // Default location for BDO
          setSelectedLocation('Select GP');

          console.log("✅ BDO District & Block mapped:", {
            districtName,
            blockName
          });

        } catch (error) {
          console.error("❌ District/Block mapping failed:", error);
        } finally {
          setLoadingBDOData(false);
        }
      }
    };

    fetchDistrictAndBlockName();
  }, [user]);


  // Update location selection with change tracking
  const updateLocationSelection = useCallback((scope, location, locationId, districtId = null, blockId = null, gpId = null, changeType = 'selection') => {
    const safeScope = enforceBlockScope(scope);
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType,
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: safeScope,
        location,
        locationId,
        districtId: districtId || bdoDistrictId, // Always use BDO's district
        blockId: blockId || bdoBlockId, // Always use BDO's block
        gpId
      }
    };

    // Update state (always maintain BDO's district and block)
    setActiveScope(safeScope);
    setSelectedLocation(location);
    setSelectedLocationId(locationId);
    setSelectedDistrictId(districtId || bdoDistrictId); // Ensure we always have BDO's district
    setSelectedBlockId(blockId || bdoBlockId); // Ensure we always have BDO's block
    setSelectedGPId(gpId);
    setSelectedGPForHierarchy(gpId ? { id: gpId, name: location } : null);

    // Track the change
    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);

    // Log the change
    console.log(`🔄 BDO Location Change (${changeType}):`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, bdoDistrictId, bdoBlockId]);

  // Track tab changes specifically
  const trackTabChange = useCallback((newScope) => {
    const safeScope = enforceBlockScope(newScope);
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'tab_change',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: safeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: bdoDistrictId, // Always maintain BDO's district
        blockId: bdoBlockId, // Always maintain BDO's block
        gpId: selectedGPId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`📋 BDO Tab Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, bdoDistrictId, bdoBlockId]);




  // Track dropdown changes specifically
  const trackDropdownChange = useCallback((location, locationId, districtId = null, blockId = null, gpId = null) => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'dropdown_change',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: activeScope,
        location,
        locationId,
        districtId: bdoDistrictId, // Always use BDO's district
        blockId: bdoBlockId, // Always use BDO's block
        gpId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔽 BDO Dropdown Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, bdoDistrictId, bdoBlockId]);

  // Reset location selection (for BDO, reset to GPs view of their block)
  const resetLocationSelection = useCallback(() => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'reset',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: 'GPs',
        location: bdoBlockName,
        locationId: bdoBlockId,
        districtId: bdoDistrictId,
        blockId: bdoBlockId,
        gpId: null
      }
    };

    setActiveScope('GPs');
    setSelectedLocation(bdoBlockName);
    setSelectedLocationId(bdoBlockId);
    setSelectedDistrictId(bdoDistrictId);
    setSelectedBlockId(bdoBlockId);
    setSelectedGPId(null);
    setDropdownLevel('gps');
    setSelectedGPForHierarchy(null);

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔄 BDO Reset Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, bdoDistrictId, bdoDistrictName, bdoBlockId, bdoBlockName]);

  // Get current location info
  const getCurrentLocationInfo = useCallback(() => {
    return {
      scope: activeScope,
      location: selectedLocation,
      locationId: selectedLocationId,
      districtId: bdoDistrictId, // Always BDO's district
      blockId: bdoBlockId, // Always BDO's block
      gpId: selectedGPId,
      districtName: bdoDistrictName,
      blockName: bdoBlockName,
      gpName: selectedGPForHierarchy?.name || null,
      bdoDistrictId, // Expose BDO's district explicitly
      bdoDistrictName,
      bdoBlockId, // Expose BDO's block explicitly
      bdoBlockName
    };
  }, [activeScope, selectedLocation, selectedLocationId, bdoDistrictId, bdoBlockId, selectedGPId, bdoDistrictName, bdoBlockName, selectedGPForHierarchy]);

  // Get change history
  const getChangeHistory = useCallback(() => {
    return changeHistory;
  }, [changeHistory]);

  // Get last change
  const getLastChange = useCallback(() => {
    return lastChange;
  }, [lastChange]);

  // Clear change history
  const clearChangeHistory = useCallback(() => {
    setChangeHistory([]);
    setLastChange(null);
    console.log('🧹 BDO Change history cleared');
  }, []);

  const value = useMemo(() => ({
    // State
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId: bdoDistrictId, // Always BDO's district
    selectedBlockId: bdoBlockId, // Always BDO's block
    selectedGPId,
    dropdownLevel,
    selectedGPForHierarchy,
    // Breadcrumb dropdown state
    openBreadcrumbDropdown,
    breadcrumbDistricts,
    breadcrumbBlocks,
    breadcrumbGps,
    loadingBreadcrumb,
    changeHistory,
    lastChange,
    bdoDistrictId, // BDO-specific
    bdoDistrictName, // BDO-specific
    bdoBlockId, // BDO-specific
    bdoBlockName, // BDO-specific
    loadingBDOData, // BDO-specific

    // Setters
    setActiveScope: (scope) => setActiveScope(enforceBlockScope(scope)),
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedGPForHierarchy,
    // Breadcrumb dropdown setters
    setOpenBreadcrumbDropdown,
    setBreadcrumbDistricts,
    setBreadcrumbBlocks,
    setBreadcrumbGps,
    setLoadingBreadcrumb,

    // Actions
    updateLocationSelection,
    resetLocationSelection,
    getCurrentLocationInfo,

    // Change tracking
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange,
    clearChangeHistory
  }), [
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedGPId,
    dropdownLevel,
    selectedGPForHierarchy,
    openBreadcrumbDropdown,
    breadcrumbDistricts,
    breadcrumbBlocks,
    breadcrumbGps,
    loadingBreadcrumb,
    changeHistory,
    lastChange,
    bdoDistrictId,
    bdoDistrictName,
    bdoBlockId,
    bdoBlockName,
    loadingBDOData,
    updateLocationSelection,
    resetLocationSelection,
    getCurrentLocationInfo,
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange,
    clearChangeHistory
  ]);

  return (
    <BDOLocationContext.Provider value={value}>
      {children}
    </BDOLocationContext.Provider>
  );
};

