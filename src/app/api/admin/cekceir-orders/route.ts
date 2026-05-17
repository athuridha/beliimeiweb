import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { fetchUserOrders, fetchRoamerOrders, fetchOrderDetail } from "@/lib/cekceir-scraper";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type") || "user"; // "user" or "roamer"
  const search = request.nextUrl.searchParams.get("search") || "";
  const detailId = request.nextUrl.searchParams.get("detail") || "";

  // Detail endpoint
  if (detailId) {
    const result = await fetchOrderDetail(detailId, type as "user" | "roamer");
    return Response.json(result);
  }

  // List endpoint
  if (type === "roamer") {
    const result = await fetchRoamerOrders(search || undefined);
    return Response.json(result);
  } else {
    const result = await fetchUserOrders(search || undefined);
    return Response.json(result);
  }
}
