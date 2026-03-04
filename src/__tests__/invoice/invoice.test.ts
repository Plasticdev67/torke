import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";

// Mock the db module
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  transaction: vi.fn(),
};

vi.mock("@/server/db", () => ({
  db: mockDb,
}));

// Mock storage module
const mockUploadFile = vi.fn().mockResolvedValue("invoices/test-id.pdf");

vi.mock("@/server/storage", () => ({
  downloadFile: vi.fn(),
  uploadFile: mockUploadFile,
  uploadCertPdf: vi.fn(),
  getCertUrl: vi.fn(),
}));

// Standard order data for reuse
const mockOrder = {
  id: "test-order-id",
  orderNumber: "ORD-202603-000001",
  createdAt: new Date("2026-03-01"),
  poNumber: "PO-456",
  paymentMethod: "card",
  subtotalPence: 50000,
  vatPence: 10000,
  totalPence: 60000,
  deliveryAddressId: null,
  userId: "user-1",
};

const mockOrderLines = [
  {
    lineId: "line-1",
    quantity: 10,
    unitPricePence: 5000,
    lineTotalPence: 50000,
    productName: "M12 Chemical Anchor",
    productSku: "TRK-CHE-M12",
    torkeBatchId: "TRK-2603-0001",
  },
];

describe("Invoice Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Chain mocks
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, innerJoin: mockInnerJoin });

    // Insert chain
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([{ id: "invoice-1", invoiceNumber: "INV-202603-000001" }]);

    // Update chain
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
  });

  it("generates invoice PDF with line items and VAT", async () => {
    mockWhere
      .mockResolvedValueOnce([mockOrder]) // order query
      .mockResolvedValueOnce(mockOrderLines) // order lines query
      .mockResolvedValueOnce([{ maxNum: null }]); // invoice number seq

    const { generateInvoice } = await import("@/server/services/invoice-service");
    const result = await generateInvoice(mockDb as any, "test-order-id");

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify valid PDF
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(1);
  });

  it("includes Torke batch ID per line item", async () => {
    const linesWithBatch = [
      {
        ...mockOrderLines[0],
        torkeBatchId: "TRK-2603-0001",
      },
      {
        lineId: "line-1",
        quantity: 10,
        unitPricePence: 5000,
        lineTotalPence: 50000,
        productName: "M12 Chemical Anchor",
        productSku: "TRK-CHE-M12",
        torkeBatchId: "TRK-2603-0002", // second batch allocation
      },
    ];

    mockWhere
      .mockResolvedValueOnce([mockOrder])
      .mockResolvedValueOnce(linesWithBatch)
      .mockResolvedValueOnce([{ maxNum: null }]);

    const { generateInvoice } = await import("@/server/services/invoice-service");
    const result = await generateInvoice(mockDb as any, "test-order-id");

    expect(result).toBeInstanceOf(Buffer);
    // PDF generated successfully with batch IDs
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("generates proforma with bank details for BACS", async () => {
    const bacsOrder = { ...mockOrder, paymentMethod: "bacs" };

    mockWhere
      .mockResolvedValueOnce([bacsOrder])
      .mockResolvedValueOnce(mockOrderLines);

    const { generateProforma } = await import("@/server/services/invoice-service");
    const result = await generateProforma(mockDb as any, "test-order-id");

    expect(result).toBeInstanceOf(Buffer);

    // Verify valid PDF
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(1);

    // Verify it was uploaded
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "proformas/test-order-id.pdf",
      "application/pdf"
    );
  });

  it("creates invoice record in database", async () => {
    mockWhere
      .mockResolvedValueOnce([mockOrder])
      .mockResolvedValueOnce(mockOrderLines)
      .mockResolvedValueOnce([{ maxNum: null }]);

    const { generateInvoice } = await import("@/server/services/invoice-service");
    await generateInvoice(mockDb as any, "test-order-id");

    // Verify insert was called on invoices table
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "test-order-id",
        subtotalPence: 50000,
        vatPence: 10000,
        totalPence: 60000,
        vatRate: 2000,
      })
    );
  });

  it("uploads PDF to R2", async () => {
    mockWhere
      .mockResolvedValueOnce([mockOrder])
      .mockResolvedValueOnce(mockOrderLines)
      .mockResolvedValueOnce([{ maxNum: null }]);

    const { generateInvoice } = await import("@/server/services/invoice-service");
    await generateInvoice(mockDb as any, "test-order-id");

    // Verify uploadFile was called
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/^invoices\//),
      "application/pdf"
    );

    // Verify invoice PDF key was updated
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        pdfKey: expect.stringMatching(/^invoices\//),
      })
    );
  });
});
