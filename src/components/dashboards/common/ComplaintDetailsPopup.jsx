import { useEffect, useState } from "react";
import ResolutionPopup from "./ResolutionPopup";
import apiClient, { MEDIA_BASE_URL } from "../../../services/api";
import { useJsApiLoader } from "@react-google-maps/api";

const ComplaintDetailsPopup = ({ open, onClose, complaintId }) => {

    const [popupData, setPopupData] = useState(null);

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fullAddress, setFullAddress] = useState("");



    const getAddressFromLatLng = (lat, lng) => {

        if (!window.google) return;

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode(
            { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
            (results, status) => {

                console.log("Geocode results:", results);

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

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {

        if (!complaintId || !open) return;

        const fetchComplaintDetails = async () => {
            try {
                setLoading(true);

                const res = await apiClient.get(`/public/${complaintId}/details`);

                setComplaint(res.data);

            } catch (err) {

                console.error("Complaint details error:", err);

            } finally {
                setLoading(false);
            }
        };

        fetchComplaintDetails();

    }, [complaintId, open]);

    useEffect(() => {

        if (!complaint || !isLoaded) return;

        console.log("Lat:", complaint.lat);
        console.log("Long:", complaint.long);

        if (complaint.lat && complaint.long) {
            getAddressFromLatLng(complaint.lat, complaint.long);
        }

    }, [complaint, isLoaded]);


    if (!open) return null;

    if (loading) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    Loading complaint details...
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div style={styles.overlay}>
                <span style={{ cursor: "pointer" }} onClick={onClose}>✕</span>
                <div style={styles.modal}>
                    No complaint data
                </div>
            </div>
        );
    }

    const timeline = [

        {
            status: "Complaint Created",
            role: complaint?.mobile_number,
            date: complaint?.created_at,
            data: { comment: complaint?.description }
        },

        complaint?.resolved_at && {
            status: "Resolved",
            role: "Worker",
            date: complaint?.resolved_at,
            data: complaint?.comments?.find(c =>
                c.comment.includes("RESOLVED")
            ),
            showImages: true
        },

        complaint?.verified_at && {
            status: "Verified",
            role: "Supervisor",
            date: complaint?.verified_at,
            data: complaint?.comments?.find(c =>
                c.comment.includes("VERIFIED")
            ),
            showImages: false
        },

        complaint?.closed_at && {
            status: "Closed",
            role: "Admin",
            date: complaint?.closed_at,
            data: complaint?.comments?.[complaint.comments.length - 1], // ⭐ fix
            showImages: false
        }

    ].filter(Boolean);

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
            <div style={styles.overlay}>

                <div style={styles.modal}>

                    <div style={styles.header}>
                        <h2>Complaint ID {complaint?.id}</h2>
                        <span style={{ cursor: "pointer" }} onClick={onClose}>✕</span>
                    </div>

                    <p style={{ color: "#666", fontSize: "13px" }}>
                        {complaint?.district_name} | {complaint?.block_name} | {complaint?.village_name}
                    </p>

                    <div style={styles.statusCard}>
                        {complaint?.closed_at
                            ? "Closed"
                            : complaint?.verified_at
                                ? "Verified"
                                : complaint?.resolved_at
                                    ? "Resolved"
                                    : "Open"}
                    </div>

                    <div style={styles.images}>
                        {complaint?.media?.slice(0, 2).map((img, i) => (
                            <img
                                key={i}
                                src={`${MEDIA_BASE_URL}/${img.media_url}`}
                                style={styles.img}
                            />
                        ))}
                    </div>

                    <div style={{display:"flex" , justifyContent:'space-between',padding:'0 5px'}}>
                        <h3 style={{ fontSize: '16px' }}>{complaint?.complaint_type?.name || "Complaint"}</h3>
                        <h4
                            style={{ fontSize: '12px' }}
                        >
                            Created: {formatDate(complaint?.created_at)}
                        </h4>
                    </div>

                    <p style={{ fontSize: "13px", color: "#666" }}>
                        📍 {fullAddress || complaint.location}
                    </p>

                    <p style={{ fontSize: "14px", marginTop: "5px" }}>
                        {complaint.description}
                    </p>

                    <h4 style={{ marginTop: "20px" }}>Timeline</h4>

                    <div style={styles.timeline}>

                        {timeline.map((item, i) => (

                            <div
                                key={i}
                                style={styles.timelineItem}
                                onClick={() => {

                                    setPopupData({
                                        message: item.data?.comment || "No message available",
                                        images: item.showImages ? complaint.media : []
                                    });

                                }}
                            >

                                <div style={styles.dot}></div>

                                <div>

                                    <p style={{ fontWeight: 500 }}>
                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </p>

                                    <p style={{ fontSize: "12px", color: "#777" }}>
                                        {item.role} • {formatDate(item.date)}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                    {/* <div style={styles.buttons}>

                        <button style={styles.notBtn}>
                            Not satisfied
                        </button>

                        <button style={styles.completeBtn}>
                            Mark Completed
                        </button>

                    </div> */}

                </div>

            </div>

            <ResolutionPopup
                open={popupData}
                data={popupData}
                onClose={() => setPopupData(null)}
            />

        </>

    );

};

export default ComplaintDetailsPopup;

const styles = {

    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: '999'
    },

    modal: {
        background: "#fff",
        width: "600px",
        borderRadius: "10px",
        padding: "20px"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },

    statusCard: {
        border: "1px solid #f97316",
        background: "#fff7ed",
        padding: "10px",
        marginTop: "10px",
        borderRadius: "6px",
        color: "#c2410c"
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
        borderRadius: "6px"
    },

    timeline: {
        marginTop: "15px",
        borderLeft: "2px solid #22c55e",
        paddingLeft: "15px",
        position: "relative"
    },

    timelineItem: {
        marginBottom: "15px",
        cursor: "pointer",
        position: "relative",
        paddingLeft: "10px"
    },

    dot: {
        width: "18px",
        height: "18px",
        background: "#22c55e",
        borderRadius: "50%",
        position: "absolute",
        left: "-24px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "3px solid #fff"
    },

    buttons: {
        display: "flex",
        gap: "10px",
        marginTop: "20px"
    },

    notBtn: {
        flex: 1,
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        background: "#f3f4f6"
    },

    completeBtn: {
        flex: 1,
        padding: "10px",
        border: "none",
        borderRadius: "6px",
        background: "#16a34a",
        color: "#fff"
    }

};