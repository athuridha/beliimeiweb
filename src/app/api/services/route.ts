import { getPricing, VALID_SERVICES } from "@/lib/redis";

export async function GET() {
  const pricing = await getPricing();
  const services: Record<string, unknown> = {};
  for (const code of VALID_SERVICES) {
    const p = pricing[code] || {};
    services[code] = { code, name: p.name || code, sell_price: p.sell_price || 0 };
  }
  return Response.json({ success: true, services });
}
