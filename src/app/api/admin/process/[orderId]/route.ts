import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { loadOrders, saveOrders } from "@/lib/orders";
import { processOrderApi } from "@/lib/cekceir";
import { notifyCustomer } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });
  if (["completed", "processing", "waiting"].includes(order.status))
    return Response.json({ success: false, message: "Pesanan sudah diproses." }, { status: 400 });

  order.status = "processing";
  await saveOrders(orders);

  order.result = order.service === "status" ? "Memproses cek status..." : "Memproses roamer...";
  await saveOrders(orders);

  let data;
  try {
    data = await processOrderApi(order.service, order.imei);
  } catch (e) {
    order.status = "failed";
    order.result = "Gagal menghubungi server API";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return Response.json({ success: false, message: `Gagal menghubungi server: ${e}` }, { status: 502 });
  }

  if (!data.status) {
    order.status = "failed";
    order.result = (data.message as string) || "Gagal dari API";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return Response.json({ success: false, message: (data.message as string) || "Gagal dari API." }, { status: 400 });
  }

  order.apiOrderId = (data.data as Record<string, unknown>).order_id as string;

  if (["roamer", "roamer_instant"].includes(order.service)) {
    order.status = "waiting";
    order.result = "Roamer sedang diproses...";
    await saveOrders(orders);
    return Response.json({ success: true, message: 'Roamer diproses. Gunakan "Cek Status" untuk hasilnya.', needs_polling: true, apiOrderId: order.apiOrderId });
  }

  order.status = "completed";
  order.result = (data.data as Record<string, unknown>).result || {};
  order.processedAt = new Date().toISOString();
  await saveOrders(orders);
  return Response.json({ success: true, message: "Pesanan berhasil diproses.", result: order.result });
}
