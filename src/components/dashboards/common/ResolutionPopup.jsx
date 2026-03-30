import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { MEDIA_BASE_URL } from "../../../services/api";

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "end",   // ✅ center
        alignItems: "center",       // ✅ vertical center
        zIndex: 1000
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

    modal: {
        background: "#fff",
        width: "500px",
        maxHeight: "80vh",          // ✅ full height nahi
        height: "auto",             // ✅ content based
        padding: "20px",
        borderRadius: "12px",       // 🔥 better look
        overflowY: "auto",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        marginLeft: "80px"          // 👉 thoda right shift feel
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px"
    },

    close: {
        cursor: "pointer",
        fontSize: "18px"
    },

    message: {
        fontSize: "14px",
        color: "#555",
        marginBottom: "15px"
    },

    imageRow: {
        display: "flex",
        gap: "10px"
    },

    image: {
        width: "50%",
        height: "160px",
        objectFit: "cover",
        borderRadius: "6px",
        cursor: 'pointer'
    },

    closeBtn: {
        marginTop: "15px",
        background: "#16a34a",
        color: "#fff",
        border: "none",
        width: "100%",
        padding: "10px",
        borderRadius: "6px",
        cursor: "pointer",


    }
};

const ResolutionPopup = ({ open, onClose, data }) => {

    const [selectedImage, setSelectedImage] = React.useState(null);

    const statusTitleMap = {
        "Complaint Created": "Complaint Details",
        "Resolved": "Resolution Details",
        "Verified": "Verification Details",
        "Closed": "Closure Details"
    };
    return (
        <AnimatePresence>
            {open && (
                <div style={styles.overlay}>

                    <motion.div
                        style={styles.modal}
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 80, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div style={styles.header}>
                            <h3 style={{ fontWeight: 600 }}>
                                {statusTitleMap[data?.status] || "Details"}
                            </h3>
                            <span style={styles.close} onClick={onClose}>✕</span>
                        </div>

                        {/* Message */}
                        <p style={styles.message}>
                            {data?.message}
                        </p>

                        {/* Images */}
                        <div style={styles.imageRow}>
                            {data?.images?.map((img, i) => (
                                <img
                                    key={i}
                                    src={`${MEDIA_BASE_URL}/${img.media_url}`}
                                    style={styles.image}
                                    onClick={() => setSelectedImage(`${MEDIA_BASE_URL}/${img.media_url}`)}
                                />
                            ))}
                        </div>

                        <button style={styles.closeBtn} onClick={onClose}>
                            Close
                        </button>

                    </motion.div>

                </div>
            )}

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
                        onClick={(e) => e.stopPropagation()} // ✅ close na ho image click pe
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResolutionPopup;

