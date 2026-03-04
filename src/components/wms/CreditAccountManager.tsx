"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function formatPence(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; className: string }
> = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-amber-900/30 text-amber-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-green-900/30 text-green-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-900/30 text-red-400",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    className: "bg-zinc-700/30 text-zinc-400",
  },
};

export function CreditAccountManager() {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [creditLimitGBP, setCreditLimitGBP] = useState("");
  const [terms, setTerms] = useState<"net_30" | "net_60">("net_30");

  const utils = trpc.useUtils();

  const { data: accounts, isLoading } =
    trpc.orders.listCreditAccounts.useQuery();

  const approveMutation = trpc.orders.approveCreditAccount.useMutation({
    onSuccess: () => {
      toast.success("Credit account approved");
      utils.orders.listCreditAccounts.invalidate();
      setApproveDialogOpen(false);
      setSelectedAccountId(null);
      setCreditLimitGBP("");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const rejectMutation = trpc.orders.rejectCreditAccount.useMutation({
    onSuccess: () => {
      toast.success("Credit account rejected");
      utils.orders.listCreditAccounts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleApprove = () => {
    if (!selectedAccountId || !creditLimitGBP) return;
    const limitPence = Math.round(parseFloat(creditLimitGBP) * 100);
    if (isNaN(limitPence) || limitPence <= 0) {
      toast.error("Please enter a valid credit limit");
      return;
    }
    approveMutation.mutate({
      accountId: selectedAccountId,
      creditLimitPence: limitPence,
      terms,
    });
  };

  const handleReject = (accountId: string) => {
    if (confirm("Are you sure you want to reject this credit application?")) {
      rejectMutation.mutate({ accountId });
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse h-64 border-border bg-card" />
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Card className="border-border bg-card p-8 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No credit account applications yet.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Company Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Credit Used</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const statusInfo = STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              const { icon: StatusIcon, label: statusLabel, className: statusClass } = statusInfo!;
              const available =
                account.creditLimitPence - account.creditUsedPence;

              return (
                <TableRow key={account.id} className="border-border">
                  <TableCell className="font-medium">
                    {account.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusClass}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPence(account.creditLimitPence)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPence(account.creditUsedPence)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {account.status === "approved" ? (
                      <span
                        className={
                          available > 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        {formatPence(available)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {account.terms === "net_30"
                      ? "Net 30"
                      : account.terms === "net_60"
                        ? "Net 60"
                        : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    {account.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-600 text-white"
                          onClick={() => {
                            setSelectedAccountId(account.id);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(account.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Credit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="creditLimit">Credit Limit (GBP)</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={creditLimitGBP}
                onChange={(e) => setCreditLimitGBP(e.target.value)}
                placeholder="e.g. 5000.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="terms">Payment Terms</Label>
              <select
                id="terms"
                value={terms}
                onChange={(e) =>
                  setTerms(e.target.value as "net_30" | "net_60")
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="net_30">Net 30</option>
                <option value="net_60">Net 60</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-700 hover:bg-green-600 text-white"
                onClick={handleApprove}
                disabled={
                  !creditLimitGBP ||
                  approveMutation.isPending
                }
              >
                {approveMutation.isPending
                  ? "Approving..."
                  : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
