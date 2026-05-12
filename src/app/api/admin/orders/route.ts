import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { loadOrders, saveOrders, getCounter, setCounter } from "@/lib/orders";
import { VALID_SERVICES, getPricing } from "@/lib/redis";
import { notifyCustomer } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const orders = await loadOrders();
  return Response.json({ success: true, orders: [...orders].reverse() });
}

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const service = body.service || "";
  const imei = (body.imei || "").trim();
  const name = (body.name || "Manual Order").trim();
  const whatsapp = (body.whatsapp || "").trim();

  if (!VALID_SERVICES.has(service))
    return Response.json({ success: false, message: "Layanan tidak valid." }, { status: 400 });
  if (!/^\d{14,16}$/.test(imei))
    return Response.json({ success: false, message: "IMEI harus 14-16 digit angka." }, { status: 400 });

  const cleanWa = whatsapp ? whatsapp.replace(/[^0-9+]/g, "") : "";

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
    name,
    whatsapp: cleanWa,
    service,
    imei,
    price: body.price !== undefined && body.price !== "" ? Number(body.price) : sellPrice,
    status: body.status || "pending",
    result: null,
    apiOrderId: null,
    createdAt: new Date().toISOString(),
    processedAt: null,
  };

  orders.push(order as any);
  await saveOrders(orders);

  if (cleanWa && order.status === "pending" && body.notify) {
    await notifyCustomer(order as any);
  }

  return Response.json({ success: true, order });
}
