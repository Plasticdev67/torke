"use client";

import { useState, useCallback } from "react";

export interface CertSearchFilters {
  orderNumber: string;
  batchId: string;
  productCode: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: CertSearchFilters = {
  orderNumber: "",
  batchId: "",
  productCode: "",
  dateFrom: "",
  dateTo: "",
};

interface CertSearchProps {
  onSearch: (filters: CertSearchFilters) => void;
  isLoading: boolean;
}

export function CertSearch({ onSearch, isLoading }: CertSearchProps) {
  const [filters, setFilters] = useState<CertSearchFilters>(emptyFilters);

  const handleChange = useCallback(
    (field: keyof CertSearchFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const hasFilters = Object.values(filters).some((v) => v.trim() !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Search Certifications
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="orderNumber"
              className="mb-1 block text-xs font-medium text-zinc-400"
            >
              Order Number
            </label>
            <input
              id="orderNumber"
              type="text"
              placeholder="e.g. ORD-202603"
              value={filters.orderNumber}
              onChange={(e) => handleChange("orderNumber", e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="batchId"
              className="mb-1 block text-xs font-medium text-zinc-400"
            >
              Torke Batch ID
            </label>
            <input
              id="batchId"
              type="text"
              placeholder="e.g. TRK-2026"
              value={filters.batchId}
              onChange={(e) => handleChange("batchId", e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="productCode"
              className="mb-1 block text-xs font-medium text-zinc-400"
            >
              Product Code / Name
            </label>
            <input
              id="productCode"
              type="text"
              placeholder="e.g. TRK-MECH"
              value={filters.productCode}
              onChange={(e) => handleChange("productCode", e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="dateFrom"
                className="mb-1 block text-xs font-medium text-zinc-400"
              >
                From
              </label>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange("dateFrom", e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div>
              <label
                htmlFor="dateTo"
                className="mb-1 block text-xs font-medium text-zinc-400"
              >
                To
              </label>
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange("dateTo", e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-[#C41E3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#a01830] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
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
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
