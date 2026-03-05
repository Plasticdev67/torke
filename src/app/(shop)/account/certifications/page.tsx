"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CertSearch, type CertSearchFilters } from "@/components/shop/CertSearch";
import { CertResults } from "@/components/shop/CertResults";

const LIMIT = 20;

export default function CertificationsPage() {
  const [filters, setFilters] = useState<CertSearchFilters | null>(null);
  const [offset, setOffset] = useState(0);

  const searchQuery = trpc.certs.search.useQuery(
    {
      orderNumber: filters?.orderNumber || undefined,
      batchId: filters?.batchId || undefined,
      productCode: filters?.productCode || undefined,
      dateFrom: filters?.dateFrom || undefined,
      dateTo: filters?.dateTo || undefined,
      limit: LIMIT,
      offset,
    },
    {
      enabled: filters !== null,
    }
  );

  const handleSearch = useCallback((newFilters: CertSearchFilters) => {
    setFilters(newFilters);
    setOffset(0);
  }, []);

  const handlePageChange = useCallback((newOffset: number) => {
    setOffset(newOffset);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">My Certifications</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Search and download 3.1 certifications and cert packs for your orders.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="mb-8 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <TabLink href="/account">Dashboard</TabLink>
        <TabLink href="/account/orders">Orders</TabLink>
        <TabLink href="/account/addresses">Addresses</TabLink>
        <TabLink href="/account/certifications" active>
          Certifications
        </TabLink>
      </div>

      <div className="space-y-6">
        <CertSearch onSearch={handleSearch} isLoading={searchQuery.isFetching} />

        <CertResults
          results={searchQuery.data?.results ?? []}
          totalCount={searchQuery.data?.totalCount ?? 0}
          offset={offset}
          limit={LIMIT}
          onPageChange={handlePageChange}
          isLoading={searchQuery.isFetching}
          hasSearched={filters !== null}
        />
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
      }`}
    >
      {children}
    </Link>
  );
}
