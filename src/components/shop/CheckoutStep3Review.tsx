"use client";

import { ShoppingCart, MapPin, CreditCard, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import type { CartItem } from "@/stores/cart";
import type { CheckoutState } from "./CheckoutWizard";

interface CheckoutStep3ReviewProps {
  checkoutState: CheckoutState;
  items: CartItem[];
}

function formatPence(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card (Stripe)",
  credit: "Credit Terms",
  bacs: "BACS Bank Transfer",
};

export function CheckoutStep3Review({
  checkoutState,
  items,
}: CheckoutStep3ReviewProps) {
  const { data: addresses } = trpc.addresses.list.useQuery();

  const selectedAddress = addresses?.find(
    (a) => a.id === checkoutState.selectedAddressId
  );

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0
  );
  const vatPence = Math.round(subtotalPence * 0.2);
  const totalPence = subtotalPence + vatPence;

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-6">
        Review Your Order
      </h2>

      <div className="space-y-6">
        {/* Order Items */}
        <Card className="border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-4 w-4 text-[#C41E3A]" />
            <h3 className="font-semibold text-zinc-100">Order Items</h3>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex-1">
                  <p className="text-zinc-200">{item.productName}</p>
                  <p className="text-xs text-zinc-500">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-300">
                    {item.quantity} x {formatPence(item.unitPricePence)}
                  </p>
                  <p className="text-zinc-100 font-medium">
                    {formatPence(item.unitPricePence * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4 bg-zinc-800" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatPence(subtotalPence)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>VAT (20%)</span>
              <span>{formatPence(vatPence)}</span>
            </div>
            <Separator className="my-2 bg-zinc-800" />
            <div className="flex justify-between text-lg font-bold text-zinc-100">
              <span>Total</span>
              <span>{formatPence(totalPence)}</span>
            </div>
          </div>
        </Card>

        {/* Delivery Address */}
        <Card className="border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-[#C41E3A]" />
            <h3 className="font-semibold text-zinc-100">Delivery Address</h3>
          </div>
          {selectedAddress ? (
            <div className="text-sm text-zinc-400 space-y-0.5">
              <p className="font-medium text-zinc-200">{selectedAddress.name}</p>
              <p>{selectedAddress.addressLine1}</p>
              {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
              <p>
                {selectedAddress.city}
                {selectedAddress.county ? `, ${selectedAddress.county}` : ""}
              </p>
              <p className="font-medium text-zinc-300">
                {selectedAddress.postcode}
              </p>
              {selectedAddress.siteContactName && (
                <p className="mt-2 text-xs text-zinc-500">
                  Site Contact: {selectedAddress.siteContactName}
                  {selectedAddress.siteContactPhone
                    ? ` (${selectedAddress.siteContactPhone})`
                    : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No address selected.</p>
          )}
        </Card>

        {/* Payment Details */}
        <Card className="border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-[#C41E3A]" />
            <h3 className="font-semibold text-zinc-100">Payment</h3>
          </div>
          <div className="text-sm text-zinc-400 space-y-1">
            <p>
              <span className="text-zinc-500">Method:</span>{" "}
              <span className="text-zinc-200">
                {checkoutState.paymentMethod
                  ? PAYMENT_LABELS[checkoutState.paymentMethod]
                  : "Not selected"}
              </span>
            </p>
            {checkoutState.poNumber.trim() && (
              <p>
                <span className="text-zinc-500">PO Number:</span>{" "}
                <span className="text-zinc-200">{checkoutState.poNumber}</span>
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
