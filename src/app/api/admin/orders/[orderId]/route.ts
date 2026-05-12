import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { loadOrders, saveOrders } from "@/lib/orders";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { orderId } = await params;
  const orders = await loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });
  orders.splice(idx, 1);
  await saveOrders(orders);
  return Response.json({ success: true, message: "Pesanan dihapus." });
}
