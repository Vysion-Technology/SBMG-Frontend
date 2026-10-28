import React from 'react';
import noticeHeaderBanner from '../../../assets/images/notice-official-header.png';

/**
 * OfficialNoticeLetterhead
 * Printable and previewable official Rajasthan Government letterhead for notices.
 * Supports Hindi and English with sequence-based authority designation (BDO, CEO, SMD)
 * and an official digital signature verification stamp.
 */
export const OfficialNoticeLetterhead = React.forwardRef(({
  language = 'hi', // 'hi' | 'en'
  senderRole = 'BDO', // 'BDO' | 'CEO' | 'SMD'
  senderName = '',
  recipientRole = 'VDO',
  recipientName = '',
  complaintId = '',
  complaintTitle = '',
  villageName = '',
  blockName = '',
  districtName = '',
  noticeCategory = 'Show Cause Notice',
  customNoticeText = '',
  isFollowUp = false,
  followUpDays = 7,
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

  const referenceNo = refNumber || `SBMG/Notice/${senderRole}/${complaintId || 'GEN'}/${new Date().getFullYear()}`;

  // Sequence-based authority sign-offs
  const getAuthoritySignOff = () => {
    const roleUpper = (senderRole || '').toUpperCase();
    if (roleUpper.includes('BDO') || roleUpper.includes('BLOCK')) {
      return {
        title: isHindi ? 'खण्ड विकास अधिकारी' : 'Block Development Officer',
        office: isHindi ? `पंचायत समिति ${blockName || ''}` : `Panchayat Samiti ${blockName || ''}`,
        location: `${blockName ? blockName + ', ' : ''}${districtName || ''}`
      };
    }
    if (roleUpper.includes('CEO') || roleUpper.includes('CHIEF')) {
      return {
        title: isHindi ? 'मुख्य कार्यकारी अधिकारी' : 'Chief Executive Officer',
        office: isHindi ? `जिला परिषद ${districtName || ''}` : `Zilla Parishad ${districtName || ''}`,
        location: `${districtName || 'Rajasthan'}`
      };
    }
    // Default: SMD
    return {
      title: isHindi ? 'राज्य मिशन निदेशक' : 'State Mission Director',
      office: isHindi ? 'निदेशालय स्वच्छ भारत मिशन (ग्रामीण), राजस्थान' : 'Directorate of Swachh Bharat Mission (Gr.), Rajasthan',
      location: isHindi ? 'जयपुर, राजस्थान' : 'Jaipur, Rajasthan'
    };
  };

  const authority = getAuthoritySignOff();

  // Subject line
  const subjectText = isHindi
    ? (isFollowUp
        ? `विषय : कारण बताओ नोटिस - द्वितीय स्मरण पत्र (अनुस्मारक) (शिकायत क्र. ${complaintId || '—'})`
        : `विषय : कारण बताओ नोटिस। (शिकायत क्र. ${complaintId || '—'})`)
    : (isFollowUp
        ? `Subject: Show Cause Notice - Follow-up Reminder (${followUpDays}+ Days Overdue) (Complaint ID: #${complaintId || '—'})`
        : `Subject: Show Cause Notice (Complaint ID: #${complaintId || '—'})`);

  // Default body template
  const getBodyParagraphs = () => {
    if (customNoticeText && customNoticeText.trim()) {
      return [customNoticeText];
    }

    if (isHindi) {
      if (isFollowUp) {
        return [
          `उपरोक्त विषयांतर्गत संदर्भित नोटिस के क्रम में लेख है कि ग्राम पंचायत ${villageName ? `"${villageName}"` : 'आपकी ग्राम पंचायत'} में लम्बित शिकायत क्र. #${complaintId || '—'} (${complaintTitle || 'लम्बित शिकायत'}) के संबंध में पूर्व में कारण बताओ नोटिस जारी किया गया था।`,
          `उक्त नोटिस पर निर्धारित 7 दिवस व्यतीत हो जाने के उपरांत भी आपकी ओर से कोई स्पष्टीकरण प्रस्तुत नहीं किया गया है और न ही प्रकरण का निस्तारण किया गया है, जो कि पदीय कर्तव्यों के प्रति घोर लापरवाही एवं अनुशासनहीनता का परिचायक है।`,
          `अतः आपको अंतिम अवसर प्रदान करते हुए निर्देशित किया जाता है कि पत्र प्राप्ति के 48 घंटे के भीतर अपना स्पष्टीकरण एवं निस्तारण आख्या पोर्टल पर दर्ज करना सुनिश्चित करें, अन्यथा आपके विरुद्ध राजस्थान पंचायती राज अधिनियम के अंतर्गत कठोर अनुशासनात्मक कार्यवाही प्रस्तावित कर दी जाएगी।`
        ];
      }
      return [
        `उपरोक्त विषयांतर्गत लेख है कि SBMG मोबाइल ऐप पर आपकी ग्राम पंचायत ${villageName ? `"${villageName}"` : ''} में निम्नानुसार (${complaintTitle || '1'}) शिकायतें लम्बित है जिनका निर्धारित समय-सीमा बीत जाने के उपरांत भी निस्तारित किया जाना शेष है।`,
        `अतः उक्त क्रम में क्यों न आपके विरुद्ध नियमानुसार अनुशासनात्मक कार्यवाही अमल में लायी जाए। इस सम्बंध में आप अपना स्पष्टीकरण 3 दिवस में अधोहस्ताक्षरकर्ता के समक्ष पोर्टल/ऐप के माध्यम से अथवा लिखित रूप में प्रस्तुत करना सुनिश्चित करें तथा लम्बित प्रकरण का तत्काल निस्तारण कर रिपोर्ट दर्ज करें।`
      ];
    }

    // English
    if (isFollowUp) {
      return [
        `In reference to the subject cited above, a formal Show Cause Notice was previously issued regarding unresolved Complaint #${complaintId || '—'} ("${complaintTitle || 'Complaint'}") in Gram Panchayat ${villageName ? `"${villageName}"` : 'your jurisdiction'}.`,
        `More than ${followUpDays} days have elapsed since the dispatch of the initial notice, yet neither has a reply/explanation been submitted nor has the grievance been addressed on the SBMG platform. This reflects willful negligence and dereliction of duty.`,
        `You are hereby granted a final opportunity to submit your comprehensive explanation and action taken report within 48 hours via the portal, failing which stringent disciplinary proceedings under applicable service rules shall be initiated against you without further notice.`
      ];
    }
    return [
      `In reference to the subject cited above, it is noted that Complaint #${complaintId || '—'} regarding "${complaintTitle || 'Complaint'}" in Gram Panchayat ${villageName ? `"${villageName}"` : 'your jurisdiction'} has crossed the prescribed resolution time frame and remains pending on the SBMG portal.`,
      `Therefore, you are hereby called upon to show cause why disciplinary action should not be initiated against you in accordance with the rules. You are directed to submit your explanation within 3 days to the undersigned via the portal/app or in writing, and immediately resolve the pending matter and submit the compliance report.`
    ];
  };

  const paragraphs = getBodyParagraphs();

  return (
    <div
      ref={ref}
      style={{
        width: '794px', // A4 standard width at 96 DPI
        minHeight: '1123px', // A4 standard height at 96 DPI
        backgroundColor: '#ffffff',
        color: '#111827',
        fontFamily: isHindi ? "'Noto Sans Devanagari', 'Mangal', 'Segoe UI', Tahoma, sans-serif" : "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: '36px 48px',
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
        {/* Official Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img
            src={noticeHeaderBanner}
            alt="Government of Rajasthan Letterhead Header"
            style={{
              width: '100%',
              maxHeight: '135px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto'
            }}
          />
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
          marginBottom: '20px'
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

        {/* Notice Subject Line */}
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: isFollowUp ? '#dc2626' : '#111827',
          marginBottom: '22px',
          padding: '6px 0',
          borderBottom: '1.5px solid #111827',
          display: 'inline-block'
        }}>
          <u>{subjectText}</u>
        </div>

        {/* Notice Body */}
        <div style={{
          fontSize: '14.5px',
          color: '#1f2937',
          textAlign: 'justify',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '32px'
        }}>
          {paragraphs.map((p, idx) => (
            <p key={idx} style={{ margin: 0, textIndent: idx === 0 ? '28px' : '0' }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Footer Section with Digital Signature & Authority Sign-off */}
      <div style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid #f3f4f6'
      }}>
        {/* Verification seal / Note */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          maxWidth: '300px',
          lineHeight: 1.4
        }}>
          <div>* {isHindi ? 'यह पत्र स्वच्छ भारत मिशन (ग्रामीण) राजस्थान पोर्टल द्वारा स्वतः जनरेटेड है।' : 'This notice is system generated via Swachh Bharat Mission (Gr.) Rajasthan.'}</div>
          <div>* {isHindi ? 'प्रतिक्रिया पोर्टल/मोबाइल ऐप के माध्यम से 3 दिवस में प्रेषित करें।' : 'Submit official reply via the SBM-G portal or mobile app within 3 days.'}</div>
        </div>

        {/* Right Section: Digital Signature Box & Designation */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {/* Digital Signature Stamp */}
          <div style={{
            border: '1.5px solid #059669',
            backgroundColor: '#ecfdf5',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '11.5px',
            textAlign: 'left',
            color: '#065f46',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            width: '240px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#047857', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px' }}>✓</span>
              <span>{isHindi ? 'डिजिटल हस्ताक्षरित' : 'Digitally Signed'}</span>
            </div>
            <div><strong>{isHindi ? 'हस्ताक्षरकर्ता: ' : 'Signed by: '}</strong>{senderName || authority.title}</div>
            <div><strong>{isHindi ? 'पदनाम: ' : 'Designation: '}</strong>{authority.title}</div>
            <div><strong>{isHindi ? 'दिनांक: ' : 'Date: '}</strong>{formattedDateTime}</div>
            <div><strong>{isHindi ? 'स्थान: ' : 'Location: '}</strong>{authority.location}</div>
          </div>

          {/* Authority Designation Text */}
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
            {authority.title}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
            {authority.office}
          </div>
        </div>
      </div>
    </div>
  );
});

OfficialNoticeLetterhead.displayName = 'OfficialNoticeLetterhead';
export default OfficialNoticeLetterhead;
