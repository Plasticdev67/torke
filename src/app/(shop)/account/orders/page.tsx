import type { Metadata } from "next";
import { OrderHistory } from "@/components/shop/OrderHistory";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order History",
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            &larr; Account
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">
          Order History
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          View and manage your past orders.
        </p>
      </div>

      <OrderHistory />
    </div>
  );
}
