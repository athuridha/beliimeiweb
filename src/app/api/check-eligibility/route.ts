import { NextRequest } from "next/server";
import { loadOrders } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get("imei") || "";

  if (!imei || imei.length < 14) {
    return Response.json({ success: true, eligible: false });
  }

  const orders = await loadOrders();
  const statusOrder = orders.find(
    (o) => o.imei === imei && o.service === "status" && o.status === "completed"
  );

  if (!statusOrder) {
    return Response.json({ success: true, eligible: false });
  }

  let isUnknown = false;
  if (typeof statusOrder.result === "string") {
    isUnknown = statusOrder.result.toUpperCase().includes("STATUS: UNKNOWN");
  } else if (typeof statusOrder.result === "object" && statusOrder.result !== null) {
    isUnknown = String((statusOrder.result as Record<string, unknown>).status).toUpperCase() === "UNKNOWN";
  }

  return Response.json({ success: true, eligible: isUnknown });
}
