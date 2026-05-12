import { NextRequest } from "next/server";
import { loadOrders, saveOrders } from "@/lib/orders";
import { getServiceNames, ADMIN_WA } from "@/lib/redis";
import { sendWa } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const orders = await loadOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order)
    return Response.json({ success: false, message: "Pesanan tidak ditemukan." }, { status: 404 });

  let paymentMethod = "qris";
  let proofUrl: string | null = null;

  const ct = request.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const formData = await request.formData();
    paymentMethod = (formData.get("payment_method") as string) || "qris";
    const proof = formData.get("proof") as File | null;
    if (proof && proof.size > 0) {
      if (proof.size > 5 * 1024 * 1024)
        return Response.json({ success: false, message: "File terlalu besar (max 5MB)." }, { status: 400 });
      // Store as base64 in Redis (Vercel has no persistent filesystem)
      const bytes = await proof.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const ext = proof.name?.split(".").pop() || "jpg";
      proofUrl = `data:image/${ext};base64,${base64}`;
      order.payment_proof = proofUrl;
    }
  } else {
    try {
      const body = await request.json();
      paymentMethod = body.payment_method || "qris";
    } catch { /* default */ }
  }

  order.payment_method = paymentMethod;
  await saveOrders(orders);

  const serviceNames = await getServiceNames();
  const serviceLabel = serviceNames[order.service] || order.service;
  const methodLabel = paymentMethod === "bank" ? "Transfer Bank" : paymentMethod.toUpperCase();
  const proofInfo = proofUrl ? "\nBukti bayar: ada (cek admin panel)" : "\nBukti bayar: belum diupload";
  const orderNum = parseInt(order.id.split("-")[1]);

  const message =
    `*KONFIRMASI PEMBAYARAN*\n\n` +
    `Customer *${order.name}* mengklaim sudah bayar!\n\n` +
    `ID: ${order.id}\nWA: ${order.whatsapp}\nLayanan: ${serviceLabel}\n` +
    `IMEI: ${order.imei}\nMetode: ${methodLabel}${proofInfo}\n\n` +
    `Cek GoBiz/mutasi, lalu balas:\n*ok ${orderNum}* untuk proses`;

  await sendWa(ADMIN_WA, message);
  return Response.json({ success: true, message: "Konfirmasi pembayaran terkirim ke admin." });
}
