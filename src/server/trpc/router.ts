import { router, publicProcedure } from "./trpc";
import { batchesRouter } from "./routers/batches";
import { stockRouter } from "./routers/stock";
import { productsRouter } from "./routers/products";
import { searchRouter } from "./routers/search";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
  batches: batchesRouter,
  stock: stockRouter,
  products: productsRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
