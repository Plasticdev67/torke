// Plan 07 fills in these tests
import { describe, it, expect } from "vitest";

describe("Stripe Webhook", () => {
  it.todo("verifies webhook signature");
  it.todo("transitions order to confirmed on checkout.session.completed");
  it.todo("triggers FIFO allocation after payment confirmation");
  it.todo("skips already-confirmed orders (idempotency)");
  it.todo("returns 400 on invalid signature");
});
