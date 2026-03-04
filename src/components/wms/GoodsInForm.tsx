"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertUpload } from "./CertUpload";
import { BatchLabel } from "./BatchLabel";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Package,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface GoodsInFormProps {
  products: Product[];
}

interface FormData {
  productId: string;
  supplierName: string;
  supplierBatchNumber: string;
  quantity: number;
  poReference: string;
  certKey: string;
  certFilename: string;
  expiryDate: string;
  heatNumber: string;
  millName: string;
  inspectionNotes: string;
}

interface GoodsInResult {
  batchId: string;
  torkeBatchId: string;
  verificationToken: string;
  productName: string;
  productSku: string;
  quantity: number;
  goodsInDate: string;
}

const STEPS = [
  { label: "Product & Supplier", icon: Package },
  { label: "Certificate Upload", icon: FileText },
  { label: "Inspection & Confirm", icon: ClipboardCheck },
];

const initialFormData: FormData = {
  productId: "",
  supplierName: "",
  supplierBatchNumber: "",
  quantity: 0,
  poReference: "",
  certKey: "",
  certFilename: "",
  expiryDate: "",
  heatNumber: "",
  millName: "",
  inspectionNotes: "",
};

export function GoodsInForm({ products }: GoodsInFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GoodsInResult | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Auto-print on successful goods-in (TRACE-04)
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const isChemicalProduct = selectedProduct?.sku.startsWith("TRK-CHEM") ||
    selectedProduct?.name.toLowerCase().includes("chemical") ||
    selectedProduct?.name.toLowerCase().includes("resin");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateStep1(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.productId) newErrors.productId = "Product is required";
    if (!formData.supplierName.trim()) newErrors.supplierName = "Supplier name is required";
    if (!formData.supplierBatchNumber.trim()) newErrors.supplierBatchNumber = "Supplier batch number is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be positive";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.certKey) newErrors.certKey = "Certificate PDF is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/goods-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formData.productId,
          supplierName: formData.supplierName,
          supplierBatchNumber: formData.supplierBatchNumber,
          quantity: formData.quantity,
          certKey: formData.certKey,
          expiryDate: formData.expiryDate || null,
          inspectionNotes: formData.inspectionNotes || null,
          poReference: formData.poReference || null,
          heatNumber: formData.heatNumber || null,
          millName: formData.millName || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to complete goods-in");
      }

      const data = await res.json();

      setResult({
        batchId: data.batch.id,
        torkeBatchId: data.torkeBatchId,
        verificationToken: data.verificationToken,
        productName: selectedProduct?.name || "",
        productSku: selectedProduct?.sku || "",
        quantity: formData.quantity,
        goodsInDate: new Date().toISOString(),
      });
    } catch (err) {
      setErrors({
        inspectionNotes:
          err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success screen with label
  if (result) {
    return (
      <div className="space-y-6">
        <Card className="border-green-600/30 bg-green-950/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Goods-In Complete
              </h2>
              <p className="text-muted-foreground">
                Batch <span className="font-mono font-bold text-foreground">{result.torkeBatchId}</span> has been created and is now available in stock.
              </p>
            </div>
          </CardContent>
        </Card>

        <div ref={labelRef}>
          <BatchLabel
            torkeBatchId={result.torkeBatchId}
            productSku={result.productSku}
            productName={result.productName}
            quantity={result.quantity}
            goodsInDate={result.goodsInDate}
            verificationToken={result.verificationToken}
          />
        </div>

        <div className="flex gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            Print Label Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/goods-in/${result.batchId}`)}
          >
            View Batch Details
          </Button>
          <Button
            onClick={() => {
              setResult(null);
              setFormData(initialFormData);
              setStep(0);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            New Goods-In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Product & Supplier */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product & Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <select
                id="productId"
                value={formData.productId}
                onChange={(e) => updateField("productId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => updateField("supplierName", e.target.value)}
                placeholder="e.g. Fischer Fixings Ltd"
              />
              {errors.supplierName && (
                <p className="text-sm text-destructive">{errors.supplierName}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplierBatchNumber">Supplier Batch Number *</Label>
                <Input
                  id="supplierBatchNumber"
                  value={formData.supplierBatchNumber}
                  onChange={(e) => updateField("supplierBatchNumber", e.target.value)}
                  placeholder="e.g. SUP-2026-0142"
                />
                {errors.supplierBatchNumber && (
                  <p className="text-sm text-destructive">{errors.supplierBatchNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Received *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity || ""}
                  onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                  placeholder="e.g. 500"
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poReference">PO Reference (optional)</Label>
              <Input
                id="poReference"
                value={formData.poReference}
                onChange={(e) => updateField("poReference", e.target.value)}
                placeholder="e.g. PO-2026-001"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Certificate Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CertUpload
              certKey={formData.certKey}
              certFilename={formData.certFilename}
              onUpload={(key, filename) => {
                updateField("certKey", key);
                updateField("certFilename", filename);
              }}
              onRemove={() => {
                updateField("certKey", "");
                updateField("certFilename", "");
              }}
            />
            {errors.certKey && (
              <p className="text-sm text-destructive">{errors.certKey}</p>
            )}

            {/* Expiry date for chemical products */}
            {isChemicalProduct && (
              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Expiry Date
                  <Badge variant="outline" className="ml-2 text-xs">Chemical Product</Badge>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => updateField("expiryDate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required for chemical anchor products (WMS-05)
                </p>
              </div>
            )}

            {/* Optional mill cert details */}
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Optional -- complete if heat number is shown on the cert
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="heatNumber">Heat Number</Label>
                  <Input
                    id="heatNumber"
                    value={formData.heatNumber}
                    onChange={(e) => updateField("heatNumber", e.target.value)}
                    placeholder="e.g. 284719"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="millName">Mill Name</Label>
                  <Input
                    id="millName"
                    value={formData.millName}
                    onChange={(e) => updateField("millName", e.target.value)}
                    placeholder="e.g. Acerinox S.A."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Inspection & Confirm */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection & Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inspectionNotes">Inspection Notes (optional)</Label>
              <Textarea
                id="inspectionNotes"
                value={formData.inspectionNotes}
                onChange={(e) => updateField("inspectionNotes", e.target.value)}
                placeholder="Any notes from visual inspection..."
                rows={3}
              />
            </div>

            {/* Confirmation summary */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Summary</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{selectedProduct?.sku} - {selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium">{formData.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier Batch</span>
                  <span className="font-mono font-medium">{formData.supplierBatchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certificate</span>
                  <span className="font-medium text-green-500">{formData.certFilename || "Uploaded"}</span>
                </div>
                {formData.poReference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO Reference</span>
                    <span className="font-medium">{formData.poReference}</span>
                  </div>
                )}
                {formData.heatNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heat Number</span>
                    <span className="font-mono font-medium">{formData.heatNumber}</span>
                  </div>
                )}
                {formData.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-medium">{formData.expiryDate}</span>
                  </div>
                )}
              </div>
            </div>

            {errors.inspectionNotes && (
              <p className="text-sm text-destructive">{errors.inspectionNotes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Goods In"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
