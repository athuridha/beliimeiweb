import { NextRequest } from "next/server";
import { ADMIN_WA, getServiceNames } from "@/lib/redis";
import { loadOrders, saveOrders } from "@/lib/orders";
import { sendWa, notifyCustomer } from "@/lib/whatsapp";
import { checkImeiStatus, processOrderApi, checkApiStatus, ALLOWED_STATUSES } from "@/lib/cekceir";
import type { Order } from "@/lib/orders";

async function processOrderInternal(order: Order, orders: Order[]): Promise<string> {
  if (["completed", "processing", "waiting"].includes(order.status))
    return `Pesanan ${order.id} sudah diproses sebelumnya.`;

  order.status = "processing";
  await saveOrders(orders);

  const imeiCheck = await checkImeiStatus(order.imei);
  if (!imeiCheck.status) {
    order.status = "failed";
    order.result = `Gagal cek status IMEI: ${imeiCheck.message}`;
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    await notifyCustomer(order);
    return `Gagal cek IMEI ${order.id}: ${imeiCheck.message}`;
  }

  if (!ALLOWED_STATUSES.has(imeiCheck.status)) {
    order.status = "failed";
    order.result = `IMEI sudah berstatus ${imeiCheck.status}. Tidak perlu roamer.`;
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    await notifyCustomer(order);
    return `IMEI ${order.id} berstatus ${imeiCheck.status} (bukan UNKNOWN). Order ditolak.`;
  }

  try {
    const data = await processOrderApi(order.service, order.imei);
    if (!data.status) {
      order.status = "failed";
      order.result = (data.message as string) || "Gagal dari API";
      order.processedAt = new Date().toISOString();
      await saveOrders(orders);
      return `Gagal memproses ${order.id}: ${order.result}`;
    }

    order.apiOrderId = (data.data as Record<string, unknown>).order_id as string;
    if (["roamer", "roamer_instant"].includes(order.service)) {
      order.status = "waiting";
      order.result = "Roamer sedang diproses...";
      await saveOrders(orders);
      return `Roamer ${order.id} sedang diproses.`;
    }

    order.status = "completed";
    order.result = (data.data as Record<string, unknown>).result || {};
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return `Pesanan ${order.id} berhasil diproses!`;
  } catch (e) {
    order.status = "failed";
    order.result = "Gagal menghubungi server API";
    order.processedAt = new Date().toISOString();
    await saveOrders(orders);
    return `Gagal memproses ${order.id}: ${e}`;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sender = body.sender || "";
  const message = (body.message || "").trim().toLowerCase();

  const adminClean = ADMIN_WA.replace(/^0/, "");
  const senderClean = sender.replace(/^\+?62/, "").replace(/^0/, "");
  if (senderClean !== adminClean) return Response.json({ status: "ignored", reason: "not admin" });

  const orders = await loadOrders();

  // ok/proses command
  const okMatch = message.match(/^(ok|proses|done|confirm)\s+([a-z0-9\-]+)$/i);
  if (okMatch) {
    const inputId = okMatch[2].toUpperCase();
    const order = orders.find((o) => o.id === inputId || o.id === `BELIIMEI-${inputId}` || o.id === `ORD-${inputId.padStart(4, "0")}`);
    if (!order) {
      await sendWa(ADMIN_WA, `Pesanan ${inputId} tidak ditemukan.`);
      return Response.json({ status: "error", message: "order not found" });
    }
    const orderId = order.id;
    const resultMsg = await processOrderInternal(order, orders);
    await sendWa(ADMIN_WA, resultMsg);
    await notifyCustomer(order);
    return Response.json({ status: "processed", order_id: orderId });
  }

  // cek/status command
  const statusMatch = message.match(/^(cek|status|check)\s+([a-z0-9\-]+)$/i);
  if (statusMatch) {
    const inputId = statusMatch[2].toUpperCase();
    const order = orders.find((o) => o.id === inputId || o.id === `BELIIMEI-${inputId}` || o.id === `ORD-${inputId.padStart(4, "0")}`);
    if (!order) {
      await sendWa(ADMIN_WA, `Pesanan ${inputId} tidak ditemukan.`);
      return Response.json({ status: "error" });
    }
    const orderId = order.id;

    if (order.apiOrderId && order.status === "waiting") {
      try {
        const data = await checkApiStatus(order.apiOrderId);
        if (data.status) {
          const apiStatus = (data.data as Record<string, unknown>)?.status as string || "";
          if (apiStatus === "Success") {
            order.status = "completed";
            order.result = (data.data as Record<string, unknown>)?.result || "Berhasil";
            order.processedAt = new Date().toISOString();
            await saveOrders(orders);
            await sendWa(ADMIN_WA, `Pesanan ${orderId} selesai!`);
            await notifyCustomer(order);
            return Response.json({ status: "completed" });
          }
          if (apiStatus === "Failed") {
            order.status = "failed";
            order.result = (data.data as Record<string, unknown>)?.result || "Gagal";
            order.processedAt = new Date().toISOString();
            await saveOrders(orders);
            await sendWa(ADMIN_WA, `Pesanan ${orderId} gagal: ${order.result}`);
            await notifyCustomer(order);
            return Response.json({ status: "failed" });
          }
        }
      } catch { /* continue */ }
    }

    const serviceNames = await getServiceNames();
    const serviceLabel = serviceNames[order.service] || order.service;
    await sendWa(ADMIN_WA, `*Status Pesanan ${orderId}*\n\nNama: ${order.name}\nLayanan: ${serviceLabel}\nStatus: ${order.status}`);
    return Response.json({ status: "info sent" });
  }

  if (["help", "bantuan", "?"].includes(message)) {
    await sendWa(ADMIN_WA, `*Perintah Admin via WA:*\n\nok [nomor] - Proses pesanan\n  Contoh: ok 1\n\ncek [nomor] - Cek status pesanan\n  Contoh: cek 1\n\nlist - Lihat pesanan pending`);
    return Response.json({ status: "help sent" });
  }

  if (["list", "daftar", "pending"].includes(message)) {
    const pending = orders.filter((o) => o.status === "pending");
    if (!pending.length) {
      await sendWa(ADMIN_WA, "Tidak ada pesanan pending.");
    } else {
      const serviceNames = await getServiceNames();
      const lines = ["*Pesanan Pending:*\n"];
      for (const o of pending) lines.push(`${o.id} - ${o.name} - ${serviceNames[o.service] || o.service}`);
      lines.push("\nBalas: ok [nomor] untuk proses");
      await sendWa(ADMIN_WA, lines.join("\n"));
    }
    return Response.json({ status: "list sent" });
  }

  return Response.json({ status: "unknown command" });
}
