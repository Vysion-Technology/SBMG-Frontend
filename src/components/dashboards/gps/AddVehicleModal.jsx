import React, { useState } from 'react';
import { X, ChevronDown, Loader } from 'lucide-react';

/**
 * AddVehicleModal component for adding new vehicles
 */
const AddVehicleModal = ({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isSubmitting = false,
  districts = [],
  blocks = [],
  gramPanchayats = [],
}) => {
  const [modalStep, setModalStep] = useState(1);
  const [formData, setFormData] = useState({
    imeiNumber: '',
    vehicleNumber: '',
    districtId: '',
    blockId: '',
    gpId: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // Basic validation for step 1
    if (!formData.vehicleNumber || !formData.imeiNumber) {
      alert('Please fill in vehicle number and IMEI');
      return;
    }
    setModalStep(2);
  };

  const handleBack = () => {
    setModalStep(1);
  };

  const handleSubmit = async () => {
    // Basic validation for step 2
    if (!formData.gpId) {
      alert('Please select a Gram Panchayat');
      return;
    }

    await onSubmit(formData);
    
    // Reset form
    setFormData({
      imeiNumber: '',
      vehicleNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setModalStep(1);
  };

  const handleClose = () => {
    setFormData({
      imeiNumber: '',
      vehicleNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setModalStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
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
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSubmitting ? 0.5 : 1,
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
                Vehicle Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter vehicle number (e.g., UP91T4309)"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: isSubmitting ? 0.6 : 1,
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
                IMEI Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter IMEI number (e.g., 357803372737250)"
                value={formData.imeiNumber}
                onChange={(e) => handleInputChange('imeiNumber', e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '4px' 
              }}>
                GPS device IMEI for tracking
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
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
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
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
                  <div style={{ position: 'relative' }}>
                  <select
                    value={formData.districtId}
                    onChange={(e) => handleInputChange('districtId', e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px 32px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundColor: 'white',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district.id || district} value={district.id || district}>
                        {district.name || district}
                      </option>
                    ))}
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
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
                  <div style={{ position: 'relative' }}>
                  <select
                    value={formData.blockId}
                    onChange={(e) => handleInputChange('blockId', e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px 32px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundColor: 'white',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    <option value="">Select Block</option>
                    {blocks.map((block) => (
                      <option key={block.id || block} value={block.id || block}>
                        {block.name || block}
                      </option>
                    ))}
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
                Gram Panchayat <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={formData.gpId}
                  onChange={(e) => handleInputChange('gpId', e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '10px 32px 10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    appearance: 'none',
                    backgroundColor: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxSizing: 'border-box',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  <option value="">Select Gram Panchayat</option>
                  {gramPanchayats.map((gp) => (
                    <option key={gp.id || gp} value={gp.id || gp}>
                      {gp.name || gp}
                    </option>
                  ))}
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
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Back
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting && (
                    <Loader 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        animation: 'spin 1s linear infinite',
                      }} 
                    />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVehicleModal;

