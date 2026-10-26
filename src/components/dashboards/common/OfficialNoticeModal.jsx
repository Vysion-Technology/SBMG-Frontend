import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, Send, Download, FileText, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { noticesAPI } from '../../../services/api';
import OfficialNoticeLetterhead from './OfficialNoticeLetterhead';
import { generateNoticePdfFromElement, downloadNoticePdf } from '../../../utils/noticePdfGenerator';

/**
 * OfficialNoticeModal
 * Modal for creating and dispatching official show-cause notices for complaints / performance.
 * Features:
 * - Language selection (Hindi / English)
 * - Sequence-aware authority letterheads (BDO, CEO, SMD)
 * - Live PDF Letterhead Preview
 * - Automated PDF generation & attachment via S3/notices media API
 * - 7-day follow-up / reminder notice mode support
 */
export const OfficialNoticeModal = ({
  isOpen,
  onClose,
  complaint = null,
  target = null,
  senderRole = 'CEO', // 'BDO' | 'CEO' | 'SMD'
  isFollowUp = false,
  followUpDays = 7,
  onSuccess
}) => {
  const [language, setLanguage] = useState('hi'); // 'hi' | 'en'
  const [noticeTypes, setNoticeTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [subject, setSubject] = useState('');
  const [customText, setCustomText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Hidden ref for rendering the letterhead to canvas/PDF
  const letterheadRef = useRef(null);

  // Extract complaint/target details
  const complaintId = complaint?.id || target?.complaintId || '';
  const complaintTitle = complaint?.complaint_type || complaint?.title || target?.kpiName || 'Complaint';
  const villageName = complaint?.village_name || complaint?.gp_name || target?.gpName || target?.name || '';
  const blockName = complaint?.block_name || target?.blockName || '';
  const districtName = complaint?.district_name || target?.districtName || '';
  const districtId = complaint?.district_id || target?.districtId || null;
  const blockId = complaint?.block_id || target?.blockId || null;
  const gpId = complaint?.village_id || complaint?.gp_id || target?.gpId || null;

  // Determine current user information
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const senderName = currentUser.name || currentUser.username || currentUser.first_name || (senderRole === 'BDO' ? 'Block Development Officer' : senderRole === 'CEO' ? 'Chief Executive Officer' : 'State Mission Director');

  // Allowed recipient roles based on hierarchy sequence
  const recipientOptions = senderRole === 'SMD'
    ? [
        { role: 'CEO', label: 'Chief Executive Officer (CEO / जिला परिषद)' },
        { role: 'BDO', label: 'Block Development Officer (BDO / पंचायत समिति)' },
        { role: 'VDO', label: 'Village Development Officer (VDO / ग्राम पंचायत)' }
      ]
    : senderRole === 'CEO'
    ? [
        { role: 'BDO', label: 'Block Development Officer (BDO / पंचायत समिति)' },
        { role: 'VDO', label: 'Village Development Officer (VDO / ग्राम पंचायत)' }
      ]
    : [
        { role: 'VDO', label: 'Village Development Officer (VDO / ग्राम पंचायत)' }
      ];

  const [recipientRole, setRecipientRole] = useState(
    senderRole === 'SMD' ? 'CEO' : (senderRole === 'CEO' ? 'BDO' : 'VDO')
  );
  const recipientName = complaint?.vdo_name || target?.recipientName || '';

  // Generate default subject based on language & follow-up mode
  const getDefaultSubject = useCallback((lang, followUp) => {
    if (lang === 'hi') {
      return followUp
        ? `कारण बताओ नोटिस - द्वितीय स्मरण पत्र (शिकायत क्र. ${complaintId || '—'})`
        : `कारण बताओ नोटिस (शिकायत क्र. ${complaintId || '—'})`;
    }
    return followUp
      ? `Show Cause Notice - Reminder (${followUpDays}+ Days Overdue) (Complaint ID: #${complaintId || '—'})`
      : `Show Cause Notice (Complaint ID: #${complaintId || '—'})`;
  }, [complaintId, followUpDays]);

  // Load notice categories on mount
  useEffect(() => {
    if (isOpen) {
      const fetchTypes = async () => {
        try {
          setLoadingTypes(true);
          const response = await noticesAPI.getTypes();
          let types = Array.isArray(response.data) ? response.data : [];
          if (types.length === 0) {
            types = [
              { id: 1, name: 'Show Cause Notice (कारण बताओ नोटिस)' },
              { id: 2, name: 'Performance Warning (कार्य निष्पादन चेतावनी)' }
            ];
          }
          setNoticeTypes(types);

          // Auto-select 'Show Cause' or 'Performance' or first category
          const preferred = types.find(t => 
            t.name.toLowerCase().includes('cause') || 
            t.name.toLowerCase().includes('performance') ||
            t.name.toLowerCase().includes('warning')
          );
          setSelectedTypeId(preferred ? preferred.id.toString() : types[0].id.toString());
        } catch (err) {
          console.error('Failed to load notice types:', err);
          setNoticeTypes([
            { id: 1, name: 'Show Cause Notice (कारण बताओ नोटिस)' },
            { id: 2, name: 'Performance Warning (कार्य निष्पादन चेतावनी)' }
          ]);
          setSelectedTypeId('1');
        } finally {
          setLoadingTypes(false);
        }
      };

      fetchTypes();
      setRecipientRole(senderRole === 'SMD' ? 'CEO' : (senderRole === 'CEO' ? 'BDO' : 'VDO'));
      setSubject(getDefaultSubject(language, isFollowUp));
      setCustomText('');
      setShowPreview(false);
      setSubmitError(null);
    }
  }, [isOpen, getDefaultSubject, language, isFollowUp, senderRole]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setSubject(getDefaultSubject(newLang, isFollowUp));
  };

  // Submit Notice and generate PDF
  const handleSendNotice = async () => {
    if (!selectedTypeId || !subject.trim()) {
      setSubmitError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // 1. Create notice payload
      const payload = {
        notice_type_id: parseInt(selectedTypeId, 10),
        district_id: districtId,
        block_id: blockId,
        gp_id: gpId,
        title: subject.trim(),
        text: customText.trim() || undefined,
        recipient: recipientRole,
        module: 'Complaints',
        complaint_id: complaintId ? parseInt(complaintId, 10) : undefined,
        sender_name: senderName,
        recipient_name: recipientRole,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      };

      // 2. Dispatch notice to backend
      const response = await noticesAPI.createNotice(payload);
      const createdNotice = response.data;
      console.log('✅ Notice created:', createdNotice);

      // 3. Generate automated official PDF from letterhead
      if (letterheadRef.current && createdNotice?.id) {
        try {
          const fileName = `Official_Notice_${complaintId || createdNotice.id}_${language.toUpperCase()}.pdf`;
          const { file } = await generateNoticePdfFromElement(letterheadRef.current, fileName);

          // 4. Upload generated PDF as notice media attachment
          await noticesAPI.uploadMedia(createdNotice.id, file);
          console.log('✅ Automated PDF attached to notice successfully');
        } catch (pdfErr) {
          console.warn('Could not attach automated PDF:', pdfErr);
        }
      }

      onSuccess?.(createdNotice);
      onClose();
      alert(language === 'hi' ? 'कारण बताओ नोटिस सफलतापूर्वक प्रेषित कर दिया गया है।' : 'Show cause notice dispatched successfully!');
    } catch (err) {
      console.error('Error dispatching notice:', err);
      setSubmitError(err.response?.data?.detail || err.message || 'Failed to dispatch notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: showPreview ? '1180px' : '620px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        transition: 'width 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isFollowUp ? '#fef2f2' : '#f8fafc'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 700,
                color: isFollowUp ? '#dc2626' : '#111827'
              }}>
                {isFollowUp ? '⚠️ Issue Follow-up Notice / अनुस्मारक पत्र' : 'Issue Official Notice / कारण बताओ नोटिस'}
              </span>
              {isFollowUp && (
                <span style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {followUpDays}+ Days Overdue
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              {senderRole} → {recipientRole} ({villageName ? `GP: ${villageName}` : ''}{blockName ? `, Block: ${blockName}` : ''})
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f8fafc'
        }}>
          {/* Left Panel: Form Controls */}
          <div style={{
            flex: showPreview ? '0 0 460px' : '1',
            padding: '22px 24px',
            overflowY: 'auto',
            borderRight: showPreview ? '1px solid #e2e8f0' : 'none',
            backgroundColor: '#ffffff'
          }}>
            {/* Language Selection Bar */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                <Globe size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-2px' }} />
                Select Notice Language / भाषा चुनें
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: language === 'hi' ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: language === 'hi' ? '#ecfdf5' : '#ffffff',
                    color: language === 'hi' ? '#065f46' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {language === 'hi' && <CheckCircle2 size={15} color="#059669" />}
                  हिंदी (Official Rajasthan Govt)
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: language === 'en' ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: language === 'en' ? '#ecfdf5' : '#ffffff',
                    color: language === 'en' ? '#065f46' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {language === 'en' && <CheckCircle2 size={15} color="#059669" />}
                  English (Formal)
                </button>
              </div>
            </div>

            {/* Recipient Selection / Display */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Recipient Authority / प्रेषिती अधिकारी <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {recipientOptions.length > 1 ? (
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 500
                  }}
                >
                  {recipientOptions.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: '#334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#475569' }}>To: </span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{recipientOptions[0]?.label || recipientRole}</span>
                    {villageName && <span> ({villageName})</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    From: <strong>{senderRole}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Notice Category / श्रेणी <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                disabled={loadingTypes || isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                {loadingTypes ? (
                  <option>Loading categories...</option>
                ) : (
                  noticeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Subject Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Subject / विषय <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Additional Remarks / Custom Text Override */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                  Custom Remarks / अतिरिक्त निर्देश (Optional)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Leave empty to use official template
                </span>
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                disabled={isSubmitting}
                placeholder={language === 'hi' ? 'यदि कोई विशेष टिप्पणी या अतिरिक्त आदेश जोड़ना हो तो यहाँ लिखें...' : 'Add any specific directive or remarks to append to the notice...'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                marginBottom: '16px'
              }}>
                {submitError}
              </div>
            )}

            {/* Toggle Preview Button */}
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  backgroundColor: showPreview ? '#e0f2fe' : '#ffffff',
                  color: '#0369a1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px'
                }}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? 'Hide PDF Letterhead Preview' : 'Show PDF Letterhead Preview (डिजिटल हस्ताक्षर सहित)'}
              </button>
            </div>
          </div>

          {/* Right Panel: Live PDF Letterhead Preview */}
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
                <OfficialNoticeLetterhead
                  language={language}
                  senderRole={senderRole}
                  senderName={senderName}
                  recipientRole={recipientRole}
                  recipientName={recipientName}
                  complaintId={complaintId}
                  complaintTitle={complaintTitle}
                  villageName={villageName}
                  blockName={blockName}
                  districtName={districtName}
                  customNoticeText={customText}
                  isFollowUp={isFollowUp}
                  followUpDays={followUpDays}
                  noticeDate={new Date()}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            📄 Official PDF with Digital Sign will be automatically generated and attached.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendNotice}
              disabled={isSubmitting || !selectedTypeId || !subject.trim()}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSubmitting || !selectedTypeId || !subject.trim() ? '#94a3b8' : '#059669',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: isSubmitting || !selectedTypeId || !subject.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              <Send size={15} />
              {isSubmitting ? 'Generating PDF & Sending...' : 'Dispatch Notice / नोटिस भेजें'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Letterhead Node for html2canvas rendering */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -100 }}>
        <OfficialNoticeLetterhead
          ref={letterheadRef}
          language={language}
          senderRole={senderRole}
          senderName={senderName}
          recipientRole={recipientRole}
          recipientName={recipientName}
          complaintId={complaintId}
          complaintTitle={complaintTitle}
          villageName={villageName}
          blockName={blockName}
          districtName={districtName}
          customNoticeText={customText}
          isFollowUp={isFollowUp}
          followUpDays={followUpDays}
          noticeDate={new Date()}
        />
      </div>
    </div>
  );
};

export default OfficialNoticeModal;
