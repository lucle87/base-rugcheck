// Endpoint rug check tren Base, gate bang x402 V2 qua withX402 (pattern chinh thuc
// cho API route: chi settle khi response thanh cong < 400).
//
// Preview bypass: POST /api/rugcheck?preview=KEY thi BO QUA thanh toan de test local.
// XOA PREVIEW_KEY tren production.

import { NextRequest } from "next/server";
import { withX402 } from "@x402/next";
import { server } from "@/lib/x402server";
import { PAY_TO, PRICE, X402_NETWORK } from "@/lib/x402config";
import { rugCheck } from "@/lib/rugcheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handler that su (da tra tien hoac preview).
async function handler(request: NextRequest) {
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

// Handler co gate thanh toan x402.
const paidHandler = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: PRICE,
        network: X402_NETWORK,
        payTo: PAY_TO,
      },
    ],
    description:
      "On-chain token safety check (GO/CAUTION/DANGER) for EVM tokens on eth, bnb, or base.",
    mimeType: "application/json",
  },
  server
);

export async function POST(request: NextRequest, ctx: any) {
  // Preview bypass cho test local.
  const preview = request.nextUrl.searchParams.get("preview");
  if (preview && process.env.PREVIEW_KEY && preview === process.env.PREVIEW_KEY) {
    return handler(request);
  }
  return (paidHandler as any)(request, ctx);
}
