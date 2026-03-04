"use client";

import { useState } from "react";
import { Star, Pencil, Trash2, Plus, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AddressForm } from "./AddressForm";

// We need to add the Dialog components — check if they exist
// Using the shadcn dialog that's already installed

interface Address {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  siteContactName: string | null;
  siteContactPhone: string | null;
  isDefault: boolean;
}

interface AddressBookProps {
  /** If provided, shows select mode with a callback when an address is selected. */
  onSelect?: (address: Address) => void;
  /** Currently selected address ID (for checkout mode). */
  selectedId?: string;
}

export function AddressBook({ onSelect, selectedId }: AddressBookProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const utils = trpc.useUtils();
  const { data: addresses, isLoading } = trpc.addresses.list.useQuery();

  const deleteMutation = trpc.addresses.delete.useMutation({
    onSuccess: () => {
      toast.success("Address deleted");
      utils.addresses.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const setDefaultMutation = trpc.addresses.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default address updated");
      utils.addresses.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card
            key={i}
            className="h-48 animate-pulse border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses?.map((address) => (
          <Card
            key={address.id}
            className={`relative border-zinc-800 bg-zinc-900 p-4 ${
              onSelect ? "cursor-pointer hover:border-zinc-600" : ""
            } ${selectedId === address.id ? "border-[#C41E3A] ring-1 ring-[#C41E3A]" : ""}`}
            onClick={onSelect ? () => onSelect(address) : undefined}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">{address.name}</h3>
                {address.isDefault && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-900/30 text-amber-400"
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Default
                  </Badge>
                )}
              </div>
              {!onSelect && (
                <div className="flex gap-1">
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-amber-400"
                      onClick={() => setDefaultMutation.mutate({ id: address.id })}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    onClick={() => handleEdit(address)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-red-400"
                    onClick={() => handleDelete(address.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-2 space-y-0.5 text-sm text-zinc-400">
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>
                {address.city}
                {address.county ? `, ${address.county}` : ""}
              </p>
              <p className="font-medium text-zinc-300">{address.postcode}</p>
            </div>

            {(address.siteContactName || address.siteContactPhone) && (
              <div className="mt-3 border-t border-zinc-800 pt-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Site Contact
                </p>
                {address.siteContactName && (
                  <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                    <User className="h-3 w-3" />
                    {address.siteContactName}
                  </p>
                )}
                {address.siteContactPhone && (
                  <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                    <Phone className="h-3 w-3" />
                    {address.siteContactPhone}
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}

        {/* Add New Address Card */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Card
              className="flex min-h-[160px] cursor-pointer items-center justify-center border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              onClick={() => {
                setEditingAddress(null);
                setDialogOpen(true);
              }}
            >
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add New Address</span>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <AddressForm
              defaultValues={
                editingAddress
                  ? {
                      id: editingAddress.id,
                      name: editingAddress.name,
                      addressLine1: editingAddress.addressLine1,
                      addressLine2: editingAddress.addressLine2 ?? undefined,
                      city: editingAddress.city,
                      county: editingAddress.county ?? undefined,
                      postcode: editingAddress.postcode,
                      siteContactName:
                        editingAddress.siteContactName ?? undefined,
                      siteContactPhone:
                        editingAddress.siteContactPhone ?? undefined,
                    }
                  : undefined
              }
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {addresses?.length === 0 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          No delivery addresses saved yet. Add your first address above.
        </p>
      )}
    </div>
  );
}
