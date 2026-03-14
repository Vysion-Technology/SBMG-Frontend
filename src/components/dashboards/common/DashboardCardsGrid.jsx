import React from 'react';
import { Calendar, ChevronDown, Info } from 'lucide-react';
import AttendanceCard from './AttendanceCard';
import InspectionCard from './InspectionCard';
import ContractorDetailsCard from './ContractorDetailsCard';
import SchemesEventsCard from './SchemesEventsCard';
import GPMasterDataCard from './GPMasterDataCard';
import GPSTrackingCard from './GPSTrackingCard';
import PerformanceCard from './PerformanceCard';
import Top3Card from './Top3Card';

/**
 * Placeholder card shell for dashboard cards still to be built.
 */
const CardShell = ({ title, children, backgroundColor = 'white', datePicker = false }) => (
  <div style={{
    backgroundColor,
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 20,
    minHeight: 120,
    position: 'relative'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
        <Info size={14} color="#9ca3af" style={{ cursor: 'pointer' }} />
      </div>
      {datePicker && (
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8,
          backgroundColor: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280'
        }}>
          <Calendar size={14} /> Today <ChevronDown size={14} />
        </button>
      )}
    </div>
    {children || <div style={{ color: '#9ca3af', fontSize: 13 }}>Content placeholder</div>}
  </div>
);

/**
 * Dashboard cards grid layout.
 * Top section: Attendance (left) | Stack (right: Inspection, Contractor, Schemes+Events)
 * Then: GP Master Data, GPS Tracking, Performance, Top 3
 */
const DashboardCardsGrid = ({
  dateLabel = 'Today',
  attendanceData,
  attendanceLoading,
  attendanceError,
  inspectionData,
  inspectionLoading,
  inspectionError,
  contractorData,
  contractorLoading,
  contractorError,
  schemesData,
  schemesLoading,
  schemesError,
  eventsData,
  eventsLoading,
  eventsError,
  gpMasterData,
  gpMasterLoading,
  gpMasterError,
  gpsData,
  gpsLoading,
  gpsError,
  topPerformers,
  onAttendanceClick,
  onInspectionClick,
  onContractorClick,
  onGPMasterDataClick,
  onGPSTrackingClick
}) => (
  <div className="dashboard-cards-grid" style={{ marginLeft: 16, marginRight: 16, marginTop: 16, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
    {/* Top section: Attendance (full height) | Stack (Inspection, Contractor, Schemes+Events) */}
    <div className="dashboard-cards-top" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
      <div
        onClick={() => onAttendanceClick?.()}
        style={{ height: '100%', minHeight: 0, minWidth: 0, cursor: 'pointer' }}>
        <AttendanceCard
          total={attendanceData?.total ?? 0}
          present={attendanceData?.present ?? 0}
          absent={attendanceData?.absent}
          dateLabel={dateLabel}
          fillHeight
          loading={attendanceLoading}
          error={attendanceError}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div onClick={() => onInspectionClick?.()} style={{ cursor: 'pointer' }}>
          <InspectionCard
            averageScore={inspectionData?.averageScore ?? 0}
            totalInspections={inspectionData?.totalInspections ?? 0}
            villageCovered={inspectionData?.villageCovered ?? '0/0'}
            dateLabel={dateLabel}
            loading={inspectionLoading}
            error={inspectionError}
          />
        </div>
        <div onClick={() => onContractorClick?.()} style={{ cursor: 'pointer' }}>
          <ContractorDetailsCard
            dataFilledPercent={contractorData?.dataFilledPercent ?? 0}
            dataFilledCovered={contractorData?.dataFilledCovered ?? '0/0'}
            dateLabel={dateLabel}
            loading={contractorLoading}
            error={contractorError}
          />        </div>        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: 0 }}>
          <SchemesEventsCard
            title="Schemes"
            total={schemesData?.total ?? 0}
            active={schemesData?.active ?? 0}
            inactive={schemesData?.inactive ?? 0}
            tooltipText="Total, active, and inactive schemes."
            loading={schemesLoading}
            error={schemesError}
          />
          <SchemesEventsCard
            title="Events"
            total={eventsData?.total ?? 0}
            active={eventsData?.active ?? 0}
            inactive={eventsData?.inactive ?? 0}
            tooltipText="Total, active, and inactive events."
            loading={eventsLoading}
            error={eventsError}
          />
        </div>
      </div>
    </div>

    {/* Rest of dashboard cards: equal-width columns */}
    <div className="dashboard-cards-bottom" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      gridTemplateAreas: `
        "gpMaster gpsTracking"
        "performance top3"
      `,
      gridTemplateRows: 'auto auto',
      alignItems: 'stretch'
    }}>
      <div style={{ gridArea: 'gpMaster', minHeight: 0, cursor: 'pointer' }} onClick={() => onGPMasterDataClick?.()}>
        <GPMasterDataCard
          total={gpMasterData?.total ?? 0}
          villageCoveragePercent={gpMasterData?.villageCoveragePercent ?? 0}
          totalFundsSanctioned={gpMasterData?.totalFundsSanctioned ?? 0}
          dateLabel={dateLabel}
          loading={gpMasterLoading}
          error={gpMasterError}
        />
      </div>
      <div style={{ gridArea: 'gpsTracking', minHeight: 0, cursor: 'pointer' }} onClick={() => onGPSTrackingClick?.()}>
        <GPSTrackingCard
          total={gpsData?.total ?? 0}
          running={gpsData?.running ?? 0}
          stopped={gpsData?.stopped ?? 0}
          dateLabel={dateLabel}
          loading={gpsLoading}
          error={gpsError}
        />
      </div>
      <div style={{ gridArea: 'performance', minHeight: 0, height: '100%' }}>
        <PerformanceCard fillHeight />
      </div>
      <div style={{ gridArea: 'top3', minHeight: 0, height: '100%' }}>
        <Top3Card topPerformersByLoc={topPerformers} fillHeight />
      </div>
    </div>
  </div>
);

export default DashboardCardsGrid;
