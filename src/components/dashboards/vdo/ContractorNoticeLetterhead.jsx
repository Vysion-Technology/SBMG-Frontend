import React from 'react';

/**
 * ContractorNoticeLetterhead
 * Official Notice letterhead served by Village Development Officer (VDO) to Contractors / Agencies.
 * Formatted for standard A4 portrait output with official Rajasthani government styling,
 * digital signature verification box, and optional complaint reference.
 */
export const ContractorNoticeLetterhead = React.forwardRef(({
  language = 'hi', // 'hi' | 'en'
  vdoName = '',
  contractorName = '',
  agencyName = '',
  contractFrequency = '',
  complaintId = '',
  complaintTitle = '',
  complaintDescription = '',
  complainantName = '',
  complaintDate = '',
  villageName = '',
  blockName = '',
  districtName = '',
  noticeCategory = 'Sanitation Work Irregularities',
  customNoticeText = '',
  replyDays = 3,
  noticeDate = new Date(),
  refNumber = '',
}, ref) => {
  const isHindi = language === 'hi';

  const formattedDate = new Date(noticeDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedDateTime = new Date(noticeDate).toLocaleString(isHindi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedComplaintDate = complaintDate
    ? new Date(complaintDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  const referenceNo = refNumber || `SBMG/VDO/${villageName || 'GP'}/${complaintId ? `COMP-${complaintId}` : 'CONT'}/${new Date().getFullYear()}`;

  // Subject line
  const subjectText = isHindi
    ? (complaintId
        ? `विषय : स्वच्छता कार्य में लापरवाही एवं लम्बित शिकायत क्र. #${complaintId} के निस्तारण बाबत कारण बताओ नोटिस।`
        : `विषय : ग्राम पंचायत में स्वच्छता/कचरा संग्रहण कार्य में अनियमितता एवं अनुबंध शर्तों के उल्लंघन बाबत कारण बताओ नोटिस।`)
    : (complaintId
        ? `Subject: Show Cause Notice for Sanitation Negligence & Unresolved Complaint #${complaintId}`
        : `Subject: Show Cause Notice regarding Sanitation Service Irregularities and Agreement Breach`);

  // Default body paragraphs
  const getBodyParagraphs = () => {
    if (customNoticeText && customNoticeText.trim()) {
      return [customNoticeText];
    }

    if (isHindi) {
      const p1 = `उपरोक्त विषयांतर्गत लेख है कि आप द्वारा ग्राम पंचायत ${villageName ? `"${villageName}"` : 'उक्त'} में अनुबंधित स्वच्छता, डोर-टू-डोर कचरा संग्रहण एवं निस्तारण कार्य में निरंतर अनियमितता एवं लापरवाही बरती जा रही है।`;
      const p2 = complaintId
        ? `पोर्टल पर दर्ज जन शिकायत क्र. #${complaintId} (${complaintTitle || 'स्वच्छता सम्बन्धी शिकायत'}) के सम्बंध में निरीक्षण उपरांत पाया गया कि कार्य संतोषजनक नहीं है और समस्या का निस्तारण नहीं किया गया है।`
        : `क्षेत्रीय निरीक्षण एवं ग्रामवासियों से प्राप्त फीडबैक के अनुसार कचरा संग्रहण का कार्य निर्धारित समय-सारणी एवं मानकों के अनुरूप संपादित नहीं हो रहा है, जो अनुबंध की शर्तों का स्पष्ट उल्लंघन है।`;
      const p3 = `अतः आपको निर्देशित किया जाता है कि पत्र प्राप्ति के ${replyDays} दिवस के भीतर त्रुटि में सुधार करते हुए अपना स्पष्टीकरण अधोहस्ताक्षरकर्ता के समक्ष व्यक्तिगत अथवा लिखित रूप से प्रस्तुत करें। नियत समयावधि में संतोषप्रद उत्तर प्राप्त न होने अथवा सुधार न होने की दशा में आपके विरुद्ध अनुबंध की शर्तों के तहत दंडात्मक कार्यवाही / अनुबंध निरस्तीकरण एवं धरोहर राशि जब्त करने हेतु उच्चाधिकारियों (BDO/CEO) को अनुशंसा प्रेषित कर दी जाएगी।`;
      return [p1, p2, p3];
    }

    const p1 = `With reference to the subject cited above, it has been observed that there are persistent irregularities and severe negligence in the execution of sanitation and door-to-door waste collection services contracted to you in Gram Panchayat ${villageName ? `"${villageName}"` : 'this GP'}.`;
    const p2 = complaintId
      ? `Specifically regarding registered citizen complaint #${complaintId} ("${complaintTitle || 'Sanitation Issue'}"), ground inspection reveals that the resolution has not been carried out in accordance with mandated hygiene and service standards.`
      : `Ground verification indicates that sanitation activities are not adhering to the scheduled frequency and quality parameters, constituting a clear breach of contractual terms.`;
    const p3 = `Therefore, you are hereby directed to rectify all shortcomings and submit a written explanation to the undersigned within ${replyDays} days of receipt of this notice. Failure to comply within the stipulated timeframe will result in punitive action, forfeiture of security deposit, and recommendation to higher authorities (BDO/CEO) for termination of your contract.`;
    return [p1, p2, p3];
  };

  const paragraphs = getBodyParagraphs();

  return (
    <div
      ref={ref}
      style={{
        width: '794px', // standard A4 @ 96 DPI
        minHeight: '1123px', // standard A4 @ 96 DPI
        padding: '36px 48px',
        backgroundColor: '#ffffff',
        fontFamily: "'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: '#1f2937',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        lineHeight: 1.6,
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      <div>
        {/* Office Heading */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '14px',
          borderBottom: '2px solid #009B56',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#047857', letterSpacing: '0.5px' }}>
            {isHindi ? 'कार्यालय ग्राम पंचायत' : 'OFFICE OF THE GRAM PANCHAYAT'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '2px 0' }}>
            {villageName || 'ग्राम पंचायत'}
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
            {isHindi
              ? `पंचायत समिति: ${blockName || '—'}, जिला: ${districtName || 'राजस्थान'}`
              : `Panchayat Samiti: ${blockName || '—'}, District: ${districtName || 'Rajasthan'}`}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '2px' }}>
            {isHindi ? 'स्वच्छ भारत मिशन (ग्रामीण), पंचायती राज विभाग, राजस्थान सरकार' : 'Swachh Bharat Mission (Gr.), Panchayati Raj Department, Govt. of Rajasthan'}
          </div>
        </div>

        {/* Ref No & Date Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '18px'
        }}>
          <div>
            <span>{isHindi ? 'क्रमांक: ' : 'Ref No: '}</span>
            <span style={{ color: '#111827' }}>{referenceNo}</span>
          </div>
          <div>
            <span>{isHindi ? 'दिनांक: ' : 'Date: '}</span>
            <span style={{ color: '#111827' }}>{formattedDate}</span>
          </div>
        </div>

        {/* Recipient Block (To: Contractor / Agency) */}
        <div style={{
          fontSize: '13.5px',
          color: '#1f2937',
          lineHeight: 1.5,
          marginBottom: '18px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '10px 14px'
        }}>
          <div style={{ fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
            {isHindi ? 'प्रति (To),' : 'To,'}
          </div>
          <div style={{ fontWeight: 600, color: '#111827' }}>
            {contractorName ? `श्री ${contractorName}` : (agencyName || (isHindi ? 'संवेदक / प्लेसमेंट एजेंसी' : 'Contractor / Agency'))}
          </div>
          {agencyName && contractorName && (
            <div style={{ color: '#4b5563', fontSize: '12.5px' }}>
              {isHindi ? `एजेंसी: ${agencyName}` : `Agency: ${agencyName}`}
            </div>
          )}
          <div style={{ color: '#4b5563', fontSize: '12.5px' }}>
            {isHindi
              ? `अनुबंधित कार्य: स्वच्छता एवं कचरा संग्रहण / निस्तारण (${villageName || ''})`
              : `Contracted Work: Sanitation & Waste Management (${villageName || ''})`}
          </div>
        </div>

        {/* Notice Subject Line */}
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#dc2626',
          marginBottom: '18px',
          padding: '4px 0',
          borderBottom: '1.5px solid #111827',
          display: 'inline-block'
        }}>
          <u>{subjectText}</u>
        </div>

        {/* Complaint Details Box (if complaintId is present) */}
        {complaintId && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '18px',
            fontSize: '12.5px',
            color: '#334155',
            lineHeight: 1.5
          }}>
            <div style={{
              fontWeight: 700,
              color: '#0f172a',
              fontSize: '13px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{isHindi ? 'विवरण: लम्बित शिकायत' : 'Complaint Reference'}</span>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                {isHindi ? `आईडी: #${complaintId}` : `ID: #${complaintId}`}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
              <div>
                <strong style={{ color: '#1e293b' }}>{isHindi ? 'शिकायत प्रकार: ' : 'Type: '}</strong>
                <span>{complaintTitle || '—'}</span>
              </div>
              {formattedComplaintDate && (
                <div>
                  <strong style={{ color: '#1e293b' }}>{isHindi ? 'पंजीयन दिनांक: ' : 'Date: '}</strong>
                  <span>{formattedComplaintDate}</span>
                </div>
              )}
              {complainantName && (
                <div>
                  <strong style={{ color: '#1e293b' }}>{isHindi ? 'शिकायतकर्ता: ' : 'Complainant: '}</strong>
                  <span>{complainantName}</span>
                </div>
              )}
            </div>
            {complaintDescription && (
              <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                <strong style={{ color: '#1e293b' }}>{isHindi ? 'शिकायत विवरण: ' : 'Description: '}</strong>
                <span>{complaintDescription}</span>
              </div>
            )}
          </div>
        )}

        {/* Notice Body */}
        <div style={{
          fontSize: '14px',
          color: '#1f2937',
          textAlign: 'justify',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {paragraphs.map((p, idx) => (
            <p key={idx} style={{ margin: 0, textIndent: idx === 0 ? '24px' : '0' }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Footer Section with Digital Signature & VDO Sign-off */}
      <div style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: '16px',
        borderTop: '1px solid #f3f4f6'
      }}>
        {/* Verification Note */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          maxWidth: '280px',
          lineHeight: 1.4
        }}>
          <div>* {isHindi ? 'यह नोटिस स्वच्छ भारत मिशन (ग्रामीण) पोर्टल द्वारा स्वतः जनरेटेड है।' : 'System generated via Swachh Bharat Mission (Gr.) Portal.'}</div>
          <div>* {isHindi ? `लिखित उत्तर ${replyDays} दिवस में ग्राम पंचायत कार्यालय में प्रस्तुत करें।` : `Submit written reply within ${replyDays} days to the GP office.`}</div>
        </div>

        {/* Right Section: Digital Signature Box & VDO Title */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {/* Digital Signature Stamp */}
          <div style={{
            border: '1.5px solid #059669',
            backgroundColor: '#ecfdf5',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '10px',
            fontSize: '11.5px',
            textAlign: 'left',
            color: '#065f46',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            width: '230px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#047857', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px' }}>✓</span>
              <span>{isHindi ? 'डिजिटल हस्ताक्षरित' : 'Digitally Signed'}</span>
            </div>
            <div><strong>{isHindi ? 'हस्ताक्षरकर्ता: ' : 'Signed by: '}</strong>{vdoName || (isHindi ? 'ग्राम विकास अधिकारी' : 'Village Development Officer')}</div>
            <div><strong>{isHindi ? 'पदनाम: ' : 'Designation: '}</strong>{isHindi ? 'ग्राम विकास अधिकारी (VDO)' : 'Village Development Officer (VDO)'}</div>
            <div><strong>{isHindi ? 'स्थान: ' : 'Location: '}</strong>{villageName ? `${villageName}, ${blockName || ''}` : 'Rajasthan'}</div>
            <div><strong>{isHindi ? 'दिनांक: ' : 'Date: '}</strong>{formattedDateTime}</div>
          </div>

          {/* VDO Authority Sign-off Text */}
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
            {vdoName || (isHindi ? 'ग्राम विकास अधिकारी' : 'Village Development Officer')}
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#059669' }}>
            {isHindi ? 'ग्राम विकास अधिकारी (VDO)' : 'Village Development Officer (VDO)'}
          </div>
          <div style={{ fontSize: '12px', color: '#4b5563' }}>
            {isHindi ? `ग्राम पंचायत ${villageName || ''}` : `Gram Panchayat ${villageName || ''}`}
          </div>
        </div>
      </div>
    </div>
  );
});

ContractorNoticeLetterhead.displayName = 'ContractorNoticeLetterhead';
export default ContractorNoticeLetterhead;
