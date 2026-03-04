"use client";

import "@/styles/pick-print.css";

interface PickListAllocation {
  id: string;
  torkeBatchId: string;
  quantity: number;
}

interface PickListLine {
  id: string;
  quantity: number;
  product: {
    name: string;
    sku?: string | null;
  } | null;
  allocations: PickListAllocation[];
}

interface PickListProps {
  orderNumber: string;
  customerName?: string;
  date: string;
  lines: PickListLine[];
}

export function PickList({ orderNumber, customerName, date, lines }: PickListProps) {
  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="picklist-container bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TORKE</h1>
          <p className="text-sm text-gray-600 mt-1">Pick List</p>
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="font-semibold">Order:</span> {orderNumber}
          </p>
          <p>
            <span className="font-semibold">Date:</span>{" "}
            {new Date(date).toLocaleDateString("en-GB")}
          </p>
          {customerName && (
            <p>
              <span className="font-semibold">Customer:</span> {customerName}
            </p>
          )}
        </div>
      </div>

      {/* Pick table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 px-2 text-left font-semibold w-8">#</th>
            <th className="py-2 px-2 text-center font-semibold w-8">
              <span className="sr-only">Picked</span>
              {/* Checkbox column header */}
              &#x2610;
            </th>
            <th className="py-2 px-2 text-left font-semibold">Product</th>
            <th className="py-2 px-2 text-left font-semibold">SKU</th>
            <th className="py-2 px-2 text-center font-semibold">Qty</th>
            <th className="py-2 px-2 text-left font-semibold">Torke Batch ID</th>
            <th className="py-2 px-2 text-center font-semibold">Batch Qty</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, lineIdx) => {
            // Each line may have multiple allocation rows for FIFO splits
            const allocs = line.allocations.length > 0 ? line.allocations : [null];
            return allocs.map((alloc, allocIdx) => (
              <tr
                key={`${line.id}-${allocIdx}`}
                className={
                  allocIdx === allocs.length - 1
                    ? "border-b border-gray-300"
                    : ""
                }
              >
                {allocIdx === 0 ? (
                  <>
                    <td
                      className="py-2 px-2 text-gray-500"
                      rowSpan={allocs.length}
                    >
                      {lineIdx + 1}
                    </td>
                    <td
                      className="py-2 px-2 text-center text-lg"
                      rowSpan={allocs.length}
                    >
                      &#x2610;
                    </td>
                    <td
                      className="py-2 px-2 font-medium"
                      rowSpan={allocs.length}
                    >
                      {line.product?.name ?? "Unknown"}
                    </td>
                    <td
                      className="py-2 px-2 font-mono text-xs"
                      rowSpan={allocs.length}
                    >
                      {line.product?.sku ?? "-"}
                    </td>
                    <td
                      className="py-2 px-2 text-center font-semibold"
                      rowSpan={allocs.length}
                    >
                      {line.quantity}
                    </td>
                  </>
                ) : null}
                <td className="py-2 px-2 font-mono text-xs">
                  {alloc?.torkeBatchId ?? "-"}
                </td>
                <td className="py-2 px-2 text-center">
                  {alloc?.quantity ?? "-"}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-8 border-t-2 border-black pt-4">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-semibold">Total Items:</span> {totalItems}
            </p>
            <div className="text-sm">
              <p className="font-semibold mb-1">Picked By:</p>
              <div className="border-b border-black w-48 h-6" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-1">Date / Time:</p>
            <div className="border-b border-black w-48 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
