import { db } from "@/server/db";
import { products } from "@/server/db/schema/products";
import { eq } from "drizzle-orm";
import { GoodsInForm } from "@/components/wms/GoodsInForm";

export const dynamic = "force-dynamic";

export default async function GoodsInPage() {
  // Fetch all active products for the selector
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.sku);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Goods In</h1>
        <p className="text-muted-foreground">
          Record incoming stock, upload certificates, and generate batch labels.
        </p>
      </div>

      <GoodsInForm products={allProducts} />
    </div>
  );
}
