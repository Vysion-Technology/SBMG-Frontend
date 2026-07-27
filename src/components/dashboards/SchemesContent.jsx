import { Edit, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from "react";
import { MEDIA_BASE_URL, schemesAPI, circularAPI } from '../../services/api';
import NoDataFound from './common/NoDataFound';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';


const SchemesContent = () => {

  const { t } = useTranslation(['common', 'table']);

  const { role } = useAuth();

  const normalizedRole = role?.toUpperCase();

  const canManageEvents = ["ADMIN", "SMD"].includes(normalizedRole);

  const [circulars, setCirculars] = useState([]);

  const [listTab, setListTab] = useState("schemes");

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedScheme, setSelectedScheme] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
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

  const [existingImage, setExistingImage] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);

  // Form
  const [contentType, setContentType] = useState("scheme");
  const [selectedPdf, setSelectedPdf] = useState(null);

  // Img ration Error state
  const [imageError, setImageError] = useState('');


  // Edit scheme state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    eligibility: '',
    benefits: '',
    active: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch schemes data on component mount and when filter changes
  useEffect(() => {
    fetchSchemes();
    fetchCirculars();
  }, [schemeFilter]);

  // Close modals if selected scheme is no longer in the filtered list


  const fetchCirculars = async () => {
    try {
      const res = await circularAPI.getCirculars();

      setCirculars(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.log("Circular Error:", err);
    }
  };

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

  // const allItems = [...schemes, ...circulars];
  const filteredCirculars = circulars.filter(c => {
    const isActive = c.is_active ?? true;
    if (schemeFilter === 'active') return isActive === true;
    if (schemeFilter === 'inactive') return isActive === false;
    return true;
  });

  const displayedItems =
    listTab === "schemes"
      ? schemes
      : filteredCirculars;


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

  const getPdfUrl = (item) => {
    if (!item?.pdf_url) return null;

    if (
      item.pdf_url.startsWith("http://") ||
      item.pdf_url.startsWith("https://")
    ) {
      return item.pdf_url;
    }

    return `${MEDIA_BASE_URL}/${item.pdf_url}`;
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

    if (contentType === "circular") {

      if (!selectedPdf) {
        alert("Please select PDF");
        return;
      }

      if (!formData.name.trim() || !formData.description.trim()) {
        alert("Please fill required fields");
        return;
      }

      setIsSubmitting(true);

      try {

        const circularData = {
          title: formData.name,
          description: formData.description,
          is_active: true
        };

        const fd = new FormData();

        fd.append(
          "circular_data",
          JSON.stringify(circularData)
        );

        fd.append("pdf", selectedPdf);

        if (selectedFile) {
          fd.append("image", selectedFile);
        }

        await circularAPI.createCircular(fd);

        setShowModal(false);

        setFormData({
          name: '',
          description: '',
          details: '',
          benefits: ''
        });

        setSelectedFile(null);
        setSelectedPdf(null);

        fetchSchemes();
        fetchCirculars();

      } catch (error) {

        console.log(error);

        alert("Failed to create circular");

      } finally {

        setIsSubmitting(false);

      }

      return;
    }

    // ===== Existing Scheme Code =====

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

      const schemePayload = {
        name: formData.name,
        description: formData.description,
        eligibility: formData.details || '',
        benefits: formData.benefits || '',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      };

      const createResponse =
        await schemesAPI.createScheme(
          schemePayload
        );

      const createdScheme =
        createResponse.data;

      if (selectedFile) {

        await schemesAPI.uploadSchemeMedia(
          createdScheme.id,
          selectedFile
        );
      }

      setShowModal(false);

      setFormData({
        name: '',
        description: '',
        details: '',
        benefits: ''
      });

      setSelectedFile(null);

      fetchSchemes();
      fetchCirculars();

    } catch (error) {

      console.log(error);

      alert(
        t('schemeevent:failedToCreateScheme')
      );

    } finally {

      setIsSubmitting(false);

    }
  };

  // Handle edit button click
  const handleEditClick = (scheme) => {

    setSelectedScheme(scheme);

    const isCircular = !!scheme.pdf_url;

    setContentType(
      isCircular ? "circular" : "scheme"
    );

    setEditFormData({
      name: scheme.name || scheme.title || "",
      description: scheme.description || "",
      eligibility: scheme.eligibility || "",
      benefits: scheme.benefits || "",
      active: isCircular ? (scheme.is_active ?? true) : (scheme.active ?? true)
    });

    // Existing Image
    if (scheme.image_url) {
      setExistingImage(getImageUrl(scheme));
    } else if (
      scheme.media &&
      scheme.media.length > 0
    ) {
      setExistingImage(
        `${MEDIA_BASE_URL}/${encodeURIComponent(
          scheme.media[0].media_url
        )}`
      );
    } else {
      setExistingImage(null);
    }

    // Existing PDF
    setExistingPdf(
      scheme.pdf_url || null
    );

    setSelectedFile(null);
    setSelectedPdf(null);

    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleDeleteScheme = async (schemeId) => {

    if (!schemeId || isDeleting) return;

    const confirmDelete = window.confirm(
      "Are you sure?"
    );

    if (!confirmDelete) return;

    try {

      setIsDeleting(true);

      const isCircular =
        !!selectedScheme?.pdf_url;

      if (isCircular) {
        await circularAPI.deleteCircular(
          schemeId
        );
      } else {
        await schemesAPI.deleteScheme(
          schemeId
        );
      }

      setShowDetailsModal(false);
      setSelectedScheme(null);

      await fetchSchemes();
      await fetchCirculars();

    } catch (err) {

      console.log(err);

      alert("Delete failed");

    } finally {

      setIsDeleting(false);

    }
  };

  // Handle scheme update
  const handleUpdateScheme = async () => {

    if (!selectedScheme) return;

    setIsUpdating(true);

    try {

      const isCircular = !!selectedScheme?.pdf_url;

      if (isCircular) {

        const circularData = {
          title: editFormData.name,
          description: editFormData.description,
          is_active: editFormData.active
        };

        const fd = new FormData();

        fd.append(
          "circular_data",
          JSON.stringify(circularData)
        );

        if (selectedPdf) {
          fd.append("pdf", selectedPdf);
        }

        if (selectedFile) {
          fd.append("image", selectedFile);
        }

        await circularAPI.updateCircular(
          selectedScheme.id,
          fd
        );

      } else {

        const payload = {
          name: editFormData.name,
          description: editFormData.description,
          eligibility: editFormData.eligibility,
          benefits: editFormData.benefits,
          active: editFormData.active,
        };

        await schemesAPI.updateScheme(
          selectedScheme.id,
          payload
        );

        if (selectedFile) {
          await schemesAPI.uploadSchemeMedia(
            selectedScheme.id,
            selectedFile
          );
        }
      }

      setShowEditModal(false);

      setSelectedScheme(null);

      setSelectedFile(null);
      setSelectedPdf(null);

      setExistingImage(null);
      setExistingPdf(null);

      setEditFormData({
        name: '',
        description: '',
        eligibility: '',
        benefits: '',
        active: true
      });

      await fetchSchemes();
      await fetchCirculars();

    } catch (err) {

      console.error("Update Error:", err);

      alert(
        isCircular
          ? "Failed to update circular"
          : "Failed to update scheme"
      );

    } finally {

      setIsUpdating(false);

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

  const getImageUrl = (item) => {
    if (!item?.image_url) return null;

    if (
      item.image_url.startsWith("http://") ||
      item.image_url.startsWith("https://")
    ) {
      return item.image_url;
    }

    return `${MEDIA_BASE_URL}/${item.image_url}`;
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
                {displayedItems.length.toString().padStart(2, '0')}
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
            {canManageEvents && (
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
                {t('table:add')}
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px"
          }}
        >
          <button
            onClick={() => setListTab("schemes")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              background:
                listTab === "schemes"
                  ? "#10b981"
                  : "#f3f4f6",
              color:
                listTab === "schemes"
                  ? "#fff"
                  : "#374151"
            }}
          >
            📋 Schemes ({schemes.length})
          </button>

          <button
            onClick={() => setListTab("circulars")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              background:
                listTab === "circulars"
                  ? "#2563eb"
                  : "#f3f4f6",
              color:
                listTab === "circulars"
                  ? "#fff"
                  : "#374151"
            }}
          >
            📄 Circulars ({filteredCirculars.length})
          </button>
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
            {

              displayedItems.map((scheme) => {

                const isCircular = !!scheme.pdf_url;

                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col"
                    onClick={() => {
                      console.log("Selected Item =>", scheme);
                      setSelectedScheme({ ...scheme });
                      setActiveTab("details");
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
                      <img
                        src={
                          scheme.image_url
                            ? getImageUrl(scheme)
                            : getSchemeImage(scheme)
                        }
                        alt="scheme"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Image Failed =>", e.currentTarget.src);
                          e.currentTarget.src = "/background.png";
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: isCircular ? '#2563eb' : '#10b981',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {isCircular ? 'Circular' : 'Scheme'}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: (isCircular ? (scheme.is_active ?? true) : (scheme.active ?? true)) ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {(isCircular ? (scheme.is_active ?? true) : (scheme.active ?? true)) ? 'Active' : 'Inactive'}
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
                        {scheme.name || scheme.title || 'Untitled'}
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
                )
              }
              )}
          </div>
        )}

        {/* No Schemes State */}
        {!loading && !error && displayedItems.length === 0 && (
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


      {/* Add/Edit Scheme-Circular Modal */}
      {(showModal || showEditModal) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "650px",
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                  }}
                >
                  {showEditModal
                    ? (t('schemeevent:editSchemeCircular'))
                    : (t('schemeevent:addSchemeCircular'))}
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {t('schemeevent:manageSchemeAndCircularDetails')}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  setShowEditModal(false);

                  setSelectedFile(null);
                  setSelectedPdf(null);

                  setExistingImage(null);
                  setExistingPdf(null);

                  setImageError('')
                }}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  justifyItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Type Selection */}

              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {t('schemeevent:contentType')}
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div
                  onClick={() => setContentType("scheme")}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    textAlign: "center",
                    border:
                      contentType === "scheme"
                        ? "2px solid #10b981"
                        : "1px solid #e5e7eb",
                    background:
                      contentType === "scheme"
                        ? "#ecfdf5"
                        : "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      marginBottom: "8px",
                    }}
                  >
                    📋
                  </div>

                  <div
                    style={{
                      fontWeight: "600",
                    }}
                  >
                    {t('common:schemes')}
                  </div>
                </div>

                <div
                  onClick={() => setContentType("circular")}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    textAlign: "center",
                    border:
                      contentType === "circular"
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                    background:
                      contentType === "circular"
                        ? "#eff6ff"
                        : "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      marginBottom: "8px",
                    }}
                  >
                    📄
                  </div>

                  <div
                    style={{
                      fontWeight: "600",
                    }}
                  >
                    {t('schemeevent:circular')}
                  </div>
                </div>
              </div>
              {/* Image Upload */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    position: "relative"
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {t('schemeevent:imageUpload')}
                  </span>


                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        contentType === "scheme"
                          ? "#ef4444"
                          : "#6b7280",
                    }}
                  >
                    {contentType === "scheme"
                      ? (t('schemeevent:required'))
                      : (t('schemeevent:optional'))}
                  </span>
                </div>

                <div
                  onClick={() =>
                    document
                      .getElementById("schemeImage")
                      .click()
                  }
                  style={{
                    border: "2px dashed #d1d5db",
                    borderRadius: "14px",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#fafafa",
                  }}
                >
                  <input
                    id="schemeImage"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileSelect}
                  />

                  {selectedFile ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt=""
                        style={{
                          width: "100%",
                          height: "250px",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />

                      <p
                        style={{
                          marginTop: "12px",
                          fontWeight: 600,
                          color: "#10b981",
                        }}
                      >
                        {selectedFile.name}
                      </p>

                      <small
                        style={{
                          color: "#6b7280",
                          display: "block",
                          marginBottom: "10px",
                        }}
                      >
                        Click to replace image
                      </small>

                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedFile(null);

                            if (showEditModal) {
                              // purani image wapas dikha do
                              // setExistingImage(null) mat karna
                            }

                            document.getElementById("schemeImage").value = "";
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : existingImage ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={existingImage}
                        alt=""
                        style={{
                          width: "100%",
                          height: "250px",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />

                      <p
                        style={{
                          marginTop: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Current Image
                      </p>

                      <small
                        style={{
                          color: "#6b7280",
                        }}
                      >
                        Click to replace image
                      </small>

                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExistingImage(null);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            marginTop: "10px",
                          }}
                        >
                          Remove
                        </button>
                      </div>


                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                      }}
                    >
                      <Upload
                        size={36}
                        style={{
                          color: "#9ca3af",
                          marginBottom: "12px",
                          justifySelf: "center"
                        }}
                      />

                      <div
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        {t('schemeevent:uploadImage')}
                      </div>

                      <small
                        style={{
                          color: "#6b7280",
                        }}
                      >
                        {t('schemeevent:aspectRatioRequired')}
                      </small>
                    </div>
                  )}
                </div>
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


              {/* Existing PDF */}

              {showEditModal &&
                contentType === "circular" &&
                existingPdf && (
                  <div
                    style={{
                      marginBottom: "20px",
                      background: "#eff6ff",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid #bfdbfe"
                    }}
                  >
                    📄 {t('schemeevent:existingCircularPdf')}
                  </div>
                )}

              {/* PDF Upload */}

              {contentType === "circular" && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    onClick={() =>
                      document
                        .getElementById("pdfUpload")
                        .click()
                    }
                    style={{
                      border: "2px dashed #3b82f6",
                      borderRadius: "14px",
                      cursor: "pointer",
                      overflow: "hidden",
                      background: "#f8fbff",
                    }}
                  >
                    <input
                      hidden
                      id="pdfUpload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSelectedPdf(
                          e.target.files[0]
                        )
                      }
                    />

                    {selectedPdf ? (
                      <div
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPdf(null);
                          }}
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: "50%",
                            background: "#ef4444",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>

                        <div
                          style={{
                            fontSize: "60px",
                            marginBottom: "10px",
                          }}
                        >
                          📄
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            color: "#2563eb",
                          }}
                        >
                          {selectedPdf.name}
                        </div>

                        <small>
                          {t('schemeevent:clickToReplacePdf')}
                        </small>
                        <div>
                          <div
                            style={{
                              color: "#ef4444",
                              fontWeight: 600,
                              marginTop: "10px",
                              textDecoration: "underline",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPdf(null);
                            }}
                          >
                            {t('schemeevent:remove')}
                          </div>
                        </div>
                      </div>
                    ) : existingPdf ? (
                      <div
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "60px",
                            marginBottom: "10px",
                          }}
                        >
                          📄
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            color: "#2563eb",
                          }}
                        >
                          {t('schemeevent:existingCircularPdf')}
                        </div>

                        <small>
                          {t('schemeevent:clickToReplacePdf')}
                        </small>
                        <div>
                          <div
                            style={{
                              color: "#ef4444",
                              fontWeight: 600,
                              marginTop: "10px",
                              textDecoration: "underline",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPdf(null);
                            }}
                          >
                            Remove
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "35px 20px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "50px",
                            marginBottom: "10px",
                          }}
                        >
                          📄
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            color: "#2563eb",
                          }}
                        >
                          {t('schemeevent:uploadCircularPdf')}
                        </div>

                        <small>
                          {t('schemeevent:pdfFileOnly')}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Name */}

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  {t('schemeevent:name')}
                </label>

                <input
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}

                  type="text"
                  placeholder="Enter Name"
                  value={
                    showEditModal
                      ? editFormData.name
                      : formData.name
                  }
                  onChange={(e) =>
                    showEditModal
                      ? setEditFormData({
                        ...editFormData,
                        name: e.target.value
                      })
                      : setFormData({
                        ...formData,
                        name: e.target.value
                      })
                  }
                />
              </div>

              {/* Description */}

              {<div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  {t('schemeevent:description')}
                </label>

                <textarea
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

                  placeholder="Enter Description"
                  value={
                    showEditModal
                      ? editFormData.description
                      : formData.description
                  }
                  onChange={(e) =>
                    showEditModal
                      ? setEditFormData({
                        ...editFormData,
                        description: e.target.value
                      })
                      : setFormData({
                        ...formData,
                        description: e.target.value
                      })
                  }
                />
              </div>}

              {/* Eligibility */}

              {contentType === "scheme" && (<div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  {t('schemeevent:eligibility')}
                </label>

                <textarea
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}

                  rows={4}
                  placeholder="Enter Eligibility"
                  value={
                    showEditModal
                      ? editFormData.eligibility
                      : formData.details
                  }
                  onChange={(e) =>
                    showEditModal
                      ? setEditFormData({
                        ...editFormData,
                        eligibility: e.target.value
                      })
                      : setFormData({
                        ...formData,
                        details: e.target.value
                      })
                  }
                />
              </div>)}

              {/* Benefits */}

              {contentType === "scheme" && (

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    {t('schemeevent:benefits')}
                  </label>

                  <textarea
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}

                    rows={4}
                    placeholder="Enter Benefits"
                    value={
                      showEditModal
                        ? editFormData.benefits
                        : formData.benefits
                    }
                    onChange={(e) =>
                      showEditModal
                        ? setEditFormData({
                          ...editFormData,
                          benefits: e.target.value
                        })
                        : setFormData({
                          ...formData,
                          benefits: e.target.value
                        })
                    }
                  />

                </div>)}

              {showEditModal && (
                <div style={{ marginBottom: "20px" }}>
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
              )}
            </div>

            {/* Footer */}

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowEditModal(false);

                  setSelectedFile(null);
                  setSelectedPdf(null);

                  setExistingImage(null);
                  setExistingPdf(null);
                  setImageError('')
                }}
                style={{
                  padding: "12px 20px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                {t('schemeevent:cancel')}
              </button>

              <button
                onClick={
                  showEditModal
                    ? handleUpdateScheme
                    : handleSubmit
                }
                disabled={
                  isSubmitting || isUpdating
                }
                style={{
                  padding: "12px 20px",
                  border: "none",
                  background:
                    contentType === "scheme"
                      ? "#10b981"
                      : "#2563eb",
                  color: "#fff",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {showEditModal
                  ? (t('schemeevent:update'))
                  : contentType === "scheme"
                    ? (t('schemeevent:addScheme'))
                    : (t('schemeevent:addCircular'))}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {
                    selectedScheme?.name ||
                    selectedScheme?.title ||
                    'Details'
                  }
                </h2>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {canManageEvents && (
                    <>
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
                    </>)
                  }



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
                {
                  (
                    selectedScheme?.pdf_url
                      ? ['details'] // Circular ke liye sirf Details
                      : ['details', 'benefits', 'eligibility'] // Scheme ke liye sab tabs
                  ).map((tab) => (
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
                  ))
                }
              </div>
              <divider />
              <div style={{
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '12px 0'
              }}></div>


              <divider />

              {/* Tab Content */}
              {/* Tab Content */}
              <div style={{ padding: '24px' }}>

                {activeTab === "details" && (
                  <div>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151", marginBottom: "20px" }}>
                      {selectedScheme?.description || "No description available."}
                    </p>

                    {selectedScheme?.pdf_url && (
                      <div style={{
                        background: "#f0f4ff",
                        border: "1px solid #c7d7f5",
                        borderRadius: "14px",
                        padding: "20px",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ fontSize: "36px", lineHeight: 1 }}>📄</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e3a6e" }}>
                              {selectedScheme?.title || selectedScheme?.name || 'Circular PDF'}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                              PDF Document
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = getPdfUrl(selectedScheme);
                              const rawName = selectedScheme?.title || selectedScheme?.name || 'circular';
                              const filename = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
                              link.download = filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "#10b981",
                              color: "#fff",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              fontWeight: 500,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            ⬇ Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'benefits' && (
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-line' }}>
                    {selectedScheme?.benefits || 'No benefits information available.'}
                  </div>
                )}

                {activeTab === 'eligibility' && (
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-line' }}>
                    {selectedScheme?.eligibility || 'No eligibility information available.'}
                  </div>
                )}

              </div>
            </div>
          </div>
        )
      }


    </div >
  );
};

export default SchemesContent;