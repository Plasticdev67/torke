import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  /** Display-only price in pence. Server re-validates at checkout. */
  unitPricePence: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const qty = item.quantity ?? 1;
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                productName: item.productName,
                sku: item.sku,
                quantity: qty,
                unitPricePence: item.unitPricePence,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clear: () => set({ items: [] }),

      totalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: "torke-cart",
    }
  )
);
