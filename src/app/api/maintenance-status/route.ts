import { getLandingConfig } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getLandingConfig();
  return Response.json({
    maintenance: config.maintenance_mode === "true",
  });
}
