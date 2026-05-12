import { NextRequest } from "next/server";
import { VALID_SERVICES, getPricing, getServiceNames, ADMIN_WA } from "@/lib/redis";
import { loadOrders, saveOrders, getCounter, setCounter } from "@/lib/orders";
import { sendAdminNotification, notifyCustomer } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const service = body.service || "";
  const imei = (body.imei || "").trim();
  const name = (body.name || "").trim();
  const whatsapp = (body.whatsapp || "").trim();

  if (!VALID_SERVICES.has(service))
    return Response.json({ success: false, message: "Layanan tidak ditemukan." }, { status: 400 });
  if (!/^\d{14,16}$/.test(imei))
    return Response.json({ success: false, message: "IMEI harus 14-16 digit angka." }, { status: 400 });
  if (name.length < 2)
    return Response.json({ success: false, message: "Nama harus diisi." }, { status: 400 });
  const cleanWa = whatsapp.replace(/[^0-9+]/g, "");
  if (cleanWa.length < 10)
    return Response.json({ success: false, message: "Nomor WhatsApp tidak valid." }, { status: 400 });

  const pricing = await getPricing();
  const sellPrice = pricing[service]?.sell_price || 0;

  const orders = await loadOrders();
  let counter = await getCounter();
  if (!counter) counter = orders.length;
  counter++;
  await setCounter(counter);

  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 random digits
  const orderId = `BELIIMEI-${randomNum}`;

  const order = {
    id: orderId,
    name, whatsapp: cleanWa, service, imei,
    price: sellPrice, status: "pending", result: null,
    apiOrderId: null, createdAt: new Date().toISOString(),
    processedAt: null,
  };
  orders.push(order);
  await saveOrders(orders);
  await sendAdminNotification(order);
  await notifyCustomer(order);

  return Response.json({
    success: true, order_id: order.id,
    message: "Pesanan berhasil dikirim! Admin akan menghubungi Anda via WhatsApp untuk konfirmasi pembayaran.",
  });
}
