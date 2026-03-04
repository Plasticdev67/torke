import type { Metadata } from "next";
import { CheckoutWizard } from "@/components/shop/CheckoutWizard";
import { CartProvider } from "@/components/shop/CartProvider";

export const metadata: Metadata = {
  title: "Checkout | Torke",
  description: "Complete your order.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <CartProvider>
        <CheckoutWizard />
      </CartProvider>
    </div>
  );
}
