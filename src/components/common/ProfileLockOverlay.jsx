import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Check, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

const ProfileLockOverlay = () => {
  const { user, refreshMe, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: ''
  });

  useEffect(() => {
    const isOverdue = user?.profile_status?.is_overdue;
    if (isOverdue) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user?.employee?.first_name || '',
        last_name: user?.employee?.last_name || '',
        email: user?.email || '',
        mobile_number: user?.employee?.mobile_number || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const handleProfileRequired = () => {
      setIsVisible(true);
    };

    window.addEventListener('profile-update-required', handleProfileRequired);
    return () => window.removeEventListener('profile-update-required', handleProfileRequired);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.first_name.trim()) {
      alert('First name is required');
      return;
    }
    if (!formData.last_name.trim()) {
      alert('Last name is required');
      return;
    }
    if (formData.mobile_number && !/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        mobile_number: formData.mobile_number.trim()
      };

      await apiClient.put('/auth/profile', payload);
      if (refreshMe) {
        await refreshMe();
      }
      alert('Profile updated and verified successfully ✅');
      setIsVisible(false);
    } catch (error) {
      console.error('Profile Update Error:', error);
      const msg = error.response?.data?.detail || 'Failed to update profile. Please check your inputs.';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      backdropFilter: 'blur(6px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Lock size={32} color="#dc2626" />
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px'
        }}>
          Mandatory Profile Update Required
        </h2>

        <p style={{
          fontSize: '14px',
          color: '#4b5563',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          Access to other features is restricted until your profile information is reviewed and updated. This verification is required every 30 days.
        </p>

        <form onSubmit={handleUpdate} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                First Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Enter First Name"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '0 12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Last Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Enter Last Name"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '0 12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Contact Number <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleChange}
              required
              maxLength={10}
              placeholder="10-digit mobile number"
              style={{
                width: '100%',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '0 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              style={{
                width: '100%',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '0 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Saving & Verifying...' : <><UserCheck size={18} /> Update & Unlock Access</>}
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                backgroundColor: 'white',
                color: '#4b5563',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileLockOverlay;
