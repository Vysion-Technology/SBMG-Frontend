import { Bell, ChevronDown, Loader2, LogOut, Menu, Search, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBDOLocation } from '../../context/BDOLocationContext';
import { useCEOLocation } from '../../context/CEOLocationContext';
import { useLocation } from '../../context/LocationContext';
import { useVDOLocation } from '../../context/VDOLocationContext';
import apiClient from '../../services/api';
import { ROLES } from '../../utils/roleConfig';
import { useTranslation } from 'react-i18next';
import Profile from '../dashboards/common/Profile';

const Header = ({ onMenuClick = () => {}, pageTitle = 'Dashboard' }) => {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const bdoCtx = useBDOLocation() || {};
  const ceoCtx = useCEOLocation() || {};
  const vdoCtx = useVDOLocation() || {};
  const genericLoc = useLocation() || {};
  const isBDO = role === ROLES.BDO;
  const isCEO = role === ROLES.CEO;
  const loc = isBDO ? bdoCtx : (isCEO ? ceoCtx : genericLoc);

  const {
    activeScope = 'State',
    selectedLocation = 'Rajasthan',
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    updateLocationSelection,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    setSelectedGPId,
    setSelectedGPForHierarchy,
    breadcrumbDistricts = [],
    breadcrumbBlocks = [],
    breadcrumbGps = [],
    setBreadcrumbDistricts,
    setBreadcrumbBlocks,
    setBreadcrumbGps,
    setLoadingBreadcrumb,
    bdoDistrictName,
    bdoBlockName,
    selectedGPForHierarchy
  } = loc;

  const ceoDistrictName = ceoCtx?.ceoDistrictName;
  const vdoGPName = vdoCtx?.vdoGPName;

  const districtLabel = selectedDistrictForHierarchy?.name || ceoDistrictName || bdoDistrictName || (activeScope === 'Districts' && selectedLocation ? selectedLocation : 'All');
  const gpLabel = vdoGPName || selectedGPForHierarchy?.name || (activeScope === 'GPs' && selectedLocation ? selectedLocation : 'All');

  const hasDistrictSelection = Boolean(selectedDistrictForHierarchy?.id || selectedDistrictId);
  const hasBlockSelection = Boolean(selectedBlockForHierarchy?.id || selectedBlockId);

  const districtDisplayLabel = districtLabel && districtLabel !== 'All' && districtLabel !== 'Select District' ? districtLabel : 'All';
  const blockDisplayLabel = selectedBlockForHierarchy?.name || bdoBlockName || (hasDistrictSelection ? 'Select' : 'All');
  const gpDisplayLabel = selectedGPId || selectedGPForHierarchy?.id ? gpLabel : (isBDO ? 'Select GP' : (hasBlockSelection ? 'Select' : 'All'));

  const { t } = useTranslation();

  const [showProfile, setShowProfile] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [breadcrumbMenu, setBreadcrumbMenu] = useState({ type: null, items: [], loading: false });
  const userDropdownRef = useRef(null);
  const breadcrumbDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (breadcrumbMenu.type && breadcrumbDropdownRef.current && !breadcrumbDropdownRef.current.contains(e.target)) {
        setBreadcrumbMenu({ type: null, items: [], loading: false });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserDropdown, breadcrumbMenu.type]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRajasthanClick = () => {
    if (updateLocationSelection) {
      updateLocationSelection('State', 'Rajasthan', null, null, null, null, 'breadcrumb');
      setDropdownLevel?.('districts');
      setSelectedDistrictForHierarchy?.(null);
      setSelectedBlockForHierarchy?.(null);
      setSelectedGPId?.(null);
      setSelectedGPForHierarchy?.(null);
    }
  };

  const resetGpBreadcrumb = useCallback(() => {
    setSelectedGPId?.(null);
    setSelectedGPForHierarchy?.(null);
    setBreadcrumbGps?.([]);
    setBreadcrumbMenu({ type: null, items: [], loading: false });
  }, [setSelectedGPId, setSelectedGPForHierarchy, setBreadcrumbGps]);

  const handleBlockLabelClick = () => {
    if (isBDO) return;
    resetGpBreadcrumb();
    openBreadcrumbMenu('block');
  };

  const fetchBreadcrumbDistricts = useCallback(async () => {
    try {
      setLoadingBreadcrumb?.(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      const payload = Array.isArray(response.data) ? response.data : (response.data?.data || response.data?.districts || []);
      setBreadcrumbDistricts?.(payload);
      return payload;
    } catch (error) {
      console.error('Error fetching breadcrumb districts:', error);
      setBreadcrumbDistricts?.([]);
      return [];
    } finally {
      setLoadingBreadcrumb?.(false);
    }
  }, [setBreadcrumbDistricts, setLoadingBreadcrumb]);

  const fetchBreadcrumbBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setBreadcrumbBlocks?.([]);
      return [];
    }

    try {
      setLoadingBreadcrumb?.(true);
      const response = await apiClient.get('/geography/blocks', {
        params: { district_id: districtId, skip: 0, limit: 100 }
      });
      const payload = Array.isArray(response.data) ? response.data : (response.data?.data || response.data?.blocks || []);
      setBreadcrumbBlocks?.(payload);
      return payload;
    } catch (error) {
      console.error('Error fetching breadcrumb blocks:', error);
      setBreadcrumbBlocks?.([]);
      return [];
    } finally {
      setLoadingBreadcrumb?.(false);
    }
  }, [setBreadcrumbBlocks, setLoadingBreadcrumb]);

  const fetchBreadcrumbGps = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setBreadcrumbGps?.([]);
      return [];
    }

    try {
      setLoadingBreadcrumb?.(true);
      const response = await apiClient.get('/geography/grampanchayats', {
        params: { district_id: districtId, block_id: blockId, skip: 0, limit: 100 }
      });
      const payload = Array.isArray(response.data) ? response.data : (response.data?.data || response.data?.grampanchayats || []);
      setBreadcrumbGps?.(payload);
      return payload;
    } catch (error) {
      console.error('Error fetching breadcrumb GPs:', error);
      setBreadcrumbGps?.([]);
      return [];
    } finally {
      setLoadingBreadcrumb?.(false);
    }
  }, [setBreadcrumbGps, setLoadingBreadcrumb]);

  const openBreadcrumbMenu = useCallback(async (type) => {
    if (breadcrumbMenu.type === type) {
      setBreadcrumbMenu({ type: null, items: [], loading: false });
      return;
    }

    setBreadcrumbMenu({ type, items: [], loading: true });

    try {
      if (type === 'district') {
        const districts = breadcrumbDistricts.length > 0 ? breadcrumbDistricts : await fetchBreadcrumbDistricts();
        setBreadcrumbMenu({ type, items: districts, loading: false });
      } else if (type === 'block') {
        const districtId = selectedDistrictForHierarchy?.id || selectedDistrictId || null;
        if (!districtId) {
          setBreadcrumbMenu({ type: null, items: [], loading: false });
          return;
        }
        const blocks = breadcrumbBlocks.length > 0 ? breadcrumbBlocks : await fetchBreadcrumbBlocks(districtId);
        setBreadcrumbMenu({ type, items: blocks, loading: false });
      } else if (type === 'gp') {
        const districtId = selectedDistrictForHierarchy?.id || selectedDistrictId || null;
        const blockId = selectedBlockForHierarchy?.id || selectedBlockId || null;
        if (!districtId || !blockId) {
          setBreadcrumbMenu({ type: null, items: [], loading: false });
          return;
        }
        const gps = breadcrumbGps.length > 0 ? breadcrumbGps : await fetchBreadcrumbGps(districtId, blockId);
        setBreadcrumbMenu({ type, items: gps, loading: false });
      }
    } catch (error) {
      console.error('Error opening breadcrumb menu:', error);
      setBreadcrumbMenu({ type: null, items: [], loading: false });
    }
  }, [breadcrumbDistricts, breadcrumbBlocks, breadcrumbGps, fetchBreadcrumbDistricts, fetchBreadcrumbBlocks, fetchBreadcrumbGps, breadcrumbMenu.type, selectedDistrictForHierarchy, selectedDistrictId, selectedBlockForHierarchy, selectedBlockId]);

  const handleBreadcrumbSelect = useCallback((type, item) => {
    if (!updateLocationSelection) return;

    if (type === 'district') {
      if (isBDO) return;
      setSelectedDistrictForHierarchy?.(item);
      setSelectedBlockForHierarchy?.(null);
      setSelectedGPId?.(null);
      setSelectedGPForHierarchy?.(null);
      setBreadcrumbBlocks?.([]);
      setBreadcrumbGps?.([]);
      setDropdownLevel?.('districts');
      updateLocationSelection('Districts', item.name, item.id, item.id, null, null, 'breadcrumb');
    } else if (type === 'block') {
      if (isBDO) return;
      const districtId = selectedDistrictForHierarchy?.id || selectedDistrictId || null;
      setSelectedBlockForHierarchy?.(item);
      setSelectedGPId?.(null);
      setSelectedGPForHierarchy?.(null);
      setBreadcrumbGps?.([]);
      setDropdownLevel?.('blocks');
      updateLocationSelection('Blocks', item.name, item.id, districtId, item.id, null, 'breadcrumb');
    } else if (type === 'gp') {
      const districtId = selectedDistrictForHierarchy?.id || selectedDistrictId || null;
      const blockId = selectedBlockForHierarchy?.id || selectedBlockId || null;
      setSelectedGPId?.(item.id);
      setSelectedGPForHierarchy?.(item);
      setDropdownLevel?.('gps');
      updateLocationSelection('GPs', item.name, item.id, districtId || bdoDistrictId ? (districtId || bdoDistrictId) : null, blockId || bdoBlockId ? (blockId || bdoBlockId) : null, item.id, 'breadcrumb');
    }

    setBreadcrumbMenu({ type: null, items: [], loading: false });
  }, [updateLocationSelection, setSelectedDistrictForHierarchy, setSelectedBlockForHierarchy, setSelectedGPId, setSelectedGPForHierarchy, setDropdownLevel, setBreadcrumbBlocks, setBreadcrumbGps, selectedDistrictForHierarchy, selectedDistrictId, selectedBlockForHierarchy, selectedBlockId, isBDO, bdoDistrictName, bdoBlockName]);

  return (
    <header className="app-header" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={onMenuClick} style={{ padding: 8, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            <Menu style={{ width: 22, height: 22, color: '#6b7280' }} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>{pageTitle}</h1>
            <div ref={breadcrumbDropdownRef} style={{ fontSize: 13, color: '#6b7280', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
              {isBDO ? (
                <button type="button" onClick={handleRajasthanClick} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}>Rajasthan</button>
              ) : (
                <button type="button" onClick={handleRajasthanClick} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}>Rajasthan</button>
              )}
              <span style={{ color: '#d1d5db' }}>/</span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isBDO) {
                      resetGpBreadcrumb();
                    } else {
                      resetGpBreadcrumb();
                      openBreadcrumbMenu('district');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: districtDisplayLabel !== 'All' ? '#111827' : '#9ca3af', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  {districtDisplayLabel}
                </button>
                {breadcrumbMenu.type === 'district' && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220, maxHeight: 280, overflowY: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', zIndex: 1000 }}>
                    {breadcrumbMenu.loading ? (
                      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Loading...</div>
                    ) : breadcrumbMenu.items.length > 0 ? breadcrumbMenu.items.map((item) => (
                      <button key={item.id || item.name} onClick={() => handleBreadcrumbSelect('district', item)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer', color: '#374151' }}>
                        {item.name}
                      </button>
                    )) : (
                      <div style={{ padding: '10px 12px', color: '#6b7280' }}>No districts available</div>
                    )}
                  </div>
                )}
              </div>
              <span style={{ color: '#d1d5db' }}>/</span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isBDO) {
                      resetGpBreadcrumb();
                    } else {
                      handleBlockLabelClick();
                    }
                  }}
                  disabled={!hasDistrictSelection && !isBDO}
                  style={{ background: 'none', border: 'none', color: blockDisplayLabel !== 'All' ? '#111827' : '#9ca3af', cursor: (hasDistrictSelection || isBDO) ? 'pointer' : 'default', padding: 0, opacity: (hasDistrictSelection || isBDO) ? 1 : 0.7 }}
                >
                  {blockDisplayLabel}
                </button>
                {breadcrumbMenu.type === 'block' && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220, maxHeight: 280, overflowY: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', zIndex: 1000 }}>
                    {breadcrumbMenu.loading ? (
                      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Loading...</div>
                    ) : breadcrumbMenu.items.length > 0 ? breadcrumbMenu.items.map((item) => (
                      <button key={item.id || item.name} onClick={() => handleBreadcrumbSelect('block', item)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer', color: '#374151' }}>
                        {item.name}
                      </button>
                    )) : (
                      <div style={{ padding: '10px 12px', color: '#6b7280' }}>No blocks available</div>
                    )}
                  </div>
                )}
              </div>
              {gpLabel && (
                <>
                  <span style={{ color: '#d1d5db' }}>/</span>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => openBreadcrumbMenu('gp')}
                      disabled={!hasBlockSelection && !isBDO}
                      style={{ background: 'none', border: 'none', color: gpDisplayLabel !== 'All' ? '#111827' : '#9ca3af', cursor: (hasBlockSelection || isBDO) ? 'pointer' : 'default', padding: 0, opacity: (hasBlockSelection || isBDO) ? 1 : 0.7 }}>
                      {gpDisplayLabel}
                    </button>
                    {breadcrumbMenu.type === 'gp' && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220, maxHeight: 280, overflowY: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', zIndex: 1000 }}>
                        {breadcrumbMenu.loading ? (
                          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Loading...</div>
                        ) : breadcrumbMenu.items.length > 0 ? breadcrumbMenu.items.map((item) => (
                          <button key={item.id || item.name} onClick={() => handleBreadcrumbSelect('gp', item)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer', color: '#374151' }}>
                            {item.name}
                          </button>
                        )) : (
                          <div style={{ padding: '10px 12px', color: '#6b7280' }}>No GPs available</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ position: 'relative', width: 'clamp(140px, 28vw, 320px)', minWidth: 0 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }} />
            <input placeholder={isBDO ? t('searchGps') : isCEO ? t('searchBlocksOrGps') : t('searchDistrictsBlocksOrGps')} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 999, border: '1px solid #e5e7eb', outline: 'none', fontSize: 14 }} />
          </div>

          <button title="Notifications" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Bell style={{ width: 18, height: 18, color: '#6b7280' }} />
          </button>

          <div ref={userDropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowUserDropdown((s) => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User style={{ width: 18, height: 18, color: '#6b7280' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{role}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{role === ROLES.BDO ? (bdoBlockName || 'BDO') : role === ROLES.CEO ? (ceoDistrictName || 'CEO') : role === ROLES.VDO ? (vdoGPName || 'VDO') : ''}</div>
              </div>
            </button>

            {showUserDropdown && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', minWidth: 200, zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name || role}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{role}</div>
                </div>
                <button onClick={() => setShowProfile(true)} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer' }}>{t('profile')}</button>
                <button onClick={handleLogout} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: '#ef4444' }}>{t('logOut')}</button>
              </div>
            )}
          </div>

          <Profile open={showProfile} onClose={() => setShowProfile(false)} />
        </div>
      </div>
    </header>
  );
};

export default Header;