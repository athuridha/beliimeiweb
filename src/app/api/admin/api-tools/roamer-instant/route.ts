import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { apiRoamerInstant } from "@/lib/cekceir";

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const imei = (body.imei || "").trim();
  if (!imei || imei.length < 14)
    return Response.json({ status: false, message: "IMEI tidak valid." }, { status: 400 });
  return Response.json(await apiRoamerInstant(imei));
}
