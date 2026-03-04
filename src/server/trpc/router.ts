import { router, publicProcedure } from "./trpc";
import { batchesRouter } from "./routers/batches";
import { stockRouter } from "./routers/stock";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
  batches: batchesRouter,
  stock: stockRouter,
  // Sub-routers will be added as features are built:
  // products: productsRouter,
  // search: searchRouter,
});

export type AppRouter = typeof appRouter;
