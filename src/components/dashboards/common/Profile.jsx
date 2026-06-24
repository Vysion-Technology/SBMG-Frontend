
import { AnimatePresence, motion } from 'framer-motion';
import React, { use, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../services/api';

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
};


const Profile = ({ open, onClose }) => {

    const { user } = useAuth();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.employee.first_name || '',
                last_name: user.employee.last_name || '',
                email: user?.email || '',
                mobile_number: user.employee.mobile_number || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // console.log('Profile', user)

    const formSubmit = async (e) => {
        e.preventDefault();

        // Mobile validation (only if entered)
        if (
            formData.mobile_number &&
            !/^[6-9]\d{9}$/.test(formData.mobile_number)
        ) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        // Email validation (only if entered)
        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                mobile_number: formData.mobile_number
            };

            const res = await apiClient.put(
                'auth/profile', {
                _id: user.id,
                payload
            }
            );

            onClose();
        } catch (error) {
            console.error('Profile Update Error', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <AnimatePresence>
                {
                    open && (
                        <div style={styles.overlay}>
                            <motion.div
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
                                        <h2>Profile</h2>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <span
                                                style={{ cursor: "pointer" }}
                                                onClick={onClose}
                                            >
                                                ✕
                                            </span>
                                        </div>
                                    </div>

                                    <form onSubmit={formSubmit} className="flex flex-col flex-1 overflow-hidden">
                                        <div className='!p-5  flex flex-col gap-5  overflow-y-auto flex-1' >
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="FirstName"> First Name </label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={formData.first_name}
                                                    onChange={handleChange}
                                                    className='w-full h-[38px] rounded-lg border border-[#D6D9DE] !px-3 text-sm'
                                                    placeholder='Enter First Name'
                                                />                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="LastName"> Last Name </label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleChange}
                                                    className='w-full h-[38px] rounded-lg border border-[#D6D9DE] !px-3 text-sm'
                                                    placeholder='Enter Last Name'
                                                />                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="Contact_Number"> Contact Number </label>
                                                <input
                                                    type="text"
                                                    name="mobile_number"
                                                    value={formData.mobile_number}
                                                    onChange={handleChange}
                                                    className='w-full h-[38px] rounded-lg border border-[#D6D9DE] !px-3 text-sm'
                                                    placeholder='Enter Contact Number'
                                                />                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="Role"> Role </label>
                                                <input value={user.role} disabled type="text" className='w-full h-[38px] bg-gray-100 cursor-not-allowed rounded-lg border border-[#D6D9DE] !px-3 text-sm text-[#343434] outline-none focus:border-[#10b981] placeholder:opacity-40  ' placeholder='Enter Your Contact Number' />
                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="username"> username </label>
                                                <input type="text" value={user.username} disabled className='w-full h-[38px] cursor-not-allowed rounded-lg border border-[#D6D9DE] !px-3 text-sm text-[#343434] outline-none focus:border-[#10b981] placeholder:opacity-40 bg-gray-100 ' placeholder='Enter Your Contact Number' />
                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <label className='font-sm font-medium text-[#343434] ' htmlFor="Email"> Email </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className='w-full h-[38px] rounded-lg border border-[#D6D9DE] !px-3 text-sm'
                                                    placeholder='Enter Email'
                                                />                                            </div>
                                        </div>

                                        <div className='flex items-center justify-end gap-3 border-t border-[#D6D9DE] !p-4 bg-white'>
                                            <button onClick={onClose} className='!px-5 !py-2 rounded-lg border border-[#D6D9DE] bg-[#F5F6F7]  text-sm font-medium text-[#343434] hover:bg-gray-200 transition-colors'>
                                                Close
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className='!py-2 rounded-lg bg-[#10b981] !px-8 text-sm font-medium text-white'
                                            >
                                                {loading ? 'Saving...' : 'Save Profile'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

            </AnimatePresence>
        </>
    )
}

export default Profile