import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  try {
    const resp = await fetch("https://api.ipify.org?format=json");
    return Response.json(await resp.json());
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
