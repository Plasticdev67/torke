"use client";

import { MapPin } from "lucide-react";
import { AddressBook } from "./AddressBook";

interface CheckoutStep1AddressProps {
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
}

export function CheckoutStep1Address({
  selectedAddressId,
  onSelectAddress,
}: CheckoutStep1AddressProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-[#C41E3A]" />
        <h2 className="text-lg font-semibold text-zinc-100">
          Select Delivery Address
        </h2>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Choose a saved delivery address or add a new one for this order.
      </p>

      <AddressBook
        onSelect={(address) => onSelectAddress(address.id)}
        selectedId={selectedAddressId ?? undefined}
      />

      {!selectedAddressId && (
        <p className="mt-4 text-sm text-amber-400">
          Please select a delivery address to continue.
        </p>
      )}
    </div>
  );
}
