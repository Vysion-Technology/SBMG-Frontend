import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    // Return null instead of throwing to allow conditional usage in Header
    return null;
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  // Global state for location selection
  const [activeScope, setActiveScope] = useState('State');
  const [selectedLocation, setSelectedLocation] = useState('Rajasthan');
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // Hierarchical selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedGPId, setSelectedGPId] = useState(null);

  // Hierarchical dropdown state
  const [dropdownLevel, setDropdownLevel] = useState('districts');
  const [selectedDistrictForHierarchy, setSelectedDistrictForHierarchy] = useState(null);
  const [selectedBlockForHierarchy, setSelectedBlockForHierarchy] = useState(null);

  // Breadcrumb dropdown UI state - persists across module switches
  const [openBreadcrumbDropdown, setOpenBreadcrumbDropdown] = useState(null);
  const [breadcrumbDistricts, setBreadcrumbDistricts] = useState([]);
  const [breadcrumbBlocks, setBreadcrumbBlocks] = useState([]);
  const [breadcrumbGps, setBreadcrumbGps] = useState([]);
  const [loadingBreadcrumb, setLoadingBreadcrumb] = useState(false);

  // Change tracking state
  const [changeHistory, setChangeHistory] = useState([]);
  const [lastChange, setLastChange] = useState(null);

  // Update location selection with change tracking
  const updateLocationSelection = (scope, location, locationId, districtId = null, blockId = null, gpId = null, changeType = 'selection') => {
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
        scope,
        location,
        locationId,
        districtId,
        blockId,
        gpId
      }
    };

    // Update state
    setActiveScope(scope);
    setSelectedLocation(location);
    setSelectedLocationId(locationId);
    setSelectedDistrictId(districtId);
    setSelectedBlockId(blockId);
    setSelectedGPId(gpId);

    // Track the change
    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);

    // Log the change
    console.log(`🔄 Location Change (${changeType}):`, changeData);
  };

  // Track tab changes specifically
  const trackTabChange = (newScope) => {
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
        scope: newScope,
        location: selectedLocation, // Keep same for now, will be updated by caller
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`📋 Tab Change:`, changeData);
  };

  // Track dropdown changes specifically
  const trackDropdownChange = (location, locationId, districtId = null, blockId = null, gpId = null) => {
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
        districtId,
        blockId,
        gpId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔽 Dropdown Change:`, changeData);
  };

  // Reset location selection
  const resetLocationSelection = () => {
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
        scope: 'State',
        location: 'Rajasthan',
        locationId: null,
        districtId: null,
        blockId: null,
        gpId: null
      }
    };

    setActiveScope('State');
    setSelectedLocation('Rajasthan');
    setSelectedLocationId(null);
    setSelectedDistrictId(null);
    setSelectedBlockId(null);
    setSelectedGPId(null);
    setDropdownLevel('districts');
    setSelectedDistrictForHierarchy(null);
    setSelectedBlockForHierarchy(null);

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔄 Reset Change:`, changeData);
  };

  // Get current location info
  const getCurrentLocationInfo = () => {
    return {
      scope: activeScope,
      location: selectedLocation,
      locationId: selectedLocationId,
      districtId: selectedDistrictId,
      blockId: selectedBlockId,
      gpId: selectedGPId,
      districtName: selectedDistrictForHierarchy?.name || null,
      blockName: selectedBlockForHierarchy?.name || null
    };
  };

  // Get change history
  const getChangeHistory = () => {
    return changeHistory;
  };

  // Get last change
  const getLastChange = () => {
    return lastChange;
  };

  // Clear change history
  const clearChangeHistory = () => {
    setChangeHistory([]);
    setLastChange(null);
    console.log('🧹 Change history cleared');
  };

  const value = {
    // State
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    dropdownLevel,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    // Breadcrumb dropdown state
    openBreadcrumbDropdown,
    breadcrumbDistricts,
    breadcrumbBlocks,
    breadcrumbGps,
    loadingBreadcrumb,
    changeHistory,
    lastChange,

    // Setters
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
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
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
