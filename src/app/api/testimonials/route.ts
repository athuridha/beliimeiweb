import { getTestimonials } from "@/lib/redis";

export async function GET() {
  const items = await getTestimonials();
  const visible = (items as Array<Record<string, unknown>>).filter((t) => t.visible !== false);
  return Response.json({ success: true, testimonials: visible });
}
