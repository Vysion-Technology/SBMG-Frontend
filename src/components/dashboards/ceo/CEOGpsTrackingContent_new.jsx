import React, { useState } from "react";
import { Plus, ChevronDown, X, MapPin, Search, Truck, Circle, AlertCircle } from 'lucide-react';

const VDOGpsTrackingContent = () => {
    const [activeFleetTab, setActiveFleetTab] = useState('All(03)');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    
    // Form states
    const [formData, setFormData] = useState({
        iemiNumber: '',
        vehicleName: '',
        vehicleNumber: '',
        district: '',
        block: '',
        gramPanchayat: ''
    });
    
    const fleetTabs = ['All(03)', 'Active(01)', 'Running(01)', 'Stopped(01)'];

    // Sample vehicle data
    const vehicles = [
        { id: 1, number: 'XYZ987', status: 'active', hasNotification: true, isFlagged: false },
        { id: 2, number: 'LMN456', status: 'inactive', hasNotification: true, isFlagged: false },
        { id: 3, number: 'DEF789', status: 'active', hasNotification: false, isFlagged: false },
        { id: 4, number: 'GHI012', status: 'inactive', hasNotification: true, isFlagged: true },
        { id: 5, number: 'JKL345', status: 'active', hasNotification: false, isFlagged: false },
        { id: 6, number: 'MNO678', status: 'inactive', hasNotification: false, isFlagged: false },
        { id: 7, number: 'PQR901', status: 'active', hasNotification: false, isFlagged: false },
        { id: 8, number: 'STU234', status: 'inactive', hasNotification: false, isFlagged: false },
    ];

    const flaggedCount = vehicles.filter(v => v.isFlagged).length;
    const displayedVehicles = showOnlyFlagged 
        ? vehicles.filter(v => v.isFlagged) 
        : vehicles;

    // Modal handlers
    const handleOpenModal = () => {
        setShowAddVehicleModal(true);
        setModalStep(1);
        setFormData({
            iemiNumber: '',
            vehicleName: '',
            vehicleNumber: '',
            district: '',
            block: '',
            gramPanchayat: ''
        });
    };

    const handleCloseModal = () => {
        setShowAddVehicleModal(false);
        setModalStep(1);
    };

    const handleNext = () => {
        setModalStep(2);
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        handleCloseModal();
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            {/* Header Section */}
     <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
     }}>
         {/* Left side - Dashboard title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#374151',
              margin: 0
            }}>
              Overview
            </h1>
            <span style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                12, January 2025
              </span>
          </div>
        </div>

        {/* VDO: No scope buttons or location dropdown (location is fixed) */}
      </div>

      {/* Main Content - Two Column Layout */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        gap: '0'
      }}>
        {/* Left Panel - Fleet Overview */}
        <div style={{
          width: '400px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Fleet Section */}
          <div style={{ padding: '24px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 5px 0'
            }}>
              Fleet
            </h2>

            {/* Fleet Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {fleetTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFleetTab(tab)}
                  style={{
                    padding: '5px 7px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: activeFleetTab === tab ? '#10b981' : '#f3f4f6',
                    color: activeFleetTab === tab ? 'white' : '#6b7280',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <X 
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    cursor: 'pointer'
                  }} 
                />
              )}
            </div>

            {/* Flagged Vehicles Toggle Button */}
            {flaggedCount > 0 && (
              <div 
                onClick={() => setShowOnlyFlagged(!showOnlyFlagged)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde68a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef3c7';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle style={{ 
                    width: '20px', 
                    height: '20px', 
                    color: '#d97706' 
                  }} />
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#92400e' 
                  }}>
                    Flagged vehicles
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Toggle Switch */}
                  <div style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    backgroundColor: showOnlyFlagged ? '#7c3aed' : '#d1d5db',
                    borderRadius: '12px',
                    transition: 'background-color 0.3s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: showOnlyFlagged ? '22px' : '2px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                  
                  </div>
                </div>
            )}

            {/* Vehicle List */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              maxHeight: 'calc(100vh - 450px)',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {displayedVehicles.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <AlertCircle style={{ 
                    width: '48px', 
                    height: '48px', 
                    margin: '0 auto 16px',
                    color: '#9ca3af'
                  }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>No flagged vehicles</p>
                </div>
              ) : (
                displayedVehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: vehicle.isFlagged ? '#fef3c7' : '#ffffff',
                    borderRadius: '8px',
                    border: vehicle.isFlagged ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                >
                  <Truck style={{ width: '24px', height: '24px', color: '#4b5563' }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '2px' }}>
                      Vehicle No
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {vehicle.number}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Circle 
                      style={{ 
                        width: '10px', 
                        height: '10px', 
                        color: vehicle.status === 'active' ? '#10b981' : '#ef4444', 
                        fill: vehicle.status === 'active' ? '#10b981' : '#ef4444'
                      }} 
                    />
                    <span style={{ 
                      fontSize: '12px', 
                      color: vehicle.status === 'active' ? '#10b981' : '#6b7280',
                      fontWeight: '500'
                    }}>
                      {vehicle.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Map View */}
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
              onClick={handleOpenModal}
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

          {/* Map Placeholder */}
          <div style={{
            flex: 1,
            backgroundColor: '#d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundImage: 'linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 100%)'
          }}>
            {/* Simulated Map Roads */}
            <svg style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.3
            }}>
              <path d="M 0 200 Q 200 150, 400 200 T 800 200" stroke="#9ca3af" strokeWidth="4" fill="none" />
              <path d="M 200 0 L 200 800" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M 500 0 L 500 800" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M 0 400 L 1000 400" stroke="#9ca3af" strokeWidth="3" fill="none" />
            </svg>

            {/* Map Labels */}
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '35%',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Hotel Shivam
            </div>

            <div style={{
              position: 'absolute',
              top: '50%',
              right: '15%',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Sardar Market
            </div>

            <div style={{
              position: 'absolute',
              bottom: '25%',
              left: '20%',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Nirvana Restaurant
            </div>

            {/* Vehicle Markers */}
            <svg style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}>
              <path 
                d="M 250 350 Q 350 280, 450 320 T 600 300" 
                stroke="#3b82f6" 
                strokeWidth="6" 
                fill="none"
                strokeLinecap="round"
              />
            </svg>

            {/* Orange Vehicle */}
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '20%',
              width: '32px',
              height: '48px',
              backgroundColor: '#f97316',
              borderRadius: '16px 16px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transform: 'rotate(-15deg)',
              border: '2px solid white'
            }}>
              <Truck style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>

            {/* Blue Vehicle */}
            <div style={{
              position: 'absolute',
              top: '28%',
              left: '45%',
              width: '32px',
              height: '48px',
              backgroundColor: '#3b82f6',
              borderRadius: '16px 16px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transform: 'rotate(25deg)',
              border: '2px solid white'
            }}>
              <Truck style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>

            {/* Green Vehicle */}
            <div style={{
              position: 'absolute',
              top: '52%',
              left: '35%',
              width: '32px',
              height: '48px',
              backgroundColor: '#22c55e',
              borderRadius: '16px 16px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transform: 'rotate(-5deg)',
              border: '2px solid white'
            }}>
              <Truck style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>

            {/* Location Pin Marker */}
            <div style={{
              position: 'absolute',
              top: '60%',
              right: '25%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#10b981',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)'
                }}></div>
              </div>
            </div>

            
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Add Vehicle
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Step Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              gap: '16px'
            }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: modalStep === 1 ? '#10b981' : modalStep > 1 ? '#10b981' : '#e5e7eb',
                  border: modalStep === 1 ? '2px solid #10b981' : modalStep > 1 ? '2px solid #10b981' : '2px solid #d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: modalStep >= 1 ? 'white' : '#6b7280'
                }}>
                  {modalStep > 1 ? '✓' : '01'}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: modalStep === 1 ? '600' : '400',
                  color: modalStep === 1 ? '#10b981' : '#6b7280'
                }}>
                  Vehicle Details
                </span>
              </div>

              {/* Connector Line */}
              <div style={{
                width: '60px',
                height: '2px',
                backgroundColor: modalStep > 1 ? '#10b981' : '#d1d5db'
              }}></div>

              {/* Step 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: modalStep === 2 ? '#10b981' : '#e5e7eb',
                  border: modalStep === 2 ? '2px solid #10b981' : '2px solid #d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: modalStep === 2 ? 'white' : '#6b7280'
                }}>
                  02
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: modalStep === 2 ? '600' : '400',
                  color: modalStep === 2 ? '#10b981' : '#6b7280'
                }}>
                  Location
                </span>
              </div>
            </div>

            {/* Step 1: Vehicle Details */}
            {modalStep === 1 && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    IEMI Number
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.iemiNumber}
                    onChange={(e) => handleInputChange('iemiNumber', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.vehicleName}
                    onChange={(e) => handleInputChange('vehicleName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '32px'
                }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    style={{
                      padding: '10px 24px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {modalStep === 2 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      District
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formData.district}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 32px 10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          appearance: 'none',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Select District</option>
                        <option value="district1">District 1</option>
                        <option value="district2">District 2</option>
                      </select>
                      <ChevronDown style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        color: '#6b7280',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Block
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formData.block}
                        onChange={(e) => handleInputChange('block', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 32px 10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          appearance: 'none',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Select Block</option>
                        <option value="block1">Block 1</option>
                        <option value="block2">Block 2</option>
                      </select>
                      <ChevronDown style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        color: '#6b7280',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Gram Panchayat
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.gramPanchayat}
                      onChange={(e) => handleInputChange('gramPanchayat', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        appearance: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Select Gram Panchayat</option>
                      <option value="gp1">Gram Panchayat 1</option>
                      <option value="gp2">Gram Panchayat 2</option>
                    </select>
                    <ChevronDown style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      pointerEvents: 'none'
                    }} />
                  </div>
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '32px'
                }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    style={{
                      padding: '10px 24px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        </div>
    );
};

export default VDOGpsTrackingContent;
