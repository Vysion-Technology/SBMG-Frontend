import React, { useEffect, useState } from 'react'
import { AnimatePresence, color, motion } from "framer-motion";
import apiClient from '../../../services/api';
import { Loader } from 'lucide-react';
import { useGoogleMaps } from '../../../context/GoogleMapsProvider';

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",   // 🔥 blur effect
        WebkitBackdropFilter: "blur(8px)", // Safari support
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        zIndex: 999
    },

    modal: {
        background: "#dfdede",
        width: "500px",
        height: "100%",
        borderRadius: "0px",
        overflowY: "auto",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" // 🔥 depth feel
    },

    moduleDiv: {
        padding: "20px",
    },

    header: {
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 20px",
        background: "#fff",
        borderBottom: "1px solid #eee", TextDecoder: 'uppercase',
    },

    cardHeading: {
        fontSize: "18px",
        fontWeight: "600",
        marginBottom: "5px"
    },

    cards: {
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginTop: "16px",
    },
    cardsInner: {
        padding: "8px",
    },
    cardInnerDiv: {
        marginBottom: "12px",
    },

    innerCardHeading: {
        fontSize: "14px",
        color: "#6a7282",
    },
    innerCardValue: {
        fontSize: "16px",
        fontWeight: "500"
    },



    images: {
        display: "flex",
        gap: "10px",
        marginTop: "10px"
    },

    img: {
        width: "50%",
        height: "130px",
        objectFit: "cover",
        borderRadius: "6px",
        cursor: "pointer"
    },

    imageOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000
    },

    imageClose: {
        position: "absolute",
        top: "20px",
        right: "20px",
        cursor: "pointer",
        fontSize: "24px",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: "6px",
        background: "rgba(0,0,0,0.4)"
    },

    fullImage: {
        maxWidth: "90%",
        maxHeight: "90%",
        borderRadius: "10px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
    },



};

const InspectionDetailPage = ({ inspectionId, isopen, onClose }) => {

    const [inspectionData, setInspectionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fullAddress, setFullAddress] = useState("");

    const { isLoaded, loadError } = useGoogleMaps();

    // Loation fetch
    const getAddressFromLatLng = (lat, lng) => {

        if (!window.google) return;

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode(
            { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
            (results, status) => {

                // console.log("Geocode results:", results);

                if (status === "OK" && results.length > 0) {

                    const detailedResult =
                        results.find(r => r.types.includes("point_of_interest")) ||
                        results.find(r => r.types.includes("premise")) ||
                        results[1] ||
                        results[0];

                    setFullAddress(detailedResult.formatted_address);

                }

            }
        );

    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`inspections/${inspectionId}`);
                setInspectionData(response.data);
                console.log("data", response.data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [inspectionId, isopen]);

    useEffect(() => {

        if (!inspectionData || !isLoaded) return;


        if (inspectionData.lat && inspectionData.long) {
            getAddressFromLatLng(inspectionData.lat, inspectionData.long);
        }

    }, [inspectionData, isLoaded]);

    const formatDate = (date) =>
        new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    return (
        <>
            <AnimatePresence>

                {isopen && (
                    <motion.div
                        style={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, }}
                    >
                        <motion.div
                            style={styles.modal}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%", duration: 0.3 }}
                            transition={{ duration: 0.3 }}
                        >

                            <div className='shadow bg-white w-full' style={styles.header}>
                                <h2 >Inspection Detail Page</h2>
                                <span style={{ cursor: "pointer" }} onClick={onClose}>✕</span>
                            </div>
                            {
                                loading ? (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "80vh",
                                        flexDirection: "column",
                                        gap: "10px"
                                    }}>
                                        <Loader className="animate-spin" />
                                        <p style={{ color: "#666" }}>Loading inspection details...</p>
                                    </div>
                                )
                                    : !inspectionData ? (

                                        <div style={{
                                            textAlign: "center",
                                            marginTop: "50px",
                                            color: "#999"
                                        }}>
                                            No inspection data
                                        </div>
                                    )
                                        :

                                        (
                                            <div style={styles.moduleDiv} >
                                                {/* Basic information */}
                                                < div style={styles.cards} >
                                                    <h2 style={styles.cardHeading}>Basic information</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Date</div>

                                                            <p style={styles.innerCardValue}>{formatDate(inspectionData?.date)}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Village</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.village_name}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Block</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.block_name}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>District</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.district_name}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Role</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.officer_role}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Position holder ID</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.position_holder_id}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Register maintenance</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.register_maintenance ? "Yes" : "No"} </p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Location</div>
                                                            <p style={styles.innerCardValue}>{fullAddress || "Location not available"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remark */}
                                                <div style={styles.cards}>
                                                    <h2 style={styles.cardHeading}>Remarks</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Remarks</div>
                                                            <p style={styles.innerCardValue}>{inspectionData.remarks}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Household Waste */}
                                                <div style={styles.cards}>
                                                    <h2 style={styles.cardHeading}>Household Waste</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>waste collection frequency</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.household_waste?.waste_collection_frequency}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>DRY/Wet Vehicle segregation</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.household_waste?.dry_wet_vehicle_segregation ? "Yes" : "No"}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Covered collection in vehicles</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.household_waste?.covered_collection_in_vehicles ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Waste disposed at RRC </div>
                                                            <p style={styles.innerCardValue}> {inspectionData?.household_waste?.waste_disposed_at_rrc ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>RRC Waste collection and disposal arrangement </div>
                                                            <p style={styles.innerCardValue}> {inspectionData?.household_waste?.rrc_waste_collection_and_disposal_arrangement ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Waste collection vehicle functional </div>
                                                            <p style={styles.innerCardValue}> {inspectionData?.household_waste?.waste_collection_vehicle_functional ? "Yes" : "No"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Road and drain*/}
                                                <div style={styles.cards}>
                                                    <h2 style={styles.cardHeading}>Road and drain</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Road cleaning frequency</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.road_and_drain?.road_cleaning_frequency}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Drain cleaning frequency</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.road_and_drain?.drain_cleaning_frequency}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Disposal of sludge from drains</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.road_and_drain?.disposal_of_sludge_from_drains ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Drain waste collected on roadside</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.road_and_drain?.drain_waste_colllected_on_roadside ? "Yes" : "No"}</p>
                                                        </div>

                                                    </div>
                                                </div>

                                                {/* Community sanitation*/}
                                                <div style={styles.cards}>
                                                    <h2 style={styles.cardHeading}>Community sanitation</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>CSC cleaning frequency</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.community_sanitation?.csc_cleaning_frequency}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Electricity and water</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.community_sanitation?.electricity_and_water ? "Yes" : "No"}</p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>CSC used by community</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.community_sanitation?.csc_used_by_community ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Pink toilets cleaning</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.community_sanitation?.pink_toilets_cleaning ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Pink toilets used</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.community_sanitation?.pink_toilets_used ? "Yes" : "No"}</p>
                                                        </div>

                                                    </div>
                                                </div>

                                                {/*Other items*/}
                                                <div style={styles.cards}>
                                                    <h2 style={styles.cardHeading}>Other items</h2>
                                                    <div style={styles.cardsInner}>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Firm paid regularly</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.firm_paid_regularly ? "Yes" : "No"} </p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Cleaning staff paid regularly</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.cleaning_staff_paid_regularly ? "Yes" : "No"} </p>
                                                        </div>

                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Firm provided safety equipment</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.firm_provided_safety_equipment ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Regular feedback register entry</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.regular_feedback_register_entry ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Chart prepared for cleaning work</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.chart_prepared_for_cleaning_work ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Village visibly clean</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.village_visibly_clean ? "Yes" : "No"}</p>
                                                        </div>
                                                        <div style={styles.cardInnerDiv}>
                                                            <div style={styles.innerCardHeading}>Rate chart displayed</div>
                                                            <p style={styles.innerCardValue}>{inspectionData?.other_items?.rate_chart_displayed ? "Yes" : "No"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div >
                                        )
                            }


                        </motion.div >
                    </motion.div >
                )}
            </AnimatePresence>
        </>

    )
}

export default InspectionDetailPage
