"use client";

import { OrderDetail } from "@/components/shop/OrderDetail";
import { use } from "react";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <OrderDetail orderId={id} />
    </div>
  );
}
