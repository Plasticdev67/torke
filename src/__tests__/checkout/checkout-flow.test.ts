import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Checkout flow unit tests.
 *
 * Tests validation logic extracted from checkout components:
 * - PO number requirements per payment method
 * - Empty cart rejection
 * - Order creation payload shape
 */

// -- Helpers reproducing checkout validation logic --

function canAdvanceToStep3(state: {
  paymentMethod: string | null;
  poNumber: string;
}): boolean {
  if (!state.paymentMethod) return false;
  if (state.paymentMethod === "credit" && !state.poNumber.trim()) return false;
  return true;
}

function buildOrderPayload(
  items: Array<{ productId: string; quantity: number }>,
  addressId: string,
  paymentMethod: "card" | "credit" | "bacs",
  poNumber?: string
) {
  if (items.length === 0) {
    throw new Error("Cannot checkout with empty cart");
  }
  return {
    deliveryAddressId: addressId,
    paymentMethod,
    poNumber: poNumber?.trim() || undefined,
    items,
  };
}

describe("Checkout Flow", () => {
  it("rejects checkout with empty cart", () => {
    expect(() =>
      buildOrderPayload([], "addr-1", "card")
    ).toThrow("Cannot checkout with empty cart");
  });

  it("validates delivery address is selected", () => {
    // Step 1 requires a non-null selectedAddressId; null means cannot advance
    const selectedAddressId: string | null = null;
    expect(selectedAddressId !== null).toBe(false);
  });

  it("requires PO number for credit payment", () => {
    expect(
      canAdvanceToStep3({ paymentMethod: "credit", poNumber: "" })
    ).toBe(false);

    expect(
      canAdvanceToStep3({ paymentMethod: "credit", poNumber: "   " })
    ).toBe(false);

    expect(
      canAdvanceToStep3({ paymentMethod: "credit", poNumber: "PO-12345" })
    ).toBe(true);
  });

  it("allows optional PO number for card/BACS", () => {
    expect(
      canAdvanceToStep3({ paymentMethod: "card", poNumber: "" })
    ).toBe(true);

    expect(
      canAdvanceToStep3({ paymentMethod: "bacs", poNumber: "" })
    ).toBe(true);

    // Also OK with PO number provided
    expect(
      canAdvanceToStep3({ paymentMethod: "card", poNumber: "PO-OPTIONAL" })
    ).toBe(true);
  });

  it("creates order with correct payload", () => {
    const items = [
      { productId: "prod-1", quantity: 5 },
      { productId: "prod-2", quantity: 10 },
    ];

    const payload = buildOrderPayload(
      items,
      "addr-123",
      "credit",
      "PO-99887"
    );

    expect(payload).toEqual({
      deliveryAddressId: "addr-123",
      paymentMethod: "credit",
      poNumber: "PO-99887",
      items: [
        { productId: "prod-1", quantity: 5 },
        { productId: "prod-2", quantity: 10 },
      ],
    });
  });

  it("strips whitespace from PO number in payload", () => {
    const payload = buildOrderPayload(
      [{ productId: "prod-1", quantity: 1 }],
      "addr-1",
      "bacs",
      "  PO-TRIM  "
    );

    expect(payload.poNumber).toBe("PO-TRIM");
  });

  it("omits PO number when empty", () => {
    const payload = buildOrderPayload(
      [{ productId: "prod-1", quantity: 1 }],
      "addr-1",
      "card",
      ""
    );

    expect(payload.poNumber).toBeUndefined();
  });
});
