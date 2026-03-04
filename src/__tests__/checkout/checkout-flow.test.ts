// Plan 07 fills in these tests
import { describe, it, expect } from "vitest";

describe("Checkout Flow", () => {
  it.todo("rejects checkout with empty cart");
  it.todo("validates delivery address is selected");
  it.todo("requires PO number for credit payment");
  it.todo("allows optional PO number for card/BACS");
  it.todo("creates order with server-side price validation");
});
