import { NextRequest } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import { verifyPassword, hashPassword, createAdminToken, initAdmin } from "@/lib/auth";

const loginAttempts: Record<string, number[]> = {};

export async function POST(request: NextRequest) {
  await initAdmin();
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now() / 1000;
  loginAttempts[ip] = (loginAttempts[ip] || []).filter((t) => now - t < 300);
  if (loginAttempts[ip].length >= 5)
    return Response.json({ success: false, message: "Terlalu banyak percobaan login. Coba lagi dalam 5 menit." }, { status: 429 });

  const body = await request.json();
  const username = (body.username || "").trim();
  const password = body.password || "";

  const rdb = await getRedis();
  const stored = await rdb.hGet(KEYS.ADMIN_CREDENTIALS, username);
  if (stored && verifyPassword(password, stored)) {
    if (!stored.includes(":")) {
      await rdb.hSet(KEYS.ADMIN_CREDENTIALS, username, hashPassword(password));
    }
    const token = await createAdminToken(username);
    return Response.json({ success: true, token });
  }
  loginAttempts[ip].push(now);
  return Response.json({ success: false, message: "Username atau password salah." }, { status: 401 });
}
