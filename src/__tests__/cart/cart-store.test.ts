import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/stores/cart";

// Reset store state before each test
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("Cart Store", () => {
  describe("addItem", () => {
    it("adds item to empty cart", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
        quantity: 1,
      });
    });

    it("increments quantity when adding existing item", () => {
      const { addItem } = useCartStore.getState();
      addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });
      addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]!.quantity).toBe(2);
    });

    it("adds item with specified quantity", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
        quantity: 5,
      });

      expect(useCartStore.getState().items[0]!.quantity).toBe(5);
    });

    it("keeps separate items for different products", () => {
      const { addItem } = useCartStore.getState();
      addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });
      addItem({
        productId: "p2",
        productName: "Chemical Anchor",
        sku: "TRK-CHEM-001",
        unitPricePence: 2500,
      });

      expect(useCartStore.getState().items).toHaveLength(2);
    });
  });

  describe("removeItem", () => {
    it("removes item from cart", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });
      useCartStore.getState().addItem({
        productId: "p2",
        productName: "Chemical Anchor",
        sku: "TRK-CHEM-001",
        unitPricePence: 2500,
      });

      useCartStore.getState().removeItem("p1");

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]!.productId).toBe("p2");
    });
  });

  describe("updateQuantity", () => {
    it("updates item quantity", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });

      useCartStore.getState().updateQuantity("p1", 10);
      expect(useCartStore.getState().items[0]!.quantity).toBe(10);
    });

    it("removes item when quantity set to 0", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });

      useCartStore.getState().updateQuantity("p1", 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes item when quantity is negative", () => {
      useCartStore.getState().addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });

      useCartStore.getState().updateQuantity("p1", -1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("clears all items", () => {
      const { addItem } = useCartStore.getState();
      addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
      });
      addItem({
        productId: "p2",
        productName: "Chemical Anchor",
        sku: "TRK-CHEM-001",
        unitPricePence: 2500,
      });

      useCartStore.getState().clear();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("totalItems", () => {
    it("returns 0 for empty cart", () => {
      expect(useCartStore.getState().totalItems()).toBe(0);
    });

    it("computes total items count across all items", () => {
      const { addItem } = useCartStore.getState();
      addItem({
        productId: "p1",
        productName: "M12 Anchor Bolt",
        sku: "TRK-MECH-001",
        unitPricePence: 1500,
        quantity: 3,
      });
      addItem({
        productId: "p2",
        productName: "Chemical Anchor",
        sku: "TRK-CHEM-001",
        unitPricePence: 2500,
        quantity: 2,
      });

      expect(useCartStore.getState().totalItems()).toBe(5);
    });
  });
});
