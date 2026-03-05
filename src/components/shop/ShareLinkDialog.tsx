"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Link2, QrCode, Trash2, Check, Loader2 } from "lucide-react";

interface ShareLinkDialogProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareLinkDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: ShareLinkDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const existingLinks = trpc.verification.getShareLinks.useQuery(
    { orderId },
    { enabled: open }
  );

  const createMutation = trpc.verification.createShareLink.useMutation({
    onSuccess: () => {
      setProjectName("");
      utils.verification.getShareLinks.invalidate({ orderId });
    },
  });

  const revokeMutation = trpc.verification.revokeShareLink.useMutation({
    onSuccess: () => {
      utils.verification.getShareLinks.invalidate({ orderId });
    },
  });

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      orderId,
      projectName: projectName.trim() || undefined,
    });
  }, [createMutation, orderId, projectName]);

  const handleCopy = useCallback(async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleRevoke = useCallback(
    (tokenId: string) => {
      if (confirm("Revoke this share link? Anyone using it will lose access.")) {
        revokeMutation.mutate({ tokenId });
      }
    },
    [revokeMutation]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Link2 className="h-5 w-5 text-[#C41E3A]" />
            Share Verification Link
          </DialogTitle>
          <p className="text-sm text-zinc-400">
            Generate a read-only link for {orderNumber} that lets end-clients
            view traceability data without logging in.
          </p>
        </DialogHeader>

        {/* Create new link */}
        <div className="space-y-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="projectName" className="text-sm text-zinc-300">
              Project Name <span className="text-zinc-500">(optional)</span>
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Riverside Tower Block A"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              Displayed on the verification page for co-branding.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full bg-[#C41E3A] text-white hover:bg-[#a01830]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Generate Link
              </>
            )}
          </Button>

          {/* Show newly created link with QR */}
          {createMutation.data && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={createMutation.data.url}
                  readOnly
                  className="bg-zinc-900 border-zinc-600 text-zinc-100 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleCopy(createMutation.data!.url, "new")
                  }
                  className="shrink-0 border-zinc-600 bg-zinc-800 hover:bg-zinc-700"
                >
                  {copiedId === "new" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-zinc-400" />
                  )}
                </Button>
              </div>

              {createMutation.data.qrDataUrl && (
                <div className="flex justify-center">
                  <div className="rounded-lg bg-white p-2">
                    <img
                      src={createMutation.data.qrDataUrl}
                      alt="QR code for share link"
                      className="h-32 w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing links */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-300">Existing Links</h3>

          {existingLinks.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          )}

          {existingLinks.data?.length === 0 && (
            <p className="text-sm text-zinc-500 py-2">
              No share links created yet.
            </p>
          )}

          {existingLinks.data?.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-mono text-zinc-300">
                  {link.url}
                </p>
                <p className="text-xs text-zinc-500">
                  {link.projectName && (
                    <span className="mr-2">{link.projectName}</span>
                  )}
                  Created{" "}
                  {new Date(link.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {link.lastAccessedAt && (
                    <>
                      {" "}
                      · Last viewed{" "}
                      {new Date(link.lastAccessedAt).toLocaleDateString(
                        "en-GB"
                      )}
                    </>
                  )}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(link.url, link.id)}
                className="shrink-0 hover:bg-zinc-700"
              >
                {copiedId === link.id ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRevoke(link.id)}
                disabled={revokeMutation.isPending}
                className="shrink-0 hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4 text-zinc-500 hover:text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
