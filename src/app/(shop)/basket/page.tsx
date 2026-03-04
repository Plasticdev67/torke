import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BasketItems } from "@/components/shop/BasketItems";
import { CartProvider } from "@/components/shop/CartProvider";

export const metadata: Metadata = {
  title: "Your Basket | Torke",
  description: "Review your basket before checkout.",
};

export default function BasketPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue Shopping
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Your Basket</h1>

      <Card className="bg-[#111] border-[#222] p-6 mb-6">
        <CartProvider>
          <BasketItems />
        </CartProvider>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="border-[#333] text-[#999] hover:text-white hover:bg-[#1A1A1A]">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
        <Button asChild className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold sm:ml-auto">
          <Link href="/checkout">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
