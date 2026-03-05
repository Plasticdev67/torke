"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, CalendarDays, ShoppingCart } from "lucide-react";

export default function LeadsPage() {
  const [offset, setOffset] = useState(0);
  const [hasOrdersFilter, setHasOrdersFilter] = useState<boolean | undefined>(
    undefined
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 25;

  const { data: stats, isLoading: statsLoading } =
    trpc.leads.stats.useQuery();

  const { data, isLoading } = trpc.leads.list.useQuery({
    limit,
    offset,
    hasOrders: hasOrdersFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">TRACE Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Users who signed up via Torke TRACE and saved calculations.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Leads"
          value={stats?.totalLeads ?? 0}
          loading={statsLoading}
        />
        <StatCard
          icon={CalendarDays}
          title="This Week"
          value={stats?.thisWeek ?? 0}
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          title="This Month"
          value={stats?.thisMonth ?? 0}
          loading={statsLoading}
        />
        <StatCard
          icon={ShoppingCart}
          title="Converted"
          value={stats?.converted ?? 0}
          loading={statsLoading}
          subtitle="Have placed orders"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={hasOrdersFilter === undefined ? "all" : hasOrdersFilter ? "converted" : "unconverted"}
            onChange={(e) => {
              const v = e.target.value;
              setHasOrdersFilter(v === "all" ? undefined : v === "converted");
              setOffset(0);
            }}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">All Leads</option>
            <option value="converted">Converted (have orders)</option>
            <option value="unconverted">Unconverted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Company
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Signup Date
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Calculations
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : data?.leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No leads found matching your filters.
                </td>
              </tr>
            ) : (
              data?.leads.map((lead) => (
                <tr
                  key={lead.userId}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {lead.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.companyName || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lead.signupDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {lead.calculationCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.hasOrders ? (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        Converted
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        Lead
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + limit, data.total)} of{" "}
            {data.total} leads
          </p>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={offset + limit >= data.total}
              onClick={() => setOffset(offset + limit)}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  loading,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  loading: boolean;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {loading ? (
            <div className="mt-1 h-7 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
