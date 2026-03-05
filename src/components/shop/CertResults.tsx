"use client";

import { useState, useCallback } from "react";

interface CertAllocation {
  torkeBatchId: string;
  quantity: number;
  batchCertKey: string | null;
}

interface CertLine {
  productName: string;
  productSku: string;
  quantity: number;
  allocations: CertAllocation[];
}

interface CertOrder {
  orderId: string;
  orderNumber: string;
  orderDate: Date | string;
  status: string;
  certPackKey: string | null;
  lines: CertLine[];
}

interface CertResultsProps {
  results: CertOrder[];
  totalCount: number;
  offset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
  isLoading: boolean;
  hasSearched: boolean;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  allocated: "Allocated",
  picking: "Picking",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  dispatched: "bg-green-900/40 text-green-400",
  delivered: "bg-green-900/40 text-green-400",
  completed: "bg-green-900/40 text-green-400",
  cancelled: "bg-red-900/40 text-red-400",
  draft: "bg-zinc-800 text-zinc-400",
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CertResults({
  results,
  totalCount,
  offset,
  limit,
  onPageChange,
  isLoading,
  hasSearched,
}: CertResultsProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedOrders((prev) => {
      if (prev.size === results.length) {
        return new Set();
      }
      return new Set(results.map((r) => r.orderId));
    });
  }, [results]);

  const handleBulkDownload = useCallback(async () => {
    if (selectedOrders.size === 0) return;

    setDownloadingBulk(true);
    try {
      const response = await fetch("/api/certpack/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selectedOrders] }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err?.error || "Failed to download bulk cert pack");
        return;
      }

      // Trigger browser download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "Torke-CertPacks.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk download error:", err);
      alert("Failed to download bulk cert pack");
    } finally {
      setDownloadingBulk(false);
    }
  }, [selectedOrders]);

  // Loading shimmer
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (hasSearched && results.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <svg
          className="mx-auto mb-3 h-12 w-12 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-zinc-400">
          No certifications found matching your search criteria.
        </p>
      </div>
    );
  }

  // Not yet searched
  if (!hasSearched) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <svg
          className="mx-auto mb-3 h-12 w-12 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-sm text-zinc-400">
          Search your orders to find 3.1 certifications and cert packs.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {results.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={selectedOrders.size === results.length && results.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-[#C41E3A] focus:ring-[#C41E3A]"
              />
              Select all
            </label>
            <span className="text-xs text-zinc-500">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {selectedOrders.size > 0 && ` / ${selectedOrders.size} selected`}
            </span>
          </div>

          {selectedOrders.size > 0 && (
            <button
              onClick={handleBulkDownload}
              disabled={downloadingBulk}
              className="inline-flex items-center gap-2 rounded-md bg-[#C41E3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#a01830] disabled:opacity-50"
            >
              {downloadingBulk ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating ZIP...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Selected ({selectedOrders.size}) as ZIP
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Results list */}
      {results.map((order) => {
        const isExpanded = expandedOrders.has(order.orderId);
        const isSelected = selectedOrders.has(order.orderId);
        const statusColor =
          statusColors[order.status] || "bg-blue-900/40 text-blue-400";

        return (
          <div
            key={order.orderId}
            className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
          >
            {/* Order header row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(order.orderId)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-[#C41E3A] focus:ring-[#C41E3A]"
              />

              <button
                onClick={() => toggleExpand(order.orderId)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-100">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {formatDate(order.orderDate)} &middot;{" "}
                    {order.lines.length} line item
                    {order.lines.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <svg
                  className={`h-5 w-5 text-zinc-500 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Download Cert Pack button */}
              <a
                href={`/api/certpack/${order.orderId}`}
                download
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Cert Pack
              </a>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <th className="pb-2 pr-4">Product</th>
                      <th className="pb-2 pr-4">SKU</th>
                      <th className="pb-2 pr-4">Qty</th>
                      <th className="pb-2 pr-4">Batch ID</th>
                      <th className="pb-2">3.1 Cert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {order.lines.map((line, lineIdx) => {
                      if (line.allocations.length === 0) {
                        return (
                          <tr key={lineIdx}>
                            <td className="py-2 pr-4 text-zinc-300">
                              {line.productName}
                            </td>
                            <td className="py-2 pr-4 font-mono text-xs text-zinc-500">
                              {line.productSku}
                            </td>
                            <td className="py-2 pr-4 text-zinc-400">
                              {line.quantity}
                            </td>
                            <td className="py-2 pr-4 text-zinc-500 italic">
                              Pending
                            </td>
                            <td className="py-2 text-zinc-500">-</td>
                          </tr>
                        );
                      }

                      return line.allocations.map((alloc, allocIdx) => (
                        <tr key={`${lineIdx}-${allocIdx}`}>
                          {allocIdx === 0 && (
                            <>
                              <td
                                className="py-2 pr-4 text-zinc-300"
                                rowSpan={line.allocations.length}
                              >
                                {line.productName}
                              </td>
                              <td
                                className="py-2 pr-4 font-mono text-xs text-zinc-500"
                                rowSpan={line.allocations.length}
                              >
                                {line.productSku}
                              </td>
                            </>
                          )}
                          <td className="py-2 pr-4 text-zinc-400">
                            {alloc.quantity}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs text-zinc-400">
                            {alloc.torkeBatchId}
                          </td>
                          <td className="py-2">
                            {alloc.batchCertKey ? (
                              <a
                                href={alloc.batchCertKey}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#C41E3A] hover:text-red-400"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download 3.1 Cert
                              </a>
                            ) : (
                              <span className="text-xs text-zinc-500">
                                Not available
                              </span>
                            )}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <button
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(offset + limit)}
            disabled={offset + limit >= totalCount}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
