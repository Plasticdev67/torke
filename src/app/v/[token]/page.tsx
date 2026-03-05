import { db } from "@/server/db";
import { orderShareTokens } from "@/server/db/schema/share-tokens";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import {
  batches,
  supplierBatches,
  suppliers,
  millCerts,
} from "@/server/db/schema/batches";
import { userProfiles } from "@/server/db/schema/users";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCertUrl } from "@/server/storage";
import type { Metadata } from "next";
import {
  Shield,
  CheckCircle,
  Package,
  FileText,
  ExternalLink,
  Calendar,
} from "lucide-react";

// noindex, nofollow -- private verification pages
export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Order Verification | Torke",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

// Light theme exception for certificate-like trustworthiness
export default async function OrderVerificationPage({ params }: PageProps) {
  const { token } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return <VerificationNotFound />;
  }

  // Look up share token
  const [shareToken] = await db
    .select()
    .from(orderShareTokens)
    .where(eq(orderShareTokens.token, token));

  if (!shareToken) {
    return <VerificationNotFound />;
  }

  // Update last accessed timestamp (fire-and-forget)
  db.update(orderShareTokens)
    .set({ lastAccessedAt: new Date() })
    .where(eq(orderShareTokens.id, shareToken.id))
    .then(() => {})
    .catch(() => {});

  // Fetch order
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      dispatchedAt: orders.dispatchedAt,
      createdAt: orders.createdAt,
      userId: orders.userId,
    })
    .from(orders)
    .where(eq(orders.id, shareToken.orderId));

  if (!order) {
    return <VerificationNotFound />;
  }

  // Fetch contractor profile for co-branding
  const [profile] = await db
    .select({ companyName: userProfiles.companyName })
    .from(userProfiles)
    .where(eq(userProfiles.userId, shareToken.userId));

  const companyName = profile?.companyName || "Contractor";

  // Fetch order lines with allocations, batches, supplier batches, products
  const lineData = await db
    .select({
      lineId: orderLines.id,
      productName: products.name,
      productSku: products.sku,
      lineQuantity: orderLines.quantity,
      torkeBatchId: batches.torkeBatchId,
      allocationQty: orderLineAllocations.quantity,
      goodsInDate: batches.goodsInDate,
      batchDispatchedAt: orderLineAllocations.dispatchedAt,
      supplierBatchNumber: supplierBatches.supplierBatchNumber,
      supplierBatchId: supplierBatches.id,
      supplierName: suppliers.name,
      heatNumber: millCerts.heatNumber,
      manufacturerCertUrl: supplierBatches.manufacturerCertUrl,
      millCertDocUrl: millCerts.documentUrl,
    })
    .from(orderLines)
    .innerJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(
      orderLineAllocations,
      eq(orderLineAllocations.orderLineId, orderLines.id)
    )
    .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
    .leftJoin(supplierBatches, eq(batches.supplierBatchId, supplierBatches.id))
    .leftJoin(suppliers, eq(supplierBatches.supplierId, suppliers.id))
    .leftJoin(millCerts, eq(supplierBatches.millCertId, millCerts.id))
    .where(eq(orderLines.orderId, order.id));

  // Build structured line items
  interface LineItem {
    productName: string;
    productSku: string;
    quantity: number;
    allocations: Array<{
      torkeBatchId: string;
      quantity: number;
      supplierBatchNumber: string | null;
      supplierName: string | null;
      heatNumber: string | null;
      goodsInDate: Date | null;
      dispatchedAt: Date | null;
      certKey: string | null;
    }>;
  }

  const lineMap = new Map<string, LineItem>();

  for (const row of lineData) {
    if (!lineMap.has(row.lineId)) {
      lineMap.set(row.lineId, {
        productName: row.productName,
        productSku: row.productSku,
        quantity: row.lineQuantity,
        allocations: [],
      });
    }

    if (row.torkeBatchId) {
      const certKey = row.millCertDocUrl || row.manufacturerCertUrl || null;
      lineMap.get(row.lineId)!.allocations.push({
        torkeBatchId: row.torkeBatchId,
        quantity: row.allocationQty ?? row.lineQuantity,
        supplierBatchNumber: row.supplierBatchNumber,
        supplierName: row.supplierName,
        heatNumber: row.heatNumber,
        goodsInDate: row.goodsInDate,
        dispatchedAt: row.batchDispatchedAt,
        certKey,
      });
    }
  }

  const lines = [...lineMap.values()];

  // Pre-sign cert URLs
  const certUrls = new Map<string, string>();
  for (const line of lines) {
    for (const alloc of line.allocations) {
      if (alloc.certKey && !certUrls.has(alloc.certKey)) {
        try {
          certUrls.set(alloc.certKey, await getCertUrl(alloc.certKey));
        } catch {
          // Non-blocking
        }
      }
    }
  }

  const orderDate = order.createdAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const dispatchDate = order.dispatchedAt
    ? order.dispatchedAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header - Red bar with Torke branding */}
      <header className="bg-[#C41E3A]">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-white" />
              <span className="text-xl font-bold tracking-wider text-white">
                TORKE
              </span>
            </div>
            <span className="text-sm text-white/80">
              Order Verification
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Co-branded banner */}
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              Verified Supply Chain Record
            </p>
            <p className="text-sm text-green-700">
              Fixings supplied by{" "}
              <span className="font-semibold">{companyName}</span>, verified by
              Torke.
            </p>
          </div>
        </div>

        {/* Project name (if provided) */}
        {shareToken.projectName && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
              Project
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {shareToken.projectName}
            </p>
          </div>
        )}

        {/* Order details */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Order Details</h2>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500">Order Reference</dt>
              <dd className="text-sm font-mono font-bold text-gray-900">
                {order.orderNumber}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Order Date</dt>
              <dd className="text-sm text-gray-900">{orderDate}</dd>
            </div>
            {dispatchDate && (
              <div>
                <dt className="text-xs text-gray-500">Dispatch Date</dt>
                <dd className="text-sm text-gray-900">{dispatchDate}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500">Supplied By</dt>
              <dd className="text-sm text-gray-900">{companyName}</dd>
            </div>
          </dl>
        </section>

        {/* Fixings table */}
        <section className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Fixings &amp; Batch Traceability
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Qty</th>
                  <th className="px-3 py-3">Torke Batch</th>
                  <th className="px-3 py-3">Supplier Batch</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Heat No.</th>
                  <th className="px-3 py-3">Goods In</th>
                  <th className="px-3 py-3">3.1 Cert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line, lineIdx) => {
                  if (line.allocations.length === 0) {
                    return (
                      <tr key={lineIdx}>
                        <td className="px-5 py-3 text-gray-900">
                          {line.productName}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500">
                          {line.productSku}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {line.quantity}
                        </td>
                        <td
                          colSpan={6}
                          className="px-3 py-3 text-gray-400 italic"
                        >
                          Pending allocation
                        </td>
                      </tr>
                    );
                  }

                  return line.allocations.map((alloc, allocIdx) => {
                    const certUrl = alloc.certKey
                      ? certUrls.get(alloc.certKey)
                      : null;

                    return (
                      <tr key={`${lineIdx}-${allocIdx}`}>
                        {allocIdx === 0 && (
                          <>
                            <td
                              className="px-5 py-3 text-gray-900"
                              rowSpan={line.allocations.length}
                            >
                              {line.productName}
                            </td>
                            <td
                              className="px-3 py-3 font-mono text-xs text-gray-500"
                              rowSpan={line.allocations.length}
                            >
                              {line.productSku}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3 text-gray-700">
                          {alloc.quantity}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs font-bold text-gray-900">
                          {alloc.torkeBatchId}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">
                          {alloc.supplierBatchNumber || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {alloc.supplierName || "-"}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">
                          {alloc.heatNumber || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {alloc.goodsInDate
                            ? new Date(alloc.goodsInDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </td>
                        <td className="px-3 py-3">
                          {certUrl ? (
                            <a
                              href={certUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-[#C41E3A] px-3 py-1 text-xs font-medium text-white hover:bg-[#a51830] transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              Download
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {lines.map((line, lineIdx) => (
              <div key={lineIdx} className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {line.productName}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    {line.productSku}
                  </p>
                </div>

                {line.allocations.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Pending allocation
                  </p>
                ) : (
                  line.allocations.map((alloc, allocIdx) => {
                    const certUrl = alloc.certKey
                      ? certUrls.get(alloc.certKey)
                      : null;

                    return (
                      <div
                        key={allocIdx}
                        className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-500">Qty</span>
                          <span className="text-gray-900">
                            {alloc.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Torke Batch</span>
                          <span className="font-mono font-bold text-gray-900">
                            {alloc.torkeBatchId}
                          </span>
                        </div>
                        {alloc.supplierBatchNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Supplier Batch
                            </span>
                            <span className="font-mono text-gray-700">
                              {alloc.supplierBatchNumber}
                            </span>
                          </div>
                        )}
                        {alloc.supplierName && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Supplier</span>
                            <span className="text-gray-700">
                              {alloc.supplierName}
                            </span>
                          </div>
                        )}
                        {alloc.heatNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Heat No.</span>
                            <span className="font-mono text-gray-700">
                              {alloc.heatNumber}
                            </span>
                          </div>
                        )}
                        {alloc.goodsInDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Goods In</span>
                            <span className="text-gray-700">
                              {new Date(
                                alloc.goodsInDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {certUrl && (
                          <a
                            href={certUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#C41E3A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#a51830] transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            Download 3.1 Certificate
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            This is a verified supply chain record from Torke. Batch data is
            captured at goods-in and linked through dispatch. All EN 10204 3.1
            certifications shown are tied to the specific batches allocated to
            this order.
          </p>
        </div>

        <footer className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">
            Verified by Torke | torke.co.uk
          </p>
        </footer>
      </main>
    </div>
  );
}

function VerificationNotFound() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-[#C41E3A]">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-white" />
            <span className="text-xl font-bold tracking-wider text-white">
              TORKE
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8">
          <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Verification Not Found
          </h1>
          <p className="text-sm text-gray-600">
            This verification link is invalid or has been revoked. If you
            believe this is an error, please contact the supplier or reach out
            to{" "}
            <a
              href="mailto:info@torke.co.uk"
              className="text-[#C41E3A] hover:underline"
            >
              info@torke.co.uk
            </a>
          </p>
        </div>

        <footer className="mt-8">
          <p className="text-xs text-gray-400">
            Verified by Torke | torke.co.uk
          </p>
        </footer>
      </main>
    </div>
  );
}
