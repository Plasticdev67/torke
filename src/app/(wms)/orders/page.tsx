"use client";

import { OrderQueue } from "@/components/wms/OrderQueue";

export default function OrderQueuePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Order Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders ready for picking, packing, and dispatch.
        </p>
      </div>
      <OrderQueue />
    </div>
  );
}
