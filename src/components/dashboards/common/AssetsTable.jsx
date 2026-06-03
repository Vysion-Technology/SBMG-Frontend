import { useEffect, useRef, useState } from "react";
import SlideDrawer from "../../common/SideDrawer";

const getId = (item) => {
    if (!item) return null;
    // IMPORTANT: Check block/gp specific IDs BEFORE generic 'id' field
    // because 'id' might contain wrong ID (district ID instead of block ID)
    return (
        item.blockId || item.block_id ||
        item.gpId || item.gp_id ||
        item.districtId || item.district_id ||
        item.geography_id ||
        item.id ||
        null
    );
};

const getName = (item) => {
    if (!item) return "";
    return item.name || item.geography_name || item.districtName || item.blockName || item.gpName || "";
};

const formatCellValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((v) => v.value).join(" | ");
    }

    if (typeof value === "object" && value !== null) {
        return Object.values(value).join(" | ");
    }

    return value ?? "-";
};

const formatValue = (key, value) => {
    if (key === "Drainage_channels") {
        const num = Number(value);
        if (isNaN(num)) return "-";
        return `${(num / 1000).toFixed(2)} kms`;
    }

    return value ?? "-";
};

const renderCellContent = (key, value, subLabels = []) => {
    if (Array.isArray(value)) {
        return (
            <div className="flex gap-4">
                {value.map((item, index) => (
                    <div key={index} className="flex flex-col items-center min-w-[50px]">
                        <span className="font-semibold text-gray-700">
                            {formatValue(key, item.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    if (typeof value === "object" && value !== null) {
        return (
            <div className="flex gap-4">
                {Object.entries(value).map(([objKey, val], index) => (
                    <div key={index} className="flex flex-col items-center min-w-[50px]">
                        <span className="font-semibold text-gray-700">
                            {formatValue(key, val)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return formatValue(key, value);
};

const CommonTable = ({
    title,
    nameKey,
    data = [],
    cards = [],
    loading,
    onRowClick,
    onBack,
    showBack = false,
}) => {
    const getColumnWidth = (card) => {
        if (card.key === "Total_Work_Sanctioned_Status") return "minmax(350px, 3fr)";
        if (card.key === "FSTPs") return "minmax(300px, 2fr)";
        return "minmax(120px, 200px)";
    };

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `200px ${cards.map((card) => getColumnWidth(card)).join(" ")}`,
    };

    return (
        <>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-sm">
                <div className="flex items-center justify-between gap-3 !p-3">
                    <h3 className="text-md font-bold text-gray-800 uppercase">{title}</h3>
                    {showBack && (
                        <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                            onClick={onBack}
                        >
                            Back
                        </button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-auto">
                    <table className="w-full min-w-max border-collapse">
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr style={gridStyle} className="border-b border-gray-200">
                                <th className="!p-4 font-bold text-gray-600 text-left sticky left-0 bg-white z-30 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
                                    {nameKey.toUpperCase()}
                                </th>
                                {cards.map((card) => (
                                    <th key={card.key} className="!p-4 font-bold text-gray-600 text-left">
                                        <div>
                                            <p className="font-bold uppercase">{card.label}</p>
                                            {card.subLabels && (
                                                <div className="flex !mt-1">
                                                    {card.subLabels.map((label, index) => (
                                                        <div key={index} className="min-w-[70px] text-[11px] font-medium text-gray-400">
                                                            {label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={cards.length + 1} className="!p-6 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((row, rowIndex) => (
                                    <tr key={rowIndex} style={gridStyle} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td
                                            onClick={() => onRowClick && onRowClick(row)}
                                            className="!p-4 cursor-pointer font-bold text-emerald-600 sticky left-0 bg-white z-10 hover:bg-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]"
                                        >
                                            {getName(row) || "-"}
                                        </td>
                                        {cards.map((card) => (
                                            <td key={card.key} className="!p-4 text-gray-700 whitespace-nowrap text-left">
                                               {renderCellContent(card.key, row[card.key], card.subLabels)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={cards.length + 1} className="!p-6 text-center text-gray-400">
                                        No Data Available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
            <p className="bg-[#D8E6FD] !p-4 !mt-5 text-sm select-none text-[#3B82F6] rounded-2xl">This table will be open on the click of any card from assets. on the click of card table will show data of same category.
                Table headers will be changed based on click of the selected category.
            </p>
        </>
    );
};

const AssetsTable = ({
    initialLevel = "district",
    selectedDistrict = null,
    selectedBlock = null,
    selectedDistrictId = null,
    selectedBlockId = null,
    apiData = [],
    cards = [],
    section = "",
    fetchDistricts,
    fetchBlocksData,
    fetchGPData,
    mapApiToUI,
    loadingDis = false,
    closeParentDrawer,
}) => {
    const [level, setLevel] = useState(initialLevel);
    const [currentData, setCurrentData] = useState([]);
    const [blocksData, setBlocksData] = useState([]);
    const [gpsData, setGpsData] = useState([]);
    const [district, setDistrict] = useState(selectedDistrict);
    const [block, setBlock] = useState(selectedBlock);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [loadingGps, setLoadingGps] = useState(false);
    const [error, setError] = useState(null);
    const [isBlockDrawerOpen, setIsBlockDrawerOpen] = useState(false);
    const [isGpDrawerOpen, setIsGpDrawerOpen] = useState(false);

    const loadDistrictData = async () => {
        if (Array.isArray(apiData) && apiData.length > 0) {
            setCurrentData(apiData);
            return;
        }

        if (typeof fetchDistricts === "function") {
            try {
                setLoadingDistricts(true);
                const districts = await fetchDistricts();
                setCurrentData(Array.isArray(districts) ? districts : []);
            } catch (err) {
                setError(err);
                setCurrentData([]);
            } finally {
                setLoadingDistricts(false);
            }
        } else {
            setCurrentData([]);
        }
    };

    const fetchBlocksDataRef = useRef(fetchBlocksData);
    const fetchGPDataRef = useRef(fetchGPData);
    const fetchDistrictsRef = useRef(fetchDistricts);
    const mapApiToUIRef = useRef(mapApiToUI);

    useEffect(() => { fetchBlocksDataRef.current = fetchBlocksData; }, [fetchBlocksData]);
    useEffect(() => { fetchGPDataRef.current = fetchGPData; }, [fetchGPData]);
    useEffect(() => { fetchDistrictsRef.current = fetchDistricts; }, [fetchDistricts]);
    useEffect(() => { mapApiToUIRef.current = mapApiToUI; }, [mapApiToUI]);

    // Simple in-memory caches to de-duplicate identical drill-down requests
    const blocksCacheRef = useRef(new Map());
    const gpsCacheRef = useRef(new Map());

    const loadBlocks = async (districtId) => {
        if (!districtId) {
            setBlocksData([]);
            return [];
        }
        setLoadingBlocks(true);
        setError(null);

        try {
            const cacheKey = String(districtId);
            const cached = blocksCacheRef.current.get(cacheKey);
            if (cached) {
                return await cached;
            }

            const promise = (fetchBlocksDataRef.current ? fetchBlocksDataRef.current(districtId) : Promise.resolve([])).then((blocks) => {
                return (blocks || []).map((item) => {
                    const blockId = item.block_id || item.blockId || item.geography_id || item.id;
                    return {
                        ...item,
                        blockName: item.blockName || item.block_name || item.geography_name || item.name,
                        districtId: item.districtId || item.district_id || districtId,
                        blockId: blockId,
                        block_id: blockId,
                        id: blockId,
                    };
                });
            });

            // store promise to dedupe inflight
            blocksCacheRef.current.set(cacheKey, promise);
            const normalized = await promise;
            console.debug(`Normalized ${normalized.length} blocks for district ${districtId}`);
            setBlocksData(normalized);
            // replace promise with resolved data
            blocksCacheRef.current.set(cacheKey, normalized);
            return normalized;
        } catch (err) {
            console.error("Failed to load blocks:", err);
            setError(err);
            setBlocksData([]);
            return [];
        } finally {
            setLoadingBlocks(false);
        }
    };

    const loadGps = async (districtId, blockId) => {
        if (!districtId || !blockId) {
            setGpsData([]);
            return [];
        }
        setLoadingGps(true);
        setError(null);

        try {
            const cacheKey = `${districtId}:${blockId}`;
            const cachedGps = gpsCacheRef.current.get(cacheKey);
            if (cachedGps) {
                return await cachedGps;
            }

            console.debug(`Fetching GPs for ${cacheKey}`);
            const gpPromise = (fetchGPDataRef.current ? fetchGPDataRef.current(districtId, blockId) : Promise.resolve([])).then((gps) => {
                return (gps || []).map((item) => {
                    const gpId = item.gpId || item.gp_id || item.id || item.geography_id;
                    return {
                        ...item,
                        gpId: gpId,
                        gp_id: gpId,
                        gpName: item.gpName || item.gp_name || item.geography_name || item.name,
                        blockId: blockId,
                        block_id: blockId,
                        districtId: districtId,
                        district_id: districtId,
                        ...((typeof mapApiToUIRef.current === "function" && item.assets) ? mapApiToUIRef.current(item.assets) : {}),
                    };
                });
            });

            gpsCacheRef.current.set(cacheKey, gpPromise);
            const normalizedGps = await gpPromise;
            console.debug(`Normalized ${normalizedGps.length} GPs for block ${blockId} (district ${districtId})`);
            setGpsData(normalizedGps);
            gpsCacheRef.current.set(cacheKey, normalizedGps);
            return normalizedGps;
        } catch (err) {
            console.error("Failed to load GPs:", err);
            setError(err);
            setGpsData([]);
            return [];
        } finally {
            setLoadingGps(false);
        }
    };

    const selectedDistrictIdSafe = getId(selectedDistrict) ?? selectedDistrictId;
    const selectedBlockIdSafe = getId(selectedBlock) ?? selectedBlockId;

    useEffect(() => {
        setDistrict(selectedDistrict);
    }, [selectedDistrict]);

    useEffect(() => {
        setBlock(selectedBlock);
    }, [selectedBlock]);

    useEffect(() => {
        const initialize = async () => {
            setError(null);
            setLevel(initialLevel);

            if (initialLevel === "district") {
                await loadDistrictData();
                return;
            }

            if (initialLevel === "block") {
                const districtId = selectedDistrictIdSafe;
                if (!districtId) {
                    setCurrentData([]);
                    return;
                }
                setDistrict(selectedDistrict ?? (selectedDistrictId ? { id: selectedDistrictId } : null));
                const blocks = await loadBlocks(districtId);
                setCurrentData(blocks);
                return;
            }

            if (initialLevel === "gp") {
                const districtId = selectedDistrictIdSafe;
                const blockId = selectedBlockIdSafe;
                if (!districtId || !blockId) {
                    setCurrentData([]);
                    return;
                }
                setDistrict(selectedDistrict ?? (selectedDistrictId ? { id: selectedDistrictId } : null));
                setBlock(selectedBlock ?? (selectedBlockId ? { id: selectedBlockId } : null));
                const gps = await loadGps(districtId, blockId);
                setCurrentData(gps);
                return;
            }
        };

        initialize();
    }, [initialLevel, selectedDistrict, selectedBlock, selectedDistrictId, selectedBlockId, apiData]);

    const handleRowClick = async (row) => {
        if (level === "district") {
            const districtId = getId(row);
            console.log("🏘️ District row clicked - districtId:", districtId, "row:", row);
            if (!districtId) {
                console.error("❌ No districtId found in row:", row);
                return;
            }

            setDistrict(row);
            setIsBlockDrawerOpen(true);
            setLoadingBlocks(true);

            try {
                const blocks = await loadBlocks(districtId);
                if (Array.isArray(blocks) && blocks.length > 0) {
                    setBlocksData(blocks);
                }
            } catch (err) {
                console.error("Failed to load blocks for drawer:", err);
            } finally {
                setLoadingBlocks(false);
            }
            return;
        }

        if (level === "block") {
            const districtId = getId(district);
            // Extract blockId from row - prefer block-specific fields
            const blockId = row.block_id || row.blockId || row.geography_id || row.id;
            console.log("🔗 Block row clicked from main table");
            console.log("   Row object:", row);
            console.log("   districtId:", districtId);
            console.log("   blockId (block_id first):", blockId);
            if (!districtId || !blockId) {
                console.error("❌ Missing districtId or blockId", { districtId, blockId, row });
                return;
            }

            if (districtId === blockId) {
                console.warn("⚠️  WARNING: districtId and blockId are the SAME! Check row data:", row);
            }

            setBlock(row);
            setIsGpDrawerOpen(true);
            setLoadingGps(true);

            try {
                const gps = await loadGps(districtId, blockId);
                if (Array.isArray(gps) && gps.length > 0) {
                    setGpsData(gps);
                }
            } catch (err) {
                console.error("Failed to load GPs for drawer:", err);
            } finally {
                setLoadingGps(false);
            }
        }
    };

    const handleBlockRowClick = async (row) => {
        const districtId = getId(district);
        // Extract blockId from row - prefer block-specific fields
        const blockId = row.block_id || row.blockId || row.geography_id || row.id;
        console.log("🔗 Block row clicked from drawer");
        console.log("   Row object:", row);
        console.log("   districtId:", districtId);
        console.log("   blockId (block_id first):", blockId);
        if (!districtId || !blockId) {
            console.error("❌ Missing districtId or blockId", { districtId, blockId, row });
            return;
        }

        if (districtId === blockId) {
            console.warn("⚠️  WARNING: districtId and blockId are the SAME! Check row data:", row);
        }

        setBlock(row);
        setIsGpDrawerOpen(true);
        setLoadingGps(true);

        try {
            const gps = await loadGps(districtId, blockId);
            if (Array.isArray(gps) && gps.length > 0) {
                setGpsData(gps);
            }
        } catch (err) {
            console.error("Failed to load GPs for drawer:", err);
        } finally {
            setLoadingGps(false);
        }
    };

    const handleCloseAll = () => {
        console.log("🔐 Closing all drawers and resetting data - INCLUDING PARENT");
        setIsBlockDrawerOpen(false);
        setIsGpDrawerOpen(false);
        setBlocksData([]);
        setGpsData([]);
        setBlock(null);
        setDistrict(selectedDistrict);
        setError(null);
        // Close parent district-level drawer too
        if (typeof closeParentDrawer === "function") {
            console.log("🚪 Closing parent drawer");
            closeParentDrawer();
        }
    };

    const titleByLevel = {
        district: "DISTRICT",
        block: "BLOCK",
        gp: "GRAM PANCHAYAT",
    }[level] || "DISTRICT";

    const descriptionByLevel = {
        district: "Click a district to view its blocks in the nested drawer.",
        block: "Click a block to view its GPs in the nested drawer.",
        gp: "Showing GPs for the selected block.",
    }[level] || "Click a district to view its blocks in the nested drawer.";

    const currentLoading = level === "district" ? loadingDistricts : level === "block" ? loadingBlocks : loadingGps;

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-white !px-4 !py-3 shadow-sm border border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{titleByLevel} {section}</h2>
                        <p className="text-sm text-slate-500">{descriptionByLevel}</p>
                    </div>
                </div>

                <CommonTable
                    title={`${titleByLevel} ${section}`}
                    nameKey={titleByLevel}
                    data={currentData}
                    cards={cards}
                    loading={currentLoading}
                    onRowClick={handleRowClick}
                    showBack={false}
                />

                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {String(error.message || error)}
                    </div>
                )}
            </div>

            <SlideDrawer
                open={isBlockDrawerOpen}
                onClose={handleCloseAll}
                title={section}
                width="md:w-[90%] w-full"
                showBack={true}
                onBack={() => {
                    setIsBlockDrawerOpen(false);
                    setIsGpDrawerOpen(false);
                    setGpsData([]);
                    setBlock(null);
                }}
            >
                <CommonTable
                    title="BLOCK"
                    nameKey="Block"
                    data={blocksData}
                    cards={cards}
                    loading={loadingBlocks}
                    onRowClick={handleBlockRowClick}
                    showBack={false}
                />
            </SlideDrawer>

            <SlideDrawer
                open={isGpDrawerOpen}
                onClose={handleCloseAll}
                title={section}
                width="md:w-[80%] w-full"
                showBack={true}
                onBack={() => {
                    setIsGpDrawerOpen(false);
                    setGpsData([]);
                }}
            >
                <CommonTable
                    title="GRAM PANCHAYAT"
                    nameKey="Gram Panchayat"
                    data={gpsData}
                    cards={cards}
                    loading={loadingGps}
                    showBack={false}
                />
            </SlideDrawer>
        </>
    );
};

export default AssetsTable;
