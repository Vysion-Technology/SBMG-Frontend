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
        gridTemplateColumns: `200px repeat(${cards.length}, minmax(200px, 1fr))`,
    };

    return (
        <>
            <div className=" max-h-[350px] bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto no-scrollbar text-sm">

                {/* HEADER SAME AS DISTRICT */}
                <div className="!p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-md  font-bold text-gray-800 uppercase">
                        {title}
                    </h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-max border-collapse block">

                        {/* HEADER */}
                        <thead className="block sticky top-0 left-0 z-10">
                            <tr style={gridStyle} className="border-b border-gray-200 bg-white">
                                <th className="!p-4 font-bold text-gray-600 text-left sticky left-0 bg-white z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
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
                        <tbody className="block">
                            {loading ? (
                                <tr className="block">
                                    <td className="!p-6 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((row, i) => (
                                    <tr key={i} style={gridStyle} className="group border-b border-gray-50 hover:bg-gray-50">

                                        {/* STICKY COLUMN SAME */}
                                        <td
                                            onClick={() => onRowClick && onRowClick(row)}
                                            className="!p-4 cursor-pointer font-bold text-emerald-600 sticky left-0 bg-white z-10 group-hover:bg-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]"
                                        >
                                            {row[nameKey] || "-"}
                                        </td>

                                        {cards.map(card => (
                                            <td key={card.key} className="!p-4 text-gray-700 font-medium">
                                                {row[card.key] ?? "-"}
                                            </td>
                                        ))}

                                    </tr>
                                ))
                            ) : (
                                <tr className="block">
                                    <td className="!p-6 text-center text-gray-400">
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
        gridTemplateColumns: `200px repeat(${cards.length}, minmax(200px, 1fr))`,
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
            <div className="w-full max-h-[350px] bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto no-scrollbar text-sm">
                <style>
                    {`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
                </style>

                {/* Header Title */}
                <div className="!p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-md font-bold text-gray-800 uppercase">
                        {level === "district" && "DISTRICT"}
                        {level === "block" && "BLOCK"}
                        {level === "gp" && "GRAM PANCHAYAT"} {section}
                    </h3>
                </div>

                {/* Scrollable Container */}
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-max border-collapse block">
                        {/* Header Section */}
                        <thead className="block sticky top-0 z-10">
                            <tr style={gridStyle} className="border-b border-gray-200 bg-white ">
                                <th className="!p-4 font-bold text-gray-600 text-left sticky left-0 bg-white z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
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

                        {/* Body Section */}
                        <tbody className="block">
                            {getTableData()?.length > 0 ? (
                                getTableData()?.map((row, rowIndex) => (
                                    <tr key={rowIndex} style={gridStyle} className="group border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        {/* Sticky District Cell with Right Shadow */}
                                        <td onClick={() => handleRowClick(row)} className="!p-4  cursor-pointer hover:underline font-bold text-emerald-600 sticky left-0 bg-white z-10 group-hover:bg-gray-50 uppercase transition-colors shadow-[5px_0_10px_-5px_rgba(0,0,0,0.15)]">
                                            {getName(row) || "-"}
                                        </td>

                                        {/* Dynamic Data Cells */}
                                        {cards.map((card) => {
                                            const value = row[card.key];
                                            return (
                                                <td key={card.key} className="!p-4 text-gray-700 font-medium whitespace-nowrap self-center">
                                                    {typeof value !== "object" ? (value || "-") : "-"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr className="block !p-10  text-center text-gray-400">
                                    <td className="block">No Data Available</td>
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