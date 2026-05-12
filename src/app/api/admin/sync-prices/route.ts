import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { fetchApiServices } from "@/lib/cekceir";

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const result = await fetchApiServices();
  if (result.success)
    return Response.json({ success: true, message: "Harga API berhasil disync.", api_prices: result.services });
  return Response.json({ success: false, message: result.message || "Gagal sync harga." }, { status: 500 });
}
