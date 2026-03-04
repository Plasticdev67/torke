import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
  // Sub-routers will be added as features are built:
  // products: productsRouter,
  // batches: batchesRouter,
  // stock: stockRouter,
  // search: searchRouter,
});

export type AppRouter = typeof appRouter;
