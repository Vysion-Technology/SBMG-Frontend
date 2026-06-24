import React, { useState, useEffect } from 'react';
import { Lock, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ReconfirmationLockOverlay = ({ onNavigateToReconfirm, activeItem }) => {
  const { user, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show if user is overdue AND not already on the reconfirm page
    const isOverdue = user?.gp_data_status?.is_overdue;
    const isNotOnReconfirmPage = activeItem !== 'gpMasterData';

    if (isOverdue && isNotOnReconfirmPage) {
      setIsVisible(true);
    } else if (!isOverdue || !isNotOnReconfirmPage) {
      setIsVisible(false);
    }
  }, [user, activeItem]);

  useEffect(() => {
    // Also listen for the global event from API interceptor
    const handleReconfirmRequired = () => {
      // Only show if we aren't already on the reconfirm page
      if (activeItem !== 'gpMasterData') {
        setIsVisible(true);
      }
    };

    window.addEventListener('gp-reconfirmation-required', handleReconfirmRequired);
    return () => window.removeEventListener('gp-reconfirmation-required', handleReconfirmRequired);
  }, [activeItem]);

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
      backdropFilter: 'blur(4px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Lock size={32} color="#dc2626" />
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '12px'
        }}>
          Mandatory GP Data Update Required
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#4b5563',
          lineHeight: '1.5',
          marginBottom: '32px'
        }}>
          Access to other app features is restricted until your Gram Panchayat Master Data is reviewed and reconfirmed. This is required every 3 months.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={() => {
              // setIsVisible(false); // Optional: keep visible until reconfirmed
              onNavigateToReconfirm();
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            Update & Reconfirm <ArrowRight size={20} />
          </button>

          <button
            onClick={logout}
            style={{
              backgroundColor: 'white',
              color: '#4b5563',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReconfirmationLockOverlay;
