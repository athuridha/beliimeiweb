import { NextRequest } from "next/server";
import { loadOrders, saveOrders } from "@/lib/orders";
import { processOrderApi, checkApiStatus } from "@/lib/cekceir";
import { notifyCustomer } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Auto-process: called after payment confirmation, no admin auth needed
// but we use a shared secret or the paid route triggers this internally.
export async function POST(request: NextRequest) {
  // Accept orderId from body
  const body = await request.json().catch(() => ({}));
  const orderId = body.orderId as string;
  const secret = body.secret as string;

  // Simple internal secret to prevent abuse
  if (secret !== "beliimei-auto-process-internal") {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!orderId) {
    return Response.json({ success: false, message: "Missing orderId" }, { status: 400 });
  }

  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return Response.json({ success: false, message: "Order not found" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return Response.json({ success: false, message: "Order already processed" }, { status: 400 });
  }

  // Set to processing
  order.status = "processing";
  order.result = order.service === "status" ? "Memproses cek status..." : "Memproses roamer...";
  await saveOrders(orders);

  // Call CekCEIR API
  let data;
  try {
    data = await processOrderApi(order.service, order.imei);
  } catch (e) {
    order.status = "failed";
    order.result = "Gagal menghubungi server API";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    try { await notifyCustomer(order); } catch { /* silent */ }
    return Response.json({ success: false, message: `API error: ${e}` }, { status: 502 });
  }

  if (!data.status) {
    order.status = "failed";
    order.result = (data.message as string) || "Gagal dari API";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    try { await notifyCustomer(order); } catch { /* silent */ }
    return Response.json({ success: false, message: (data.message as string) || "API failed" });
  }

  order.apiOrderId = (data.data as Record<string, unknown>).order_id as string;

  // For roamer services, start polling immediately
  if (["roamer", "roamer_instant"].includes(order.service)) {
    order.status = "waiting";
    order.result = "Roamer sedang diproses...";
    await saveOrders(orders);

    // Notify customer that it's being processed
    try { await notifyCustomer(order); } catch { /* silent */ }

    // Poll for up to 90 seconds (9 attempts, 10s apart)
    for (let i = 0; i < 9; i++) {
      await new Promise((r) => setTimeout(r, 10000)); // wait 10s

      try {
        const statusData = await checkApiStatus(order.apiOrderId!);
        if (!statusData.status) continue;

        const apiStatus = (statusData.data as Record<string, unknown>)?.status as string || "";

        if (apiStatus === "Success") {
          order.status = "completed";
          order.result = (statusData.data as Record<string, unknown>)?.result || "Berhasil";
          order.processedAt = new Date().toISOString();
          await saveOrders(orders);
          try { await notifyCustomer(order); } catch { /* silent */ }
          return Response.json({ success: true, status: "completed" });
        }

        if (apiStatus === "Failed") {
          order.status = "failed";
          order.result = (statusData.data as Record<string, unknown>)?.result || "Gagal";
          order.processedAt = new Date().toISOString();
          await saveOrders(orders);
          try { await notifyCustomer(order); } catch { /* silent */ }
          return Response.json({ success: true, status: "failed" });
        }
      } catch {
        // continue polling
      }
    }

    // If still not done after polling, the cron job will pick it up
    return Response.json({ success: true, status: "waiting", message: "Still processing, cron will handle." });
  }

  // For non-roamer (status check), it completes immediately
  order.status = "completed";
  order.result = (data.data as Record<string, unknown>).result || {};
  order.processedAt = new Date().toISOString();
  await saveOrders(orders);
  try { await notifyCustomer(order); } catch { /* silent */ }

  return Response.json({ success: true, status: "completed", result: order.result });
}
