"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const addressFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  addressLine1: z.string().min(1, "Address line 1 is required").max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(1, "City is required").max(200),
  county: z.string().max(200).optional(),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .max(20)
    .refine((val) => UK_POSTCODE_REGEX.test(val.trim()), {
      message: "Please enter a valid UK postcode",
    }),
  siteContactName: z.string().max(300).optional(),
  siteContactPhone: z.string().max(50).optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  /** If provided, form is in edit mode. */
  defaultValues?: AddressFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddressForm({
  defaultValues,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const utils = trpc.useUtils();
  const isEdit = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          addressLine1: defaultValues.addressLine1,
          addressLine2: defaultValues.addressLine2 ?? "",
          city: defaultValues.city,
          county: defaultValues.county ?? "",
          postcode: defaultValues.postcode,
          siteContactName: defaultValues.siteContactName ?? "",
          siteContactPhone: defaultValues.siteContactPhone ?? "",
        }
      : undefined,
  });

  const createMutation = trpc.addresses.create.useMutation({
    onSuccess: () => {
      toast.success("Address saved");
      utils.addresses.list.invalidate();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.addresses.update.useMutation({
    onSuccess: () => {
      toast.success("Address updated");
      utils.addresses.list.invalidate();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: AddressFormValues) => {
    if (isEdit && defaultValues?.id) {
      updateMutation.mutate({ id: defaultValues.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Address Name</Label>
        <Input
          id="name"
          placeholder='e.g. "Site A - Manchester"'
          {...register("name")}
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          placeholder="Street address"
          {...register("addressLine1")}
          className="mt-1"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-red-500">
            {errors.addressLine1.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          placeholder="Apartment, suite, etc. (optional)"
          {...register("addressLine2")}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            {...register("city")}
            className="mt-1"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="county">County</Label>
          <Input
            id="county"
            placeholder="County (optional)"
            {...register("county")}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="postcode">Postcode</Label>
        <Input
          id="postcode"
          placeholder="e.g. M1 1AE"
          {...register("postcode")}
          className="mt-1"
        />
        {errors.postcode && (
          <p className="mt-1 text-sm text-red-500">
            {errors.postcode.message}
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <p className="mb-3 text-sm font-medium text-zinc-400">
          Site Contact (optional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="siteContactName">Contact Name</Label>
            <Input
              id="siteContactName"
              placeholder="Site contact name"
              {...register("siteContactName")}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="siteContactPhone">Contact Phone</Label>
            <Input
              id="siteContactPhone"
              placeholder="Phone number"
              {...register("siteContactPhone")}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || isSubmitting}
          className="bg-[#C41E3A] hover:bg-[#A01830]"
        >
          {isPending ? "Saving..." : isEdit ? "Update Address" : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
