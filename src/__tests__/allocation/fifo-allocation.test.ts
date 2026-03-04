import { describe, it, expect, vi } from "vitest";

// Mock the database module to prevent DATABASE_URL requirement
vi.mock("@/server/db", () => ({
  db: {},
}));

// Mock batch-service to prevent its db import side effects
vi.mock("@/server/services/batch-service", () => ({
  allocateFIFO: vi.fn(),
}));

// Now import after mocks are set up
const {
  canTransition,
  ORDER_TRANSITIONS,
} = await import("@/server/services/order-service");
type OrderStatus = import("@/server/services/order-service").OrderStatus;

describe("Order Service - State Machine", () => {
  describe("canTransition", () => {
    it("allows draft -> awaiting_payment", () => {
      expect(canTransition("draft", "awaiting_payment")).toBe(true);
    });

    it("allows draft -> confirmed (credit account path)", () => {
      expect(canTransition("draft", "confirmed")).toBe(true);
    });

    it("allows draft -> cancelled", () => {
      expect(canTransition("draft", "cancelled")).toBe(true);
    });

    it("allows awaiting_payment -> confirmed", () => {
      expect(canTransition("awaiting_payment", "confirmed")).toBe(true);
    });

    it("allows awaiting_payment -> cancelled", () => {
      expect(canTransition("awaiting_payment", "cancelled")).toBe(true);
    });

    it("allows confirmed -> allocated", () => {
      expect(canTransition("confirmed", "allocated")).toBe(true);
    });

    it("allows allocated -> picking", () => {
      expect(canTransition("allocated", "picking")).toBe(true);
    });

    it("allows picking -> packed", () => {
      expect(canTransition("picking", "packed")).toBe(true);
    });

    it("allows packed -> dispatched", () => {
      expect(canTransition("packed", "dispatched")).toBe(true);
    });

    it("allows dispatched -> delivered", () => {
      expect(canTransition("dispatched", "delivered")).toBe(true);
    });

    it("allows delivered -> completed", () => {
      expect(canTransition("delivered", "completed")).toBe(true);
    });

    it("rejects invalid transition: draft -> dispatched", () => {
      expect(canTransition("draft", "dispatched")).toBe(false);
    });

    it("rejects invalid transition: completed -> draft", () => {
      expect(canTransition("completed", "draft")).toBe(false);
    });

    it("rejects invalid transition: cancelled -> confirmed", () => {
      expect(canTransition("cancelled", "confirmed")).toBe(false);
    });

    it("rejects transition from completed to any status", () => {
      const allStatuses: OrderStatus[] = [
        "draft",
        "awaiting_payment",
        "confirmed",
        "allocated",
        "picking",
        "packed",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
      ];
      for (const status of allStatuses) {
        expect(canTransition("completed", status)).toBe(false);
      }
    });

    it("rejects transition from cancelled to any status", () => {
      const allStatuses: OrderStatus[] = [
        "draft",
        "awaiting_payment",
        "confirmed",
        "allocated",
        "picking",
        "packed",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
      ];
      for (const status of allStatuses) {
        expect(canTransition("cancelled", status)).toBe(false);
      }
    });
  });

  describe("ORDER_TRANSITIONS", () => {
    it("covers all 10 order statuses", () => {
      const expectedStatuses: OrderStatus[] = [
        "draft",
        "awaiting_payment",
        "confirmed",
        "allocated",
        "picking",
        "packed",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
      ];

      const keys = Object.keys(ORDER_TRANSITIONS);
      expect(keys).toHaveLength(10);
      for (const status of expectedStatuses) {
        expect(ORDER_TRANSITIONS).toHaveProperty(status);
      }
    });

    it("completed and cancelled are terminal states (no outgoing transitions)", () => {
      expect(ORDER_TRANSITIONS.completed).toHaveLength(0);
      expect(ORDER_TRANSITIONS.cancelled).toHaveLength(0);
    });

    it("most statuses allow cancellation", () => {
      const cancellableStatuses: OrderStatus[] = [
        "draft",
        "awaiting_payment",
        "confirmed",
        "allocated",
        "picking",
        "packed",
      ];
      for (const status of cancellableStatuses) {
        expect(ORDER_TRANSITIONS[status]).toContain("cancelled");
      }
    });

    it("dispatched and delivered do not allow cancellation", () => {
      expect(ORDER_TRANSITIONS.dispatched).not.toContain("cancelled");
      expect(ORDER_TRANSITIONS.delivered).not.toContain("cancelled");
    });
  });
});
