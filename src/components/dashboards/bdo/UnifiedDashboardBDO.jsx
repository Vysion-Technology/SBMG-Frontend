import React, { use } from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  ListChecks,
  Database,
  Briefcase,
  Calendar,
  Truck,
  Bell,
  CreditCard,
  MessageSquare,
  Building
} from 'lucide-react';
import { useState } from 'react';
import swachLogo from '../../../assets/logos/swach.png';
import Header from '../../common/Header';
import TopHeaderBar from '../../common/TopHeaderBar';
import BDODashboardContent from './BDODashboardContent';
import BDOComplaintsContent from './BDOComplaintsContent';
import BDOAttendanceContent from './BDOAttendanceContent';
import BDOInspectionContent from './BDOInspectionContent';
import BDOVillageMasterContent from './BDOVillageMasterContent';
import BDOSchemesContent from './BDOSchemesContent';
import BDOEventsContent from './BDOEventsContent';
import BDONoticeContent from './BDONoticeContent';
import BDOGpsTrackingContent from './BDOGpsTrackingContent';
import PaymentsContent from '../PaymentsContent';
import BDOFeedbackContent from './BDOFeedback';
import { useBDOLocation } from '../../../context/BDOLocationContext';
import BDOContractorDetails from './BDOContractorDetails';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ activeItem, setActiveItem, isSidebarOpen }) => {

  const handleItemClick = (key) => {
    setActiveItem(key);
  };

  const { t } = useTranslation(['dashboard', 'common'])

  const menuItems = [
    { key: 'dashboard', label: t('common:dashboard'), icon: LayoutDashboard },
    { key: 'complaints', label: t('common:complaints'), icon: FileText },
    { key: 'cscCleaning', label: t('common:cscCleaning'), icon: CheckCircle },
    { key: 'inspection', label: t('common:inspection'), icon: ListChecks },
    { key: 'gpMasterData', label: t('common:gpMasterData'), icon: Database },
    { key: 'contractorDetails', label: t('common:contractorDetails'), icon: Building },
    { key: 'schemes', label: t('common:schemes'), icon: Briefcase },
    { key: 'events', label: t('common:events'), icon: Calendar },
    { key: 'gpsTracking', label: t('common:gpsTracking'), icon: Truck },
    { key: 'payments', label: t('common:payments'), icon: CreditCard },
    { key: 'notices', label: t('common:notices'), icon: Bell },
    { key: 'feedbacks', label: t('common:feedbacks'), icon: MessageSquare }
  ];

  return (
    <aside className="h-screen flex flex-col m-0 p-0 transition-all duration-250 ease-in-out" style={{
      width: isSidebarOpen ? '272px' : '80px',
      height: '100%',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      transition: 'width 0.25s ease'
    }}>
      {/* Logo Section */}
      <div style={{
        paddingLeft: '6px',
        paddingRight: '6px',
        margin: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isSidebarOpen ? '12px' : '0',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          margin: 10,
          padding: '5px',
          minHeight: '48px'
        }}>
          {/* Swach Logo */}
          <div style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src={swachLogo}
              alt="Swach Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          {isSidebarOpen && (
            <div>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#059669',
                margin: 0,
                whiteSpace: 'nowrap'
              }}>SBMG</h2>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        paddingLeft: isSidebarOpen ? '16px' : '8px',
        paddingRight: isSidebarOpen ? '16px' : '8px',
        overflowY: 'auto',
        overflowX: 'hidden',
        margin: 0
      }}>
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none'
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeItem;

            return (
              <li key={item.key} style={{ marginTop: '10px' }}>
                <button
                  onClick={() => handleItemClick(item.key)}
                  title={!isSidebarOpen ? item.label : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    gap: isSidebarOpen ? '12px' : '0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    position: 'relative',
                    borderLeft: isActive ? '4px solid #22c55e' : '4px solid transparent',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    color: '#374151',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 8px',
                    paddingLeft: isSidebarOpen ? '30px' : '8px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <Icon style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0
                  }} />
                  {isSidebarOpen && (
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>{item.label}</span>
                  )}

                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

const UnifiedDashboardBDO = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const bdoLocation = useBDOLocation();

  const { t } = useTranslation(['common','dashboard']);


  // Show loading screen while BDO data is being fetched
  if (!bdoLocation || bdoLocation.loadingBDOData || !bdoLocation.bdoDistrictId || !bdoLocation.bdoBlockId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#F3F4F6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading BDO Dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <BDODashboardContent />;
      case 'complaints':
        return <BDOComplaintsContent />;
      case 'cscCleaning':
        return <BDOAttendanceContent />;
      case 'inspection':
        return <BDOInspectionContent />;
      case 'gpMasterData':
        return <BDOVillageMasterContent />;
      case 'contractorDetails':
        return <BDOContractorDetails />;
      case 'schemes':
        return <BDOSchemesContent />;
      case 'events':
        return <BDOEventsContent />;
      case 'gpsTracking':
        return <BDOGpsTrackingContent />;
      case 'payments':
        return <PaymentsContent />;
      case 'notices':
        return <BDONoticeContent />;
      case 'feedbacks':
        return <BDOFeedbackContent />;
      default:
        return (
          <div style={{ padding: '4px' }}>
            <h2 style={{ color: '#374151', fontSize: '20px' }}>{activeItem} Content</h2>
            <p style={{ color: '#6b7280' }}>This is the {activeItem} section content.</p>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'white',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <TopHeaderBar />
      <div className="flex flex-1 min-h-0" style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <div className={`transition-all duration-250 ease-in-out flex-shrink-0`} style={{
          width: isSidebarOpen ? '272px' : '80px',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <Sidebar
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
        <div className="flex-1 dashboard-main-content bg-gray-100 m-0 p-0 flex flex-col overflow-auto" style={{
          flex: 1,
          backgroundColor: '#F3F4F6',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          <Header
            pageTitle={t(activeItem)}
            onMenuClick={() => setIsSidebarOpen(prev => !prev)}
            onNotificationsClick={() => setActiveItem('notices')}
          />
          <div className={`dashboard-tab-content dashboard-tab-${String(activeItem).replace(/\s+/g, '-')}`} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboardBDO;

