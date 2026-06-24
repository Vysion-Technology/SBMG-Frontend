import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ReconfirmationWarningBanner = ({ onNavigateToReconfirm }) => {
  const { user } = useAuth();
  
  if (!user?.gp_data_status) return null;
  
  const { days_remaining, is_overdue } = user.gp_data_status;
  
  // Show if deadline is approaching (<= 7 days) and not already overdue
  if (days_remaining > 7 || is_overdue) return null;

  return (
    <div style={{
      backgroundColor: '#fffbeb',
      borderBottom: '1px solid #fde68a',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      flexShrink: 0,
      cursor: 'pointer',
      zIndex: 50
    }}
    onClick={onNavigateToReconfirm}
    >
      <AlertTriangle size={18} color="#d97706" />
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#92400e'
      }}>
        Your GP Master Data reconfirmation is due in {days_remaining} days. Please review it now to avoid service interruption.
      </span>
      <button style={{
        backgroundColor: '#f59e0b',
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
        Review Now <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default ReconfirmationWarningBanner;
