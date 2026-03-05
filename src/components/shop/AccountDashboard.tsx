"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export function AccountDashboard() {
  const { data: summary, isLoading } = trpc.orders.accountSummary.useQuery();

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
