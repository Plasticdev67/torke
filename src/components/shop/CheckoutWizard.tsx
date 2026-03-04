"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckoutStep1Address } from "./CheckoutStep1Address";
import { CheckoutStep2Payment } from "./CheckoutStep2Payment";
import { CheckoutStep3Review } from "./CheckoutStep3Review";

const STEPS = [
  { number: 1, label: "Delivery Address" },
  { number: 2, label: "Payment" },
  { number: 3, label: "Review & Place Order" },
];

export type PaymentMethod = "card" | "credit" | "bacs";

export interface CheckoutState {
  selectedAddressId: string | null;
  paymentMethod: PaymentMethod | null;
  poNumber: string;
}

export function CheckoutWizard() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    selectedAddressId: null,
    paymentMethod: null,
    poNumber: "",
  });

  // Redirect to basket if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isPlacingOrder) {
      router.replace("/basket");
    }
  }, [items.length, router, isPlacingOrder]);

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => {
      toast.error(err.message);
      setIsPlacingOrder(false);
    },
  });

  const canAdvance = (): boolean => {
    if (currentStep === 1) {
      return checkoutState.selectedAddressId !== null;
    }
    if (currentStep === 2) {
      if (!checkoutState.paymentMethod) return false;
      if (
        checkoutState.paymentMethod === "credit" &&
        !checkoutState.poNumber.trim()
      ) {
        return false;
      }
      return true;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!checkoutState.selectedAddressId || !checkoutState.paymentMethod) return;

    setIsPlacingOrder(true);

    try {
      const result = await createOrder.mutateAsync({
        deliveryAddressId: checkoutState.selectedAddressId,
        paymentMethod: checkoutState.paymentMethod,
        poNumber: checkoutState.poNumber.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      clearCart();

      if (checkoutState.paymentMethod === "card") {
        // For card payments, we need to redirect to Stripe
        // The payment service will provide the session URL via a separate call
        // For now, redirect to success with order reference
        // The actual Stripe redirect is handled after order creation
        const paymentResponse = await fetch("/api/stripe/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: result.orderId,
            orderNumber: result.orderNumber,
          }),
        });

        if (paymentResponse.ok) {
          const { url } = await paymentResponse.json();
          if (url) {
            window.location.href = url;
            return;
          }
        }

        // Fallback: redirect to success page
        router.push(`/checkout/success?order=${result.orderNumber}`);
      } else {
        // Credit and BACS go directly to success page
        router.push(`/checkout/success?order=${result.orderNumber}`);
      }
    } catch {
      // Error handled by mutation onError
    }
  };

  if (items.length === 0 && !isPlacingOrder) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    currentStep > step.number
                      ? "bg-green-600 text-white"
                      : currentStep === step.number
                        ? "bg-[#C41E3A] text-white"
                        : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium hidden sm:inline",
                    currentStep >= step.number
                      ? "text-zinc-100"
                      : "text-zinc-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-px flex-1",
                    currentStep > step.number ? "bg-green-600" : "bg-zinc-800"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <CheckoutStep1Address
            selectedAddressId={checkoutState.selectedAddressId}
            onSelectAddress={(id) =>
              setCheckoutState((s) => ({ ...s, selectedAddressId: id }))
            }
          />
        )}
        {currentStep === 2 && (
          <CheckoutStep2Payment
            paymentMethod={checkoutState.paymentMethod}
            poNumber={checkoutState.poNumber}
            onChangePaymentMethod={(method) =>
              setCheckoutState((s) => ({ ...s, paymentMethod: method }))
            }
            onChangePoNumber={(po) =>
              setCheckoutState((s) => ({ ...s, poNumber: po }))
            }
          />
        )}
        {currentStep === 3 && (
          <CheckoutStep3Review
            checkoutState={checkoutState}
            items={items}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-white"
          onClick={() => {
            if (currentStep === 1) {
              router.push("/basket");
            } else {
              setCurrentStep((s) => s - 1);
            }
          }}
          disabled={isPlacingOrder}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 1 ? "Back to Basket" : "Back"}
        </Button>

        {currentStep < 3 ? (
          <Button
            className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !canAdvance()}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
