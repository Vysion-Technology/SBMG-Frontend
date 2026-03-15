import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, MapPin, ChevronDown, ArrowUpDown } from 'lucide-react';
import GoogleMapView from './gps/GoogleMapView';
import FleetSidebar from './gps/FleetSidebar';
import VehicleDetailsPanel from './gps/VehicleDetailsPanel';
import AddVehicleModal from './gps/AddVehicleModal';
import DeleteConfirmModal from './gps/DeleteConfirmModal';
import { useVehicles, filterVehiclesByStatus, searchVehicles } from '../../hooks/useVehicles';
import { useVehicleDetails } from '../../hooks/useVehicleDetails';
import { useAddVehicle, useUpdateVehicle, useDeleteVehicle } from '../../hooks/useAddVehicle';
import { InfoTooltip } from '../common/Tooltip';
import apiClient from '../../services/api';

const GpsTrackingContent = () => {
  const [activeScope, setActiveScope] = useState('All');
  const [activeFleetTab, setActiveFleetTab] = useState('All(03)');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirmVehicle, setDeleteConfirmVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    districtId: null,
    blockId: null,
    gpId: null
  });

  // GPS Analytics state
  const [gpsAnalyticsData, setGpsAnalyticsData] = useState(null);
  const [loadingGpsAnalytics, setLoadingGpsAnalytics] = useState(false);
  const [gpsAnalyticsError, setGpsAnalyticsError] = useState(null);

  // Location hierarchy state for table navigation
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedDistrictForHierarchy, setSelectedDistrictForHierarchy] = useState(null);
  const [selectedBlockForHierarchy, setSelectedBlockForHierarchy] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [backButtonHover, setBackButtonHover] = useState(false);

  const scopeButtons = ['All', 'Districts', 'Blocks', 'GPs'];

  // Fetch districts from API
  const fetchDistricts = useCallback(async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  // Fetch blocks from API for a specific district
  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setBlocks([]);
      return;
    }
    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks', {
        params: {
          district_id: districtId,
          skip: 0,
          limit: 100
        }
      });
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch GPS analytics data
  const fetchGpsAnalytics = useCallback(async () => {
    try {
      setLoadingGpsAnalytics(true);
      setGpsAnalyticsError(null);

      console.log('🔄 Fetching GPS Analytics for scope:', activeScope);

      let url = '';
      if (activeScope === 'All') {
        url = '/annual-surveys/analytics/state';
        console.log('🏛️ Calling STATE GPS analytics API');
      } else if (activeScope === 'Districts' && selectedLocation.districtId) {
        url = `/annual-surveys/analytics/district/${selectedLocation.districtId}`;
        console.log('🏙️ Calling DISTRICT GPS analytics API');
      } else if (activeScope === 'Blocks' && selectedLocation.blockId) {
        url = `/annual-surveys/analytics/block/${selectedLocation.blockId}`;
        console.log('🏘️ Calling BLOCK GPS analytics API');
      } else if (activeScope === 'GPs' && selectedLocation.gpId) {
        url = `/annual-surveys/analytics/gp/${selectedLocation.gpId}`;
        console.log('🏡 Calling GP GPS analytics API');
      } else {
        console.log('⏸️ Waiting for location selection');
        return;
      }

      console.log('🌐 GPS Analytics API URL:', url);
      const response = await apiClient.get(url);
      console.log('✅ GPS Analytics API Response:', response.data);
      setGpsAnalyticsData(response.data);

    } catch (error) {
      console.error('❌ GPS Analytics API Error:', error);
      setGpsAnalyticsError(error.message || 'Failed to fetch GPS analytics data');
      setGpsAnalyticsData(null);
    } finally {
      setLoadingGpsAnalytics(false);
    }
  }, [activeScope, selectedLocation.districtId, selectedLocation.blockId, selectedLocation.gpId]);

  // Initialize districts on component mount
  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  // Fetch GPS analytics when scope or location changes
  useEffect(() => {
    fetchGpsAnalytics();
  }, [activeScope, selectedLocation, fetchGpsAnalytics]);


  // Fetch vehicles from API using location IDs
  // TODO: Connect to actual location context when available
  const { data: vehiclesData = [], isLoading: isLoadingVehicles, error: vehiclesError } = useVehicles({
    districtId: selectedLocation.districtId || 1, // Default to district 1 for demo
    blockId: selectedLocation.blockId || 1, // Default to block 1 for demo
    gpId: selectedLocation.gpId || 1, // Default to gp 1 for demo
  });

  // Fetch selected vehicle details
  const currentDate = new Date();
  const { data: vehicleDetails, isLoading: isLoadingDetails } = useVehicleDetails(
    selectedVehicle?.vehicle_id || selectedVehicle?.id,
    {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      enabled: !!selectedVehicle,
    }
  );

  // Add vehicle mutation
  const addVehicleMutation = useAddVehicle({
    onSuccess: () => {
      setShowAddVehicleModal(false);
      setEditingVehicle(null);
      alert('Vehicle added successfully!');
    },
    onError: (error) => {
      console.error('Failed to add vehicle:', error);
      alert('Failed to add vehicle. Please try again.');
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useUpdateVehicle({
    onSuccess: () => {
      setShowAddVehicleModal(false);
      setEditingVehicle(null);
      alert('Vehicle updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update vehicle:', error);
      alert('Failed to update vehicle. Please try again.');
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useDeleteVehicle({
    onError: (error) => {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle. Please try again.');
    },
  });

  // Filter and search vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehiclesData;

    // Filter by status tab
    result = filterVehiclesByStatus(result, activeFleetTab);

    // Filter by search query
    result = searchVehicles(result, searchQuery);

    // Filter by flagged status
    if (showOnlyFlagged) {
      result = result.filter(v => v.isFlagged);
    }

    return result;
  }, [vehiclesData, activeFleetTab, searchQuery, showOnlyFlagged]);

  // Calculate fleet stats
  const fleetStats = useMemo(() => {
    const all = vehiclesData.length;
    const active = vehiclesData.filter(v => v.status === 'active').length;
    const running = vehiclesData.filter(v => v.status === 'running').length;
    const stopped = vehiclesData.filter(v => v.status === 'stopped').length;

    return {
      all,
      active,
      running,
      stopped,
    };
  }, [vehiclesData]);

  // Update fleet tabs with real counts
  const fleetTabs = useMemo(() => [
    `All(${String(fleetStats.all).padStart(2, '0')})`,
    `Active(${String(fleetStats.active).padStart(2, '0')})`,
    `Running(${String(fleetStats.running).padStart(2, '0')})`,
    `Stopped(${String(fleetStats.stopped).padStart(2, '0')})`,
  ], [fleetStats]);

  const flaggedCount = vehiclesData.filter(v => v.isFlagged).length;

  const handleAddOrUpdateVehicle = async (formData) => {
    if (editingVehicle) {
      await updateVehicleMutation.mutateAsync({
        vehicleId: editingVehicle.id,
        vehicleData: {
          gp_id: editingVehicle.gp_id,
          vehicle_no: formData.vehicleNumber,
          imei: formData.imeiNumber,
          name: formData.vehicleName || '',
        },
      });
    } else {
      await addVehicleMutation.mutateAsync({
        gp_id: formData.gpId,
        vehicle_no: formData.vehicleNumber,
        imei: formData.imeiNumber,
        name: formData.vehicleName || '',
      });
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddVehicleModal(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    setDeleteConfirmVehicle(vehicle);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmVehicle) return;
    deleteVehicleMutation.mutate(deleteConfirmVehicle.id, {
      onSuccess: () => {
        setDeleteConfirmVehicle(null);
        setSelectedVehicle(null);
        alert('Vehicle deleted successfully.');
      },
    });
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>

      {/* Main Content - Three Column Layout */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        gap: '0'
      }}>
        {/* Left Panel - Fleet Overview */}
        <FleetSidebar
          vehicles={filteredVehicles}
          activeFleetTab={activeFleetTab}
          fleetTabs={fleetTabs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTabChange={setActiveFleetTab}
          onVehicleClick={handleVehicleSelect}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
          selectedVehicle={selectedVehicle}
          showFlaggedToggle={true}
          flaggedCount={flaggedCount}
          showOnlyFlagged={showOnlyFlagged}
          onFlaggedToggle={() => setShowOnlyFlagged(!showOnlyFlagged)}
        />

        {/* Center Panel - Map View */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Add Vehicle Button */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10
          }}>
            <button
              onClick={() => { setEditingVehicle(null); setShowAddVehicleModal(true); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              Add Vehicle
            </button>
          </div>

          {/* Google Map */}
          {isLoadingVehicles ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Loading vehicles...
              </div>
            </div>
          ) : vehiclesError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
            }}>
              <div style={{ fontSize: '14px', color: '#ef4444' }}>
                Error loading vehicles: {vehiclesError.message}
              </div>
            </div>
          ) : (
            <GoogleMapView
              vehicles={filteredVehicles}
              selectedVehicle={selectedVehicle}
              onVehicleSelect={handleVehicleSelect}
            />
          )}
        </div>

        {/* Right Panel - Vehicle Details */}
        {selectedVehicle && (
          <VehicleDetailsPanel
            vehicle={selectedVehicle}
            details={vehicleDetails}
            isLoading={isLoadingDetails}
            onClose={() => setSelectedVehicle(null)}
            onEdit={handleEditVehicle}
            onDelete={handleDeleteVehicle}
          />
        )}
      </div>

      {/* GPS Tracking Analytics Table Section */}
      {(() => {
        const coverageData = activeScope === 'All'
          ? gpsAnalyticsData?.district_wise_coverage || []
          : activeScope === 'Districts'
            ? gpsAnalyticsData?.block_wise_coverage || []
            : activeScope === 'Blocks'
              ? gpsAnalyticsData?.gp_wise_coverage || []
              : activeScope === 'GPs'
                ? gpsAnalyticsData?.gp_wise_coverage || []
                : [];

        return coverageData.length > 0 ? (
          <div data-table-scroll style={{
            backgroundColor: 'white',
            padding: '14px',
            marginLeft: '16px',
            marginRight: '16px',
            marginTop: '16px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid lightgray',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {activeScope === 'All' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Wise GPS Tracking Coverage
              </h3>
              {(activeScope === 'Blocks' || activeScope === 'GPs') && (
                <button
                  onClick={() => {
                    if (activeScope === 'Blocks') {
                      setActiveScope('Districts');
                      setSelectedBlockForHierarchy(null);
                    } else if (activeScope === 'GPs') {
                      setActiveScope('Blocks');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: backButtonHover ? '#e5e7eb' : '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={() => setBackButtonHover(true)}
                  onMouseLeave={() => setBackButtonHover(false)}
                >
                  {activeScope === 'Blocks' ? '← Back to Districts' : '← Back to Blocks'}
                </button>
              )}
            </div>

            <div style={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflowX: 'auto'
            }}>
              <div style={{
                minWidth: '800px',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                  backgroundColor: '#f9fafb',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {activeScope === 'All' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Name
                    <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Total Vehicles
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Active Vehicles
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Running Vehicles
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Stopped Vehicles
                  </div>
                </div>

                {/* Table Rows */}
                {(() => {
                  const displayRows = activeScope === 'GPs' && selectedLocation.gpId
                    ? coverageData.filter(item => item.geography_id === selectedLocation.gpId || item.id === selectedLocation.gpId)
                    : coverageData;

                  return displayRows.map((item, index) => (
                    <div key={item.geography_id || item.id || index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: index < displayRows.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: 'white',
                      transition: 'background-color 0.2s',
                      alignItems: 'center'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{
                        fontSize: '14px',
                        color: activeScope === 'GPs' ? '#111827' : '#10b981',
                        fontWeight: '500',
                        cursor: activeScope === 'GPs' ? 'default' : 'pointer',
                        textDecoration: activeScope === 'GPs' ? 'none' : 'underline'
                      }}>
                        {item.geography_name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        {item.total_vehicles || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                        {item.active_vehicles || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '500' }}>
                        {item.running_vehicles || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>
                        {item.stopped_vehicles || 0}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Add/Edit Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => { setShowAddVehicleModal(false); setEditingVehicle(null); }}
        onSubmit={handleAddOrUpdateVehicle}
        isSubmitting={addVehicleMutation.isPending || updateVehicleMutation.isPending}
        editingVehicle={editingVehicle}
        districts={[]}
        blocks={[]}
        gramPanchayats={[]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmVehicle}
        vehicle={deleteConfirmVehicle}
        onClose={() => setDeleteConfirmVehicle(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteVehicleMutation.isPending}
      />
    </div>
  );
};

export default GpsTrackingContent;
