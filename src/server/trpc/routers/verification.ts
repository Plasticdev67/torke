import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { orderShareTokens } from "@/server/db/schema/share-tokens";
import { orders } from "@/server/db/schema/orders";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";

const SHARE_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://torke.co.uk";

export const verificationRouter = router({
  /**
   * Generate a shareable read-only verification link for an order.
   * Validates the user owns the order before creating the share token.
   */
  createShareLink: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        projectName: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns this order
      const [order] = await ctx.db
        .select({ id: orders.id, userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order || order.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Create share token
      const rows = await ctx.db
        .insert(orderShareTokens)
        .values({
          orderId: input.orderId,
          userId,
          projectName: input.projectName?.trim() || null,
        })
        .returning();

      const tokenRow = rows[0]!;

      // Generate QR code data URL for the share link
      const shareUrl = `${SHARE_BASE_URL}/v/${tokenRow.token}`;
      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await QRCode.toDataURL(shareUrl, {
          errorCorrectionLevel: "H",
          width: 200,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
      } catch {
        // Non-blocking -- QR generation is a convenience feature
      }

      return {
        id: tokenRow.id,
        token: tokenRow.token,
        url: shareUrl,
        qrDataUrl,
        projectName: tokenRow.projectName,
        createdAt: tokenRow.createdAt,
      };
    }),

  /**
   * Get all share links for an order owned by the current user.
   */
  getShareLinks: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [order] = await ctx.db
        .select({ id: orders.id, userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order || order.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const tokens = await ctx.db
        .select()
        .from(orderShareTokens)
        .where(eq(orderShareTokens.orderId, input.orderId));

      return tokens.map((t) => ({
        id: t.id,
        token: t.token,
        url: `${SHARE_BASE_URL}/v/${t.token}`,
        projectName: t.projectName,
        createdAt: t.createdAt,
        lastAccessedAt: t.lastAccessedAt,
      }));
    }),

  /**
   * Revoke (delete) a share token. User must own it.
   */
  revokeShareLink: protectedProcedure
    .input(z.object({ tokenId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership via userId on the token itself
      const [token] = await ctx.db
        .select({ id: orderShareTokens.id, userId: orderShareTokens.userId })
        .from(orderShareTokens)
        .where(eq(orderShareTokens.id, input.tokenId));

      if (!token || token.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share link not found",
        });
      }

      await ctx.db
        .delete(orderShareTokens)
        .where(eq(orderShareTokens.id, input.tokenId));

      return { success: true };
    }),
});
