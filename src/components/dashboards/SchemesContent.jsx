import { Edit, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from "react";
import { MEDIA_BASE_URL, schemesAPI } from '../../services/api';
import NoDataFound from './common/NoDataFound';
import { useTranslation } from 'react-i18next';

const SchemesContent = () => {

  const { t } = useTranslation(['common', 'table']);

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [activeTab, setActiveTab] = useState('Details');
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schemeFilter, setSchemeFilter] = useState('active'); // 'active', 'inactive', 'all'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    details: '',
    benefits: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');

  // Img ration Error state
  const [imageError, setImageError] = useState('');


  // Edit scheme state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    eligibility: '',
    benefits: '',
    start_time: '',
    end_time: '',
    active: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch schemes data on component mount and when filter changes
  useEffect(() => {
    fetchSchemes();
  }, [schemeFilter]);

  // Close modals if selected scheme is no longer in the filtered list
  useEffect(() => {
    if (selectedScheme && !loading) {
      const schemeStillVisible = schemes.some(s => s.id === selectedScheme.id);
      if (!schemeStillVisible) {
        // Scheme is no longer visible (likely disabled and filtered out)
        setShowEditModal(false);
        setShowDetailsModal(false);
        setSelectedScheme(null);
      }
    }
  }, [schemes, selectedScheme, loading]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch schemes based on filter - use API filtering when possible, but always apply client-side filtering as backup
      let schemesData = [];

      if (schemeFilter === 'all') {
        // For 'all', fetch both active and inactive separately to ensure we get everything
        const [activeResponse, inactiveResponse] = await Promise.all([
          schemesAPI.getSchemes({ skip: 0, limit: 100, active: true }),
          schemesAPI.getSchemes({ skip: 0, limit: 100, active: false })
        ]);
        const activeSchemes = activeResponse.data || [];
        const inactiveSchemes = inactiveResponse.data || [];
        schemesData = [...activeSchemes, ...inactiveSchemes];
      } else {
        // For 'active' or 'inactive', fetch with the appropriate parameter
        const activeParam = schemeFilter === 'active' ? true : false;
        const response = await schemesAPI.getSchemes({ skip: 0, limit: 100, active: activeParam });
        schemesData = response.data || [];
      }

      // Deduplicate schemes by ID and name to prevent duplicate entries
      const uniqueSchemes = schemesData.reduce((acc, scheme) => {
        // First check if scheme with same ID already exists
        const existingById = acc.find(s => s.id === scheme.id);
        if (existingById) {
          console.warn('Duplicate scheme detected by ID:', scheme.name, 'ID:', scheme.id);
          return acc;
        }

        // Then check if scheme with same name already exists (case-insensitive)
        // Keep the first occurrence and skip duplicates
        const existingByName = acc.find(s =>
          s.name && scheme.name &&
          s.name.toLowerCase().trim() === scheme.name.toLowerCase().trim()
        );
        if (existingByName) {
          console.warn('Duplicate scheme detected by name:', scheme.name, 'ID:', scheme.id, '- Keeping first occurrence');
          return acc;
        }

        acc.push(scheme);
        return acc;
      }, []);

      // Apply client-side filtering to ensure correct display (backup safety check)
      let filteredSchemes = uniqueSchemes;
      if (schemeFilter === 'active') {
        filteredSchemes = uniqueSchemes.filter(scheme => scheme.active === true);
      } else if (schemeFilter === 'inactive') {
        filteredSchemes = uniqueSchemes.filter(scheme => scheme.active === false);
      }
      // 'all' filter: show all schemes (no additional filtering needed)

      setSchemes(filteredSchemes);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('Failed to load schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to get scheme image
  const getSchemeImage = (scheme) => {
    if (scheme.media && scheme.media.length > 0) {
      // Use the public media API endpoint
      return `${MEDIA_BASE_URL}/${encodeURIComponent(scheme.media[0].media_url)}`;
    }
    return '/background.png'; // Fallback to placeholder
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🔥 always reset FIRST
    setImageError('');
    setSelectedFile(null);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const expected = 4 / 5;
      const tolerance = 0.03;

      if (Math.abs(ratio - expected) > tolerance) {
        setImageError(t('schemeevent:only45AspectRatioAllowed'));
        setSelectedFile(null);
        URL.revokeObjectURL(url);
        return;
      }

      setSelectedFile(file);
      setImageError('');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Handle form submission with seamless two-step API flow
  const handleSubmit = async () => {

    if (!selectedFile) {
      setImageError(t('schemeevent:upload45Image'));
      return;
    }

    if (!formData.name.trim() || !formData.description.trim()) {
      alert(t('schemeevent:fillRequiredFields'));
      return;
    }



    setIsSubmitting(true);
    setSubmitProgress(t('schemeevent:creatingScheme'));

    try {
      // Step 1: Create the scheme
      const schemePayload = {
        name: formData.name,
        description: formData.description,
        eligibility: formData.details || '',
        benefits: formData.benefits || '',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      };

      const createResponse = await schemesAPI.createScheme(schemePayload);
      const createdScheme = createResponse.data;

      // Step 2: Upload media if file is selected
      if (selectedFile) {
        setSubmitProgress(t('schemeevent:uploadingMedia'));
        console.log('Uploading media for scheme ID:', createdScheme.id, 'File:', selectedFile);
        const uploadResponse = await schemesAPI.uploadSchemeMedia(createdScheme.id, selectedFile);
        console.log('Media upload response:', uploadResponse.data);
      }

      // Success - close modal and refresh schemes
      setSubmitProgress(t('schemeevent:schemeCreatedSuccessfully'));
      setTimeout(() => {
        setShowModal(false);
        setFormData({ name: '', description: '', details: '', benefits: '' });
        setSelectedFile(null);
        setIsSubmitting(false);
        setSubmitProgress('');
        fetchSchemes(); // Refresh the schemes list
      }, 1000);

    } catch (error) {
      console.error('Error creating scheme:', error);
      setSubmitProgress('');
      setIsSubmitting(false);
      setImageError('');
      alert(t('schemeevent:failedToCreateScheme'));
    }
  };

  // Handle edit button click
  const handleEditClick = (scheme) => {
    setSelectedScheme(scheme);
    setEditFormData({
      name: scheme.name || '',
      description: scheme.description || '',
      eligibility: scheme.eligibility || '',
      benefits: scheme.benefits || '',
      start_time: scheme.start_time || '',
      end_time: scheme.end_time || '',
      active: scheme.active !== undefined ? scheme.active : true
    });
    setShowEditModal(true);
  };

  const handleDeleteScheme = async (schemeId) => {
    if (!schemeId || isDeleting) return;
    const confirmDelete = window.confirm(t('schemeevent:confirmDeleteScheme'));
    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await schemesAPI.deleteScheme(schemeId);
      setShowDetailsModal(false);
      setSelectedScheme(null);
      await fetchSchemes();
    } catch (error) {
      console.error('Error deleting scheme:', error);
      alert(t('schemeevent:failedToDeleteScheme'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle scheme update
  const handleUpdateScheme = async () => {
    if (!editFormData.name.trim() || !editFormData.description.trim()) {
      alert(t('schemeevent:fillRequiredFields'));
      return;
    }

    setIsUpdating(true);

    try {
      const updatePayload = {
        name: editFormData.name,
        description: editFormData.description,
        eligibility: editFormData.eligibility,
        benefits: editFormData.benefits,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        active: editFormData.active
      };

      await schemesAPI.updateScheme(selectedScheme.id, updatePayload);

      // If scheme is set to inactive, switch filter to "All" so user can see it as inactive
      if (!editFormData.active && schemeFilter === 'active') {
        setSchemeFilter('all');
      }

      // Close modal and refresh
      setShowEditModal(false);
      setIsUpdating(false);
      fetchSchemes(); // Refresh schemes
    } catch (error) {
      console.error('Error updating scheme:', error);
      setIsUpdating(false);
      alert(t('schemeevent:failedToUpdateScheme'));
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setFormData({ name: '', description: '', details: '', benefits: '' });
    setSelectedFile(null);
    setImageError('');
    setSubmitProgress('');
    setIsSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>


      {/* Overview Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Overview Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {t('common:overview')}
              <span style={{
                fontSize: '16px',
                fontWeight: '400',
                color: '#6b7280'
              }}>
                {schemes.length.toString().padStart(2, '0')}
              </span>
            </h2>

          </div>
          {/* Right side - Filter and Add Scheme button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Scheme Filter Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                onClick={() => setSchemeFilter('active')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: schemeFilter === 'active' ? '#10b981' : 'transparent',
                  color: schemeFilter === 'active' ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {t('schemeevent:active')}
              </button>
              <button
                onClick={() => setSchemeFilter('inactive')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: schemeFilter === 'inactive' ? '#ef4444' : 'transparent',
                  color: schemeFilter === 'inactive' ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {t('schemeevent:inactive')}
              </button>
              <button
                onClick={() => setSchemeFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: schemeFilter === 'all' ? '#3b82f6' : 'transparent',
                  color: schemeFilter === 'all' ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {t('schemeevent:all')}
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              {t('schemeevent:addScheme')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            marginTop: '24px'
          }}>
            <Loader2 style={{ width: '32px', height: '32px', color: '#10b981', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '12px', color: '#6b7280' }}>{t('table:loading')}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ marginTop: '24px' }}>
            <NoDataFound size="medium" />
          </div>
        )}

        {/* Scheme Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col"
                onClick={() => {
                  setSelectedScheme(scheme);
                  setShowDetailsModal(true);
                  setActiveTab('details');
                }}
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
                  <img
                    src={getSchemeImage(scheme)}
                    alt="scheme"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/background.png";
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: scheme.active ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {scheme.active ? 'Active' : 'Inactive'}
                  </div>
                  {/* Media count indicator if multiple images */}
                  {scheme.media && scheme.media.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      +{scheme.media.length - 1} more
                    </div>
                  )}

                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 6px 0',
                    lineHeight: '1.4'
                  }}>
                    {scheme.name || 'Untitled Scheme'}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {truncateText(scheme.description, 60)}
                  </p>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Schemes State */}
        {!loading && !error && schemes.length === 0 && (
          <div style={{
            marginTop: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <NoDataFound size="large" />
          </div>
        )}
      </div>

      {/* Add Scheme Modal */}
      {
        showModal && (
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
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {t('schemeevent:addScheme')}
                </h2>
                <button
                  onClick={resetModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px' }}>
                {/* Image Upload Area */}
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedFile ? '#f0f9ff' : 'transparent',
                  borderColor: selectedFile ? '#10b981' : '#d1d5db'
                }}
                  onClick={() => document.getElementById('schemeFileInput').click()}>
                  <input
                    id="schemeFileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <Upload style={{
                    width: '32px',
                    height: '32px',
                    color: selectedFile ? '#10b981' : '#9ca3af',
                    margin: '0 auto 12px'
                  }} />
                  <p style={{
                    fontSize: '14px',
                    color: selectedFile ? '#10b981' : '#6b7280',
                    margin: 0
                  }}>
                    {selectedFile ? selectedFile.name : t('schemeevent:dragAndDropImage')}
                  </p>
                  {selectedFile && (
                    <p style={{
                      fontSize: '12px',
                      color: '#10b981',
                      margin: '8px 0 0 0'
                    }}>
                      ✓  {t('schemeevent:fileSelected')}
                    </p>
                  )}
                </div>

                {/* 👇 ADD THIS ERROR MESSAGE HERE */}
                {imageError && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '12px',
                    marginTop: '-12px',
                    marginBottom: '16px'
                  }}>
                    {imageError}
                  </p>
                )}


                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:name')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('schemeevent:name')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:description')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('schemeevent:description')}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Eligibility Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:eligibility')}
                    </label>
                    <textarea
                      placeholder={t('schemeevent:eligibility')}
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Benefits Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:benefits')}
                    </label>
                    <textarea
                      placeholder={t('schemeevent:benefits')}
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Progress indicator */}
                {isSubmitting && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#10b981',
                    fontSize: '14px'
                  }}>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    {submitProgress}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <button
                    onClick={() => {
                      if (!isSubmitting) {
                        setShowModal(false);
                        setFormData({ name: '', description: '', details: '', benefits: '' });
                        setSelectedFile(null);
                      }
                    }}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    {t('schemeevent:cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmitting && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    {isSubmitting ? t('schemeevent:creatingScheme') : t('schemeevent:addScheme')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Scheme Details Modal */}
      {
        showDetailsModal && selectedScheme && (
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
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px ',
                paddingBottom: '5px',
                paddingLeft: '20px',
                paddingRight: '20px',
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {selectedScheme?.name || 'Scheme Details'}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleEditClick(selectedScheme)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#10b981',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                    {t('schemeevent:editScheme')}
                  </button>
                  <button
                    onClick={() => handleDeleteScheme(selectedScheme?.id)}
                    disabled={isDeleting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      backgroundColor: isDeleting ? '#fecaca' : 'transparent',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDeleting ? (
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    )}
                    {isDeleting ? t('schemeevent:deleting') : t('schemeevent:deleteScheme')}
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#6b7280'
                    }}
                  >
                    <X style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
              }}>
                {['details', 'benefits', 'eligibility'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === tab ? '600' : '400',
                      color: activeTab === tab ? '#111827' : '#6b7280',
                      borderBottom: activeTab === tab ? '2px solid #10b981' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t(`schemeevent:${tab}`)}
                  </button>
                ))}
              </div>
              <divider />
              <div style={{
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '12px 0'
              }}></div>


              <divider />

              {/* Tab Content */}
              <div style={{ padding: '24px' }}>
                {activeTab === 'details' && (
                  <div>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151',
                      margin: '0 0 16px 0'
                    }}>
                      {selectedScheme?.description || 'No description available.'}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      marginTop: '20px'
                    }}>

                    </div>
                  </div>
                )}

                {activeTab === 'benefits' && (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedScheme?.benefits || 'No benefits information available.'}
                  </div>
                )}

                {activeTab === 'eligibility' && (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedScheme?.eligibility || 'No eligibility information available.'}
                  </div>
                )}

                {activeTab === 'Media' && (
                  <div>
                    {selectedScheme?.media && selectedScheme.media.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        {selectedScheme.media.map((mediaItem, index) => (
                          <div key={index} style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f3f4f6'
                          }}>
                            <img
                              src={`${MEDIA_BASE_URL}/${encodeURIComponent(mediaItem.media_url)}`}
                              alt={`Scheme media ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'opacity 0.3s ease'
                              }}
                              onLoad={(e) => {
                                e.target.style.opacity = '1';
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none',
                              width: '100%',
                              height: '150px',
                              backgroundColor: '#f3f4f6',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280',
                              fontSize: '14px',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              <div style={{ fontSize: '24px' }}>📷</div>
                              <div>Failed to load image</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280'
                      }}>
                        <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No media available</p>
                        <p style={{ fontSize: '14px', margin: 0 }}>This scheme doesn't have any images or media files.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Scheme Modal */}
      {
        showEditModal && selectedScheme && (
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
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {t('schemeevent:editScheme')}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:name')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('schemeevent:name')}
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:description')}
                    </label>
                    <textarea
                      placeholder={t('schemeevent:description')}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Eligibility Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:eligibility')}
                    </label>
                    <textarea
                      placeholder={t('schemeevent:eligibility')}
                      value={editFormData.eligibility}
                      onChange={(e) => setEditFormData({ ...editFormData, eligibility: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Benefits Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:benefits')}
                    </label>
                    <textarea
                      placeholder={t('schemeevent:benefits')}
                      value={editFormData.benefits}
                      onChange={(e) => setEditFormData({ ...editFormData, benefits: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Start Time Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:startTime')}
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.start_time ? new Date(editFormData.start_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* End Time Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('schemeevent:endTime')}
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.end_time ? new Date(editFormData.end_time).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Active Status Field */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={editFormData.active}
                        onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      {t('schemeevent:active')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    opacity: isUpdating ? 0.6 : 1
                  }}
                >
                  {t('schemeevent:cancel')}
                </button>
                <button
                  onClick={handleUpdateScheme}
                  disabled={isUpdating}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isUpdating ? '#9ca3af' : '#10b981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isUpdating && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                  {isUpdating ? t('schemeevent:updating') : t('schemeevent:updateScheme')}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default SchemesContent;