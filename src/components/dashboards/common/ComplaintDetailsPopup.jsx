import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Loader, MapPin, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from '../../../context/AuthContext.jsx';
import { useGoogleMaps } from "../../../context/GoogleMapsProvider";
import apiClient, { MEDIA_BASE_URL } from "../../../services/api";
import ResolutionPopup from "./ResolutionPopup";
import SLABadge from "./SLABadge.jsx";
import { useTranslation } from "react-i18next";


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
        background: "#fff",
        width: "500px",
        height: "100%",
        borderRadius: "0px",
        // padding: "20px",
        overflowY: "auto",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", // 🔥 depth feel
        display: "flex",
        flexDirection: "column"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: '#f3f4f6',
        padding: '15px',
        boxShadow: "0 0px 2px #3c3838",
        fontSize: '18px'
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

    timeline: {
        marginTop: "15px",
        borderLeft: "2px solid #22c55e",
        paddingLeft: "15px",
        position: "relative",
        background: '#F3F4F6'
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
        background: "#009B56",
        borderRadius: "50%",
        position: "absolute",
        left: "-24px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "3px solid #D4FFED"
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
    },
    printBtn: {
        padding: "5px",
        border: "none",
        borderRadius: "6px",
        background: "#009B56",
        color: "#fff",
        cursor: "pointer",
        justifyItems: 'center'
    }



};

const ComplaintDetailsPopup = ({ open, onClose, complaintId, onSendNotice }) => {
    const { t } = useTranslation(['table', 'complaints', 'common']);

    const [popupData, setPopupData] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fullAddress, setFullAddress] = useState("");

    const [closing, setClosing] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeRemark, setCloseRemark] = useState("");
    const [closeRemarkError, setCloseRemarkError] = useState("");

    const { user } = useAuth();

    const canCloseComplaint =
        ["ADMIN", "CEO", "BDO", "SMD"].includes(
            user?.role?.toUpperCase()
        ) &&
        !complaint?.closed_at;


    console.log("Role:", user?.role);
    console.log("Can Close:", canCloseComplaint);






    // complain type & heading 
    const [complaintTypes, setComplaintTypes] = useState([]);

    useEffect(() => {
        const fetchComplaintTypes = async () => {
            try {
                const res = await apiClient.get("/public/complaint-types");
                setComplaintTypes(res.data || []);
            } catch (err) {
                console.error("Complaint types error:", err);
            }
        };

        fetchComplaintTypes();
    }, []);


    const complaintTypeMap = React.useMemo(() => {
        const map = {};

        complaintTypes.forEach(item => {
            map[item.id] = item.name;
        });

        return map;
    }, [complaintTypes]);

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

    const { isLoaded, loadError } = useGoogleMaps();

    // const { isLoaded } = useJsApiLoader({
    //     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    // });

    useEffect(() => {

        if (!complaintId || !open) return;

        const fetchComplaintDetails = async () => {
            try {
                setLoading(true);

                const res = await apiClient.get(`/public/${complaintId}/details`);

                setComplaint(res.data);
                console.log(res.data);

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

        // console.log("Lat:", complaint.lat);
        // console.log("Long:", complaint.long);

        if (complaint.lat && complaint.long) {
            getAddressFromLatLng(complaint.lat, complaint.long);
        }

    }, [complaint, isLoaded]);


    const timeline = complaint ? [

        {
            status: "Complaint Created",
            role: complaint?.complainant_name
                ? `${complaint.complainant_name}${complaint.mobile_number ? ` • +91${complaint.mobile_number}` : ''}`
                : (complaint?.mobile_number ? `+91${complaint.mobile_number}` : "Citizen"),
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
            role: complaint?.closed_by_info || complaint?.complainant_name || "Citizen",
            date: complaint?.closed_at,
            data: (complaint?.comments?.length > 0
                ? complaint.comments[complaint.comments.length - 1]
                : null) || { comment: "Complaint closed." },
            showImages: false
        }

    ].filter(Boolean) : [];

    const closingComment = React.useMemo(() => {
        if (!complaint?.closed_at || !complaint?.comments?.length) return null;
        return complaint.comments[complaint.comments.length - 1];
    }, [complaint]);

    const formatDate = (date) =>
        new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });


    const handleOpenCloseModal = () => {
        setCloseRemark("");
        setCloseRemarkError("");
        setShowCloseModal(true);
    };

    const handleConfirmClose = async () => {
        if (!complaint?.id) return;

        if (!closeRemark || !closeRemark.trim()) {
            setCloseRemarkError("Remark is mandatory when closing a complaint.");
            return;
        }

        try {
            setClosing(true);
            setCloseRemarkError("");

            await apiClient.patch(
                `/complaints/${complaint.id}/status`,
                {
                    status_name: "CLOSED",
                    remark: closeRemark.trim()
                }
            );

            // UI refresh
            const res = await apiClient.get(
                `/public/${complaint.id}/details`
            );

            setComplaint(res.data);
            setShowCloseModal(false);
            setCloseRemark("");

        } catch (error) {
            console.error("Close complaint error:", error);
            const errorDetail = error.response?.data?.detail;
            alert(typeof errorDetail === 'string' ? errorDetail : "Failed to close complaint");
        } finally {
            setClosing(false);
        }
    };

    return (

        <>
            <AnimatePresence>
                {open && (
                    <>
                        <div style={styles.overlay}>

                            <motion.div
                                className="print-section"
                                style={styles.modal}
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ duration: 0.3 }}
                            >

                                <div style={{ flex: 1 }}>
                                    {loading ? (
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "80vh",
                                            flexDirection: "column",
                                            gap: "10px"
                                        }}>
                                            <Loader className="animate-spin" />
                                            <p style={{ color: "#666" }}>Loading complaint details...</p>
                                        </div>
                                    ) : !complaint ? (
                                        <div style={{
                                            textAlign: "center",
                                            marginTop: "50px",
                                            color: "#999"
                                        }}>
                                            No complaint data
                                        </div>
                                    ) : (


                                        <>
                                            {/* complaint id */}
                                            <div style={styles.header}>
                                                <h2>Complaint ID: {complaint?.id}</h2>
                                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

                                                    <button
                                                        onClick={() => window.print()}
                                                        style={styles.printBtn}
                                                    >
                                                        <Printer size={18} />
                                                    </button>

                                                    <span
                                                        style={{ cursor: "pointer" }}
                                                        onClick={onClose}
                                                    >
                                                        ✕
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="!p-5">
                                                {/* location dis block gps.. */}
                                                <div className="flex  justify-between">
                                                    <p style={{ color: "#666", fontSize: "13px" }}>
                                                        {complaint?.district_name} | {complaint?.block_name} | {complaint?.village_name}
                                                    </p>
                                                    <SLABadge level={complaint.last_sla_breach_level} />
                                                </div>

                                                {/* Complaint actions type */}
                                                <div
                                                    style={{
                                                        ...styles.statusCard,
                                                        backgroundColor: complaint?.closed_at
                                                            ? "#F0FDF4"
                                                            : complaint?.verified_at
                                                                ? "#FFF7ED"
                                                                : complaint?.resolved_at
                                                                    ? "#FAF5FF"
                                                                    : "#FEF2F2",
                                                        color: complaint?.closed_at
                                                            ? "#11B981"
                                                            : complaint?.verified_at
                                                                ? "#F9781E"
                                                                : complaint?.resolved_at
                                                                    ? "#8B5CF6"
                                                                    : "#EF4A4A",
                                                        borderColor: complaint?.closed_at
                                                            ? "#31CA9C"
                                                            : complaint?.verified_at
                                                                ? "#F9781E"
                                                                : complaint?.resolved_at
                                                                    ? "#8B5CF6"
                                                                    : "#EF4A4A",

                                                    }}
                                                >
                                                    {complaint?.closed_at
                                                        ? <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <span style={{ backgroundColor: '#00BE7D', padding: '5px', borderRadius: '50%' }}>
                                                                <Check color={'white'} width={'16px'} height={'16px'} />
                                                            </span>

                                                            <div>
                                                                <p style={{ fontWeight: '500', color: '#03B77B', fontSize: '18px' }}>
                                                                    Complaint has been Closed</p>
                                                                <p style={{ color: '#666' }}> Closed <span style={{ fontSize: '12px' }}>{formatDate(complaint?.closed_at)} </span> </p>
                                                            </div>
                                                        </div>

                                                        : complaint?.verified_at
                                                            ?
                                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} >
                                                                <span style={{ backgroundColor: '#ffcc8c', padding: '5px', borderRadius: '50%' }}>
                                                                    <Clock width={'16px'} height={'16px'} />
                                                                </span>
                                                                <div>
                                                                    <p style={{ fontWeight: '500', color: '#ffa93d', fontSize: '18px' }}>
                                                                        Awaiting for citizen to close complaint</p>
                                                                    <p style={{ color: '#666' }}> Verified <span style={{ fontSize: '12px' }}>{formatDate(complaint?.verified_at)} </span> </p>
                                                                </div>

                                                            </div>

                                                            :
                                                            complaint?.resolved_at
                                                                ?
                                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} >
                                                                    <span style={{ backgroundColor: '#ebd8ff', padding: '5px', borderRadius: '50%' }}>
                                                                        <Clock width={'16px'} height={'16px'} />
                                                                    </span>
                                                                    <div>
                                                                        <p style={{ fontWeight: '500', color: '#9855da', fontSize: '18px' }}>
                                                                            Awaiting for VDO to verify</p>
                                                                        <p style={{ color: '#666' }}> Resolved <span style={{ fontSize: '12px' }}>{formatDate(complaint?.resolved_at)} </span> </p>
                                                                    </div>

                                                                </div>


                                                                :
                                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                    <span style={{ backgroundColor: '#ffaeae', padding: '5px', borderRadius: '50%' }}>
                                                                        <Loader width={'16px'} height={'16px'} />
                                                                    </span>
                                                                    <div>
                                                                        <p style={{ fontWeight: '500', color: '#ff4343', fontSize: '18px' }}>
                                                                            Awaiting for supervisor to take action</p>
                                                                        <p style={{ color: '#666' }}> Open <span style={{ fontSize: '12px' }}>{formatDate(complaint?.created_at)} </span></p>
                                                                    </div>


                                                                </div>}
                                                </div>

                                                {/* Complaint Img */}
                                                <div style={styles.images}>
                                                    {complaint?.media?.slice(0, 2).map((img, i) => (
                                                        <img
                                                            key={i}
                                                            src={`${MEDIA_BASE_URL}/${img.media_url}`}
                                                            style={styles.img}
                                                            onClick={() => setSelectedImage(`${MEDIA_BASE_URL}/${img.media_url}`)}
                                                        />
                                                    ))}
                                                </div>



                                                {/* Headin & Date */}
                                                <div style={{ display: "flex", justifyContent: 'space-between', marginTop: '10px' }}>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
                                                        {complaintTypeMap[complaint?.complaint_type_id] || "Complaint"}
                                                    </h3>
                                                    <h4
                                                        style={{ fontSize: '11px', padding: '5px 8px', background: '#F3F4F6', borderRadius: '8px' }}
                                                    >
                                                        {formatDate(complaint?.created_at)}
                                                    </h4>

                                                </div>

                                                <div style={{ display: "flex", justifyContent: 'space-between', alignItems: 'center', margin: '8px 0px' }}>
                                                    {complaint?.complainant_name ? (
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                                            {complaint.complainant_name}
                                                        </div>
                                                    ) : <div />}
                                                    {complaint?.mobile_number && (
                                                        <h4
                                                            style={{ fontSize: '11px', padding: '4px 8px', background: '#F3F4F6', borderRadius: '8px', color: '#4b5563', fontWeight: 500 }}
                                                        >
                                                            +91 {complaint.mobile_number}
                                                        </h4>
                                                    )}
                                                </div>

                                                {/* Location */}
                                                <p style={{ fontSize: "13px", color: "#666", display: 'flex', gap: '5px', alignItems: "center" }}>
                                                    <span  ><MapPin style={{
                                                        fontSize: "13px", color: "#666", width: "15",
                                                        height: "15"
                                                    }} /></span> {fullAddress || complaint.location}
                                                </p>

                                                {/* Complain description */}
                                                <p style={{ fontSize: "14px", marginTop: "8px" }}>
                                                    {complaint.description}
                                                </p>

                                                {/* Closing Remark Card for Closed Complaints */}
                                                {complaint?.closed_at && (
                                                    <div
                                                        style={{
                                                            marginTop: "14px",
                                                            padding: "12px 14px",
                                                            backgroundColor: "#f0fdf4",
                                                            border: "1px solid #bbf7d0",
                                                            borderRadius: "8px"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                                Closing Remark
                                                            </span>
                                                            <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 500 }}>
                                                                {complaint.closed_by_info ? `Closed by: ${complaint.closed_by_info}` : ""}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: "13px", color: "#14532d", fontWeight: 500, lineHeight: 1.4 }}>
                                                            {closingComment?.comment || "Complaint closed."}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* timeline */}
                                                <h4 style={{ marginTop: "20px" }}>Timeline</h4>
                                                <div
                                                    style={{
                                                        backgroundColor: '#F3F4F6',
                                                        padding: "5px 15px",
                                                        borderRadius: "8px",
                                                    }}
                                                >
                                                    <div style={styles.timeline}>

                                                        {timeline.map((item, i) => (

                                                            <div
                                                                key={i}
                                                                style={styles.timelineItem}
                                                                onClick={() => {

                                                                    setPopupData({
                                                                        status: item.status,
                                                                        message: item.data?.comment || "No message available",
                                                                        images: item.showImages ? complaint.media : []
                                                                    });

                                                                }}
                                                            >

                                                                <div style={styles.dot}></div>

                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div >

                                                                        <p style={{ fontWeight: 500 }}>
                                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                                        </p>

                                                                        <p style={{ fontSize: "12px", color: "#777" }}>
                                                                            {item.role} • {formatDate(item.date)}
                                                                        </p>

                                                                    </div>
                                                                    <div>
                                                                        <ArrowRight width={'16px'} height={'16px'} />
                                                                    </div>
                                                                </div>

                                                            </div>

                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )
                                    }
                                </div>

                                {(onSendNotice || canCloseComplaint) && complaint && (
                                    <div className='flex items-center justify-end gap-3 border-t border-[#D6D9DE] bg-white p-3'>
                                        {onSendNotice && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const complaintForNotice = {
                                                        ...complaint,
                                                        title: complaint.title || complaintTypeMap[complaint.complaint_type_id] || complaint.complaint_type || 'Complaint',
                                                        complaint_type: complaintTypeMap[complaint.complaint_type_id] || complaint.complaint_type || complaint.title,
                                                        statusDisplay: complaint.status ? (complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)) : 'Pending'
                                                    };
                                                    onSendNotice(complaintForNotice);
                                                }}
                                                style={{
                                                    padding: '9px 16px',
                                                    backgroundColor: 'transparent',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    fontWeight: 500,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {t('table:sendNotice', 'Send Notice')}
                                            </button>
                                        )}

                                        {canCloseComplaint && (
                                            <button
                                                type="button"
                                                onClick={handleOpenCloseModal}
                                                disabled={closing}
                                                style={{
                                                    background: "#16a34a",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    padding: "9px 20px",
                                                    cursor: closing ? "not-allowed" : "pointer",
                                                    opacity: closing ? 0.7 : 1,
                                                    fontWeight: 500,
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                Close Complaint
                                            </button>
                                        )}
                                    </div>
                                )}

                            </motion.div>


                        </div >

                    </>
                )}

            </AnimatePresence >

            {/* Close Complaint Modal with Mandatory Remark */}
            <AnimatePresence>
                {showCloseModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 2100,
                            padding: "16px"
                        }}
                        onClick={() => !closing && setShowCloseModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "#fff",
                                borderRadius: "12px",
                                width: "100%",
                                maxWidth: "480px",
                                padding: "24px",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#111827" }}>
                                    Close Complaint
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => !closing && setShowCloseModal(false)}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: "18px",
                                        color: "#6b7280"
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#4b5563" }}>
                                Are you sure you want to close Complaint <strong>#{complaint?.id}</strong>? Please provide a mandatory remark.
                            </p>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                                    Closing Remark <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <textarea
                                    value={closeRemark}
                                    onChange={(e) => {
                                        setCloseRemark(e.target.value);
                                        if (closeRemarkError) setCloseRemarkError("");
                                    }}
                                    rows={4}
                                    placeholder="Enter closing remark / reason for closure..."
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: closeRemarkError ? "1px solid #ef4444" : "1px solid #d1d5db",
                                        outline: "none",
                                        fontSize: "14px",
                                        fontFamily: "inherit",
                                        resize: "vertical",
                                        boxSizing: "border-box"
                                    }}
                                />
                                {closeRemarkError && (
                                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#ef4444" }}>
                                        {closeRemarkError}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    disabled={closing}
                                    onClick={() => setShowCloseModal(false)}
                                    style={{
                                        padding: "9px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        background: "#f9fafb",
                                        color: "#374151",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: closing ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={closing || !closeRemark.trim()}
                                    onClick={handleConfirmClose}
                                    style={{
                                        padding: "9px 20px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: !closeRemark.trim() || closing ? "#86efac" : "#16a34a",
                                        color: "#fff",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: !closeRemark.trim() || closing ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    {closing ? (
                                        <>
                                            <Loader size={16} className="animate-spin" />
                                            Closing...
                                        </>
                                    ) : (
                                        "Confirm & Close"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ResolutionPopup
                open={popupData}
                data={popupData}
                onClose={() => setPopupData(null)}
            />

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        style={styles.imageOverlay}
                        onClick={() => setSelectedImage(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <span
                            style={styles.imageClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            ✕
                        </span>
                        <motion.img
                            src={selectedImage}
                            style={styles.fullImage}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

        </>

    );

};

export default ComplaintDetailsPopup;

