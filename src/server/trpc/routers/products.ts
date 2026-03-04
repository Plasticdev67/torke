import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { products, categories } from "@/server/db/schema/products";
import { eq, and, sql, count, desc, asc } from "drizzle-orm";

const listInputSchema = z.object({
  categorySlug: z.string().optional(),
  diameter: z.string().optional(),
  material: z.string().optional(),
  finish: z.string().optional(),
  loadClass: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "sku"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().min(1).max(100).default(24),
  offset: z.number().min(0).default(0),
});

export const productsRouter = router({
  list: publicProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(products.isActive, true)];

      // Category filter — join through categories table
      if (input.categorySlug) {
        const cat = await ctx.db.query.categories.findFirst({
          where: eq(categories.slug, input.categorySlug),
        });
        if (cat) {
          // Also find child categories
          const children = await ctx.db.query.categories.findMany({
            where: eq(categories.parentId, cat.id),
          });
          const categoryIds = [cat.id, ...children.map((c) => c.id)];
          conditions.push(
            sql`${products.categoryId} IN (${sql.join(
              categoryIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
        }
      }

      if (input.diameter) {
        conditions.push(eq(products.diameter, input.diameter));
      }
      if (input.material) {
        conditions.push(eq(products.material, input.material));
      }
      if (input.finish) {
        conditions.push(eq(products.finish, input.finish));
      }
      if (input.loadClass) {
        conditions.push(eq(products.loadClass, input.loadClass));
      }
      if (input.search) {
        const searchTerm = input.search;
        conditions.push(
          sql`(${products.name} ILIKE ${"%" + searchTerm + "%"} OR ${products.sku} ILIKE ${"%" + searchTerm + "%"})`
        );
      }

      const where = and(...conditions);

      const orderByCol =
        input.sortBy === "name"
          ? input.sortDir === "asc"
            ? asc(products.name)
            : desc(products.name)
          : input.sortBy === "sku"
          ? input.sortDir === "asc"
            ? asc(products.sku)
            : desc(products.sku)
          : input.sortDir === "asc"
          ? asc(products.createdAt)
          : desc(products.createdAt);

      const [items, totalResult] = await Promise.all([
        ctx.db.query.products.findMany({
          where,
          with: { category: true },
          limit: input.limit,
          offset: input.offset,
          orderBy: orderByCol,
        }),
        ctx.db
          .select({ count: count() })
          .from(products)
          .where(where),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: and(
          eq(products.slug, input.slug),
          eq(products.isActive, true)
        ),
        with: { category: true },
      });

      if (!product) {
        return null;
      }

      // Fetch parent category if this product's category has a parent
      let parentCategory = null;
      if (product.category?.parentId) {
        parentCategory = await ctx.db.query.categories.findFirst({
          where: eq(categories.id, product.category.parentId),
        });
      }

      // Fetch related products from same category
      const related = await ctx.db.query.products.findMany({
        where: and(
          eq(products.categoryId, product.categoryId),
          eq(products.isActive, true),
          sql`${products.id} != ${product.id}`
        ),
        limit: 4,
        with: { category: true },
      });

      return {
        ...product,
        parentCategory,
        related,
      };
    }),

  listByCategory: publicProcedure
    .input(
      z.object({
        categorySlug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const cat = await ctx.db.query.categories.findFirst({
        where: eq(categories.slug, input.categorySlug),
      });

      if (!cat) {
        return { items: [], facets: {} as Record<string, Record<string, number>> };
      }

      // Include child categories
      const children = await ctx.db.query.categories.findMany({
        where: eq(categories.parentId, cat.id),
      });
      const categoryIds = [cat.id, ...children.map((c) => c.id)];

      const items = await ctx.db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          sql`${products.categoryId} IN (${sql.join(
            categoryIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        ),
        with: { category: true },
      });

      // Build facet counts from DB as fallback
      const facets: Record<string, Record<string, number>> = {};
      const facetKeys = ["diameter", "material", "finish", "loadClass"] as const;

      for (const key of facetKeys) {
        facets[key] = {};
      }

      for (const item of items) {
        for (const key of facetKeys) {
          const value = item[key];
          if (value) {
            const bucket = facets[key]!;
            bucket[value] = (bucket[value] ?? 0) + 1;
          }
        }
      }

      return { items, facets };
    }),

  categories: publicProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db.query.categories.findMany({
      orderBy: asc(categories.sortOrder),
    });

    // Count products per category
    const productCounts = await ctx.db
      .select({
        categoryId: products.categoryId,
        count: count(),
      })
      .from(products)
      .where(eq(products.isActive, true))
      .groupBy(products.categoryId);

    const countMap = new Map(
      productCounts.map((pc) => [pc.categoryId, pc.count])
    );

    return allCategories.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.id) ?? 0,
    }));
  }),
});
