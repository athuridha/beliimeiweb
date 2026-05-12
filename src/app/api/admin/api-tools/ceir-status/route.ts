import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { apiCheckCeirStatus } from "@/lib/cekceir";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const orderId = request.nextUrl.searchParams.get("order_id") || "";
  return Response.json(await apiCheckCeirStatus(orderId));
}
