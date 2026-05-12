import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getPaymentMethods, savePaymentMethods } from "@/lib/redis";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { methodId } = await params;
  const methods = await getPaymentMethods();
  const filtered = (methods as Array<Record<string, unknown>>).filter((m) => m.id !== methodId);
  await savePaymentMethods(filtered);
  return Response.json({ success: true, message: "Metode pembayaran dihapus." });
}
