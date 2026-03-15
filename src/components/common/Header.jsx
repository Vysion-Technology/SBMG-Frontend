import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, ChevronDown, LayoutDashboard, Loader2, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCEOLocation } from '../../context/CEOLocationContext';
import { useBDOLocation } from '../../context/BDOLocationContext';
import { useVDOLocation } from '../../context/VDOLocationContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roleConfig';

const buildSubtitle = (typeLabel, meta) => {
  if (typeLabel === 'District') {
    return 'District';
  }
  if (typeLabel === 'Block') {
    const district = meta?.districtName ? `District: ${meta.districtName}` : null;
    return district ? `Block · ${district}` : 'Block';
  }
  if (typeLabel === 'Gram Panchayat') {
    const parts = [];
    if (meta?.blockName) {
      parts.push(`Block: ${meta.blockName}`);
    }
    if (meta?.districtName) {
      parts.push(`District: ${meta.districtName}`);
    }
    return parts.length > 0 ? `Gram Panchayat · ${parts.join(' · ')}` : 'Gram Panchayat';
  }
  return typeLabel;
};

const Header = ({ onMenuClick, onNotificationsClick, showLocationSearch = true, pageTitle = 'Dashboard', isMobile = false }) => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const isCEO = role === ROLES.CEO;
  const isBDO = role === ROLES.BDO;
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  // Try all contexts - one will be available based on which dashboard we're in
  const locationContextSMD = useLocation();
  const locationContextCEO = useCEOLocation();
  const locationContextBDO = useBDOLocation();
  const locationContextVDO = useVDOLocation();

  // Use whichever context is available
  const locationContext = locationContextCEO || locationContextBDO || locationContextVDO || locationContextSMD || {
    updateLocationSelection: () => { },
    setActiveScope: () => { },
    setDropdownLevel: () => { },
    setSelectedDistrictForHierarchy: () => { },
    setSelectedBlockForHierarchy: () => { }
  };

  const {
    updateLocationSelection,
    setActiveScope,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    activeScope,
    selectedLocation,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    ceoDistrictName,
    bdoDistrictName,
    bdoBlockName,
    vdoGPName
  } = locationContext || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Breadcrumb dropdown states
  const [openBreadcrumbDropdown, setOpenBreadcrumbDropdown] = useState(null);
  const [breadcrumbDistricts, setBreadcrumbDistricts] = useState([]);
  const [breadcrumbBlocks, setBreadcrumbBlocks] = useState([]);
  const [breadcrumbGps, setBreadcrumbGps] = useState([]);
  const [loadingBreadcrumb, setLoadingBreadcrumb] = useState(false);

  const searchTimeoutRef = useRef(null);
  const activeRequestRef = useRef(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const breadcrumbDropdownRef = useRef(null);
  const suggestionCache = useRef(new Map());
  const userInteractedRef = useRef(false);

  const clearSearchTimeout = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  const fetchGeographySuggestions = useCallback(async (term) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      setHighlightedIndex(-1);
      userInteractedRef.current = false;
      return;
    }

    const cacheKey = trimmedTerm.toLowerCase();
    if (suggestionCache.current.has(cacheKey)) {
      const cached = suggestionCache.current.get(cacheKey);
      setSuggestions(cached.suggestions);
      setShowSuggestions(true);
      setSearchError(cached.error);
      if (!userInteractedRef.current) {
        setHighlightedIndex(cached.suggestions.length > 0 ? 0 : -1);
      }
      setIsSearching(false);
      return;
    }

    const requestId = Date.now();
    activeRequestRef.current = requestId;

    setIsSearching(true);
    setSearchError(null);

    const commonParams = {
      params: {
        skip: 0,
        limit: 100, // Backend limit is 100
        search: trimmedTerm
      }
    };

    try {
      // CEO only searches blocks and GPs, not districts
      // BDO only searches GPs, not districts or blocks
      const searchPromises = isBDO
        ? [
          Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip districts for BDO
          Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip blocks for BDO
          apiClient.get('/geography/grampanchayats', commonParams)
        ]
        : isCEO
          ? [
            Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip districts for CEO
            apiClient.get('/geography/blocks', commonParams),
            apiClient.get('/geography/grampanchayats', commonParams)
          ]
          : [
            apiClient.get('/geography/districts', commonParams),
            apiClient.get('/geography/blocks', commonParams),
            apiClient.get('/geography/grampanchayats', commonParams)
          ];

      const [districtResult, blockResult, gpResult] = await Promise.allSettled(searchPromises);

      if (activeRequestRef.current !== requestId) {
        return;
      }

      const nextSuggestions = [];

      // Only process district results for non-CEO and non-BDO users
      if (!isCEO && !isBDO && districtResult.status === 'fulfilled' && Array.isArray(districtResult.value?.data)) {
        districtResult.value.data.forEach((district) => {
          if (!district) return;
          const name = district.name || district.district_name || district.districtName || 'Unnamed District';
          nextSuggestions.push({
            id: district.id ?? district.district_id ?? name,
            name,
            type: 'district',
            typeLabel: 'District',
            raw: district,
            meta: {
              districtId: district.id ?? district.district_id ?? null,
              districtName: name
            },
            subtitle: buildSubtitle('District', { districtName: name })
          });
        });
      } else if (districtResult.status === 'rejected') {
        console.error('Failed to fetch districts for search:', districtResult.reason);
      }

      // Only process block results for non-BDO users
      if (!isBDO && blockResult.status === 'fulfilled' && Array.isArray(blockResult.value?.data)) {
        blockResult.value.data.forEach((block) => {
          if (!block) return;
          const name = block.name || block.block_name || block.blockName || 'Unnamed Block';
          const districtName = block.district?.name || block.district_name || block.districtName || '';
          const districtId = block.district_id ?? block.district?.id ?? null;
          nextSuggestions.push({
            id: block.id ?? block.block_id ?? name,
            name,
            type: 'block',
            typeLabel: 'Block',
            raw: block,
            meta: {
              districtId,
              districtName: districtName || undefined
            },
            subtitle: buildSubtitle('Block', {
              districtName: districtName || undefined
            })
          });
        });
      } else if (blockResult.status === 'rejected') {
        console.error('Failed to fetch blocks for search:', blockResult.reason);
      }

      if (gpResult.status === 'fulfilled' && Array.isArray(gpResult.value?.data)) {
        gpResult.value.data.forEach((gp) => {
          if (!gp) return;
          const name = gp.name || gp.gp_name || gp.gpName || 'Unnamed GP';
          const blockName = gp.block?.name || gp.block_name || gp.blockName || '';
          const districtName = gp.district?.name || gp.district_name || gp.districtName || '';
          const blockId = gp.block_id ?? gp.block?.id ?? null;
          const districtId = gp.district_id ?? gp.district?.id ?? null;
          nextSuggestions.push({
            id: gp.id ?? gp.gp_id ?? name,
            name,
            type: 'gp',
            typeLabel: 'Gram Panchayat',
            raw: gp,
            meta: {
              blockId,
              blockName: blockName || undefined,
              districtId,
              districtName: districtName || undefined
            },
            subtitle: buildSubtitle('Gram Panchayat', {
              blockName: blockName || undefined,
              districtName: districtName || undefined
            })
          });
        });
      } else if (gpResult.status === 'rejected') {
        console.error('Failed to fetch gram panchayats for search:', gpResult.reason);
      }

      const filteredSuggestions = nextSuggestions.filter((suggestion) => {
        return suggestion?.name?.toLowerCase().includes(trimmedTerm.toLowerCase());
      });

      filteredSuggestions.sort((a, b) => {
        if (a.name.toLowerCase() === b.name.toLowerCase()) {
          return a.typeLabel.localeCompare(b.typeLabel);
        }
        return a.name.localeCompare(b.name);
      });

      const errorMessage = filteredSuggestions.length === 0 ? 'No matching locations found.' : null;

      suggestionCache.current.set(cacheKey, {
        suggestions: filteredSuggestions,
        error: errorMessage
      });

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setSearchError(errorMessage);
      if (!userInteractedRef.current) {
        setHighlightedIndex(filteredSuggestions.length > 0 ? 0 : -1);
      }
    } catch (error) {
      if (activeRequestRef.current !== requestId) {
        return;
      }
      console.error('Unexpected error during geography search:', error);
      const fallbackError = 'Unable to search locations right now.';
      suggestionCache.current.set(cacheKey, {
        suggestions: [],
        error: fallbackError
      });
      setSearchError(fallbackError);
      setSuggestions([]);
      setShowSuggestions(true);
      if (!userInteractedRef.current) {
        setHighlightedIndex(-1);
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, []);

  // Fetch districts for breadcrumb
  const fetchBreadcrumbDistricts = useCallback(async () => {
    setLoadingBreadcrumb(true);
    try {
      const response = await apiClient.get('/geography/districts', {
        params: { skip: 0, limit: 100 }
      });
      if (Array.isArray(response.data)) {
        const districts = response.data.map(d => ({
          id: d.id ?? d.district_id,
          name: d.name || d.district_name || 'Unnamed'
        }));
        setBreadcrumbDistricts(districts.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Failed to fetch districts for breadcrumb:', error);
      setBreadcrumbDistricts([]);
    } finally {
      setLoadingBreadcrumb(false);
    }
  }, []);

  // Fetch blocks for breadcrumb
  const fetchBreadcrumbBlocks = useCallback(async (districtId) => {
    setLoadingBreadcrumb(true);
    try {
      const response = await apiClient.get('/geography/blocks', {
        params: { skip: 0, limit: 100, district_id: districtId }
      });
      if (Array.isArray(response.data)) {
        const blocks = response.data.map(b => ({
          id: b.id ?? b.block_id,
          name: b.name || b.block_name || 'Unnamed',
          district_id: b.district_id ?? districtId
        }));
        setBreadcrumbBlocks(blocks.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Failed to fetch blocks for breadcrumb:', error);
      setBreadcrumbBlocks([]);
    } finally {
      setLoadingBreadcrumb(false);
    }
  }, []);

  // Fetch GPs for breadcrumb
  const fetchBreadcrumbGps = useCallback(async (districtId, blockId) => {
    setLoadingBreadcrumb(true);
    try {
      const params = { skip: 0, limit: 100 };
      if (blockId) params.block_id = blockId;
      if (districtId && !blockId) params.district_id = districtId;

      const response = await apiClient.get('/geography/grampanchayats', { params });
      if (Array.isArray(response.data)) {
        const gps = response.data.map(g => ({
          id: g.id ?? g.gp_id,
          name: g.name || g.gp_name || 'Unnamed',
          block_id: g.block_id ?? blockId,
          district_id: g.district_id ?? districtId
        }));
        setBreadcrumbGps(gps.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Failed to fetch GPs for breadcrumb:', error);
      setBreadcrumbGps([]);
    } finally {
      setLoadingBreadcrumb(false);
    }
  }, []);

  useEffect(() => {
    clearSearchTimeout();

    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      setHighlightedIndex(-1);
      return () => { };
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchGeographySuggestions(searchTerm);
    }, 300);

    return () => {
      clearSearchTimeout();
    };
  }, [searchTerm, fetchGeographySuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showSuggestions) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => () => clearSearchTimeout(), []);

  const resetSearchState = useCallback(() => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
    setHighlightedIndex(-1);
    userInteractedRef.current = false;
  }, []);

  const ensureDistrictObject = (suggestion) => {
    const districtId = suggestion.meta?.districtId ?? suggestion.raw?.district_id ?? suggestion.raw?.districtId ?? null;
    const districtName = suggestion.meta?.districtName || suggestion.raw?.district?.name || suggestion.raw?.district_name || suggestion.raw?.districtName || suggestion.name;
    return districtId
      ? { ...suggestion.raw?.district, id: districtId, name: districtName }
      : suggestion.raw?.district ?? (districtName ? { name: districtName } : null);
  };

  const ensureBlockObject = (suggestion) => {
    const blockId = suggestion.meta?.blockId ?? suggestion.raw?.block_id ?? suggestion.raw?.blockId ?? suggestion.id;
    const blockName = suggestion.meta?.blockName || suggestion.raw?.block?.name || suggestion.raw?.name || suggestion.name;
    const districtId = suggestion.meta?.districtId ?? suggestion.raw?.district_id ?? suggestion.raw?.districtId ?? suggestion.raw?.block?.district_id ?? null;
    return {
      ...suggestion.raw,
      id: blockId,
      name: blockName,
      district_id: districtId
    };
  };

  const handleSuggestionSelect = useCallback((suggestion) => {
    if (!suggestion) {
      return;
    }

    resetSearchState();
    userInteractedRef.current = false;

    if (inputRef.current) {
      inputRef.current.blur();
    }

    const name = suggestion.name;

    if (suggestion.type === 'district') {
      const district = suggestion.raw || { id: suggestion.id, name };
      const districtId = district.id ?? suggestion.meta?.districtId ?? suggestion.id;
      setActiveScope('Districts');
      setDropdownLevel('blocks');
      setSelectedDistrictForHierarchy({ ...district, id: districtId, name });
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('Districts', name, districtId, districtId, null, null, 'global_search');
    } else if (suggestion.type === 'block') {
      const district = ensureDistrictObject(suggestion);
      const block = ensureBlockObject(suggestion);
      const districtId = district?.id ?? suggestion.meta?.districtId ?? null;
      const blockId = block?.id ?? suggestion.id;

      setActiveScope('Blocks');
      setDropdownLevel('gps');
      setSelectedDistrictForHierarchy(district || null);
      setSelectedBlockForHierarchy(block || null);
      updateLocationSelection('Blocks', block.name || name, blockId, districtId, blockId, null, 'global_search');
    } else if (suggestion.type === 'gp') {
      const district = ensureDistrictObject(suggestion);
      const block = ensureBlockObject({
        ...suggestion,
        meta: {
          ...suggestion.meta,
          districtId: suggestion.meta?.districtId ?? district?.id ?? null
        }
      });
      const gp = suggestion.raw || { id: suggestion.id, name };
      const districtId = district?.id ?? suggestion.meta?.districtId ?? null;
      const blockId = block?.id ?? suggestion.meta?.blockId ?? null;
      const gpId = gp.id ?? suggestion.id;

      setActiveScope('GPs');
      setDropdownLevel('gps');
      setSelectedDistrictForHierarchy(district || null);
      setSelectedBlockForHierarchy(block || null);
      updateLocationSelection('GPs', gp.name || name, gpId, districtId, blockId, gpId, 'global_search');
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to scroll after global search selection:', error);
    }
  }, [ensureDistrictObject, ensureBlockObject, resetSearchState, setActiveScope, setDropdownLevel, setSelectedDistrictForHierarchy, setSelectedBlockForHierarchy, updateLocationSelection]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    setShowSuggestions(true);
    userInteractedRef.current = false;
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      userInteractedRef.current = true;
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      userInteractedRef.current = true;
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next;
      });
    } else if (event.key === 'Enter') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      userInteractedRef.current = true;
      const selected = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0];
      handleSuggestionSelect(selected);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      resetSearchState();
    }
  };

  const handleClearSearch = () => {
    resetSearchState();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // Breadcrumb dropdown handlers
  const handleDistrictDropdownOpen = () => {
    if (!isBDO) {
      setOpenBreadcrumbDropdown(openBreadcrumbDropdown === 'district' ? null : 'district');
      if (openBreadcrumbDropdown !== 'district') {
        fetchBreadcrumbDistricts();
      }
    }
  };

  const handleBlockDropdownOpen = () => {
    if (!isCEO && selectedDistrictForHierarchy) {
      setOpenBreadcrumbDropdown(openBreadcrumbDropdown === 'block' ? null : 'block');
      if (openBreadcrumbDropdown !== 'block') {
        fetchBreadcrumbBlocks(selectedDistrictForHierarchy.id);
      }
    }
  };

  const handleGpDropdownOpen = () => {
    if (selectedDistrictForHierarchy || selectedBlockForHierarchy) {
      setOpenBreadcrumbDropdown(openBreadcrumbDropdown === 'gp' ? null : 'gp');
      if (openBreadcrumbDropdown !== 'gp') {
        fetchBreadcrumbGps(selectedDistrictForHierarchy?.id, selectedBlockForHierarchy?.id);
      }
    }
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrictForHierarchy(district);
    setSelectedBlockForHierarchy(null);
    setActiveScope('Districts');
    setDropdownLevel('blocks');
    updateLocationSelection('Districts', '', district.id, district.id, null, null, 'breadcrumb');
    // Fetch blocks for the selected district
    fetchBreadcrumbBlocks(district.id);
    setOpenBreadcrumbDropdown(null);
  };

  const handleBlockSelect = (block) => {
    setSelectedBlockForHierarchy(block);
    setActiveScope('Blocks');
    setDropdownLevel('gps');
    updateLocationSelection('Blocks', '', block.id, block.district_id, block.id, null, 'breadcrumb');
    setOpenBreadcrumbDropdown(null);
  };

  const handleGpSelect = (gp) => {
    setActiveScope('GPs');
    setDropdownLevel('gps');
    updateLocationSelection('GPs', gp.name, gp.id, gp.district_id, gp.block_id, gp.id, 'breadcrumb');
    setOpenBreadcrumbDropdown(null);
  };

  const handleRajasthanClick = () => {
    setSelectedDistrictForHierarchy(null);
    setSelectedBlockForHierarchy(null);
    setActiveScope('Districts');
    setDropdownLevel('districts');
    updateLocationSelection('Districts', '', null, null, null, null, 'breadcrumb');
    setOpenBreadcrumbDropdown(null);
  };

  // Close breadcrumb dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openBreadcrumbDropdown && breadcrumbDropdownRef.current && !breadcrumbDropdownRef.current.contains(event.target)) {
        setOpenBreadcrumbDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openBreadcrumbDropdown]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  return (
    <header className="app-header"
      style={{
        width: '100%',

        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '6px 0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 35,
        paddingRight: '24px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
      {/* Left side - Dashboard icon + title + breadcrumb */}
      <div className="app-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', minWidth: 0 }}>
        <button onClick={onMenuClick} style={{
          padding: 8,
          marginLeft: 8,
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isMobile ? (
            <Menu style={{ width: 22, height: 22, color: '#6b7280' }} />
          ) : (
            <LayoutDashboard style={{ width: 22, height: 22, color: '#6b7280' }} />
          )}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            lineHeight: 1.2
          }}>
            {pageTitle}
          </h1>
          <div className="breadcrumb-text" ref={breadcrumbDropdownRef} style={{
            fontSize: 14,
            color: '#6b7280',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap'
          }}>
            {/* Rajasthan */}
            <button
              onClick={handleRajasthanClick}
              style={{
                border: 'none',
                background: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Rajasthan
            </button>

            {/* District Dropdown */}
            {!isBDO && (
              <>
                <span style={{ color: '#d1d5db' }}>{'/'}</span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleDistrictDropdownOpen}
                    style={{
                      border: 'none',
                      background: openBreadcrumbDropdown === 'district' ? '#e5e7eb' : 'none',
                      color: selectedDistrictForHierarchy?.name ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: selectedDistrictForHierarchy?.name ? 600 : 500,
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => openBreadcrumbDropdown !== 'district' && (e.target.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => openBreadcrumbDropdown !== 'district' && (e.target.style.backgroundColor = 'transparent')}
                  >
                    {selectedDistrictForHierarchy?.name || 'All'}
                    <ChevronDown style={{ width: 16, height: 16 }} />
                  </button>

                  {openBreadcrumbDropdown === 'district' && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      zIndex: 1100,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      minWidth: '200px'
                    }}>
                      {loadingBreadcrumb ? (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>Loading...</div>
                      ) : breadcrumbDistricts.length > 0 ? (
                        breadcrumbDistricts.map((district) => (
                          <button
                            key={district.id}
                            onClick={() => handleDistrictSelect(district)}
                            style={{
                              width: '100%',
                              border: 'none',
                              backgroundColor: selectedDistrictForHierarchy?.id === district.id ? '#dcfce7' : 'transparent',
                              textAlign: 'left',
                              padding: '10px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#111827',
                              fontWeight: selectedDistrictForHierarchy?.id === district.id ? 600 : 400,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = selectedDistrictForHierarchy?.id === district.id ? '#dcfce7' : '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedDistrictForHierarchy?.id === district.id ? '#dcfce7' : 'transparent'}
                          >
                            {district.name}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>No districts found</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Block Dropdown */}
            {!isCEO && selectedDistrictForHierarchy && (
              <>
                <span style={{ color: '#d1d5db' }}>{'/'}</span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleBlockDropdownOpen}
                    style={{
                      border: 'none',
                      background: openBreadcrumbDropdown === 'block' ? '#e5e7eb' : 'none',
                      color: selectedBlockForHierarchy?.name ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: selectedBlockForHierarchy?.name ? 600 : 500,
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => openBreadcrumbDropdown !== 'block' && (e.target.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => openBreadcrumbDropdown !== 'block' && (e.target.style.backgroundColor = 'transparent')}
                  >
                    {selectedBlockForHierarchy?.name || 'All'}
                    <ChevronDown style={{ width: 16, height: 16 }} />
                  </button>

                  {openBreadcrumbDropdown === 'block' && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      zIndex: 1100,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      minWidth: '200px'
                    }}>
                      {loadingBreadcrumb ? (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>Loading...</div>
                      ) : breadcrumbBlocks.length > 0 ? (
                        breadcrumbBlocks.map((block) => (
                          <button
                            key={block.id}
                            onClick={() => handleBlockSelect(block)}
                            style={{
                              width: '100%',
                              border: 'none',
                              backgroundColor: selectedBlockForHierarchy?.id === block.id ? '#dcfce7' : 'transparent',
                              textAlign: 'left',
                              padding: '10px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#111827',
                              fontWeight: selectedBlockForHierarchy?.id === block.id ? 600 : 400,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = selectedBlockForHierarchy?.id === block.id ? '#dcfce7' : '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedBlockForHierarchy?.id === block.id ? '#dcfce7' : 'transparent'}
                          >
                            {block.name}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>No blocks found</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* GP Dropdown */}
            {selectedBlockForHierarchy && (
              <>
                <span style={{ color: '#d1d5db' }}>{'/'}</span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleGpDropdownOpen}
                    style={{
                      border: 'none',
                      background: openBreadcrumbDropdown === 'gp' ? '#e5e7eb' : 'none',
                      color: selectedLocation ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: selectedLocation ? 600 : 500,
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => openBreadcrumbDropdown !== 'gp' && (e.target.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => openBreadcrumbDropdown !== 'gp' && (e.target.style.backgroundColor = 'transparent')}
                  >
                    {selectedLocation || 'All'}
                    <ChevronDown style={{ width: 16, height: 16 }} />
                  </button>

                  {openBreadcrumbDropdown === 'gp' && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      zIndex: 1100,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      minWidth: '200px'
                    }}>
                      {loadingBreadcrumb ? (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>Loading...</div>
                      ) : breadcrumbGps.length > 0 ? (
                        breadcrumbGps.map((gp) => (
                          <button
                            key={gp.id}
                            onClick={() => handleGpSelect(gp)}
                            style={{
                              width: '100%',
                              border: 'none',
                              backgroundColor: selectedLocation === gp.name ? '#dcfce7' : 'transparent',
                              textAlign: 'left',
                              padding: '10px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#111827',
                              fontWeight: selectedLocation === gp.name ? 600 : 400,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = selectedLocation === gp.name ? '#dcfce7' : '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedLocation === gp.name ? '#dcfce7' : 'transparent'}
                          >
                            {gp.name}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '12px 16px', color: '#6b7280' }}>No GPs found</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Search bar, Notifications and Profile */}
      <div className="app-header-right" style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 16
      }}>
        {/* Search bar - hidden for VDO */}
        {showLocationSearch && (
          <div ref={containerRef} className="app-header-search" style={{
            position: 'relative',
            width: 320,
            minWidth: 120
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
              ref={inputRef}
              type="text"
              value={searchTerm}
              placeholder={isBDO ? "Search GPs" : isCEO ? "Search blocks or GPs" : "Search districts, blocks, or GPs"}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-12 py-1.5 border border-gray-300 rounded-full outline-none text-sm md:text-base"
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '48px',
                paddingTop: '7px',
                paddingBottom: '7px',
                border: '1px solid #d1d5db',
                borderRadius: '28px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            {(searchTerm || isSearching || showSuggestions) && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '36px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label="Clear search"
              >
                <span style={{ fontSize: '14px' }}>×</span>
              </button>
            )}
            {isSearching && (
              <Loader2
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }}
              />
            )}
            {!isSearching && !searchTerm && showSuggestions && suggestions.length === 0 && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }}>
                <Search style={{ width: '16px', height: '16px' }} />
              </div>
            )}
            {showSuggestions && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 16px 32px -20px rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                zIndex: 1200,
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                {isSearching ? (
                  <div style={{ padding: '16px', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 style={{ width: '16px', height: '16px' }} />
                    Searching locations...
                  </div>
                ) : (
                  <>
                    {suggestions.map((suggestion, index) => {
                      const isActive = index === highlightedIndex;
                      return (
                        <button
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          type="button"
                          onMouseEnter={() => {
                            userInteractedRef.current = true;
                            setHighlightedIndex(index);
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                            textAlign: 'left',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            {suggestion.name} <span style={{ color: '#059669', fontWeight: 500 }}>({suggestion.typeLabel})</span>
                          </span>
                          {suggestion.subtitle && (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{suggestion.subtitle}</span>
                          )}
                        </button>
                      );
                    })}
                    {searchError && (
                      <div style={{ padding: '14px 16px', fontSize: '13px', color: '#b91c1c', borderTop: suggestions.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
                        {searchError}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {/* Notification bell - Separate container */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Open notices"
            onClick={() => {
              if (typeof onNotificationsClick === 'function') {
                onNotificationsClick();
              } else {
                try {
                  const target = document.querySelector('[data-dashboard-section="notices"]');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } catch (error) {
                  console.error('Failed to focus notices section:', error);
                }
              }
            }}
          >
            <Bell style={{ width: '18px', height: '18px', color: '#6b7280' }} />
          </button>
        </div>

        {/* User profile - Separate container */}
        <div ref={userDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={toggleUserDropdown}
            style={{
              backgroundColor: '#f3f4f6',
              padding: '4px 12px',
              borderRadius: '30px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Profile Image / Initials */}
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#d1d5db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyChild: 'center',
              overflow: 'hidden', justifyContent: 'center'
            }}>
              {/* Agar user photo available ho toh <img> lagayein, nahi toh initials */}
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', textAlign: 'center' }}>
                U
              </span>
            </div>

            {/* User Info Text */}
            <div style={{ textAlign: 'left', marginRight: '4px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.2'
              }}>
                {/* Role and Area Mapping */}
                {role === ROLES.VDO && ('VDO')}
                {role === ROLES.BDO && ('BDO')}
                {role === ROLES.CEO && ('CEO')}
                {role === ROLES.SMD && ('SMD')}

              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {/* Role and Area Mapping */}
                {role === ROLES.VDO && (vdoGPName || 'VDO')}
                {role === ROLES.BDO && (bdoBlockName || 'BDO')}
                {role === ROLES.CEO && (ceoDistrictName || 'CEO')}
                {role === ROLES.SMD && (ceoDistrictName || 'Rajasthan')}
              </div>
            </div>

            <ChevronDown style={{
              width: '16px',
              height: '16px',
              color: '#6b7280',
              transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} />
          </button>

          {/* Dropdown Menu remains the same with handleLogout */}
          {showUserDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              minWidth: '200px',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {/* User Info Section */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#d1d5db',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                    }}>
                      User
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                    }}>
                      {role === ROLES.CEO ? 'CEO' : role === ROLES.BDO ? 'BDO' : role === ROLES.VDO ? 'VDO' : 'Admin'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <LogOut style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ef4444'
                }}>
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;