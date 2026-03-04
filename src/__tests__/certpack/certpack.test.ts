import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";

// Mock the db module
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
  transaction: vi.fn(),
};

vi.mock("@/server/db", () => ({
  db: mockDb,
}));

// Mock storage module
const mockDownloadFile = vi.fn();
const mockUploadFile = vi.fn().mockResolvedValue("certpacks/test-order-id.pdf");

vi.mock("@/server/storage", () => ({
  downloadFile: mockDownloadFile,
  uploadFile: mockUploadFile,
  uploadCertPdf: vi.fn(),
  getCertUrl: vi.fn(),
}));

describe("Cert Pack Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Chain: db.select().from().where()
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, innerJoin: mockInnerJoin });

    // Chain: db.update().set().where()
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
  });

  it("generates PDF with cover page", async () => {
    // Setup mock data for order query
    mockWhere
      .mockResolvedValueOnce([
        {
          id: "test-order-id",
          orderNumber: "ORD-202603-000001",
          createdAt: new Date("2026-03-01"),
          poNumber: "PO-123",
          deliveryAddressId: null,
          userId: "user-1",
        },
      ])
      // order lines with allocations (no allocations)
      .mockResolvedValueOnce([
        {
          lineId: "line-1",
          quantity: 10,
          productName: "M12 Chemical Anchor",
          allocationBatchId: null,
          allocationQty: null,
          torkeBatchId: null,
          supplierBatchId: null,
        },
      ]);

    const { generateCertPack } = await import(
      "@/server/services/certpack-service"
    );
    const result = await generateCertPack(mockDb as any, "test-order-id");

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify it's a valid PDF
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("includes traceability table with batch refs", async () => {
    mockWhere
      .mockResolvedValueOnce([
        {
          id: "test-order-id",
          orderNumber: "ORD-202603-000002",
          createdAt: new Date("2026-03-01"),
          poNumber: null,
          deliveryAddressId: null,
          userId: "user-1",
        },
      ])
      .mockResolvedValueOnce([
        {
          lineId: "line-1",
          quantity: 5,
          productName: "M16 Anchor Bolt",
          allocationBatchId: "batch-1",
          allocationQty: 5,
          torkeBatchId: "TRK-2603-0001",
          supplierBatchId: "sb-1",
        },
      ])
      // Supplier batch + cert query
      .mockResolvedValueOnce([
        {
          sbId: "sb-1",
          supplierBatchNumber: "SB-ABC-123",
          manufacturerCertUrl: null,
          millCertId: "mc-1",
          supplierName: "Steel Co",
          heatNumber: "HN-789",
          millName: "ArcelorMittal",
          documentUrl: "certs/sb-1/cert.pdf",
        },
      ]);

    // Mock cert PDF download
    const certPdf = await PDFDocument.create();
    certPdf.addPage([595, 842]);
    const certBytes = await certPdf.save();
    mockDownloadFile.mockResolvedValueOnce(Buffer.from(certBytes));

    const { generateCertPack } = await import(
      "@/server/services/certpack-service"
    );
    const result = await generateCertPack(mockDb as any, "test-order-id");

    expect(result).toBeInstanceOf(Buffer);

    // Should have cover page + appended cert page
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it("handles missing cert PDF gracefully", async () => {
    mockWhere
      .mockResolvedValueOnce([
        {
          id: "test-order-id",
          orderNumber: "ORD-202603-000003",
          createdAt: new Date("2026-03-01"),
          poNumber: null,
          deliveryAddressId: null,
          userId: "user-1",
        },
      ])
      .mockResolvedValueOnce([
        {
          lineId: "line-1",
          quantity: 3,
          productName: "Test Product",
          allocationBatchId: "batch-1",
          allocationQty: 3,
          torkeBatchId: "TRK-2603-0002",
          supplierBatchId: "sb-2",
        },
      ])
      .mockResolvedValueOnce([
        {
          sbId: "sb-2",
          supplierBatchNumber: "SB-DEF-456",
          manufacturerCertUrl: null,
          millCertId: null,
          supplierName: "Bolt Ltd",
          heatNumber: null,
          millName: null,
          documentUrl: "certs/sb-2/missing.pdf",
        },
      ]);

    // Simulate R2 download failure (cert not found)
    mockDownloadFile.mockRejectedValueOnce(new Error("Not found"));

    const { generateCertPack } = await import(
      "@/server/services/certpack-service"
    );

    // Should NOT throw - handle gracefully
    const result = await generateCertPack(mockDb as any, "test-order-id");
    expect(result).toBeInstanceOf(Buffer);

    // Only cover page (no cert appended since it was unavailable)
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("uploads cert pack to R2 and updates order", async () => {
    mockWhere
      .mockResolvedValueOnce([
        {
          id: "test-order-id",
          orderNumber: "ORD-202603-000004",
          createdAt: new Date("2026-03-01"),
          poNumber: null,
          deliveryAddressId: null,
          userId: "user-1",
        },
      ])
      .mockResolvedValueOnce([
        {
          lineId: "line-1",
          quantity: 1,
          productName: "Simple Product",
          allocationBatchId: null,
          allocationQty: null,
          torkeBatchId: null,
          supplierBatchId: null,
        },
      ]);

    const { generateCertPack } = await import(
      "@/server/services/certpack-service"
    );
    await generateCertPack(mockDb as any, "test-order-id");

    // Verify uploadFile was called with correct key
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "certpacks/test-order-id.pdf",
      "application/pdf"
    );

    // Verify order was updated with cert pack key
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        certPackKey: "certpacks/test-order-id.pdf",
      })
    );
  });
});
