// Endpoint rug check. KHONG co code thanh toan: middleware x402 da gate truoc.
// Toi day la da tra tien (hoac dang o che do preview). Chi viec doc + chay loi.

import { NextRequest } from "next/server";
import { rugCheck } from "@/lib/rugcheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const token = (body?.token || body?.address || "").toString().trim();
  const chain = (body?.chain || "").toString().trim().toLowerCase();
  const mode = body?.mode ? body.mode.toString().trim().toLowerCase() : undefined;

  if (!token || !chain) {
    return Response.json(
      { error: "Missing 'token' and 'chain' (one of: eth, bnb, base)." },
      { status: 400 }
    );
  }

  try {
    const data = await rugCheck(token, chain, mode);
    return Response.json(data);
  } catch (e: any) {
    return Response.json(
      { error: "Rug check failed: " + (e?.message || "unknown") },
      { status: 502 }
    );
  }
}
