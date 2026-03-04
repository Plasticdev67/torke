"use client";

import { CreditCard, Building2, Landmark, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { PaymentMethod } from "./CheckoutWizard";

interface CheckoutStep2PaymentProps {
  paymentMethod: PaymentMethod | null;
  poNumber: string;
  onChangePaymentMethod: (method: PaymentMethod) => void;
  onChangePoNumber: (po: string) => void;
}

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
  requiresCredit?: boolean;
}> = [
  {
    value: "card",
    label: "Pay by Card",
    description: "Secure payment via Stripe. Supports all major cards with SCA.",
    icon: CreditCard,
  },
  {
    value: "credit",
    label: "Credit Terms",
    description: "Pay on your approved credit account. PO number required.",
    icon: Building2,
    requiresCredit: true,
  },
  {
    value: "bacs",
    label: "BACS Bank Transfer",
    description:
      "You'll receive a proforma invoice with bank details on the next page.",
    icon: Landmark,
  },
];

export function CheckoutStep2Payment({
  paymentMethod,
  poNumber,
  onChangePaymentMethod,
  onChangePoNumber,
}: CheckoutStep2PaymentProps) {
  const { data: creditAccount, isLoading: creditLoading } =
    trpc.orders.getCreditAccount.useQuery();

  const hasCreditAccount =
    creditAccount?.status === "approved";

  const availableCreditPence = hasCreditAccount
    ? creditAccount.creditLimitPence - creditAccount.creditUsedPence
    : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-[#C41E3A]" />
        <h2 className="text-lg font-semibold text-zinc-100">Payment Method</h2>
      </div>

      {/* PO Number */}
      <div className="mb-6">
        <Label htmlFor="poNumber" className="text-zinc-300">
          PO Number{" "}
          {paymentMethod === "credit" ? (
            <span className="text-[#C41E3A]">*</span>
          ) : (
            <span className="text-zinc-500">(optional)</span>
          )}
        </Label>
        <Input
          id="poNumber"
          value={poNumber}
          onChange={(e) => onChangePoNumber(e.target.value)}
          placeholder="Enter your purchase order number"
          className="mt-1 max-w-md border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          maxLength={200}
        />
        {paymentMethod === "credit" && !poNumber.trim() && (
          <p className="mt-1 text-sm text-amber-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            PO number is required for credit payment.
          </p>
        )}
      </div>

      {/* Payment Method Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PAYMENT_OPTIONS.map((option) => {
          const disabled =
            option.requiresCredit && !hasCreditAccount && !creditLoading;
          const isSelected = paymentMethod === option.value;
          const Icon = option.icon;

          return (
            <Card
              key={option.value}
              className={cn(
                "relative cursor-pointer border p-4 transition-all",
                disabled
                  ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 opacity-50"
                  : isSelected
                    ? "border-[#C41E3A] bg-zinc-900 ring-1 ring-[#C41E3A]"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              )}
              onClick={() => {
                if (!disabled) onChangePaymentMethod(option.value);
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-[#C41E3A]/20 text-[#C41E3A]"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "font-semibold",
                      isSelected ? "text-zinc-100" : "text-zinc-300"
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Credit info */}
              {option.value === "credit" && hasCreditAccount && (
                <div className="mt-3 border-t border-zinc-800 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Credit Limit</span>
                    <span className="text-zinc-300">
                      {(creditAccount.creditLimitPence / 100).toLocaleString(
                        "en-GB",
                        { style: "currency", currency: "GBP" }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-zinc-500">Available</span>
                    <span className="font-medium text-green-400">
                      {(availableCreditPence / 100).toLocaleString("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      })}
                    </span>
                  </div>
                </div>
              )}

              {option.value === "credit" && !hasCreditAccount && !creditLoading && (
                <div className="mt-3 border-t border-zinc-800 pt-2">
                  <p className="text-xs text-zinc-500">
                    No approved credit account. Contact Torke to apply.
                  </p>
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <Badge className="absolute -top-2 -right-2 bg-[#C41E3A] text-white text-xs">
                  Selected
                </Badge>
              )}
            </Card>
          );
        })}
      </div>

      {/* BACS Info */}
      {paymentMethod === "bacs" && (
        <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            After placing your order, you will see our bank details on the
            confirmation page. Your order will be processed once payment is
            received. A formal proforma invoice will also be emailed.
          </p>
        </div>
      )}
    </div>
  );
}
