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
  const newResult = body.result;
  const shouldNotify = body.notify !== false; // default true
  
  if (!newStatus || !["pending", "processing", "waiting", "completed", "failed"].includes(newStatus)) {
    return Response.json({ success: false, message: "Status tidak valid" }, { status: 400 });
  }

  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });

  const oldStatus = order.status;
  order.status = newStatus;

  // Save result/notes if provided
  if (newResult !== undefined) {
    order.result = newResult;
  }
  
  if (["completed", "failed"].includes(newStatus)) {
    order.processedAt = new Date().toISOString();
  }

  await saveOrders(orders);

  // Kirim WA ke customer jika status berubah dan notify aktif
  let notified = false;
  if (oldStatus !== newStatus && shouldNotify && order.whatsapp) {
    try {
      const { notifyCustomer } = await import("@/lib/whatsapp");
      await notifyCustomer(order);
      notified = true;
    } catch {
      // silent
    }
  }

  return Response.json({ 
    success: true, 
    message: `Status pesanan diperbarui dari "${oldStatus}" ke "${newStatus}".${notified ? " Notifikasi WA terkirim." : ""}`,
    order: { id: order.id, status: order.status, result: order.result }
  });
}
