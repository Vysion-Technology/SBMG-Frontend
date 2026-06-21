import { ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBDOLocation } from "../../context/BDOLocationContext";
import { useCEOLocation } from "../../context/CEOLocationContext";
import { useLocation } from "../../context/LocationContext";
import { useVDOLocation } from "../../context/VDOLocationContext";
import apiClient from "../../services/api";
import VolunteerDetails from "./common/VolunteerDetails";
import { useAuth } from "../../context/AuthContext";

const Volunteer = () => {
  const { t } = useTranslation(['common', 'table']);
  const mountedRef = useRef(false);

  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [gps, setGps] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [viewLevel, setViewLevel] = useState("district");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { user, role } = useAuth();

  // ── role lowercase normalize karo (image mein "bdo" lowercase dikh raha tha)
  const normalizedRole = role?.toUpperCase(); // "bdo" → "BDO", "ceo" → "CEO"

  const isDistrictLocked = ["CEO", "BDO", "VDO"].includes(normalizedRole);
  const isBlockLocked = ["BDO", "VDO"].includes(normalizedRole);
  const isGpLocked = ["VDO"].includes(normalizedRole);

  // ── location contexts
  const locationContextSMD = useLocation();
  const locationContextCEO = useCEOLocation();
  const locationContextBDO = useBDOLocation();
  const locationContextVDO = useVDOLocation();

  const locationContext =
    locationContextCEO || locationContextBDO || locationContextVDO || locationContextSMD || {};

  const {
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    selectedGPForHierarchy,
    selectedLocation,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    updateLocationSelection,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    setSelectedGPForHierarchy,
    getCurrentLocationInfo,
    activeScope,
  } = locationContext;

  const currentLocationInfo =
    typeof getCurrentLocationInfo === 'function' ? getCurrentLocationInfo() : {};

  // ── context IDs / Names
  const contextDistrictId = selectedDistrictForHierarchy?.id ?? selectedDistrictId ?? currentLocationInfo.districtId ?? null;
  const contextBlockId = selectedBlockForHierarchy?.id ?? selectedBlockId ?? currentLocationInfo.blockId ?? null;
  const contextGpId = selectedGPForHierarchy?.id ?? selectedGPId ?? currentLocationInfo.gpId ?? null;
  const contextDistrictName = selectedDistrictForHierarchy?.name ?? currentLocationInfo.districtName ?? null;
  const contextBlockName = selectedBlockForHierarchy?.name ?? currentLocationInfo.blockName ?? null;
  const contextGpName = selectedGPForHierarchy?.name ?? currentLocationInfo.gpName ?? selectedLocation ?? null;

  const selectedDistrict =
    selectedDistrictForHierarchy ||
    districts.find((i) => i.id === contextDistrictId) ||
    (contextDistrictId ? { id: contextDistrictId, name: contextDistrictName } : null);

  const selectedBlock =
    selectedBlockForHierarchy ||
    blocks.find((i) => i.id === contextBlockId) ||
    (contextBlockId ? { id: contextBlockId, name: contextBlockName } : null);

  const selectedGp =
    selectedGPForHierarchy ||
    gps.find((i) => i.id === contextGpId) ||
    (contextGpId ? { id: contextGpId, name: contextGpName } : null);

  // ── geo fetchers
  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/geography/districts?skip=0&limit=100");
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setDistricts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBlocks = async (districtId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/geography/blocks?district_id=${districtId}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setBlocks(data);
      setViewLevel("block");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchGps = async (blockId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/geography/grampanchayats?block_id=${blockId}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setGps(data);
      setViewLevel("gp");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── volunteer fetcher
  // gpId directly pass hoga jab GP row click ho (handleClick se)
  // baaki cases mein activeScope + selectedXForHierarchy se URL banta hai
  const fetchVolunteers = async (gpId = null) => {
    console.log("Volunteer API Called");
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (gpId) {
        params.append("gp_id", gpId);
      } else if (isGpLocked) {
        // VDO — context se gp_id lo (user object mein nahi hota)
        const vdoGpId = contextGpId || selectedGPId || user?.gp_id;
        if (vdoGpId) params.append("gp_id", vdoGpId);
      } else if (isBlockLocked && user?.block_id) {
        params.append("block_id", user.block_id);
      } else if (isDistrictLocked && user?.district_id) {
        params.append("district_id", user.district_id);
      } else if (activeScope === "Districts" && selectedDistrictForHierarchy?.id) {
        params.append("district_id", selectedDistrictForHierarchy.id);
      } else if (activeScope === "Blocks" && selectedBlockForHierarchy?.id) {
        params.append("block_id", selectedBlockForHierarchy.id);
      } else if (activeScope === "GPs" && selectedGPForHierarchy?.id) {
        params.append("gp_id", selectedGPForHierarchy.id);
      }
      console.log("Volunteer API Called");

      const url = `/volunteers/list${params.toString() ? `?${params}` : ""}`;
      console.log("Volunteer API =>", url);

      const res = await apiClient.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setVolunteers(data);
    } catch (err) {
      console.error(err);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Mount effect — role ke hisaab se starting level set karo
  // Sirf ek baar chalega (mountedRef double-fire rokta hai StrictMode mein)
  // Mount effect mein VDO ka gp_id fix karo
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (isGpLocked) {
      // VDO — gp_id user object mein nahi hota, context se aata hai
      // contextGpId try karo, phir selectedGPId, phir user?.gp_id
      const vdoGpId = contextGpId || selectedGPId || user?.gp_id;
      if (vdoGpId) {
        // Seedha volunteers dikhao — GP list nahi
        fetchVolunteers(vdoGpId);
        setViewLevel("volunteer");
      } else {
        // gp_id kahi nahi mila — error state
        console.warn("VDO: gp_id not found in context or user object");
        setViewLevel("volunteer");
      }
    } else if (isBlockLocked && user?.block_id) {
      fetchGps(user.block_id);
      fetchVolunteers();
    } else if (isDistrictLocked && user?.district_id) {
      fetchBlocks(user.district_id);
      fetchVolunteers();
    } else {
      fetchDistricts();
      fetchVolunteers();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // ── SMD only — context change pe geo navigate karo
  // Locked roles ke liye yeh effect kuch nahi karega
  useEffect(() => {
    console.log("Effect 1");
    if (isDistrictLocked || isBlockLocked || isGpLocked) return;

    if (contextGpId) { fetchVolunteers(contextGpId); return; }
    if (contextBlockId) { fetchGps(contextBlockId); return; }
    if (contextDistrictId) { fetchBlocks(contextDistrictId); return; }

    setViewLevel("district");
    setBlocks([]);
    setGps([]);
    setVolunteers([]);
  }, [contextDistrictId, contextBlockId, contextGpId]);

  // ── Volunteers reload — scope/selection change pe (SMD only effectively)
  // volunteer level pe skip karo — tab handleClick ne fetch kar diya hai
  useEffect(() => {
    if (isGpLocked || isBlockLocked || isDistrictLocked) return; // locked roles ka data mount pe set ho gaya
    if (viewLevel === "volunteer") return;
    console.log("Effect 2");
    fetchVolunteers();
  }, [
    activeScope,
    selectedDistrictForHierarchy?.id,
    selectedBlockForHierarchy?.id,
    selectedGPForHierarchy?.id,
  ]);

  // ── sync header context
  const syncHeaderSelection = (scope, location, locationId, districtId, blockId, gpId, changeType) => {
    if (scope === 'Districts' && typeof setSelectedDistrictForHierarchy === 'function') {
      setSelectedDistrictForHierarchy({ id: districtId, name: location || contextDistrictName });
      setSelectedBlockForHierarchy?.(null);
      setSelectedGPForHierarchy?.(null);
    }
    if (scope === 'Blocks' && typeof setSelectedBlockForHierarchy === 'function') {
      setSelectedBlockForHierarchy({ id: blockId, name: location || contextBlockName, district_id: districtId });
      setSelectedGPForHierarchy?.(null);
    }
    if (scope === 'GPs' && typeof setSelectedGPForHierarchy === 'function') {
      setSelectedGPForHierarchy({ id: gpId, name: location || contextGpName, block_id: blockId, district_id: districtId });
    }
    updateLocationSelection?.(scope, location || '', locationId, districtId, blockId, gpId, changeType);
  };

  const handleClick = (item) => {
    if (viewLevel === "district") {
      fetchBlocks(item.id);
      syncHeaderSelection('Districts', item.name, item.id, item.id, null, null, 'table_click');
    } else if (viewLevel === "block") {
      fetchGps(item.id);
      syncHeaderSelection('Blocks', item.name, item.id, item.district_id, item.id, null, 'table_click');
    } else if (viewLevel === "gp") {
      syncHeaderSelection('GPs', item.name, item.id, item.district_id, item.block_id, item.id, 'table_click');
      fetchVolunteers(item.id); // gp_id directly pass
      setViewLevel("volunteer");
    }
  };

  const handleBack = () => {
    if (viewLevel === "volunteer") {
      setViewLevel("gp");
      setVolunteers([]);
      setSelectedGPForHierarchy?.(null);
      // Wapas GP list pe — block ke volunteers dobara fetch karo (count ke liye)
      fetchVolunteers(); // ← yeh pehle bhi tha sirf BDO ke liye, ab sab ke liye
      updateLocationSelection?.('Blocks', contextBlockName || '', contextBlockId, contextDistrictId, contextBlockId, null, 'table_back');
    }
    else if (viewLevel === "gp") {
      if (isBlockLocked) return;
      setViewLevel("block");
      setGps([]);
      setSelectedBlockForHierarchy?.(null);
      fetchVolunteers(); // ← CEO block pe wapas aaye toh district volunteers refetch
      updateLocationSelection?.('Districts', contextDistrictName || '', contextDistrictId, contextDistrictId, null, null, 'table_back');
    }
    else if (viewLevel === "block") {
      if (isDistrictLocked) return;
      setViewLevel("district");
      setBlocks([]);
      setSelectedDistrictForHierarchy?.(null);
      fetchVolunteers(); // ← SMD district pe wapas
      updateLocationSelection?.('State', 'Rajasthan', null, null, null, null, 'table_back');
    }
  };

  const getTitle = () => {
    if (viewLevel === "district") return t('table:districtName');
    if (viewLevel === "block") return t('table:blockName');
    if (viewLevel === "gp") return t('table:gpName');
    return t('table:volunteerName');
  };

  // ── derived data
  const getData = () => {
    if (viewLevel === "district") return districts;
    if (viewLevel === "block") return blocks;
    if (viewLevel === "gp") return gps;
    if (viewLevel === "volunteer") return volunteers;
    return [];
  };

  const countMap = useMemo(() => {
    const keyMap = { district: "district_name", block: "block_name", gp: "gp_name" };
    const key = keyMap[viewLevel];
    if (!key) return {};
    return volunteers.reduce((acc, v) => {
      const val = v[key]?.toUpperCase().trim();
      if (val) acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }, [volunteers, viewLevel]);

  const totalVolunteers = volunteers.length;

  const isVolunteerLevel = viewLevel === "volunteer";

  // ── back button dikhao ya nahi
  const showBackButton =
    viewLevel !== "district" &&
    !(viewLevel === "block" && isDistrictLocked) &&
    !(viewLevel === "gp" && isBlockLocked) &&
    !(isVolunteerLevel && isGpLocked);

  // ── GP scope = activeScope "GPs" ya viewLevel "volunteer"/"gp" locked role pe
  const isGpScopeView = activeScope === "GPs" || (isBlockLocked && viewLevel !== "block");


  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      // same key pe click → direction toggle, naya key → asc se start
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    const data = getData();
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aVal, bVal;

      if (sortConfig.key === "name") {
        // name column — volunteer level pe full_name, baaki pe name
        aVal = (isVolunteerLevel ? a.full_name : a.name) || "";
        bVal = (isVolunteerLevel ? b.full_name : b.name) || "";
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortConfig.key === "count") {
        // count column — volunteer level pe gender, baaki pe countMap se
        if (isVolunteerLevel) {
          aVal = a.gender || "";
          bVal = b.gender || "";
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        aVal = countMap[a.name?.toUpperCase().trim()] ?? 0;
        bVal = countMap[b.name?.toUpperCase().trim()] ?? 0;
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortConfig.key === "status") {
        // status — Available (count>0) ko 1, Not Available ko 0 treat karo
        aVal = isVolunteerLevel ? 1 : (countMap[a.name?.toUpperCase().trim()] ?? 0) > 0 ? 1 : 0;
        bVal = isVolunteerLevel ? 1 : (countMap[b.name?.toUpperCase().trim()] ?? 0) > 0 ? 1 : 0;
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [getData(), sortConfig, countMap, isVolunteerLevel]);


  // Arrow icon — active column pe colored, inactive pe gray
  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const isAsc = sortConfig.direction === "asc";
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", marginLeft: "4px", cursor: "pointer" }}>
        <span style={{ fontSize: "8px", lineHeight: 1, color: isActive && isAsc ? "#10b981" : "#d1d5db" }}>▲</span>
        <span style={{ fontSize: "8px", lineHeight: 1, color: isActive && !isAsc ? "#10b981" : "#d1d5db" }}>▼</span>
      </span>
    );
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{
        backgroundColor: "white",
        padding: "16px 20px",
        borderRadius: "8px",
        border: "1px solid lightgray",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {t("common:overview")}
          </h2>
          {showBackButton && (
            <button onClick={handleBack} style={{
              padding: "6px 12px", border: "1px solid #ccc",
              borderRadius: "6px", background: "#f3f4f6", cursor: "pointer"
            }}>
              ← Back
            </button>
          )}
        </div>

        <div style={{
          background: "white", marginTop: "16px",
          border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden"
        }}>
          {/* ── Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: "2fr 1fr 1fr",
            backgroundColor: '#f9fafb',
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky', top: 0, zIndex: 10
          }}>
            <div onClick={() => handleSort("name")} style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#374151', alignItems: 'center' }}>
              {isVolunteerLevel ? t('table:volunteerName') : getTitle()}
              <SortIcon columnKey="name" />
            </div>

            <div onClick={() => handleSort("count")} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {isVolunteerLevel ? t('table:gender') : (
                <>
                  {t('table:totalCount')} <span style={{ color: '#6b7280', fontWeight: '400', marginLeft: '4px' }}>({totalVolunteers})</span>
                  <SortIcon columnKey="count" />
                </>
              )}
            </div>

            <div onClick={() => handleSort("status")} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {t('table:status')}
              <SortIcon columnKey="status" />
            </div>
          </div>

          {/* ── Table body */}
          {loading ? (
            <div style={{ padding: "16px", color: "#6b7280" }}>Loading...</div>
          ) : sortedData.length === 0 ? (
            <div style={{ padding: "16px", color: "#6b7280" }}>No data found.</div>
          ) : (
            sortedData.map((item, idx) => {
              const count = isVolunteerLevel ? null : (countMap[item.name?.toUpperCase().trim()] ?? 0);

              return (
                <div
                  key={item.id ?? idx}
                  onClick={() => !isVolunteerLevel && handleClick(item)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f1f1f1",
                    cursor: isVolunteerLevel ? "default" : "pointer",
                  }}
                >
                  {/* Name */}
                  <div
                    onClick={isVolunteerLevel ? () => {
                      setSelectedVolunteerId(item.id);
                      setShowDetails(true);
                    } : undefined}
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#10b981',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {isVolunteerLevel ? (item.full_name || "N/A") : (item.name || "N/A")}
                  </div>

                  {/* Count / Gender */}
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    {isVolunteerLevel ? (item.gender || "—") : count}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: isVolunteerLevel ? '#dcfce7' : (count > 0 ? '#dcfce7' : '#fee2e2'),
                      color: isVolunteerLevel ? '#065f46' : (count > 0 ? '#065f46' : '#991b1b'),
                    }}>
                      {isVolunteerLevel ? "Active" : (count > 0 ? "Available" : "Not Available")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <VolunteerDetails
        open={showDetails}
        onClose={() => { setShowDetails(false); setSelectedVolunteerId(null); }}
        volunteerId={selectedVolunteerId}
      />
    </div>
  );
};

export default Volunteer;