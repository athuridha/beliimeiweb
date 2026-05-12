import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { verifyApiKey } from "@/lib/cekceir";

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const result = await verifyApiKey();
  return Response.json(result);
}
