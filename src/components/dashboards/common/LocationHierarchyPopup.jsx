import { useEffect, useState } from "react";
import apiClient from "../../../services/api";

const LocationHierarchyPopup = ({ onSelect, onClose, selectedLocation }) => {

    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [gps, setGps] = useState([]);

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [selectedGP, setSelectedGP] = useState(null);

    const [districtSearch, setDistrictSearch] = useState("");
    const [blockSearch, setBlockSearch] = useState("");
    const [gpSearch, setGpSearch] = useState("");

    useEffect(() => {
        fetchDistricts();
    }, []);

    const fetchDistricts = async () => {
        const res = await apiClient.get("/geography/districts?skip=0&limit=50");
        const list = res.data;

        setDistricts(list);

        if (list.length > 0) {

            let district = list[0];

            if (selectedLocation?.districtId) {
                const found = list.find(d => d.id === selectedLocation.districtId);
                if (found) district = found;
            }

            setSelectedDistrict(district);
            fetchBlocks(district.id);
        }
    };

    const fetchBlocks = async (districtId) => {

        const res = await apiClient.get("/geography/blocks", {
            params: { district_id: districtId }
        });

        const list = res.data;

        setBlocks(list);

        if (list.length > 0) {

            let block = list[0];

            if (selectedLocation?.blockId) {
                const found = list.find(b => b.id === selectedLocation.blockId);
                if (found) block = found;
            }

            setSelectedBlock(block);
            fetchGps(districtId, block.id);
        }
    };

    const fetchGps = async (districtId, blockId) => {

        const res = await apiClient.get("/geography/grampanchayats", {
            params: {
                district_id: districtId,
                block_id: blockId
            }
        });

        const list = res.data;

        setGps(list);

        if (list.length > 0) {

            let gp = list[0];

            if (selectedLocation?.gpId) {
                const found = list.find(g => g.id === selectedLocation.gpId);
                if (found) gp = found;
            }

            setSelectedGP(gp);
        }
    };

    const rowStyle = (active) => ({
        padding: "12px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
        background: active ? "#e7f5ef" : "#fff",
        borderLeft: active ? "4px solid #0f9d58" : "4px solid transparent",
        display: "flex",
        justifyContent: "space-between"
    });

    return (

        <div style={overlay}>

            <div style={modal}>

                {/* HEADER */}

                <div style={header}>

                    <div>Overview </div>

                    <button onClick={onClose} style={closeBtn}>
                        ✕
                    </button>

                </div>

                {/* CONTENT */}

                <div style={columns}>

                    {/* DISTRICTS */}

                    <div style={card}>

                        <div style={title}>DISTRICTS</div>

                        <input
                            placeholder="Search districts..."
                            style={search}
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                        />

                        <div style={count}>{districts.length} districts</div>

                        <div style={list}>

                            {districts
                                .filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
                                .map(d => (

                                    <div
                                        key={d.id}
                                        className="hover:!bg-[#e7f5ef] transition-colors duration-200"
                                        style={rowStyle(selectedDistrict?.id === d.id)}
                                        onClick={() => {
                                            setSelectedDistrict(d);
                                            fetchBlocks(d.id);
                                            if (onSelect) {
                                                onSelect({
                                                    scope: 'Districts',
                                                    location: d.name,
                                                    locationId: d.id,
                                                    districtId: d.id,
                                                    blockId: null,
                                                    gpId: null,
                                                    districtName: d.name,
                                                    blockName: null,
                                                    gpName: null
                                                });
                                            }
                                        }}
                                    >

                                        <div>

                                            <div>{d.name}</div>

                                        </div>

                                        <div>›</div>

                                    </div>

                                ))}

                        </div>

                    </div>

                    {/* BLOCKS */}

                    <div style={card}>

                        <div style={title}>
                            BLOCKS IN {selectedDistrict?.name}
                        </div>

                        <input
                            placeholder="Search blocks..."
                            style={search}
                            value={blockSearch}
                            onChange={(e) => setBlockSearch(e.target.value)}
                        />

                        <div style={count}>{blocks.length} blocks</div>

                        <div style={list}>

                            {blocks
                                .filter(b => b.name.toLowerCase().includes(blockSearch.toLowerCase()))
                                .map(b => (

                                    <div
                                        key={b.id}
                                        style={rowStyle(selectedBlock?.id === b.id)}
                                        className="hover:!bg-[#e7f5ef] transition-colors duration-200"
                                        onClick={() => {
                                            setSelectedBlock(b);
                                            fetchGps(selectedDistrict.id, b.id);
                                            if (onSelect) {
                                                onSelect({
                                                    scope: 'Blocks',
                                                    location: b.name,
                                                    locationId: b.id,
                                                    districtId: selectedDistrict?.id,
                                                    blockId: b.id,
                                                    gpId: null,
                                                    districtName: selectedDistrict?.name,
                                                    blockName: b.name,
                                                    gpName: null
                                                });
                                            }
                                        }}
                                    >

                                        <div>

                                            <div>{b.name}</div>


                                        </div>

                                        <div>›</div>

                                    </div>

                                ))}

                        </div>

                    </div>

                    {/* GPS */}

                    <div style={card}>

                        <div style={title}>
                            GPs IN {selectedBlock?.name}
                        </div>

                        <input
                            placeholder="Search GPs..."
                            style={search}
                            value={gpSearch}
                            onChange={(e) => setGpSearch(e.target.value)}
                        />

                        <div style={count}>{gps.length} gram panchayats</div>

                        <div style={list}>

                            {gps
                                .filter(g => g.name.toLowerCase().includes(gpSearch.toLowerCase()))
                                .map(g => (

                                    <div
                                        key={g.id}
                                        style={rowStyle(selectedGP?.id === g.id)}
                                        className="hover:!bg-[#e7f5ef] transition-colors duration-200"
                                        onClick={() => {
                                            setSelectedGP(g);
                                            if (onSelect) {
                                                onSelect({
                                                    scope: 'GPs',
                                                    location: g.name,
                                                    locationId: g.id,
                                                    districtId: selectedDistrict?.id,
                                                    blockId: selectedBlock?.id,
                                                    gpId: g.id,
                                                    districtName: selectedDistrict?.name,
                                                    blockName: selectedBlock?.name,
                                                    gpName: g.name
                                                });
                                            }
                                            if (onClose) {
                                                onClose();
                                            }
                                        }}
                                    >

                                        <div>{g.name}</div>

                                    </div>

                                ))}

                        </div>

                    </div>
                </div>

            </div>

        </div>

    );

};

export default LocationHierarchyPopup;

const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 999
};

const modal = {
    width: "96%",
    height: "78vh",
    background: "#fff",
    borderRadius: "10px 10px 0 0",
    padding: "16px",
    display: "flex",
    flexDirection: "column"
};

const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    borderBottom: "1px solid #eee",
    fontSize: "15px",
    fontWeight: "600"
};

const closeBtn = {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer"
};

const columns = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "14px",
    flex: 1,
    marginTop: "12px",
    overflow: "hidden"
};

const card = {
    border: "1px solid #e6e6e6",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    height: "100%",
    overflow: "hidden"
};

const title = {
    padding: "10px 12px",
    fontWeight: "600",
    fontSize: "13px",
    borderBottom: "1px solid #eee"
};

const search = {
    margin: "8px 10px",
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "13px"
};

const count = {
    fontSize: "12px",
    color: "#777",
    padding: "0 10px 8px"
};

const list = {
    flex: 1,
    overflowY: "auto"
};

const meta = {
    fontSize: "12px",
    color: "#777"
};

