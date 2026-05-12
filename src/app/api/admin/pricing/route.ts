import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getPricing, setPricing, getApiPrices, VALID_SERVICES } from "@/lib/redis";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const pricing = await getPricing();
  const apiPrices = await getApiPrices();
  return Response.json({ success: true, pricing, api_prices: apiPrices });
}

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const pricing = await getPricing();
  for (const code of VALID_SERVICES) {
    if (body[code]) {
      if (body[code].sell_price !== undefined) {
        pricing[code] = pricing[code] || {};
        pricing[code].sell_price = parseInt(body[code].sell_price);
      }
      if (body[code].name) {
        pricing[code] = pricing[code] || {};
        pricing[code].name = body[code].name;
      }
    }
  }
  await setPricing(pricing);
  return Response.json({ success: true, message: "Harga berhasil diupdate.", pricing });
}
