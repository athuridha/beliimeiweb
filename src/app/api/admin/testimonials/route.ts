import { NextRequest } from "next/server";
import crypto from "crypto";
import { adminAuth } from "@/lib/auth";
import { getTestimonials, getReviewTokens, saveReviewTokens } from "@/lib/redis";
import { loadOrders } from "@/lib/orders";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, testimonials: await getTestimonials() });
}

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const orderId = (body.order_id || "").trim();
  let customerName = (body.customer_name || "").trim();

  if (!customerName) {
    const orders = await loadOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) customerName = order.name;
  }

  const token = crypto.randomBytes(16).toString("base64url");
  const tokens = await getReviewTokens();
  tokens[token] = { order_id: orderId, customer_name: customerName, created_at: new Date().toISOString(), used: false };
  await saveReviewTokens(tokens);

  return Response.json({ success: true, token, link: `/review/${token}` });
}
