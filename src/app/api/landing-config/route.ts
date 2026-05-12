import { getLandingConfig } from "@/lib/redis";

export async function GET() {
  const config = await getLandingConfig();
  return Response.json({ success: true, config });
}
