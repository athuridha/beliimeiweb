import { NextRequest } from "next/server";
import crypto from "crypto";
import { getReviewTokens, saveReviewTokens, getTestimonials, saveTestimonials } from "@/lib/redis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokens = await getReviewTokens();
  const info = tokens[token] as Record<string, unknown> | undefined;
  if (!info) return Response.json({ success: false, message: "Link tidak valid." }, { status: 404 });
  if (info.used) return Response.json({ success: false, message: "Link sudah digunakan." }, { status: 400 });
  return Response.json({ success: true, customer_name: info.customer_name || "", order_id: info.order_id || "" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokens = await getReviewTokens();
  const info = tokens[token] as Record<string, unknown> | undefined;
  if (!info) return Response.json({ success: false, message: "Link tidak valid." }, { status: 404 });
  if (info.used) return Response.json({ success: false, message: "Link sudah digunakan." }, { status: 400 });

  const body = await request.json();
  const name = (body.name || "").trim();
  const rating = parseInt(body.rating) || 5;
  const comment = (body.comment || "").trim();

  if (!name || !comment)
    return Response.json({ success: false, message: "Nama dan komentar harus diisi." }, { status: 400 });

  const testimonial = {
    id: crypto.randomBytes(8).toString("hex"),
    name, rating: Math.min(5, Math.max(1, rating)), comment,
    order_id: info.order_id || "", visible: true,
    createdAt: new Date().toISOString(),
  };

  const items = await getTestimonials();
  (items as Array<Record<string, unknown>>).push(testimonial);
  await saveTestimonials(items);

  info.used = true;
  await saveReviewTokens(tokens);

  return Response.json({ success: true, message: "Terima kasih atas testimoni Anda!" });
}
