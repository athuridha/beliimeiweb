import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getPaymentMethods, savePaymentMethods } from "@/lib/redis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { methodId } = await params;
  const body = await request.json();
  const methods = await getPaymentMethods();
  for (const m of methods as Array<Record<string, unknown>>) {
    if (m.id === methodId) {
      if (body.label !== undefined) m.label = body.label;
      if (body.enabled !== undefined) m.enabled = body.enabled;
      if (body.bank_name !== undefined) m.bank_name = body.bank_name;
      if (body.account_number !== undefined) m.account_number = body.account_number;
      if (body.account_name !== undefined) m.account_name = body.account_name;
      if (body.qris_string !== undefined) m.qris_string = body.qris_string;
      break;
    }
  }
  await savePaymentMethods(methods);
  return Response.json({ success: true, message: "Metode pembayaran diperbarui." });
}
