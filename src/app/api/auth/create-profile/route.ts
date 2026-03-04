import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { userProfiles } from "@/server/db/schema/users";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { companyName?: string };

    await db.insert(userProfiles).values({
      userId: session.user.id,
      companyName: body.companyName || null,
      role: "customer",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
