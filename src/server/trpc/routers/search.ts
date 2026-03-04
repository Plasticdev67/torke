import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { meili } from "@/server/search";

const PRODUCTS_INDEX = "products";

export const searchRouter = router({
  products: publicProcedure
    .input(
      z.object({
        query: z.string(),
        filters: z
          .object({
            categorySlug: z.string().optional(),
            diameter: z.string().optional(),
            material: z.string().optional(),
            finish: z.string().optional(),
            loadClass: z.string().optional(),
          })
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const index = meili.index(PRODUCTS_INDEX);

        // Build Meilisearch filter array
        const filterParts: string[] = [];
        if (input.filters?.categorySlug) {
          filterParts.push(
            `categorySlug = "${input.filters.categorySlug}"`
          );
        }
        if (input.filters?.diameter) {
          filterParts.push(`diameter = "${input.filters.diameter}"`);
        }
        if (input.filters?.material) {
          filterParts.push(`material = "${input.filters.material}"`);
        }
        if (input.filters?.finish) {
          filterParts.push(`finish = "${input.filters.finish}"`);
        }
        if (input.filters?.loadClass) {
          filterParts.push(`loadClass = "${input.filters.loadClass}"`);
        }

        const result = await index.search(input.query, {
          limit: input.limit,
          offset: input.offset,
          filter: filterParts.length > 0 ? filterParts : undefined,
          facets: [
            "categorySlug",
            "diameter",
            "material",
            "finish",
            "loadClass",
          ],
          attributesToHighlight: ["name", "description"],
          attributesToRetrieve: [
            "id",
            "name",
            "slug",
            "sku",
            "categorySlug",
            "subcategorySlug",
            "description",
            "diameter",
            "material",
            "finish",
            "loadClass",
            "images",
          ],
        });

        return {
          hits: result.hits as Array<{
            id: string;
            name: string;
            slug: string;
            sku: string;
            categorySlug: string;
            subcategorySlug?: string;
            description?: string;
            diameter?: string;
            material?: string;
            finish?: string;
            loadClass?: string;
            images?: string[];
          }>,
          facetDistribution: result.facetDistribution || {},
          totalHits: result.estimatedTotalHits || 0,
          processingTimeMs: result.processingTimeMs,
        };
      } catch (error) {
        // Meilisearch may not be running — return empty results gracefully
        console.warn("Meilisearch query failed:", error);
        return {
          hits: [],
          facetDistribution: {},
          totalHits: 0,
          processingTimeMs: 0,
        };
      }
    }),
});
