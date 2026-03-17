import React from "react";
import { MEDIA_BASE_URL } from "../../../services/api";

const ResolutionPopup = ({ open, onClose, data }) => {
    if (!open) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>

                <div style={styles.header}>
                    <h3 style={{ fontWeight: 600 }}>Resolution</h3>
                    <span style={styles.close} onClick={onClose}>✕</span>
                </div>

                <p style={styles.message}>
                    {data?.message}
                </p>

                <div style={styles.imageRow}>
                    {data?.images?.map((img, i) => (
                        <img
                            key={i}
                            src={`${MEDIA_BASE_URL}/${img.media_url}`}
                            style={styles.image}
                        />
                    ))}
                </div>

                <button style={styles.closeBtn} onClick={onClose}>
                    Close
                </button>

            </div>
        </div>
    );
};

export default ResolutionPopup;

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
        zIndex: 1000
    },

    modal: {
        background: "#fff",
        width: "520px",
        borderRadius: "10px",
        padding: "20px"
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
        borderRadius: "6px"
    },

    closeBtn: {
        marginTop: "15px",
        background: "#16a34a",
        color: "#fff",
        border: "none",
        width: "100%",
        padding: "10px",
        borderRadius: "6px",
        cursor: "pointer"
    }
}