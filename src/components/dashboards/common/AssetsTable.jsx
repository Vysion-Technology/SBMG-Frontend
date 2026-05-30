import { useState } from "react";
import SideDrawer from "../../common/SideDrawer";
import SlideDrawer from "../../common/SideDrawer";


const formatCellValue = (value) => {

    if (Array.isArray(value)) {
        return value.map(v => v.value).join(" | ");
    }

    if (typeof value === "object" && value !== null) {
        return Object.values(value).join(" | ");
    }

    return value ?? "-";
};


const renderCellContent = (value, subLabels = []) => {

    // ARRAY VALUES
    if (Array.isArray(value)) {
        return (
            <div className="flex gap-4">
                {value.map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center min-w-[50px]"
                    >
                        <span className="text-[11px] text-gray-400 font-medium">
                            {subLabels[index] || "-"}
                        </span>

                        <span className="font-semibold text-gray-700">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // OBJECT VALUES
    if (typeof value === "object" && value !== null) {
        return (
            <div className="flex gap-4">
                {Object.entries(value).map(([key, val], index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center min-w-[50px]"
                    >
                        <span className="text-[11px] text-gray-400 font-medium">
                            {subLabels[index] || key}
                        </span>

                        <span className="font-semibold text-gray-700">
                            {val}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // NORMAL VALUE
    return value ?? "-";
};


const CommonTable = ({
    title,
    nameKey,
    data = [],
    cards = [],
    loading,
    onRowClick,
    onBack,
    showBack = false
}) => {

    // Grid configuration for table rows
    const getColumnWidth = (card) => {
        // large content column
        if (card.key === "Total_Work_Sanctioned_Status") {
            return "minmax(350px, 3fr)";
        }

        // medium column
        if (card.key === "FSTPs") {
            return "minmax(300px, 2fr)";
        }

        // small columns
        return "minmax(120px, 200px)";
    };

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `
        200px
        ${cards.map(card => getColumnWidth(card)).join(" ")}
    `,
    };

    // const gridStyle = {
    //     display: "grid",
    //     gridTemplateColumns: `200px repeat(${cards.length}, minmax(100px, 250px))`,
    // };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-sm">

                {/* HEADER TITLE */}
                <div className="items-center gap-3 !p-3">
                    <h3 className="text-md font-bold text-gray-800 uppercase">
                        {title}
                    </h3>
                </div>

                {/* SCROLLABLE AREA */}
                <div className="max-h-[400px] overflow-auto">

                    <table className="w-full min-w-max border-collapse">

                        {/* HEADER */}
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr style={gridStyle} className="border-b border-gray-200">

                                {/* STICKY FIRST COLUMN HEADER */}
                                <th className="!p-4 font-bold text-gray-600 text-left sticky left-0 bg-white z-30 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
                                    {nameKey.toUpperCase()}
                                </th>

                                {cards.map((card) => (
                                    <th
                                        key={card.key}
                                        className="!p-4 font-bold text-gray-600 text-left"
                                    >
                                        <div>
                                            <p className="font-bold uppercase">
                                                {card.label}
                                            </p>

                                            {card.subLabels && (
                                                <div className="flex !mt-1">
                                                    {card.subLabels.map((label, index) => (
                                                        <div
                                                            key={index}
                                                            className="min-w-[70px] text-[11px] font-medium text-gray-400"
                                                        >
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

                        {/* BODY */}
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={cards.length + 1} className="!p-6 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((row, i) => (
                                    <tr key={i} style={gridStyle} className="border-b border-gray-50 hover:bg-gray-50">

                                        {/* STICKY FIRST COLUMN */}
                                        <td
                                            onClick={() => onRowClick && onRowClick(row)}
                                            className="!p-4 cursor-pointer font-bold text-emerald-600 sticky left-0 bg-white z-10 hover:bg-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]"
                                        >
                                            {row[nameKey] || "-"}
                                        </td>

                                        {cards.map(card => (
                                            <td key={card.key} className="!p-4 text-gray-700 whitespace-nowrap">
                                                {Array.isArray(row[card.key]) ? (
                                                    <div className="flex">
                                                        {row[card.key].map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="min-w-[70px] text-left"
                                                            >
                                                                {item.value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : typeof row[card.key] === "object" && row[card.key] !== null ? (
                                                    <div className="flex">
                                                        {Object.values(row[card.key]).map((value, index) => (
                                                            <div
                                                                key={index}
                                                                className="min-w-[70px] text-left"
                                                            >
                                                                {value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    formatCellValue(row[card.key])
                                                )}
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

const AssetsTable = ({ loadingDis, section, cards, apiData, fetchBlocks, fetchGramPanchayats, mapApiToUI, closeParentDrawer, fetchBlocksData, fetchGPData }) => {



    const dataToRender = Array.isArray(apiData)
        ? apiData
        : apiData ? [apiData] : [];

    // Grid configuration for table rows
    const getColumnWidth = (card) => {
        // large content column
        if (card.key === "Total_Work_Sanctioned_Status") {
            return "minmax(350px, 3fr)";
        }

        // medium column
        if (card.key === "FSTPs") {
            return "minmax(300px, 2fr)";
        }

        // small columns
        return "minmax(120px, 200px)";
    };

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `
        200px
        ${cards.map(card => getColumnWidth(card)).join(" ")}
    `,
    };


    const [level, setLevel] = useState("district");
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);

    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [loadingGps, setLoadingGps] = useState(false);


    const [blocksData, setBlocksData] = useState([]);
    const [gpsData, setGpsData] = useState([]);

    const [isBlockDrawerOpen, setIsBlockDrawerOpen] = useState(false);
    const [isGpDrawerOpen, setIsGpDrawerOpen] = useState(false);

    const handleCloseAll = () => {
        setIsBlockDrawerOpen(false);
        setIsGpDrawerOpen(false);

        setBlocksData([]);
        setGpsData([]);

        setLevel("district");
        setSelectedDistrict(null);
        setSelectedBlock(null);

        closeParentDrawer?.(); // 🔥 district drawer bhi close
    };

    const getTableData = () => {
        if (level === "district") return dataToRender;
        if (level === "block") return selectedDistrict?.blocks || [];
        if (level === "gp") return selectedBlock?.gps || [];
    };


    const getName = (row) => {
        if (level === "district") return row.districtName;
        if (level === "block") return row.blockName;
        if (level === "gp") return row.gpName;
    };






    const handleRowClick = async (row) => {

        // 🟢 DISTRICT → BLOCK
        if (level === "district") {
            setIsBlockDrawerOpen(true);
            // open drawer instantly
            // document.querySelector('[data-block-drawer]')?.click();
            setIsBlockDrawerOpen(true);


            setLoadingBlocks(true);

            try {
                const res = await fetchBlocksData(row.districtId);

                const mappedBlocks = (res || []).map((item) => ({
                    ...item,

                    blockName:
                        item.blockName ||
                        item.block_name ||
                        item.geography_name ||
                        item.name,

                    districtId:
                        item.districtId || item.district_id,

                    blockId:
                        item.blockId ||
                        item.id ||
                        item.block_id ||
                        item.geography_id,
                }));

                setBlocksData(mappedBlocks);
            } catch (err) {
                console.error("Blocks API error:", err);
                setBlocksData([]);
            } finally {
                setLoadingBlocks(false);
            }
        }

        // 🔵 BLOCK → GP
        else if (level === "block") {

            // document.querySelector('[data-gp-drawer]')?.click();
            setIsGpDrawerOpen(true);
            setGpsData([]);
            setLoadingGps(true);

            try {
                const res = await fetchGPData(
                    row.district_id || row.districtId,
                    row.id || row.blockId
                );
                const mappedGps = (res || []).map((item) => ({
                    ...item,
                    ...mapApiToUI(item.assets)
                }));

                setGpsData(mappedGps);
            } catch (err) {
                console.error("GP API error:", err);
                setGpsData([]);
            } finally {
                setLoadingGps(false);
            }
        }
    };


    return (
        <>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 text-sm">

                {/* HEADER TITLE */}
                <h3 className="text-md font-bold text-gray-800 uppercase !p-3">
                    {level === "district" && "DISTRICT"}
                    {level === "block" && "BLOCK"}
                    {level === "gp" && "GRAM PANCHAYAT"} {section}
                </h3>

                {/* TABLE SCROLL CONTAINER */}
                <div className="max-h-[350px] overflow-auto">

                    <table className="w-full min-w-max border-collapse">

                        {/* HEADER */}
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr style={gridStyle} className="border-b border-gray-200">

                                {/* LEFT STICKY HEADER */}
                                <th className="!p-4 font-bold text-gray-600 text-left sticky left-0 bg-white z-30 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
                                    {level === "district" && "DISTRICT"}
                                    {level === "block" && "BLOCK"}
                                    {level === "gp" && "GRAM PANCHAYAT"}
                                </th>

                                {cards.map((card) => (
                                    <th
                                        key={card.key}
                                        className="!p-4 font-bold text-gray-600 text-left"
                                    >
                                        <div>
                                            <p className="font-bold uppercase">
                                                {card.label}
                                            </p>
                                            {card.subLabels && (
                                                <div className="flex !mt-1">
                                                    {card.subLabels.map((label, index) => (
                                                        <div
                                                            key={index}
                                                            className="min-w-[70px] text-[11px] font-medium text-gray-400"
                                                        >
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

                        {/* BODY */}
                        <tbody>
                            {
                                loadingDis ? (
                                    <tr>
                                        <td colSpan={cards.length + 1} className="!p-6 text-center text-gray-400">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : getTableData()?.length > 0 ?

                                    (
                                        getTableData().map((row, rowIndex) => (
                                            <tr key={rowIndex} style={gridStyle} className="border-b border-gray-50 hover:bg-gray-50">

                                                {/* ✅ STICKY FIRST COLUMN */}
                                                <td
                                                    onClick={() => handleRowClick(row)}
                                                    className="!p-4 cursor-pointer font-bold text-emerald-600 sticky left-0 bg-white z-10 hover:bg-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]"
                                                >
                                                    {getName(row) || "-"}
                                                </td>

                                                {cards.map((card) => (
                                                    <td key={card.key} className="!p-4 text-gray-700 whitespace-nowrap text-left">
                                                        {Array.isArray(row[card.key]) ? (
                                                            <div className="flex">
                                                                {row[card.key].map((item, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="min-w-[70px] text-left"
                                                                    >
                                                                        {item.value}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : typeof row[card.key] === "object" && row[card.key] !== null ? (
                                                            <div className="flex">
                                                                {Object.values(row[card.key]).map((value, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="min-w-[70px] text-left"
                                                                    >
                                                                        {value}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            formatCellValue(row[card.key])
                                                        )}
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

            {/* 🔵 BLOCK DRAWER */}
            <SlideDrawer
                open={isBlockDrawerOpen}
                onClose={handleCloseAll}
                title={section}
                width="md:w-[90%] w-full"
                showBack={true}
                onBack={() => {
                    setIsBlockDrawerOpen(false);
                }}

            >
                <CommonTable
                    title="BLOCK"
                    nameKey="blockName"
                    data={blocksData}
                    cards={cards}
                    loading={loadingBlocks}
                    showBack={true}

                    onBack={() => {
                        setIsBlockDrawerOpen(false);
                    }}


                    onRowClick={async (block) => {
                        setIsGpDrawerOpen(true);

                        setLoadingGps(true);
                        setGpsData([]);


                        const res = await fetchGPData(
                            block.districtId,
                            block.blockId
                        );


                        const mapped = (res || []).map((item) => ({
                            ...item,

                            gpName:
                                item.gpName ||
                                item.gp_name ||
                                item.geography_name ||
                                item.name,
                        }));

                        setGpsData(mapped);

                        setLoadingGps(false);
                    }}
                />
            </SlideDrawer>

            {/* 🟣 GP DRAWER */}
            <SlideDrawer
                open={isGpDrawerOpen}
                onClose={handleCloseAll}
                title={section}
                width="md:w-[80%] w-full"
                showBack={true}
                onBack={() => {
                    setIsGpDrawerOpen(false);
                }}
            >
                <CommonTable
                    title="GRAM PANCHAYAT"
                    nameKey="gpName"
                    data={gpsData}
                    cards={cards}
                    showBack={true}

                    onBack={() => {
                        setIsGpDrawerOpen(false);
                    }}
                    loading={loadingGps}
                />
            </SlideDrawer>

        </>
    );
};



export default AssetsTable;