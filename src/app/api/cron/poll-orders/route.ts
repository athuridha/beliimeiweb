import { loadOrders, saveOrders } from "@/lib/orders";
import { checkApiStatus } from "@/lib/cekceir";
import { notifyCustomer } from "@/lib/whatsapp";

// This endpoint polls all "waiting" orders and auto-updates their status.
// Can be called by Vercel Cron or by the admin dashboard periodically.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const orders = await loadOrders();
  const waitingOrders = orders.filter(
    (o) => o.status === "waiting" && o.apiOrderId
  );

  if (waitingOrders.length === 0) {
    return Response.json({ success: true, message: "No waiting orders.", updated: 0 });
  }

  let updatedCount = 0;

  for (const order of waitingOrders) {
    try {
      const data = await checkApiStatus(order.apiOrderId!);
      if (!data.status) continue;

      const apiStatus = (data.data as Record<string, unknown>)?.status as string || "";

      if (apiStatus === "Success") {
        order.status = "completed";
        order.result = (data.data as Record<string, unknown>)?.result || "Berhasil";
        order.processedAt = new Date().toISOString();
        updatedCount++;

        // Notify customer via WhatsApp
        try { await notifyCustomer(order); } catch { /* silent */ }
      } else if (apiStatus === "Failed") {
        order.status = "failed";
        order.result = (data.data as Record<string, unknown>)?.result || "Gagal";
        order.processedAt = new Date().toISOString();
        updatedCount++;

        // Notify customer via WhatsApp
        try { await notifyCustomer(order); } catch { /* silent */ }
      }
      // If still processing, skip — will check again next poll
    } catch {
      // Skip this order on error, will retry next poll
    }
  }

  if (updatedCount > 0) {
    await saveOrders(orders);
  }

  return Response.json({
    success: true,
    message: `Polled ${waitingOrders.length} orders, updated ${updatedCount}.`,
    updated: updatedCount,
  });
}
