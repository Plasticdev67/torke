import { MeiliSearch } from "meilisearch";

export const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_ADMIN_KEY || "",
});

export const SEARCH_API_KEY = process.env.MEILISEARCH_SEARCH_KEY || "";
