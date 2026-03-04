"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Truck, Package, BoxSelect } from "lucide-react";
import { cn } from "@/lib/utils";

interface DispatchFormProps {
  orderId: string;
  orderNumber: string;
  orderLines: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
      sku?: string | null;
    } | null;
    allocations: Array<{
      id: string;
      torkeBatchId: string;
      quantity: number;
    }>;
  }>;
}

interface FormValues {
  dispatchType: "parcel" | "pallet";
  trackingNumber: string;
  consignmentNumber: string;
  carrierName: string;
  notes: string;
}

export function DispatchForm({
  orderId,
  orderNumber,
  orderLines,
}: DispatchFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dispatchType: "parcel",
      trackingNumber: "",
      consignmentNumber: "",
      carrierName: "",
      notes: "",
    },
  });

  const dispatchType = watch("dispatchType");

  const dispatchMutation = trpc.orders.dispatch.useMutation({
    onSuccess: () => {
      toast.success(`Order ${orderNumber} dispatched`);
      router.push("/orders");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: FormValues) => {
    dispatchMutation.mutate({
      orderId,
      dispatchType: data.dispatchType,
      trackingNumber: data.dispatchType === "parcel" ? data.trackingNumber : undefined,
      consignmentNumber: data.dispatchType === "pallet" ? data.consignmentNumber : undefined,
      carrierName: data.carrierName || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Order summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Order Summary
        </h2>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Order:</span>{" "}
            {orderNumber}
          </p>
          <div className="mt-3 space-y-1">
            {orderLines.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  {line.product?.name ?? "Unknown"}{" "}
                  <span className="text-muted-foreground">x{line.quantity}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {line.allocations.map((a) => a.torkeBatchId).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatch type selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Dispatch Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              dispatchType === "parcel"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <input
              type="radio"
              value="parcel"
              {...register("dispatchType")}
              className="sr-only"
            />
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Small Parcel (Courier)
              </p>
              <p className="text-xs text-muted-foreground">
                DPD, Royal Mail, etc.
              </p>
            </div>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              dispatchType === "pallet"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <input
              type="radio"
              value="pallet"
              {...register("dispatchType")}
              className="sr-only"
            />
            <BoxSelect className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Pallet (Haulier)
              </p>
              <p className="text-xs text-muted-foreground">
                Full/half pallet shipment
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Parcel fields */}
      {dispatchType === "parcel" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Carrier Name
            </label>
            <input
              type="text"
              {...register("carrierName")}
              placeholder="e.g. DPD, Royal Mail"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tracking Number <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("trackingNumber", {
                required: dispatchType === "parcel" ? "Tracking number is required" : false,
              })}
              placeholder="Enter tracking number"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.trackingNumber && (
              <p className="mt-1 text-xs text-destructive">
                {errors.trackingNumber.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pallet fields */}
      {dispatchType === "pallet" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Haulier Name
            </label>
            <input
              type="text"
              {...register("carrierName")}
              placeholder="e.g. Palletline, XPO Logistics"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Consignment Number <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("consignmentNumber", {
                required:
                  dispatchType === "pallet"
                    ? "Consignment number is required"
                    : false,
              })}
              placeholder="Enter consignment number"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.consignmentNumber && (
              <p className="mt-1 text-xs text-destructive">
                {errors.consignmentNumber.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Notes (optional)
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Any additional dispatch notes..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={dispatchMutation.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {dispatchMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        Confirm Dispatch
      </button>
    </form>
  );
}
