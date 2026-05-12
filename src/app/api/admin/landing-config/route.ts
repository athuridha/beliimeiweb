import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getLandingConfig, saveLandingConfig } from "@/lib/redis";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, config: await getLandingConfig() });
}

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const config = await getLandingConfig();
  Object.assign(config, body);
  await saveLandingConfig(config);
  return Response.json({ success: true, message: "Konfigurasi landing page berhasil diupdate.", config });
}
