import { useState } from "react";
import SideDrawer from "../../common/SideDrawer";
import SlideDrawer from "../../common/SideDrawer";


const CommonTable = ({
    title,
    nameKey,
    data = [],
    cards = [],
    loading,
    onRowClick
}) => {

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `200px repeat(${cards.length}, minmax(100px, auto))`,
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-sm">

                {/* HEADER TITLE */}
                <div className="!p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-30">
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

                                {cards.map(card => (
                                    <th key={card.key} className="!p-4 font-bold text-gray-600 text-left">
                                        {card.label.toUpperCase()}
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
                                                {row[card.key] ?? "-"}
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

const AssetsTable = ({ section, cards, apiData, fetchBlocks,
    fetchGramPanchayats }) => {
    const dataToRender = Array.isArray(apiData)
        ? apiData
        : apiData ? [apiData] : [];

    // Grid configuration for table rows
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `200px repeat(${cards.length}, minmax(100px, auto))`,
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
                const res = await fetchBlocks(row.districtId);
                setBlocksData(res || []);
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
                const res = await fetchGramPanchayats(
                    row.district_id || row.districtId,
                    row.id || row.blockId
                );
                setGpsData(res || []);
            } catch (err) {
                console.error("GP API error:", err);
                setGpsData([]);
            } finally {
                setLoadingGps(false);
            }
        }
    };




    const handleBack = () => {
        if (level === "gp") {
            setLevel("block");
            setSelectedBlock(null);
        } else if (level === "block") {
            setLevel("district");
            setSelectedDistrict(null);
        }
    };

    return (
        <>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 text-sm">

                {/* HEADER TITLE */}
                <div className="!p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-30">
                    <h3 className="text-md font-bold text-gray-800 uppercase">
                        {level === "district" && "DISTRICT"}
                        {level === "block" && "BLOCK"}
                        {level === "gp" && "GRAM PANCHAYAT"} {section}
                    </h3>
                </div>

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
                                    <th key={card.key} className="!p-4 font-bold text-gray-600 text-left">
                                        {card.label.toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* BODY */}
                        <tbody>
                            {getTableData()?.length > 0 ? (
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
                                            <td key={card.key} className="!p-4 text-gray-700 whitespace-nowrap">
                                                {row[card.key] ?? "-"}
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
                onClose={() => setIsBlockDrawerOpen(false)}
                title="Blocks"
                width="md:w-[90%] w-full"

            >
                <CommonTable
                    title="BLOCK"
                    nameKey="name"
                    data={blocksData}
                    cards={cards}
                    loading={loadingBlocks}
                    onRowClick={async (block) => {
                        setIsGpDrawerOpen(true);

                        setLoadingGps(true);
                        setGpsData([]);

                        const res = await fetchGramPanchayats(
                            block.district_id,
                            block.id
                        );

                        setGpsData(res || []);
                        setLoadingGps(false);
                    }}
                />
            </SlideDrawer>

            {/* 🟣 GP DRAWER */}
            <SlideDrawer
                open={isGpDrawerOpen}
                onClose={() => setIsGpDrawerOpen(false)}
                title="Gram Panchayat"
                width="md:w-[80%] w-full"
            >
                <CommonTable
                    title="GRAM PANCHAYAT"
                    nameKey="name"
                    data={gpsData}
                    cards={cards}
                    loading={loadingGps}
                />
            </SlideDrawer>

        </>
    );
};



export default AssetsTable;