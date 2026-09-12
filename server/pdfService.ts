import { PDFDocument, rgb, StandardFonts, degrees, PDFFont } from 'pdf-lib';

const UNICODE_MATH_MAP: Record<string, string> = {
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~=',
  '≡': '==',
  '×': '*',
  '÷': '/',
  '±': '+/-',
  '√': 'sqrt',
  '∞': 'infinity',
  '∈': 'in',
  '∉': 'not in',
  '⊂': 'subset of',
  '⊆': 'subseteq',
  '∪': 'union',
  '∩': 'intersection',
  '→': '->',
  '←': '<-',
  '↔': '<->',
  '⇒': '=>',
  '⇐': '<=',
  '⇔': '<=>',
  'λ': 'lambda',
  'Λ': 'Lambda',
  'π': 'pi',
  'Π': 'Pi',
  'α': 'alpha',
  'β': 'beta',
  'γ': 'gamma',
  'Γ': 'Gamma',
  'δ': 'delta',
  'Δ': 'Delta',
  'θ': 'theta',
  'Θ': 'Theta',
  'σ': 'sigma',
  'Σ': 'Sigma',
  'ω': 'omega',
  'Ω': 'Omega',
  'ε': 'epsilon',
  'μ': 'mu',
  '∑': 'sum',
  '∏': 'prod',
  '∫': 'integral',
  '•': '*',
  '–': '-',
  '—': '--',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  '¹': '^1',
  '²': '^2',
  '³': '^3',
  'ⁿ': '^n',
  '₀': '_0',
  '₁': '_1',
  '₂': '_2',
  'ᵢ': '_i',
  'ⱼ': '_j',
  '⊲': '<',
  '⊳': '>',
  '∀': 'for all',
  '∃': 'there exists',
  '¬': 'NOT',
  '∧': 'AND',
  '∨': 'OR',
  '⊕': 'XOR',
  '·': '*',
  '°': ' deg',
  '§': 'Sec. ',
  '©': '(c)',
  '®': '(R)',
  '™': '(TM)',
};

function sanitizeForWinAnsi(text: string, font: PDFFont): string {
  if (!text) return '';
  let str = text;

  // 1. Replace known unicode math/typography symbols
  for (const [char, replacement] of Object.entries(UNICODE_MATH_MAP)) {
    if (str.includes(char)) {
      str = str.replaceAll(char, replacement);
    }
  }

  // 2. Normalize unicode (NFKD) to decompose composite characters
  str = str.normalize('NFKD');

  // 3. Keep only characters that can be safely measured and encoded
  let safeStr = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    // Standard ASCII printable
    if (code >= 32 && code <= 126) {
      safeStr += char;
      continue;
    }
    if (char === '\t' || char === ' ') {
      safeStr += ' ';
      continue;
    }
    try {
      font.widthOfTextAtSize(char, 10);
      safeStr += char;
    } catch {
      safeStr += ' ';
    }
  }

  return safeStr;
}

export class PdfService {
  /**
   * Merge multiple PDF base64 strings into a single PDF base64 string
   */
  public async mergePdfs(pdfBase64Array: string[]): Promise<string> {
    if (pdfBase64Array.length === 0) {
      throw new Error('At least one PDF is required to merge');
    }

    const mergedPdf = await PDFDocument.create();

    for (const base64Data of pdfBase64Array) {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
      const pdfBytes = Buffer.from(cleanBase64, 'base64');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    return Buffer.from(mergedBytes).toString('base64');
  }

  /**
   * Split a PDF by page range (1-indexed)
   */
  public async splitPdf(
    pdfBase64: string,
    startPage: number,
    endPage: number
  ): Promise<string> {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = Buffer.from(cleanBase64, 'base64');
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const totalPages = sourcePdf.getPageCount();

    const start = Math.max(1, startPage);
    const end = Math.min(totalPages, endPage);

    if (start > end) {
      throw new Error(`Invalid page range: ${start} to ${end}. Total pages: ${totalPages}`);
    }

    const newPdf = await PDFDocument.create();
    const pageIndicesToCopy: number[] = [];
    for (let i = start - 1; i < end; i++) {
      pageIndicesToCopy.push(i);
    }

    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndicesToCopy);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const resultBytes = await newPdf.save();
    return Buffer.from(resultBytes).toString('base64');
  }

  /**
   * Reorganize pages: reorder, rotate, or delete
   */
  public async organizePdf(
    pdfBase64: string,
    operations: {
      pageOrder?: number[]; // 1-indexed array of page numbers to keep in order
      deletePages?: number[]; // 1-indexed pages to remove
      rotatePages?: { page: number; rotationDegrees: number }[]; // 1-indexed page and degrees (90, 180, 270)
    }
  ): Promise<string> {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = Buffer.from(cleanBase64, 'base64');
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const totalPages = sourcePdf.getPageCount();

    let targetOrder: number[] = [];
    if (operations.pageOrder && operations.pageOrder.length > 0) {
      targetOrder = operations.pageOrder.filter((p) => p >= 1 && p <= totalPages);
    } else {
      for (let i = 1; i <= totalPages; i++) {
        targetOrder.push(i);
      }
    }

    if (operations.deletePages && operations.deletePages.length > 0) {
      const toDelete = new Set(operations.deletePages);
      targetOrder = targetOrder.filter((p) => !toDelete.has(p));
    }

    if (targetOrder.length === 0) {
      throw new Error('Cannot delete all pages in the PDF');
    }

    const newPdf = await PDFDocument.create();
    const zeroBasedIndices = targetOrder.map((p) => p - 1);
    const copiedPages = await newPdf.copyPages(sourcePdf, zeroBasedIndices);

    // Apply rotations if requested
    if (operations.rotatePages) {
      for (const rot of operations.rotatePages) {
        const destIndex = targetOrder.indexOf(rot.page);
        if (destIndex !== -1 && copiedPages[destIndex]) {
          const currentRotation = copiedPages[destIndex].getRotation().angle;
          copiedPages[destIndex].setRotation(degrees((currentRotation + rot.rotationDegrees) % 360));
        }
      }
    }

    copiedPages.forEach((page) => newPdf.addPage(page));

    const resultBytes = await newPdf.save();
    return Buffer.from(resultBytes).toString('base64');
  }

  /**
   * Inspect PDF metadata and page count
   */
  public async getPdfInfo(pdfBase64: string): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    producer?: string;
  }> {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = Buffer.from(cleanBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      producer: pdfDoc.getProducer() || undefined,
    };
  }

  /**
   * Create a formatted academic PDF document from generated content
   */
  public async generateAcademicPdf(
    title: string,
    subtitle: string,
    author: string,
    university: string,
    bodyText: string
  ): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - margin * 2;
    let y = height - margin;

    // Header Branding
    const safeBrand = sanitizeForWinAnsi('ABHOGIPARHAI — Academic Workspace', fontTimes);
    page.drawText(safeBrand, {
      x: margin,
      y: y,
      size: 9,
      font: fontTimes,
      color: rgb(0.4, 0.4, 0.4),
    });
    const safeUniHeader = sanitizeForWinAnsi(`${university} • Verified Grounded Output`, fontTimes);
    page.drawText(safeUniHeader, {
      x: width - margin - 170,
      y: y,
      size: 9,
      font: fontTimes,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 25;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 30;

    // Title
    const safeTitle = sanitizeForWinAnsi(title, fontTimesBold);
    page.drawText(safeTitle.slice(0, 75), {
      x: margin,
      y: y,
      size: 18,
      font: fontTimesBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 20;

    // Subtitle & Author
    const safeSubtitle = sanitizeForWinAnsi(`${subtitle} | Prepared by: ${author}`, fontTimes);
    page.drawText(safeSubtitle, {
      x: margin,
      y: y,
      size: 11,
      font: fontTimes,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 30;

    // Split body into paragraphs
    const paragraphs = bodyText.split('\n');
    for (const paragraph of paragraphs) {
      if (y < margin + 40) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }

      const trimmed = paragraph.trim();
      if (!trimmed) {
        y -= 12;
        continue;
      }

      // Check if heading
      if (trimmed.startsWith('#') || trimmed.endsWith(':')) {
        y -= 8;
        const headingRaw = trimmed.replace(/^#+\s*/, '');
        const safeHeading = sanitizeForWinAnsi(headingRaw, fontTimesBold);
        page.drawText(safeHeading.slice(0, 80), {
          x: margin,
          y,
          size: 13,
          font: fontTimesBold,
          color: rgb(0.12, 0.22, 0.35),
        });
        y -= 18;
        continue;
      }

      // Format text line wrapping
      const sanitizedPara = sanitizeForWinAnsi(trimmed, fontTimes);
      const words = sanitizedPara.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let textWidth = 0;
        try {
          textWidth = fontTimes.widthOfTextAtSize(testLine, 10.5);
        } catch {
          textWidth = testLine.length * 6;
        }

        if (textWidth > contentWidth) {
          if (y < margin + 40) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - margin;
          }
          if (currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y,
              size: 10.5,
              font: fontTimes,
              color: rgb(0.15, 0.15, 0.15),
            });
            y -= 14;
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < margin + 40) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 10.5,
          font: fontTimes,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 14;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
  }
}

export const pdfService = new PdfService();
