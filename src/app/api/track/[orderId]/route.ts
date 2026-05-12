import { NextRequest } from "next/server";
import { loadOrders } from "@/lib/orders";
import { getServiceNames } from "@/lib/redis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });

  const serviceNames = await getServiceNames();
  const serviceLabel = serviceNames[order.service] || order.service;

  const steps: Array<{ label: string; time: string | null; done: boolean }> = [];
  steps.push({ label: "Pesanan Dibuat", time: order.createdAt, done: true });

  if (["processing", "waiting", "completed", "failed"].includes(order.status)) {
    steps.push({ label: "Sedang Diproses", time: order.processedAt || order.createdAt, done: true });
  }
  if (["waiting", "completed", "failed"].includes(order.status)) {
    steps.push({ label: "Menunggu Hasil API", time: order.processedAt, done: true });
  }
  if (order.status === "completed") {
    steps.push({ label: "Selesai", time: order.processedAt, done: true });
  }
  if (order.status === "failed") {
    steps.push({ label: "Gagal", time: order.processedAt, done: true });
  }
  if (order.status === "pending") {
    steps.push({ label: "Menunggu Pembayaran", time: null, done: false });
  }

  return Response.json({
    success: true,
    order: {
      id: order.id, service: serviceLabel, status: order.status,
      imei: order.imei, createdAt: order.createdAt, result: order.result,
    },
    steps,
  });
}
