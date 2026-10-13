import React from 'react';
import { UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileWarningBanner = ({ onOpenProfile }) => {
  const { user } = useAuth();
  
  if (!user?.profile_status) return null;
  
  const { days_remaining, is_overdue } = user.profile_status;
  
  // Show if deadline is approaching (<= 5 days) and not already overdue
  if (days_remaining > 5 || is_overdue) return null;

  return (
    <div style={{
      backgroundColor: '#eff6ff',
      borderBottom: '1px solid #bfdbfe',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      flexShrink: 0,
      cursor: 'pointer',
      zIndex: 49
    }}
    onClick={onOpenProfile}
    >
      <UserCheck size={18} color="#2563eb" />
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#1e40af'
      }}>
        Your monthly profile verification is due in {days_remaining} days. Please verify your contact details to avoid access restriction.
      </span>
      <button style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        Update Now <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default ProfileWarningBanner;
