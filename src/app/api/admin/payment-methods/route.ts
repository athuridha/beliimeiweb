import { NextRequest } from "next/server";
import crypto from "crypto";
import { adminAuth } from "@/lib/auth";
import { getPaymentMethods, savePaymentMethods } from "@/lib/redis";

export async function GET(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, methods: await getPaymentMethods() });
}

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.methods) {
    await savePaymentMethods(body.methods);
    return Response.json({ success: true, message: "Metode pembayaran berhasil disimpan.", methods: body.methods });
  }

  const methodType = body.type || "bank";
  const label = (body.label || "").trim();
  if (!label)
    return Response.json({ success: false, message: "Label harus diisi." }, { status: 400 });

  const methodId = `${methodType}-${crypto.randomBytes(4).toString("hex")}`;
  const newMethod: Record<string, unknown> = { id: methodId, type: methodType, label, enabled: true };

  if (methodType === "bank") {
    newMethod.bank_name = body.bank_name || "";
    newMethod.account_number = body.account_number || "";
    newMethod.account_name = body.account_name || "";
  } else if (methodType === "qris") {
    newMethod.qris_string = body.qris_string || "";
  }

  const methods = await getPaymentMethods();
  (methods as Array<Record<string, unknown>>).push(newMethod);
  await savePaymentMethods(methods);
  return Response.json({ success: true, message: "Metode pembayaran ditambahkan.", method: newMethod });
}
