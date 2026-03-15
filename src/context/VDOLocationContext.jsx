import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const VDOLocationContext = createContext();

export const useVDOLocation = () => {
  const context = useContext(VDOLocationContext);
  if (!context) {
    // Return null instead of throwing to allow conditional usage in Header
    return null;
  }
  return context;
};

export const VDOLocationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // VDO's district ID, block ID, and GP ID from /me API (constant for VDO)
  const [vdoDistrictId, setVdoDistrictId] = useState(null);
  const [vdoDistrictName, setVdoDistrictName] = useState(null);
  const [vdoBlockId, setVdoBlockId] = useState(null);
  const [vdoBlockName, setVdoBlockName] = useState(null);
  const [vdoGPId, setVdoGPId] = useState(null);
  const [vdoGPName, setVdoGPName] = useState(null);
  const [loadingVDOData, setLoadingVDOData] = useState(true);

  // Get VDO district, block, and village data directly from user object (from /me API)
 useEffect(() => {
  if (user && user.district_id && user.block_id && user.village_id) {

    const districtId = user.district_id;
    const blockId = user.block_id;
    const gpId = user.village_id;

    let districtName = '';
    let blockName = '';
    let gpName = '';

    if (user.username) {
      const parts = user.username.split(".");
      districtName = parts[0] || '';
      blockName = parts[1] || '';
      gpName = parts[2] || '';
    }

    setVdoDistrictId(districtId);
    setVdoDistrictName(districtName);

    setVdoBlockId(blockId);
    setVdoBlockName(blockName);

    setVdoGPId(gpId);
    setVdoGPName(gpName);

    console.log("✅ VDO Location parsed from username:", {
      districtName,
      blockName,
      gpName
    });

    setLoadingVDOData(false);
  }
}, [user]);

  // Get current location info - VDO always works at village level
  const getCurrentLocationInfo = useCallback(() => {
    return {
      level: 'VILLAGE', // VDO always works at village level (uppercase, singular as API expects)
      districtId: vdoDistrictId,
      blockId: vdoBlockId,
      gpId: vdoGPId,
      districtName: vdoDistrictName,
      blockName: vdoBlockName,
      gpName: vdoGPName,
      vdoDistrictId, // Expose VDO's district explicitly
      vdoDistrictName,
      vdoBlockId, // Expose VDO's block explicitly
      vdoBlockName,
      vdoGPId, // Expose VDO's GP explicitly
      vdoGPName
    };
  }, [vdoDistrictId, vdoBlockId, vdoGPId, vdoDistrictName, vdoBlockName, vdoGPName]);

  // Location path for display - skip generic "District", "Block", "Village" to avoid "District DISTRICT" etc.
  const getLocationPath = useCallback(() => {
    const rawDistrict = (vdoDistrictName || '').trim();
    const districtLabel = (rawDistrict && rawDistrict.toLowerCase() !== 'district') ? `${vdoDistrictName} DISTRICT` : '';
    const rawBlock = (vdoBlockName || '').trim();
    const blockLabel = (rawBlock && rawBlock.toLowerCase() !== 'block') ? rawBlock : '';
    const rawGP = (vdoGPName || '').trim();
    const gpLabel = (rawGP && rawGP.toLowerCase() !== 'village') ? rawGP : '';
    const parts = ['Rajasthan', districtLabel, blockLabel, gpLabel].filter(Boolean);
    return parts.join(' / ');
  }, [vdoDistrictName, vdoBlockName, vdoGPName]);

  const value = useMemo(() => ({
    // State - VDO's fixed location data
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    
    // Actions
    getCurrentLocationInfo,
    getLocationPath
  }), [
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    getCurrentLocationInfo,
    getLocationPath
  ]);

  return (
    <VDOLocationContext.Provider value={value}>
      {children}
    </VDOLocationContext.Provider>
  );
};

