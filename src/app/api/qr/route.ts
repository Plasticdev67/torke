import { NextRequest, NextResponse } from "next/server";
import { generateQRDataUrl } from "@/server/services/qr-service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  try {
    const dataUrl = await generateQRDataUrl(token);
    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error("QR generation error:", err);
    return NextResponse.json(
      { error: "QR generation failed" },
      { status: 500 }
    );
  }
}
