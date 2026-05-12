import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { getTestimonials, saveTestimonials } from "@/lib/redis";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testiId: string }> }
) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const { testiId } = await params;
  const items = await getTestimonials();
  const filtered = (items as Array<Record<string, unknown>>).filter((t) => t.id !== testiId);
  await saveTestimonials(filtered);
  return Response.json({ success: true, message: "Testimoni dihapus." });
}
