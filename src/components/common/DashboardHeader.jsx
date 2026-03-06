import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';

const DashboardHeader = ({ title = "Overview", rightContent = null }) => {
  const {
    activeScope,
    selectedLocation,
    selectedDistrictId,
    selectedBlockId,
    activeHierarchyDistrict,
    activeHierarchyBlock,
    setActiveScope,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection,
  } = useLocation();

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);
  const dropdownRef = useRef(null);

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];

  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) return setBlocks([]);
    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks', { params: { district_id: districtId, skip: 0, limit: 100 } });
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) return setGramPanchayats([]);
    try {
      setLoadingGPs(true);
      const response = await apiClient.get('/geography/grampanchayats', { params: { district_id: districtId, block_id: blockId, skip: 0, limit: 100 } });
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('Error fetching GPs:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId) {
      fetchBlocks(selectedDistrictId);
    }
  }, [activeScope, selectedDistrictId, fetchBlocks]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId && selectedBlockId) {
      fetchGramPanchayats(selectedDistrictId, selectedBlockId);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, fetchGramPanchayats]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScopeChange = (scope) => {
    setActiveScope(scope);
    setShowLocationDropdown(false);
    
    if (scope === 'State') {
      setDropdownLevel('state');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('State', 'Rajasthan', 'state', null, null, null, 'tab_change');
    } else if (scope === 'Districts') {
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('Districts', 'Select District', 'all_districts', null, null, null, 'tab_change');
    } else if (scope === 'Blocks') {
      setDropdownLevel('blocks');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('Blocks', 'Select Block', 'all_blocks', null, null, null, 'tab_change');
    } else if (scope === 'GPs') {
      setDropdownLevel('gps');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('GPs', 'Select GP', 'all_gps', null, null, null, 'tab_change');
    }
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrictForHierarchy(district);
    if (activeScope === 'Districts') {
      updateLocationSelection('Districts', district.name, district.id, district.id, null, null, 'dropdown_select');
      setShowLocationDropdown(false);
    } else {
      fetchBlocks(district.id);
    }
  };

  const handleBlockClick = (block) => {
    setSelectedBlockForHierarchy(block);
    if (activeScope === 'Blocks') {
      updateLocationSelection('Blocks', block.name, block.id, activeHierarchyDistrict.id, block.id, null, 'dropdown_select');
      setShowLocationDropdown(false);
    } else {
      fetchGramPanchayats(activeHierarchyDistrict.id, block.id);
    }
  };

  const handleGPClick = (gp) => {
    updateLocationSelection('GPs', gp.name, gp.id, activeHierarchyDistrict.id, activeHierarchyBlock.id, gp.id, 'dropdown_select');
    setShowLocationDropdown(false);
  };

  const getMenuItemStyles = (isActive) => ({
    padding: '10px 16px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
    color: isActive ? '#111827' : '#374151',
    fontWeight: isActive ? '500' : '400',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent'
  });

  return (
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
      {/* Left side - Dashboard title */}
      <div>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#374151',
          margin: 0
        }}>
          {title}
        </h1>
      </div>

      {/* Right side - Scope buttons and Location dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Scope segmented buttons */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          padding: '4px',
          gap: '2px'
        }}>
          {scopeButtons.map((scope) => (
            <button
              key={scope}
              onClick={() => handleScopeChange(scope)}
              style={{
                padding: '3px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: activeScope === scope ? '#10b981' : 'transparent',
                color: activeScope === scope ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {scope}
            </button>
          ))}
        </div>

        {/* Location dropdown */}
        <div 
          data-location-dropdown
          ref={dropdownRef}
          style={{
            position: 'relative',
            minWidth: '200px'
          }}>
          <button 
            onClick={() => activeScope !== 'State' && setShowLocationDropdown(!showLocationDropdown)}
            disabled={activeScope === 'State'}
            style={{
              width: '100%',
              padding: '5px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              backgroundColor: activeScope === 'State' ? '#f9fafb' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: activeScope === 'State' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: activeScope === 'State' ? '#9ca3af' : '#6b7280',
              opacity: activeScope === 'State' ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              <span>{selectedLocation}</span>
            </div>
            <ChevronDown style={{ 
              width: '16px', 
              height: '16px', 
              color: activeScope === 'State' ? '#d1d5db' : '#9ca3af' 
            }} />
          </button>
          
          {/* Location Dropdown Menu */}
          {showLocationDropdown && activeScope !== 'State' && (
            <div
              key={`dropdown-${activeScope}`}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                left: 'auto',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                zIndex: 1000,
                marginTop: '6px',
                display: 'flex',
                overflow: 'hidden',
                minWidth: activeScope === 'Districts' ? '280px' : activeScope === 'Blocks' ? '520px' : '780px'
              }}
            >
              <div
                style={{
                  minWidth: '240px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  borderRight: activeScope !== 'Districts' ? '1px solid #f3f4f6' : 'none'
                }}
              >
                {loadingDistricts ? (
                  <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    Loading districts...
                  </div>
                ) : districts.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    No districts available
                  </div>
                ) : (
                  districts.map((district) => {
                    const isActiveDistrict = activeHierarchyDistrict?.id === district.id;
                    const isSelectedDistrict = activeScope === 'Districts' && selectedLocation === district.name;
                    const showArrow = activeScope === 'Blocks' || activeScope === 'GPs';
                    return (
                      <div
                        key={`district-${district.id}`}
                        onClick={() => handleDistrictClick(district)}
                        style={getMenuItemStyles(isActiveDistrict || isSelectedDistrict)}
                      >
                        <span>{district.name}</span>
                        {showArrow && (
                          <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {activeScope !== 'Districts' && (
                <div
                  style={{
                    minWidth: '240px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    borderRight: activeScope === 'GPs' ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  {loadingBlocks ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Loading blocks...
                    </div>
                  ) : !activeHierarchyDistrict ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Select a district to view blocks
                    </div>
                  ) : blocks.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      No blocks found
                    </div>
                  ) : (
                    blocks.map((block) => {
                      const isActiveBlock = activeHierarchyBlock?.id === block.id;
                      const isSelectedBlock = activeScope === 'Blocks' && selectedLocation === block.name;
                      const showArrow = activeScope === 'GPs';
                      return (
                        <div
                          key={`block-${block.id}`}
                          onClick={() => handleBlockClick(block)}
                          style={getMenuItemStyles(isActiveBlock || isSelectedBlock)}
                        >
                          <span>{block.name}</span>
                          {showArrow && (
                            <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeScope === 'GPs' && (
                <div
                  style={{
                    minWidth: '240px',
                    maxHeight: '280px',
                    overflowY: 'auto'
                  }}
                >
                  {loadingGPs ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Loading GPs...
                    </div>
                  ) : !activeHierarchyBlock ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Select a block to view GPs
                    </div>
                  ) : gramPanchayats.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      No GPs found
                    </div>
                  ) : (
                    gramPanchayats.map((gp) => {
                      const isSelectedGP = activeScope === 'GPs' && selectedLocation === gp.name;
                      return (
                        <div
                          key={`gp-${gp.id}`}
                          onClick={() => handleGPClick(gp)}
                          style={getMenuItemStyles(isSelectedGP)}
                        >
                          <span>{gp.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {rightContent}
      </div>
    </div>
  );
};

export default DashboardHeader;