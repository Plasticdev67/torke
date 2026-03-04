import type { Metadata } from "next";
import { AddressBook } from "@/components/shop/AddressBook";

export const metadata: Metadata = {
  title: "Delivery Addresses",
};

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">
          Delivery Addresses
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your saved delivery addresses and site contacts.
        </p>
      </div>
      <AddressBook />
    </div>
  );
}
