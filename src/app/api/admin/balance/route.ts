import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { fetchApiBalance } from "@/lib/cekceir";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const result = await fetchApiBalance();
  return Response.json(result);
}
