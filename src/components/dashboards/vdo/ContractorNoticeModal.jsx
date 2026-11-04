import React, { useState, useRef, useEffect } from 'react';
import { X, Download, FileText, Globe, CheckCircle2, AlertTriangle, Eye, Printer } from 'lucide-react';
import ContractorNoticeLetterhead from './ContractorNoticeLetterhead';
import { generateNoticePdfFromElement, downloadNoticePdf } from '../../../utils/noticePdfGenerator';

/**
 * ContractorNoticeModal
 * Allows a VDO to generate and download an official formal notice served to a Contractor or Agency.
 * Usable from Contractor Details or directly from Complaint Details.
 */
export const ContractorNoticeModal = ({
  isOpen,
  onClose,
  contractor = null,
  complaint = null,
  gpName = '',
  blockName = '',
  districtName = '',
  onSuccess
}) => {
  const [language, setLanguage] = useState('hi'); // 'hi' | 'en'
  const [contractorName, setContractorName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('sanitation_irregularities');
  const [customText, setCustomText] = useState('');
  const [replyDays, setReplyDays] = useState(3);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const letterheadRef = useRef(null);

  // Determine current VDO user details from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const vdoName = currentUser.name || currentUser.username || currentUser.first_name || 'ग्राम विकास अधिकारी';

  // Extract complaint details if available
  const complaintId = complaint?.id || '';
  const complaintTitle = complaint?.complaint_type || complaint?.title || '';
  const complaintDescription = complaint?.description || '';
  const complainantName = complaint?.complainant_name || complaint?.user_name || complaint?.name || '';
  const complaintDate = complaint?.created_at || complaint?.created_date || complaint?.date || '';

  // Extract location (prefer props, fallback to complaint, fallback to user)
  const effectiveGPName = gpName || complaint?.village_name || complaint?.gp_name || currentUser.gp_name || '';
  const effectiveBlockName = blockName || complaint?.block_name || currentUser.block_name || '';
  const effectiveDistrictName = districtName || complaint?.district_name || currentUser.district_name || '';

  // Initialize contractor and agency names
  useEffect(() => {
    if (contractor) {
      setContractorName(contractor.person_name || contractor.name || '');
      setAgencyName(contractor.agency_name || contractor.agency?.name || '');
    } else if (complaint?.contractor) {
      setContractorName(complaint.contractor.person_name || complaint.contractor.name || '');
      setAgencyName(complaint.contractor.agency_name || complaint.contractor.agency?.name || '');
    } else {
      setContractorName('');
      setAgencyName('');
    }

    if (complaintId) {
      setNoticeCategory('unresolved_complaint');
    } else {
      setNoticeCategory('sanitation_irregularities');
    }
    setCustomText('');
    setDownloadSuccess(false);
  }, [contractor, complaint, isOpen]);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const categoryOptions = [
    {
      id: 'sanitation_irregularities',
      labelHi: 'स्वच्छता / डोर-टू-डोर कचरा संग्रहण में अनियमितता',
      labelEn: 'Irregularities in Door-to-Door Waste Collection'
    },
    {
      id: 'unresolved_complaint',
      labelHi: 'लम्बित जन-शिकायत का अनिस्तारण / लापरवाही',
      labelEn: 'Unresolved Citizen Complaint & Negligence'
    },
    {
      id: 'attendance_shortfall',
      labelHi: 'श्रमिकों / वाहनों की अपर्याप्त उपस्थिति',
      labelEn: 'Shortfall in Deployed Workers or Vehicles'
    },
    {
      id: 'general_breach',
      labelHi: 'स्वच्छता अनुबंध शर्तों का उल्लंघन',
      labelEn: 'Sanitation Agreement Terms Breach'
    },
    {
      id: 'custom',
      labelHi: 'अन्य / विशेष निर्देश (Custom Text)',
      labelEn: 'Custom Notice Text'
    }
  ];

  const handleDownloadPdf = async () => {
    if (!letterheadRef.current) return;
    try {
      setIsGenerating(true);
      const fileName = `Notice_Contractor_${(contractorName || 'Contractor').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const { pdf } = await generateNoticePdfFromElement(letterheadRef.current, fileName);
      downloadNoticePdf(pdf, fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to generate contractor notice PDF:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '95%',
        maxWidth: showPreview ? '1200px' : '650px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.4px'
              }}>
                VDO ➔ CONTRACTOR
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {isHindi ? 'संवेदक / एजेंसी को कारण बताओ नोटिस जारी करें' : 'Issue Notice to Contractor / Agency'}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0 0' }}>
              {isHindi
                ? `ग्राम पंचायत: ${effectiveGPName || '—'}, पंचायत समिति: ${effectiveBlockName || '—'}`
                : `GP: ${effectiveGPName || '—'}, Block: ${effectiveBlockName || '—'}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(l => l === 'hi' ? 'en' : 'hi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
              title="Toggle Notice Language"
            >
              <Globe size={14} color="#009B56" />
              <span>{isHindi ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* Toggle Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreview(p => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: showPreview ? '#ecfdf5' : '#ffffff',
                color: showPreview ? '#047857' : '#374151',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Eye size={14} />
              <span>{showPreview ? (isHindi ? 'फॉर्म देखें' : 'Hide Preview') : (isHindi ? 'नोटिस प्रिव्यू' : 'View Preview')}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f3f4f6'
        }}>
          {/* Left Panel: Configuration Form */}
          <div style={{
            flex: showPreview ? '0 0 460px' : '1 1 auto',
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRight: showPreview ? '1px solid #e5e7eb' : 'none'
          }}>
            {downloadSuccess && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#065f46'
              }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>{isHindi ? 'नोटिस PDF सफलतापूर्वक डाउनलोड हो गया है।' : 'Official notice PDF downloaded successfully.'}</span>
              </div>
            )}

            {/* Contractor & Agency Inputs */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                {isHindi ? 'संवेदक का नाम (Contractor Person Name)' : 'Contractor Person Name'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. श्री मोहन लाल / फर्म प्रतिनिधि' : 'e.g. Mr. Mohan Lal'}
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                {isHindi ? 'संवेदक एजेंसी / फर्म का नाम (Agency Name)' : 'Agency / Firm Name'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. मैसर्स श्री कृष्णा एंटरप्राइजेज' : 'e.g. M/s Krishna Sanitation Services'}
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Notice Category */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                {isHindi ? 'नोटिस का कारण / श्रेणी (Notice Subject / Reason)' : 'Notice Reason / Subject'}
              </label>
              <select
                value={noticeCategory}
                onChange={(e) => setNoticeCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13.5px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                {categoryOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {isHindi ? opt.labelHi : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Complaint Link Notice Banner */}
            {complaintId && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '12.5px',
                color: '#1e40af'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                  {isHindi ? `📌 सम्बद्ध शिकायत: #${complaintId}` : `📌 Linked Complaint: #${complaintId}`}
                </div>
                <div>{complaintTitle || complaintDescription || 'Sanitation issue'}</div>
              </div>
            )}

            {/* Reply Days Timeline */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                {isHindi ? 'स्पष्टीकरण प्रस्तुत करने की समयावधि (Reply Timeline)' : 'Required Reply Timeline'}
              </label>
              <select
                value={replyDays}
                onChange={(e) => setReplyDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13.5px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                <option value={2}>{isHindi ? '2 दिवस (2 Days - अत्यावश्यक)' : '2 Days (Urgent)'}</option>
                <option value={3}>{isHindi ? '3 दिवस (3 Days - मानक)' : '3 Days (Standard)'}</option>
                <option value={5}>{isHindi ? '5 दिवस (5 Days)' : '5 Days'}</option>
                <option value={7}>{isHindi ? '7 दिवस (7 Days)' : '7 Days'}</option>
              </select>
            </div>

            {/* Custom Remarks / Instruction Box */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                {isHindi ? 'विशेष निर्देश / विवरण (Optional Custom Remarks)' : 'Optional Custom Remarks'}
              </label>
              <textarea
                rows={4}
                placeholder={isHindi
                  ? 'यदि कोई विशेष निर्देश अथवा विशिष्ट वार्ड / घटना का उल्लेख करना हो तो यहाँ लिखें...'
                  : 'Add any specific ward name, incident date, or custom instructions...'}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={600}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right', marginTop: '2px' }}>
                {customText.length} / 600
              </div>
            </div>
          </div>

          {/* Right Panel: Live Document Preview (when enabled) */}
          {showPreview && (
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#525659',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '20px' }}>
                <ContractorNoticeLetterhead
                  language={language}
                  vdoName={vdoName}
                  contractorName={contractorName}
                  agencyName={agencyName}
                  complaintId={complaintId}
                  complaintTitle={complaintTitle}
                  complaintDescription={complaintDescription}
                  complainantName={complainantName}
                  complaintDate={complaintDate}
                  villageName={effectiveGPName}
                  blockName={effectiveBlockName}
                  districtName={effectiveDistrictName}
                  noticeCategory={noticeCategory}
                  customNoticeText={customText}
                  replyDays={replyDays}
                  noticeDate={new Date()}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {isHindi
              ? '* नोटिस अधिकृत रूप से ग्राम विकास अधिकारी (VDO) द्वारा हस्ताक्षरित रहेगा।'
              : '* Notice will be issued under official signature of the Village Development Officer (VDO).'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                backgroundColor: '#009B56',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(0, 155, 86, 0.25)'
              }}
            >
              <Download size={16} />
              <span>{isGenerating ? (isHindi ? 'PDF तैयार हो रहा है...' : 'Generating PDF...') : (isHindi ? 'नोटिस PDF डाउनलोड करें' : 'Download Notice PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Letterhead for canvas capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -100 }}>
        <ContractorNoticeLetterhead
          ref={letterheadRef}
          language={language}
          vdoName={vdoName}
          contractorName={contractorName}
          agencyName={agencyName}
          complaintId={complaintId}
          complaintTitle={complaintTitle}
          complaintDescription={complaintDescription}
          complainantName={complainantName}
          complaintDate={complaintDate}
          villageName={effectiveGPName}
          blockName={effectiveBlockName}
          districtName={effectiveDistrictName}
          noticeCategory={noticeCategory}
          customNoticeText={customText}
          replyDays={replyDays}
          noticeDate={new Date()}
        />
      </div>
    </div>
  );
};

export default ContractorNoticeModal;
