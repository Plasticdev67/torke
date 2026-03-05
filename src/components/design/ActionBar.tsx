"use client";

import { useState } from "react";
import { FileDown, Save, Lock, Loader2, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useDesignStore } from "@/stores/design";
import { AuthGateModal } from "./AuthGateModal";

export function ActionBar() {
  const results = useDesignStore((s) => s.results);
  const inputs = useDesignStore((s) => s.inputs);
  const disabled = !results;
  const router = useRouter();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "export" | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const exportPdfMutation = trpc.calculations.exportPdf.useMutation();
  const saveMutation = trpc.calculations.save.useMutation();

  const doExportPdf = async () => {
    setExporting(true);
    try {
      const result = await exportPdfMutation.mutateAsync({
        ...inputs,
        projectName: inputs.projectName || undefined,
        engineerName: inputs.engineerName || undefined,
      });
      // Open download URL in new tab
      window.open(result.downloadUrl, "_blank");
      toast.success(`PDF exported (${result.calcReference})`);
      // Update store with the calc reference
      useDesignStore.setState({ calcReference: result.calcReference });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export PDF"
      );
    } finally {
      setExporting(false);
    }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const result = await saveMutation.mutateAsync({
        ...inputs,
        projectName: inputs.projectName || undefined,
        engineerName: inputs.engineerName || undefined,
      });
      toast.success(`Calculation saved (${result.calcReference})`);
      // Update store with the calc reference
      useDesignStore.setState({ calcReference: result.calcReference });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save calculation"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    if (!isAuthenticated) {
      setPendingAction("export");
      setAuthModalOpen(true);
      return;
    }
    doExportPdf();
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      setPendingAction("save");
      setAuthModalOpen(true);
      return;
    }
    doSave();
  };

  const handleAuthenticated = () => {
    // After successful auth, trigger the pending action
    if (pendingAction === "export") {
      doExportPdf();
    } else if (pendingAction === "save") {
      doSave();
    }
    setPendingAction(null);
  };

  return (
    <>
      <div className="sticky bottom-0 shrink-0 border-t border-[#222] bg-[#0F0F0F]/95 px-3 py-3 backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled || exporting}
            onClick={handleExportPdf}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A81830] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export PDF
            {!isAuthenticated && !disabled && (
              <Lock className="h-3 w-3 opacity-60" />
            )}
          </button>

          <button
            type="button"
            disabled={disabled || saving}
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#333] px-4 py-2 text-sm font-medium text-[#CCC] transition-colors hover:border-[#555] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Calculation
            {!isAuthenticated && !disabled && (
              <Lock className="h-3 w-3 opacity-60" />
            )}
          </button>
        </div>

        {/* View Saved link (only when authenticated) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => router.push("/design/saved")}
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-[#888] transition-colors hover:text-[#C41E3A]"
          >
            <FolderOpen className="h-3 w-3" />
            View Saved Calculations
          </button>
        )}

        {/* Scope disclaimer */}
        <p className="mt-2 text-center text-[10px] text-[#555]">
          Calculations exclude seismic and fire design
        </p>
      </div>

      <AuthGateModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthenticated={handleAuthenticated}
      />
    </>
  );
}
