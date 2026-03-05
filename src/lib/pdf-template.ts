import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 50;
const TORKE_RED = rgb(196 / 255, 30 / 255, 58 / 255);
const WHITE = rgb(1, 1, 1);
const DARK_GREY = rgb(0.3, 0.3, 0.3);

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface BrandingOptions {
  title: string;
  subtitle?: string;
  documentType: string;
}

// --------------------------------------------------------------------------
// Apply Torke branding (header bar + footer) to an existing PDFDocument page
// --------------------------------------------------------------------------

export function applyTorkeBranding(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  options: BrandingOptions
) {
  const { width, height } = page.getSize();

  // --- Header bar ---
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: TORKE_RED,
  });

  page.drawText("TORKE", {
    x: MARGIN,
    y: height - 42,
    size: 28,
    font: fonts.bold,
    color: WHITE,
  });

  // Document type badge (right side of header)
  page.drawText(options.documentType, {
    x: width - MARGIN - fonts.regular.widthOfTextAtSize(options.documentType, 12),
    y: height - 38,
    size: 12,
    font: fonts.regular,
    color: WHITE,
  });

  // Title below header
  page.drawText(options.title, {
    x: MARGIN,
    y: height - 90,
    size: 16,
    font: fonts.bold,
    color: rgb(0, 0, 0),
  });

  // Subtitle if provided
  if (options.subtitle) {
    page.drawText(options.subtitle, {
      x: MARGIN,
      y: height - 108,
      size: 10,
      font: fonts.regular,
      color: DARK_GREY,
    });
  }

  // --- Footer ---
  const footerY = 30;
  const footerText = "Torke  |  torke.co.uk  |  sales@torke.co.uk";
  page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: width - MARGIN, y: footerY + 12 },
    thickness: 0.5,
    color: DARK_GREY,
  });
  page.drawText(footerText, {
    x: MARGIN,
    y: footerY,
    size: 7,
    font: fonts.regular,
    color: DARK_GREY,
  });

  // Small red accent line at top of footer
  page.drawRectangle({
    x: MARGIN,
    y: footerY + 13,
    width: 40,
    height: 2,
    color: TORKE_RED,
  });
}

// --------------------------------------------------------------------------
// Create a new branded PDFDocument with Torke header/footer pre-applied
// --------------------------------------------------------------------------

export async function createBrandedDocument(
  title: string,
  subtitle?: string,
  documentType = "Document"
): Promise<{ doc: PDFDocument; page: PDFPage; fonts: { bold: PDFFont; regular: PDFFont } }> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const fonts = { bold, regular };

  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  applyTorkeBranding(page, fonts, { title, subtitle, documentType });

  return { doc, page, fonts };
}
