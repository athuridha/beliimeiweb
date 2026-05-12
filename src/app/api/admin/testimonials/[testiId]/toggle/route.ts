import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getTestimonials, saveTestimonials } from "@/lib/redis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testiId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { testiId } = await params;
  const items = await getTestimonials();
  for (const t of items as Array<Record<string, unknown>>) {
    if (t.id === testiId) {
      t.visible = t.visible === false ? true : false;
      break;
    }
  }
  await saveTestimonials(items);
  return Response.json({ success: true, message: "Status testimoni diperbarui." });
}
