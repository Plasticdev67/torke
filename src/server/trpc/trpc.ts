import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { userProfiles } from "@/server/db/schema/users";
import { eq } from "drizzle-orm";

export interface TRPCContext {
  db: typeof db;
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
}

export async function createTRPCContext(): Promise<TRPCContext> {
  let session: TRPCContext["session"] = null;

  try {
    const headersList = await headers();
    session = await auth.api.getSession({
      headers: headersList,
    });
  } catch {
    // No session available
  }

  return {
    db,
    session,
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const warehouseProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Check user role via userProfiles
  const profile = await ctx.db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, ctx.session.user.id),
  });

  if (!profile || (profile.role !== "warehouse_staff" && profile.role !== "admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Warehouse access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userProfile: profile,
    },
  });
});
