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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  
  const { orderId } = await params;
  const body = await request.json();
  const newStatus = body.status;
  
  if (!newStatus || !["pending", "processing", "waiting", "completed", "failed"].includes(newStatus)) {
    return Response.json({ success: false, message: "Status tidak valid" }, { status: 400 });
  }

  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });

  const oldStatus = order.status;
  order.status = newStatus;
  
  if (["completed", "failed"].includes(newStatus)) {
    order.processedAt = new Date().toISOString();
  }

  await saveOrders(orders);

  // Jika status berubah, kirim WA otomatis ke customer
  if (oldStatus !== newStatus) {
    try {
      const { notifyCustomer } = await import("@/lib/whatsapp");
      await notifyCustomer(order);
    } catch {
      // silent
    }
  }

  return Response.json({ success: true, message: "Status pesanan diperbarui." });
}
