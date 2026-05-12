import { NextRequest } from "next/server";
import { qrisSetAmount } from "@/lib/qris";

export async function GET(request: NextRequest) {
  const amount = parseInt(request.nextUrl.searchParams.get("amount") || "0");
  if (!amount) return Response.json({ success: false, message: "Amount required" }, { status: 400 });
  const qris = qrisSetAmount(amount);
  if (!qris) return Response.json({ success: false, message: "QRIS not configured" }, { status: 500 });
  return Response.json({ success: true, qris });
}
