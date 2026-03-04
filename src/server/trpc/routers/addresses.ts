import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { deliveryAddresses } from "@/server/db/schema/addresses";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Loose UK postcode validation: 1-2 letters, 1-2 digits, optional space, digit, 2 letters
// Accepts common formats: EC1A 1BB, W1A 0AX, M1 1AE, B33 8TH, etc.
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const addressInputSchema = z.object({
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
  country: z.string().max(10).default("GB"),
  siteContactName: z.string().max(300).optional(),
  siteContactPhone: z.string().max(50).optional(),
});

export const addressesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const addresses = await ctx.db
      .select()
      .from(deliveryAddresses)
      .where(eq(deliveryAddresses.userId, userId))
      .orderBy(
        desc(deliveryAddresses.isDefault),
        desc(deliveryAddresses.createdAt)
      );

    return addresses;
  }),

  create: protectedProcedure
    .input(addressInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user has any addresses — first one becomes default
      const existing = await ctx.db
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(eq(deliveryAddresses.userId, userId))
        .limit(1);

      const isDefault = existing.length === 0;

      const [address] = await ctx.db
        .insert(deliveryAddresses)
        .values({
          userId,
          name: input.name,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          county: input.county ?? null,
          postcode: input.postcode.trim().toUpperCase(),
          country: input.country,
          siteContactName: input.siteContactName ?? null,
          siteContactPhone: input.siteContactPhone ?? null,
          isDefault,
        })
        .returning();

      return address!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        ...addressInputSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(
          and(
            eq(deliveryAddresses.id, input.id),
            eq(deliveryAddresses.userId, userId)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      const [updated] = await ctx.db
        .update(deliveryAddresses)
        .set({
          name: input.name,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          county: input.county ?? null,
          postcode: input.postcode.trim().toUpperCase(),
          country: input.country,
          siteContactName: input.siteContactName ?? null,
          siteContactPhone: input.siteContactPhone ?? null,
          updatedAt: new Date(),
        })
        .where(eq(deliveryAddresses.id, input.id))
        .returning();

      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(
          and(
            eq(deliveryAddresses.id, input.id),
            eq(deliveryAddresses.userId, userId)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      await ctx.db
        .delete(deliveryAddresses)
        .where(eq(deliveryAddresses.id, input.id));

      return { success: true };
    }),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(
          and(
            eq(deliveryAddresses.id, input.id),
            eq(deliveryAddresses.userId, userId)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      // Unset all defaults for this user
      await ctx.db
        .update(deliveryAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(deliveryAddresses.userId, userId));

      // Set new default
      const [updated] = await ctx.db
        .update(deliveryAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(deliveryAddresses.id, input.id))
        .returning();

      return updated!;
    }),
});
