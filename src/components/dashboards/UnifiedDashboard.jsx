import React, { useState, useEffect } from 'react';
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
  Building,
  Menu
} from 'lucide-react';
import swachLogo from '../../assets/logos/swach.png';
import Header from '../common/Header';
import TopHeaderBar from '../common/TopHeaderBar';
import DashboardContent from './DashboardContent';
import ComplaintsContent from './ComplaintsContent';
import AttendanceContent from './AttendanceContent';
import InspectionContent from './InspectionContent';
import VillageMasterContent from './VillageMasterContent';
import SchemesContent from './SchemesContent';
import EventsContent from './EventsContent';
import NotoficationContent from './NoticeContent';
import GpsTrackingContent from './GpsTrackingContent';
import PaymentsContent from './PaymentsContent';
import FeedbacksContent from './FeedbacksContent';
import ContractorDetails from './ContractorDetails';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

const Sidebar = ({ activeItem, setActiveItem, isSidebarOpen, onItemSelect }) => {
  const handleItemClick = (item) => {
    setActiveItem(item.name);
    onItemSelect?.();
  };
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Complaints', icon: FileText },
    { name: 'CSC Cleaning', icon: CheckCircle },
    { name: 'Inspection', icon: ListChecks },
    { name: 'GP Master Data', icon: Database },
    { name: 'Contractor Details', icon: Building },
    { name: 'Schemes', icon: Briefcase },
    { name: 'Events', icon: Calendar },
    { name: 'GPS Tracking', icon: Truck },
    { name: 'Payments', icon: CreditCard },
    { name: 'Notices', icon: Bell },
    { name: 'Feedbacks', icon: MessageSquare }
  ];

  return (
    <aside className="h-screen flex flex-col m-0 p-0 transition-all duration-250 ease-in-out" style={{
      width: isSidebarOpen ? '272px' : '80px',
      height: '100%',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'hidden',
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
          justifyContent: isSidebarOpen ? 'center' : 'center',
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
            const isActive = item.name === activeItem;

            return (
              <li key={item.name} style={{ marginTop: '10px' }}>
                <button
                  onClick={() => handleItemClick(item)}
                  title={!isSidebarOpen ? item.name : ''}
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
                    }}>{item.name}</span>
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

const UnifiedDashboard = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [complaintsInitialFilter, setComplaintsInitialFilter] = useState(null);

  const scrollToMainTable = (scrollTarget = 'default') => {
    // Scroll to the main data table after a brief delay to allow component to render
    setTimeout(() => {
      let selector = '[data-table-scroll]';
      
      // For complaints, scroll to the complaints list table instead of district summary
      if (scrollTarget === 'complaints-list') {
        selector = '[data-complaints-list-table]';
      }
      
      const tableContainer = document.querySelector(selector);
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleNavigateToComplaints = (filter) => {
    setComplaintsInitialFilter(filter);
    setActiveItem('Complaints');
    scrollToMainTable('complaints-list');
  };

  const handleNavigateToAttendance = () => {
    setActiveItem('CSC Cleaning');
    scrollToMainTable();
  };

  const handleNavigateToGPMasterData = () => {
    setActiveItem('GP Master Data');
    scrollToMainTable();
  };

  const handleNavigateToGPSTracking = () => {
    setActiveItem('GPS Tracking');
    scrollToMainTable();
  };

  const handleNavigateToContractorDetails = () => {
    setActiveItem('Contractor Details');
    scrollToMainTable();
  };

  const handleNavigateToInspection = () => {
    setActiveItem('Inspection');
    scrollToMainTable();
  };

  const handleNavigateToSchemes = () => {
    setActiveItem('Schemes');
    // Scroll to top to prevent auto-scrolling to bottom
    window.scrollTo(0, 0);
  };

  const handleNavigateToEvents = () => {
    setActiveItem('Events');
    // Scroll to top to prevent auto-scrolling to bottom
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
    else setIsSidebarOpen(true);
  }, [isMobile]);

  const handleMenuClick = () => setIsSidebarOpen((prev) => !prev);
  const handleSidebarItemSelect = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return <DashboardContent onNavigateToComplaints={handleNavigateToComplaints} onNavigateToAttendance={handleNavigateToAttendance} onNavigateToGPMasterData={handleNavigateToGPMasterData} onNavigateToGPSTracking={handleNavigateToGPSTracking} onNavigateToContractorDetails={handleNavigateToContractorDetails} onNavigateToInspection={handleNavigateToInspection} onNavigateToSchemes={handleNavigateToSchemes} onNavigateToEvents={handleNavigateToEvents} />;
      case 'Complaints':
        return <ComplaintsContent initialFilter={complaintsInitialFilter} onFilterConsumed={() => setComplaintsInitialFilter(undefined)} />;
      case 'CSC Cleaning':
        return <AttendanceContent />;
      case 'Inspection':
        return <InspectionContent />;
      case 'GP Master Data':
        return <VillageMasterContent />;
      case 'Contractor Details':
        return <ContractorDetails />;
      case 'Schemes':
        return <SchemesContent />;
      case 'Events':
        return <EventsContent />;
      case 'GPS Tracking':
        return <GpsTrackingContent />;
      case 'Payments':
        return <PaymentsContent />;
      case 'Notices':
        return <NotoficationContent />;
      case 'Feedbacks':
        return <FeedbacksContent />;
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
    <div className="unified-dashboard" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      minWidth: 0,
      maxWidth: '100vw',
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
        minWidth: 0,
        width: '100%',
        overflow: 'hidden',

        position: 'relative'
      }}>
        {/* Mobile overlay backdrop */}
        {isMobile && isSidebarOpen && (
          <div
            className="sidebar-mobile-overlay"
            onClick={handleMenuClick}
            aria-hidden="true"
          />
        )}
        {/* Sidebar: on mobile = overlay (takes no layout space), on desktop = inline */}
        <div
          className={`sidebar-wrapper overflow-x-hidden overflow-y-auto ${isMobile ? 'sidebar-mobile' : ''} ${isMobile && isSidebarOpen ? 'open' : ''}`}
          style={{
            ...(!isMobile && {
              width: isSidebarOpen ? 272 : 80,
              minWidth: isSidebarOpen ? 272 : 80,
              transition: 'width 0.25s ease',
              flexShrink: 0
            }),
            ...(isMobile && {
              width: 0,
              minWidth: 0,
              maxWidth: 0,
              overflow: 'visible',
              flexShrink: 0
            })
          }}
        >
          <Sidebar
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            isSidebarOpen={isMobile ? true : isSidebarOpen}
            onItemSelect={handleSidebarItemSelect}
          />
        </div>
        <div className="flex-1 dashboard-main-content" style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          backgroundColor: '#F3F4F6',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Header
            pageTitle={activeItem}
            onMenuClick={handleMenuClick}
            onNotificationsClick={() => setActiveItem('Notices')}
            isMobile={isMobile}
          />
          <div className={`dashboard-tab-content dashboard-tab-${String(activeItem).replace(/\s+/g, '-')}`} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;