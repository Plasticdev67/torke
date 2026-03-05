"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useDesignStore } from "@/stores/design";
import { toast } from "sonner";
import type { DesignInputs } from "@/lib/calc-engine/types";

export default function SavedCalculationsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect to /design if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/design");
    }
  }, [isPending, session, router]);

  const isAuthenticated = !!session?.user;

  const { data: calculations, isLoading, refetch } =
    trpc.calculations.list.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const deleteMutation = trpc.calculations.delete.useMutation();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // We need a separate approach for loading since it's a query
  // Use a mutation-like pattern with manual fetch
  const utils = trpc.useUtils();

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const calc = await utils.calculations.load.fetch({ id });

      // Load inputs and results into design store
      const inputs = calc.inputs as DesignInputs;
      useDesignStore.setState({
        inputs,
        results: null, // Will recalculate on page load
        calcReference: calc.calcReference,
      });

      toast.success(`Loaded ${calc.calcReference}`);
      router.push("/design");
    } catch {
      toast.error("Failed to load calculation");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Calculation deleted");
      setDeleteConfirmId(null);
      refetch();
    } catch {
      toast.error("Failed to delete calculation");
    }
  };

  const handleNewCalculation = () => {
    useDesignStore.getState().reset();
    router.push("/design");
  };

  if (isPending || !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#C41E3A]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl overflow-y-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/design")}
            className="mb-2 flex items-center gap-1 text-xs text-[#666] transition-colors hover:text-[#C41E3A]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Design Tool
          </button>
          <h1 className="text-xl font-bold text-white">Saved Calculations</h1>
          <p className="text-sm text-[#666]">
            {calculations?.length ?? 0} saved calculation
            {calculations?.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewCalculation}
          className="flex items-center gap-2 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A81830]"
        >
          <Plus className="h-4 w-4" />
          New Calculation
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C41E3A]" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && calculations?.length === 0 && (
        <div className="rounded-lg border border-[#222] bg-[#1A1A1A] p-8 text-center">
          <p className="mb-4 text-sm text-[#888]">
            No saved calculations yet. Run a design calculation and click Save.
          </p>
          <button
            type="button"
            onClick={handleNewCalculation}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A81830]"
          >
            <Plus className="h-4 w-4" />
            Start Designing
          </button>
        </div>
      )}

      {/* Calculations list */}
      {!isLoading && calculations && calculations.length > 0 && (
        <div className="space-y-2">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="flex items-center gap-4 rounded-lg border border-[#222] bg-[#1A1A1A] p-4"
            >
              {/* Pass/Fail badge */}
              <div className="shrink-0">
                {calc.overallPass ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-white">
                    {calc.calcReference}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      calc.overallPass
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {calc.overallPass ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-[#666]">
                  {calc.projectName && (
                    <span className="truncate">{calc.projectName}</span>
                  )}
                  {calc.engineerName && (
                    <span className="truncate">{calc.engineerName}</span>
                  )}
                  <span>
                    {new Date(calc.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoad(calc.id)}
                  disabled={loadingId === calc.id}
                  className="flex items-center gap-1.5 rounded border border-[#333] px-3 py-1.5 text-xs text-[#CCC] transition-colors hover:border-[#555] hover:text-white disabled:opacity-50"
                >
                  {loadingId === calc.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  Load
                </button>

                {deleteConfirmId === calc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(calc.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded bg-red-700 px-2 py-1.5 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded border border-[#333] px-2 py-1.5 text-xs text-[#888] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(calc.id)}
                    className="rounded border border-[#333] p-1.5 text-[#666] transition-colors hover:border-red-700 hover:text-red-500"
                    aria-label="Delete calculation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
