"use client";

import { CreditAccountManager } from "@/components/wms/CreditAccountManager";

export default function CreditAccountsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Credit Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer credit account applications. Approve or reject with
          credit limits and terms.
        </p>
      </div>
      <CreditAccountManager />
    </div>
  );
}
