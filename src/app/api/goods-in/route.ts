import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { completeGoodsIn } from "@/server/services/batch-service";
import { z } from "zod";

const goodsInSchema = z.object({
  productId: z.string().uuid(),
  supplierName: z.string().min(1),
  supplierBatchNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  certKey: z.string().min(1),
  expiryDate: z.string().nullable().optional(),
  inspectionNotes: z.string().nullable().optional(),
  poReference: z.string().nullable().optional(),
  heatNumber: z.string().nullable().optional(),
  millName: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = goodsInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await completeGoodsIn({
      ...parsed.data,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Goods-in error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
