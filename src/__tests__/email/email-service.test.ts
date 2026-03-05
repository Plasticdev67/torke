import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock fns so they're available in vi.mock factories
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
}));

vi.mock("resend", () => {
  class MockResend {
    emails = { send: mockSend };
  }
  return { Resend: MockResend };
});

// Mock storage
vi.mock("@/server/storage");

// Mock db with a factory that doesn't reference hoisted vars
vi.mock("@/server/db", () => {
  const whereHandler = vi.fn();
  const executeHandler = vi.fn();

  return {
    db: {
      select: () => ({
        from: () => ({
          where: whereHandler,
          innerJoin: () => ({
            leftJoin: () => ({
              leftJoin: () => ({
                where: whereHandler,
              }),
            }),
          }),
        }),
      }),
      execute: executeHandler,
      __whereHandler: whereHandler,
      __executeHandler: executeHandler,
    },
  };
});

// Import after mocks
import {
  sendOrderConfirmation,
  sendDispatchNotification,
} from "@/server/services/email-service";
import { downloadFile, getCertUrl } from "@/server/storage";
import { db } from "@/server/db";

// Access internal mock handlers
const mockWhere = (db as any).__whereHandler as ReturnType<typeof vi.fn>;
const mockExecute = (db as any).__executeHandler as ReturnType<typeof vi.fn>;

const mockOrder = {
  id: "order-1",
  orderNumber: "ORD-202603-000001",
  createdAt: new Date("2026-03-01"),
  paymentMethod: "card",
  poNumber: null,
  subtotalPence: 5000,
  vatPence: 1000,
  totalPence: 6000,
  certPackKey: null,
  trackingNumber: null,
  consignmentNumber: null,
  dispatchType: null,
  userId: "user-1",
  deliveryAddressId: "addr-1",
  status: "confirmed",
  stripeSessionId: null,
  stripePaymentIntentId: null,
  creditAccountId: null,
  invoiceId: null,
  notes: null,
  updatedAt: new Date(),
  confirmedAt: new Date(),
  allocatedAt: null,
  dispatchedAt: null,
  deliveredAt: null,
};

const mockAddress = {
  id: "addr-1",
  userId: "user-1",
  name: "Site A",
  addressLine1: "123 Test Street",
  addressLine2: null,
  city: "Sheffield",
  county: null,
  postcode: "S1 1AA",
  country: "GB",
  siteContactName: "John Doe",
  siteContactPhone: null,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLineRows = [
  {
    lineId: "line-1",
    quantity: 5,
    productName: "M12 Anchor Bolt",
    torkeBatchId: "TRK-2026-0001",
  },
];

function setupDefaultMocks() {
  let whereCallCount = 0;
  mockWhere.mockImplementation(() => {
    whereCallCount++;
    switch (whereCallCount) {
      case 1:
        return Promise.resolve([mockOrder]); // order
      case 2:
        return Promise.resolve([mockAddress]); // address
      case 3:
        return Promise.resolve(mockLineRows); // line rows
      default:
        return Promise.resolve([]);
    }
  });

  mockExecute.mockResolvedValue({
    rows: [{ name: "Test User", email: "test@example.com" }],
  });
}

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("sends order confirmation email via Resend", async () => {
    await sendOrderConfirmation("order-1");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0]![0];
    expect(callArgs.to).toEqual(["test@example.com"]);
    expect(callArgs.subject).toContain("Order Confirmed");
    expect(callArgs.subject).toContain("ORD-202603-000001");
    expect(callArgs.from).toContain("Torke");
  });

  it("sends dispatch notification with tracking info", async () => {
    const dispatchedOrder = {
      ...mockOrder,
      status: "dispatched",
      trackingNumber: "TRK123456",
      dispatchType: "parcel",
      dispatchedAt: new Date(),
    };

    let whereCallCount = 0;
    mockWhere.mockImplementation(() => {
      whereCallCount++;
      switch (whereCallCount) {
        case 1:
          return Promise.resolve([dispatchedOrder]);
        case 2:
          return Promise.resolve([mockAddress]);
        case 3:
          return Promise.resolve(mockLineRows);
        default:
          return Promise.resolve([]);
      }
    });

    await sendDispatchNotification("order-1");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0]![0];
    expect(callArgs.subject).toContain("Order Dispatched");
    expect(callArgs.to).toEqual(["test@example.com"]);
  });

  it("attaches cert pack when under 10MB", async () => {
    const smallBuffer = Buffer.alloc(1024);
    const orderWithCert = {
      ...mockOrder,
      certPackKey: "certpacks/order-1.pdf",
      dispatchType: "parcel",
      trackingNumber: "TRK123",
    };

    let whereCallCount = 0;
    mockWhere.mockImplementation(() => {
      whereCallCount++;
      switch (whereCallCount) {
        case 1:
          return Promise.resolve([orderWithCert]);
        case 2:
          return Promise.resolve([mockAddress]);
        case 3:
          return Promise.resolve(mockLineRows);
        default:
          return Promise.resolve([]);
      }
    });

    vi.mocked(downloadFile).mockResolvedValue(smallBuffer);

    await sendDispatchNotification("order-1");

    expect(downloadFile).toHaveBeenCalledWith("certpacks/order-1.pdf");
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArgs = mockSend.mock.calls[0]![0];
    expect(callArgs.attachments).toBeDefined();
    expect(callArgs.attachments).toHaveLength(1);
    expect(callArgs.attachments[0].filename).toContain("CertPack");
  });

  it("includes download link when cert pack over 10MB", async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    const orderWithCert = {
      ...mockOrder,
      certPackKey: "certpacks/order-1.pdf",
      dispatchType: "parcel",
      trackingNumber: "TRK123",
    };

    let whereCallCount = 0;
    mockWhere.mockImplementation(() => {
      whereCallCount++;
      switch (whereCallCount) {
        case 1:
          return Promise.resolve([orderWithCert]);
        case 2:
          return Promise.resolve([mockAddress]);
        case 3:
          return Promise.resolve(mockLineRows);
        default:
          return Promise.resolve([]);
      }
    });

    vi.mocked(downloadFile).mockResolvedValue(largeBuffer);
    vi.mocked(getCertUrl).mockResolvedValue(
      "https://r2.example.com/certpacks/order-1.pdf"
    );

    await sendDispatchNotification("order-1");

    expect(getCertUrl).toHaveBeenCalledWith("certpacks/order-1.pdf");
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArgs = mockSend.mock.calls[0]![0];
    expect(callArgs.attachments).toBeUndefined();
  });

  it("does not throw on email failure (logs error)", async () => {
    mockSend.mockRejectedValueOnce(new Error("Resend API failure"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should NOT throw
    await expect(sendOrderConfirmation("order-1")).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
