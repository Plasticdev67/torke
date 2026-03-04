"use client";

import { useEffect, useState } from "react";
import { generateQRDataUrl } from "@/server/services/qr-service";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface BatchLabelProps {
  torkeBatchId: string;
  productSku: string;
  productName: string;
  quantity: number;
  goodsInDate: string;
  verificationToken: string;
}

/**
 * Printable batch label sized for thermal label stock (100mm x 60mm).
 * All in black on white -- thermal printer compatible.
 */
export function BatchLabel({
  torkeBatchId,
  productSku,
  productName,
  quantity,
  goodsInDate,
  verificationToken,
}: BatchLabelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code data URL client-side
    async function loadQR() {
      try {
        const res = await fetch(
          `/api/qr?token=${encodeURIComponent(verificationToken)}`
        );
        if (res.ok) {
          const data = await res.json();
          setQrDataUrl(data.dataUrl);
        }
      } catch {
        // QR code generation failure is non-blocking
      }
    }
    loadQR();
  }, [verificationToken]);

  const formattedDate = new Date(goodsInDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const truncatedName =
    productName.length > 40
      ? productName.substring(0, 37) + "..."
      : productName;

  return (
    <div className="space-y-3">
      {/* Print button -- hidden in print */}
      <div className="print:hidden">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Label
        </Button>
      </div>

      {/* Label container -- styled for both screen preview and print */}
      <div className="label-container mx-auto border border-border bg-white text-black print:border-0"
        style={{
          width: "100mm",
          height: "60mm",
          padding: "3mm",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Header row: Torke logo text + batch ID */}
          <div className="flex items-start justify-between">
            <div>
              <div
                style={{ fontSize: "8pt", fontWeight: "bold", letterSpacing: "2px" }}
              >
                TORKE
              </div>
            </div>
            <div style={{ fontSize: "7pt", color: "#666" }}>{formattedDate}</div>
          </div>

          {/* Main content: Batch ID large + product info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {/* Torke batch ID -- large bold */}
              <div
                style={{
                  fontSize: "14pt",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                }}
              >
                {torkeBatchId}
              </div>

              {/* Product SKU */}
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "bold",
                  marginTop: "2mm",
                }}
              >
                {productSku}
              </div>

              {/* Product name */}
              <div style={{ fontSize: "7pt", color: "#333", marginTop: "1mm" }}>
                {truncatedName}
              </div>

              {/* Quantity */}
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "bold",
                  marginTop: "2mm",
                }}
              >
                Qty: {quantity}
              </div>
            </div>

            {/* QR code */}
            <div
              style={{
                width: "25mm",
                height: "25mm",
                flexShrink: 0,
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR verification code"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "1px solid #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "6pt",
                    color: "#999",
                  }}
                >
                  QR
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: "5pt",
              color: "#999",
              borderTop: "0.5pt solid #ddd",
              paddingTop: "1mm",
            }}
          >
            Scan QR code to verify batch authenticity | torke.co.uk
          </div>
        </div>
      </div>
    </div>
  );
}
