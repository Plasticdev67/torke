import type { Metadata } from "next";
import { AddressBook } from "@/components/shop/AddressBook";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delivery Addresses",
};

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">
          Delivery Addresses
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your saved delivery addresses and site contacts.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="mb-8 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <TabLink href="/account">Dashboard</TabLink>
        <TabLink href="/account/orders">Orders</TabLink>
        <TabLink href="/account/addresses" active>Addresses</TabLink>
        <TabLink href="/account/certifications">Certifications</TabLink>
      </div>

      <AddressBook />
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
