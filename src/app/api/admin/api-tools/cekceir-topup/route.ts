import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/auth";
import { requestCekceirTopup } from "@/lib/topup-automation";

export async function POST(request: NextRequest) {
  if (!(await adminAuth(request.headers.get("authorization"))))
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    const amount = parseInt(body.amount, 10);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return Response.json({ success: false, message: "Invalid amount" }, { status: 400 });
    }

    const result = await requestCekceirTopup(amount);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message || "Unknown error" }, { status: 500 });
  }
}
