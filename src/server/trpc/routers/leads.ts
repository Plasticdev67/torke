/**
 * Leads tRPC Router
 *
 * Admin-only views for design tool signups (lead generation funnel).
 * Queries users who have saved calculations, with stats and pagination.
 */
import { z } from "zod";
import { router, warehouseProcedure } from "../trpc";
import { sql } from "drizzle-orm";

// Better Auth stores core user data in its own table
// We join with calculations to find users who have saved calcs
const userTable = sql.raw('"user"');

export const leadsRouter = router({
  /**
   * List users who have saved calculations (design tool leads).
   * Paginated, with optional filters.
   */
  list: warehouseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        hasOrders: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get users with their calculation counts
      const rows = await ctx.db.execute(sql`
        SELECT
          u.id as "userId",
          u.name,
          u.email,
          u."createdAt" as "signupDate",
          up."company_name" as "companyName",
          COALESCE(calc_counts.calc_count, 0)::int as "calculationCount",
          CASE WHEN order_counts.order_count > 0 THEN true ELSE false END as "hasOrders",
          COALESCE(order_counts.order_count, 0)::int as "orderCount"
        FROM ${userTable} u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        INNER JOIN (
          SELECT user_id, COUNT(*)::int as calc_count
          FROM calculations
          GROUP BY user_id
        ) calc_counts ON calc_counts.user_id = u.id
        LEFT JOIN (
          SELECT "userId", COUNT(*)::int as order_count
          FROM orders
          WHERE status != 'cancelled' AND status != 'draft'
          GROUP BY "userId"
        ) order_counts ON order_counts."userId" = u.id
        WHERE 1=1
        ${input.dateFrom ? sql`AND u."createdAt" >= ${input.dateFrom}::timestamp` : sql``}
        ${input.dateTo ? sql`AND u."createdAt" <= ${input.dateTo}::timestamp` : sql``}
        ${input.hasOrders === true ? sql`AND order_counts.order_count > 0` : sql``}
        ${input.hasOrders === false ? sql`AND (order_counts.order_count IS NULL OR order_counts.order_count = 0)` : sql``}
        ORDER BY u."createdAt" DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `);

      // Total count for pagination
      const [totalResult] = await ctx.db.execute(sql`
        SELECT COUNT(DISTINCT c.user_id)::int as total
        FROM calculations c
        JOIN ${userTable} u ON u.id = c.user_id
        ${input.dateFrom ? sql`WHERE u."createdAt" >= ${input.dateFrom}::timestamp` : sql``}
      `);

      return {
        leads: (rows as unknown) as Array<{
          userId: string;
          name: string | null;
          email: string;
          signupDate: string;
          companyName: string | null;
          calculationCount: number;
          hasOrders: boolean;
          orderCount: number;
        }>,
        total: (totalResult as Record<string, unknown>)?.total as number ?? 0,
      };
    }),

  /**
   * Summary stats for the lead funnel.
   */
  stats: warehouseProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [result] = await ctx.db.execute(sql`
      SELECT
        COUNT(DISTINCT c.user_id)::int as "totalLeads",
        COUNT(DISTINCT CASE WHEN u."createdAt" >= ${weekAgo.toISOString()}::timestamp THEN c.user_id END)::int as "thisWeek",
        COUNT(DISTINCT CASE WHEN u."createdAt" >= ${monthAgo.toISOString()}::timestamp THEN c.user_id END)::int as "thisMonth",
        COUNT(DISTINCT CASE WHEN o."userId" IS NOT NULL THEN c.user_id END)::int as "converted"
      FROM calculations c
      JOIN ${userTable} u ON u.id = c.user_id
      LEFT JOIN orders o ON o."userId" = c.user_id AND o.status NOT IN ('cancelled', 'draft')
    `);

    const stats = result as Record<string, unknown>;
    return {
      totalLeads: (stats?.totalLeads as number) ?? 0,
      thisWeek: (stats?.thisWeek as number) ?? 0,
      thisMonth: (stats?.thisMonth as number) ?? 0,
      converted: (stats?.converted as number) ?? 0,
    };
  }),
});
