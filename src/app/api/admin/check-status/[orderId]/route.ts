import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { loadOrders, saveOrders } from "@/lib/orders";
import { checkApiStatus } from "@/lib/cekceir";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order || !order.apiOrderId)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });

  let data;
  try {
    data = await checkApiStatus(order.apiOrderId);
  } catch {
    return Response.json({ success: false, message: "Gagal menghubungi server." }, { status: 502 });
  }

  if (!data.status)
    return Response.json({ success: true, status: "waiting", message: "Masih diproses..." });

  const apiStatus = (data.data as Record<string, unknown>)?.status as string || "";
  if (apiStatus === "Success") {
    order.status = "completed";
    order.result = (data.data as Record<string, unknown>)?.result || "Berhasil";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return Response.json({ success: true, status: "completed", result: order.result });
  }
  if (apiStatus === "Failed") {
    order.status = "failed";
    order.result = (data.data as Record<string, unknown>)?.result || "Gagal";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return Response.json({ success: true, status: "failed", result: order.result });
  }
  return Response.json({ success: true, status: "waiting", message: "Masih diproses..." });
}
