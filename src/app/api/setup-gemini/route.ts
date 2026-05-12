import { getRedis, KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

// One-time script to save Gemini API key to Redis
// Access via: GET /api/setup-gemini?key=YOUR_KEY
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return Response.json({ success: false, message: "Provide ?key=YOUR_GEMINI_API_KEY" }, { status: 400 });
  }

  const rdb = await getRedis();
  await rdb.hSet(KEYS.SECRETS, "GEMINI_API_KEY", key);

  return Response.json({ success: true, message: "Gemini API key saved to Redis." });
}
