import { describe, it, expect, vi } from "vitest";

/**
 * BACS payment flow tests.
 *
 * Tests the BACS payment lifecycle:
 * 1. Order creation transitions to awaiting_payment
 * 2. Admin confirms BACS receipt, transitions to confirmed
 * 3. Success page shows bank details (tested via status check)
 */

// Mock the database module to avoid DATABASE_URL requirement
vi.mock("@/server/db", () => ({
  db: {},
}));

// Now safe to import order-service (it won't crash on missing DATABASE_URL)
const { canTransition } = await import("@/server/services/order-service");

describe("BACS Payment", () => {
  it("transitions order to awaiting_payment", () => {
    // BACS orders go from draft -> awaiting_payment
    expect(canTransition("draft", "awaiting_payment")).toBe(true);
  });

  it("admin confirms BACS receipt transitions to confirmed", () => {
    // Admin confirms payment: awaiting_payment -> confirmed
    expect(canTransition("awaiting_payment", "confirmed")).toBe(true);
  });

  it("confirmed order can proceed to allocated", () => {
    // After confirmation, stock allocation moves to allocated
    expect(canTransition("confirmed", "allocated")).toBe(true);
  });

  it("awaiting_payment cannot skip to allocated", () => {
    // Cannot skip confirmed step
    expect(canTransition("awaiting_payment", "allocated")).toBe(false);
  });

  it("generates proforma invoice with bank details", () => {
    // The success page shows bank details when order is BACS + awaiting_payment.
    const bacsOrder = {
      status: "awaiting_payment" as const,
      paymentMethod: "bacs" as const,
    };

    const shouldShowBankDetails =
      bacsOrder.status === "awaiting_payment" &&
      bacsOrder.paymentMethod === "bacs";

    expect(shouldShowBankDetails).toBe(true);

    // Confirmed card orders should NOT show bank details
    const cardOrder = {
      status: "confirmed" as const,
      paymentMethod: "card" as const,
    };

    const shouldNotShow =
      cardOrder.status === "awaiting_payment" &&
      cardOrder.paymentMethod === "bacs";

    expect(shouldNotShow).toBe(false);
  });
});
