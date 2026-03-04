// Plan 06 fills in these tests
import { describe, it, expect } from "vitest";

describe("Email Service", () => {
  it.todo("sends order confirmation email via Resend");
  it.todo("sends dispatch notification with tracking info");
  it.todo("attaches cert pack when under 10MB");
  it.todo("includes download link when cert pack over 10MB");
  it.todo("does not throw on email failure (logs error)");
});
