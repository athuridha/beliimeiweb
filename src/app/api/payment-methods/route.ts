import { getPaymentMethods } from "@/lib/redis";

export async function GET() {
  const methods = await getPaymentMethods();
  const enabled = (methods as Array<Record<string, unknown>>).filter((m) => m.enabled !== false);
  return Response.json({ success: true, methods: enabled });
}
