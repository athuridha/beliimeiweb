import { NextRequest } from "next/server";
import { loadOrders } from "@/lib/orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });
  return Response.json({
    success: true,
    order: { id: order.id, service: order.service, status: order.status, result: order.result, createdAt: order.createdAt },
  });
}
