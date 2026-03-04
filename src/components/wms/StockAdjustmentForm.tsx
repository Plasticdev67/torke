"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const adjustmentSchema = z.object({
  productId: z.string().uuid("Select a product"),
  batchId: z.string().uuid("Select a batch"),
  quantityChange: z
    .number({ invalid_type_error: "Enter a number" })
    .int("Must be a whole number")
    .refine((v) => v !== 0, "Quantity change must be non-zero"),
  reason: z.enum(["damage", "returns", "cycle_count_variance", "other"], {
    required_error: "Select a reason",
  }),
  notes: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const reasonLabels: Record<string, string> = {
  damage: "Damage",
  returns: "Returns",
  cycle_count_variance: "Cycle Count Variance",
  other: "Other",
};

export function StockAdjustmentForm() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const utils = trpc.useUtils();

  const { data: dashboardData } = trpc.stock.dashboard.useQuery();
  const { data: batchList } = trpc.stock.productBatches.useQuery(
    { productId: selectedProductId },
    { enabled: !!selectedProductId }
  );

  const adjustMutation = trpc.stock.adjust.useMutation({
    onSuccess: (_data, variables) => {
      const product = dashboardData?.products.find(
        (p) => p.productId === variables.productId
      );
      const batch = batchList?.find((b) => b.batchId === variables.batchId);
      toast.success(
        `Stock adjusted: ${product?.productName ?? "Product"} batch ${
          batch?.torkeBatchId ?? variables.batchId.slice(0, 8)
        } by ${variables.quantityChange > 0 ? "+" : ""}${
          variables.quantityChange
        }`
      );
      utils.stock.dashboard.invalidate();
      utils.stock.adjustmentHistory.invalidate();
      utils.stock.productBatches.invalidate();
      reset();
      setSelectedProductId("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to adjust stock");
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      notes: "",
    },
  });

  const watchedProductId = watch("productId");
  const watchedReason = watch("reason");

  const onSubmit = (data: AdjustmentFormValues) => {
    adjustMutation.mutate(data);
  };

  const products = dashboardData?.products ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New Stock Adjustment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product selector */}
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Select
              value={watchedProductId || ""}
              onValueChange={(value) => {
                setValue("productId", value, { shouldValidate: true });
                setValue("batchId", "" as string);
                setSelectedProductId(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.productId} value={p.productId}>
                    {p.productName} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && (
              <p className="text-xs text-destructive">
                {errors.productId.message}
              </p>
            )}
          </div>

          {/* Batch selector */}
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch</Label>
            <Select
              value={watch("batchId") || ""}
              onValueChange={(value) =>
                setValue("batchId", value, { shouldValidate: true })
              }
              disabled={!selectedProductId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedProductId
                      ? "Select a batch..."
                      : "Select a product first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(batchList ?? []).map((b) => (
                  <SelectItem key={b.batchId} value={b.batchId}>
                    {b.torkeBatchId} (Avail: {b.quantityAvailable})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.batchId && (
              <p className="text-xs text-destructive">
                {errors.batchId.message}
              </p>
            )}
          </div>

          {/* Quantity Change */}
          <div className="space-y-2">
            <Label htmlFor="quantityChange">
              Quantity Change{" "}
              <span className="text-muted-foreground text-xs">
                (negative to reduce)
              </span>
            </Label>
            <Input
              id="quantityChange"
              type="number"
              {...register("quantityChange", { valueAsNumber: true })}
              placeholder="e.g. -5 or +10"
            />
            {errors.quantityChange && (
              <p className="text-xs text-destructive">
                {errors.quantityChange.message}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={watchedReason || ""}
              onValueChange={(value) =>
                setValue(
                  "reason",
                  value as AdjustmentFormValues["reason"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional details about this adjustment..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={adjustMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {adjustMutation.isPending ? "Submitting..." : "Submit Adjustment"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
