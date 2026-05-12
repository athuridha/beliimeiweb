import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { loadOrders } from "@/lib/orders";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const orders = await loadOrders();
  return Response.json({ success: true, orders: [...orders].reverse() });
}
