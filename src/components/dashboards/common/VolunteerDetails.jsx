import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react'
import apiClient, { MEDIA_BASE_URL } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from "react-to-print";
import { Printer } from 'lucide-react';

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
        zIndex: 9999
    },

    modal: {
        background: "#fff",
        width: "500px",
        height: "100%",
        borderRadius: "0px",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" // 🔥 depth feel
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



const Info = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 mb-1">
            {label}
        </p>

        <p className="font-medium text-gray-800 break-words">
            {value || "-"}
        </p>
    </div>
);

const VolunteerDetails = ({ open, onClose, volunteerId }) => {



    const printRef = useRef();


    const [volunteer, setVolunteer] = useState(null);

    const { t } = useTranslation(['common', 'table'])

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: volunteer?.full_name || "Volunteer Details",
    });



    useEffect(() => {
        const fetchVolunteer = async () => {
            try {
                const res = await apiClient.get(`volunteers/${volunteerId}`);
                setVolunteer(res.data);
            } catch (error) {
                console.error("Volunteer fetch error:", error);
            }
        };

        if (volunteerId) {
            fetchVolunteer();
        }
    }, [volunteerId]);



    if (!volunteer && open) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal} className="flex items-center justify-center">
                    Loading...
                </div>
            </div>
        );
    }



    return (

        <>

            <style>
                {`
@media print {

    @page {
        size: A4;
        margin: 10mm;
    }

    body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    .print-section {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow: visible !important;
    }

    .overflow-y-auto,
    .overflow-hidden {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
    }

    .no-print {
        display: none !important;
    }
}
`}
            </style>

            <AnimatePresence>
                {
                    open && (
                        <div style={styles.overlay}>

                            <motion.div
                                ref={printRef}
                                className="print-section"
                                style={styles.modal}
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className='flex flex-col h-full '>
                                    {/* header */}
                                    <div style={styles.header}>
                                        <h2>{t('table:volunteerDetails')}</h2>
                                        <div className='no-print' style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <button
                                                onClick={handlePrint}
                                                style={styles.printBtn}                                            >
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

                                    {/* Details Start */}
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto !p-5 !space-y-6">

                                            {/* Profile Card */}
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl !p-4 shadow-xl border border-gray-200">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={MEDIA_BASE_URL+volunteer?.photo_url}
                                                        alt="Volunteer"
                                                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
                                                    />

                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-800">
                                                            {volunteer?.full_name}
                                                        </h3>

                                                        <span className="inline-block mt-2 !px-3 !py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                            {volunteer?.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personal Details */}
                                            <div className="shadow-xl border border-gray-200 rounded-xl !p-4">
                                                <h4 className="font-semibold text-gray-800 !mb-4">
                                                    {t('table:personalInformation')}
                                                </h4>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <Info label={t('table:dateOfBirth')} value={volunteer?.date_of_birth} />
                                                    <Info label={t('table:gender')} value={volunteer?.gender} />
                                                    <Info label={t('table:mobileNumber')} value={volunteer?.mobile_number} />
                                                    <Info label={t('table:alternateMobile')} value={volunteer?.alternate_mobile} />
                                                    <Info label={t('table:email')} value={volunteer?.email} />
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="shadow-xl border border-gray-200 rounded-xl !p-4">
                                                <h4 className="font-semibold text-gray-800 !mb-4">
                                                    {t('table:addressInformation')}
                                                </h4>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <Info label={t('table:state')} value={volunteer?.state} />
                                                    <Info label={t('table:district')} value={volunteer?.district_name} />
                                                    <Info label={t('table:block')} value={volunteer?.block_name} />
                                                    <Info label={t('table:gramPanchayat')} value={volunteer?.gp_name} />
                                                    <Info label={t('table:village')} value={volunteer?.village_name} />
                                                    <Info label={t('table:wardNumber')} value={volunteer?.ward_number} />
                                                    <Info label={t('table:pinCode')} value={volunteer?.pin_code} />
                                                </div>

                                                <div className="mt-4">
                                                    <Info
                                                        label={t('table:fullAddress')}
                                                        value={volunteer?.full_address}
                                                    />
                                                </div>
                                            </div>

                                            {/* Professional */}
                                            <div className="shadow-xl border border-gray-200 rounded-xl !p-4">
                                                <h4 className="font-semibold text-gray-800 !mb-4">
                                                    {t('table:professionalInformation')}
                                                </h4>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <Info
                                                        label={t('table:highestQualification')}
                                                        value={volunteer?.highest_qualification}
                                                    />

                                                    <Info
                                                        label={t('table:currentOccupation')}
                                                        value={volunteer?.current_occupation}
                                                    />

                                                    <Info
                                                        label={t('table:organization')}
                                                        value={volunteer?.organization_name}
                                                    />

                                                    <Info
                                                        label={t('table:fitnessLevel')}
                                                        value={volunteer?.fitness_level}
                                                    />
                                                </div>
                                            </div>

                                            {/* Volunteer Details */}
                                            <div className="shadow-xl border border-gray-200 rounded-xl !p-4">
                                                <h4 className="font-semibold text-gray-800 !mb-4">
                                                    {t('table:volunteerPreferences')}
                                                </h4>

                                                <div className="!space-y-4">

                                                    <div>
                                                        <p className="text-xs text-gray-500 !mb-2">
                                                            {t('table:serviceTypes')}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2">
                                                            {volunteer?.service_types?.map((item, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="!px-3 !py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                                                                >
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-gray-500 !mb-2">
                                                            {t('table:preferredDays')}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2">
                                                            {volunteer?.preferred_days?.map((item, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="!px-3 !py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                                                                >
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <Info
                                                            label={t('table:hoursPerWeek')}
                                                            value={volunteer?.hours_per_week}
                                                        />

                                                        <Info
                                                            label={t('table:commitmentDuration')}
                                                            value={volunteer?.commitment_duration}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            <div className="shadow-xl border-gray-200  border rounded-xl !p-4">
                                                <h4 className="font-semibold text-gray-800 !mb-4">
                                                    {t('table:skillsAvailability')}
                                                </h4>

                                                <div className="!space-y-4">

                                                    <div className="grid grid-cols-2 gap-4">

                                                        <div className="bg-green-50  shadow border border-gray-100 rounded-lg !p-3">
                                                            <p className="text-xs text-gray-500">
                                                                {t('table:workInOtherVillages')}
                                                            </p>

                                                            <p className="font-medium text-green-700">
                                                                {volunteer?.willing_to_work_other_villages ? "Yes" : "No"}
                                                            </p>
                                                        </div>

                                                        <div className="bg-green-50 shadow border border-gray-100 rounded-lg !p-3">
                                                            <p className="text-xs text-gray-500">
                                                                {t('table:bringMoreVolunteers')}
                                                            </p>

                                                            <p className="font-medium text-green-700">
                                                                {volunteer?.can_bring_more_volunteers ? "Yes" : "No"}
                                                            </p>
                                                        </div>

                                                    </div>

                                                    <div className='flex justify-between items-center'>
                                                        <Info
                                                            label={t('table:relevantSkills')}
                                                            value={volunteer?.relevant_skills}
                                                        />

                                                        {volunteer?.can_bring_more_volunteers && (
                                                            <Info
                                                                label={t('table:additionalVolunteersCount')}
                                                                value={volunteer?.additional_volunteers_count}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Footer */}
                                        <div className="no-print shadow-xl border-gray-200 border-t !p-4 bg-white flex justify-end">
                                            <button
                                                onClick={onClose}
                                                className="!px-6 !py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200"
                                            >
                                                {t('table:close')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

            </AnimatePresence>

        </>
    )
}

export default VolunteerDetails