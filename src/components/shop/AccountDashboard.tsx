"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Ruler, ShoppingBag } from "lucide-react";

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export function AccountDashboard() {
  const { data: summary, isLoading } = trpc.orders.accountSummary.useQuery();
  const { data: calculations } = trpc.calculations.list.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Orders"
          value={String(summary.totalOrders)}
        />
        <SummaryCard
          title="Total Spent"
          value={formatPence(summary.totalSpentPence)}
        />
        <SummaryCard
          title="This Month"
          value={formatPence(summary.monthlySpentPence)}
        />
        {summary.creditAccount ? (
          <SummaryCard
            title="Credit Account"
            value={summary.creditAccount.status === "approved" ? "Active" : summary.creditAccount.status}
            subtitle={
              summary.creditAccount.status === "approved"
                ? `${formatPence(summary.creditAccount.creditLimitPence - summary.creditAccount.creditUsedPence)} available`
                : undefined
            }
          />
        ) : (
          <SummaryCard
            title="Cert Packs"
            value={String(summary.certPackCount)}
            subtitle="Available for download"
          />
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink
          href="/account/orders"
          title="View Orders"
          description="Browse your order history and download documents"
        />
        <QuickLink
          href="/account/addresses"
          title="Manage Addresses"
          description="Add or edit your delivery addresses"
        />
        <QuickLink
          href="/account/orders"
          title="Download Cert Packs"
          description={`${summary.certPackCount} certificate packs available`}
        />
      </div>

      {/* Torke TRACE section */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-zinc-100">
          <Ruler className="mr-2 inline-block h-5 w-5 text-[#C41E3A]" />
          Torke TRACE
        </h3>
        {calculations && calculations.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {calculations.length} saved calculation{calculations.length !== 1 ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Anchor design calculations from the Torke TRACE tool
                  </p>
                </div>
                <Link
                  href="/design"
                  className="rounded-md bg-[#C41E3A]/10 px-3 py-1.5 text-xs font-medium text-[#C41E3A] transition-colors hover:bg-[#C41E3A]/20"
                >
                  Open TRACE
                </Link>
              </div>
            </div>

            {/* Gentle order prompt for users with calculations but no orders */}
            {summary.totalOrders === 0 && (
              <div className="rounded-lg border border-[#C41E3A]/20 bg-[#C41E3A]/5 p-4">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-[#C41E3A]" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Ready to order?
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      The fixings you designed are available in our shop.
                    </p>
                    <Link
                      href="/products"
                      className="mt-2 inline-block text-xs font-medium text-[#C41E3A] hover:underline"
                    >
                      Browse Products
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">
              No saved calculations yet.
            </p>
            <Link
              href="/design"
              className="mt-2 inline-block text-xs font-medium text-[#C41E3A] hover:underline"
            >
              Try the Torke TRACE tool
            </Link>
          </div>
        )}
      </div>

      {/* Top products */}
      {summary.topProducts.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-zinc-100">
            Most Ordered Products
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            {summary.topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0"
              >
                <span className="text-sm text-zinc-200">
                  {product.productName}
                </span>
                <span className="text-xs text-zinc-400">
                  {product.orderCount} order{product.orderCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-[#C41E3A]/50 hover:bg-zinc-800/50"
    >
      <p className="font-medium text-zinc-100 group-hover:text-[#C41E3A]">
        {title}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{description}</p>
    </Link>
  );
}
