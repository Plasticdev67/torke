/**
 * Updates product image and datasheet paths in the database.
 * Changes: data\assets\images\... → products/images/...
 *          data\assets\datasheets\... → products/datasheets/...
 *
 * Usage: npx tsx scripts/fix-image-paths.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { products } from "../src/server/db/schema/products.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function fixPaths() {
  const allProducts = await db.select().from(products);
  let updated = 0;

  for (const product of allProducts) {
    const images = (product.images as string[]) || [];
    const datasheet = product.datasheetUrl;

    const newImages = images.map((img) =>
      img
        .replace(/\\/g, "/")
        .replace("data/assets/images/", "products/images/")
    );

    const newDatasheet = datasheet
      ? datasheet
          .replace(/\\/g, "/")
          .replace("data/assets/datasheets/", "products/datasheets/")
      : null;

    const imagesChanged = JSON.stringify(newImages) !== JSON.stringify(images);
    const datasheetChanged = newDatasheet !== datasheet;

    if (imagesChanged || datasheetChanged) {
      const { eq } = await import("drizzle-orm");
      await db
        .update(products)
        .set({
          images: newImages,
          datasheetUrl: newDatasheet,
        })
        .where(eq(products.id, product.id));
      updated++;
      console.log(`  Updated: ${product.name}`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${allProducts.length} products.`);
  await client.end();
}

fixPaths().catch((err) => {
  console.error("Error:", err);
  client.end();
  process.exit(1);
});
