import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate a PDF File object and Blob from a DOM element containing the OfficialNoticeLetterhead.
 * @param {HTMLElement} element - The DOM node to render
 * @param {string} fileName - The desired PDF file name (default: 'Notice.pdf')
 * @returns {Promise<{ file: File, blob: Blob, dataUrl: string }>}
 */
export async function generateNoticePdfFromElement(element, fileName = 'Notice.pdf') {
  if (!element) {
    throw new Error('Element for PDF generation is required');
  }

  // Render element to high-res canvas (scale 2 for crisp 300 DPI text)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Fit image to A4 width
  const imgProps = pdf.getImageProperties(imgData);
  const renderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));

  const blob = pdf.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const dataUrl = pdf.output('dataurlstring');

  return { file, blob, dataUrl, pdf };
}

/**
 * Download the generated PDF directly in the browser
 */
export function downloadNoticePdf(pdf, fileName = 'Official_Notice.pdf') {
  if (pdf && typeof pdf.save === 'function') {
    pdf.save(fileName);
  }
}
