import { NextRequest } from "next/server";
import { adminAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { getRedis, KEYS } from "@/lib/redis";

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const oldPassword = body.old_password || "";
  const newPassword = body.new_password || "";
  const username = body.username || "admin";

  if (newPassword.length < 6)
    return Response.json({ success: false, message: "Password baru minimal 6 karakter." }, { status: 400 });

  const rdb = await getRedis();
  const stored = await rdb.hGet(KEYS.ADMIN_CREDENTIALS, username);
  if (!stored || !verifyPassword(oldPassword, stored))
    return Response.json({ success: false, message: "Password lama salah." }, { status: 401 });

  await rdb.hSet(KEYS.ADMIN_CREDENTIALS, username, hashPassword(newPassword));
  return Response.json({ success: true, message: "Password berhasil diubah." });
}
