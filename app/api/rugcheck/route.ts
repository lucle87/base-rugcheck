// Endpoint rug check tren Base, gate bang x402 V2 qua withX402 (pattern chinh thuc
// cho API route: chi settle khi response thanh cong < 400).
//
// Preview bypass: POST /api/rugcheck?preview=KEY thi BO QUA thanh toan de test local.
// XOA PREVIEW_KEY tren production.

import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { server } from "@/lib/x402server";
import { PAY_TO, PRICE, X402_NETWORK } from "@/lib/x402config";
import { rugCheck } from "@/lib/rugcheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handler that su (da tra tien hoac preview).
async function handler(request: NextRequest): Promise<any> {
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
    return NextResponse.json(
      { error: "Missing 'token' and 'chain' (one of: eth, bnb, base)." },
      { status: 400 }
    );
  }

  try {
    const data = await rugCheck(token, chain, mode);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Rug check failed: " + (e?.message || "unknown") },
      { status: 502 }
    );
  }
}

// Handler co gate thanh toan x402.
const paidHandler = withX402(
  handler as any,
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
      "Token safety check with honeypot simulation, buy/sell tax, holder concentration and deployer privileges (GO/CAUTION/DANGER) for EVM tokens on eth, bnb, or base.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        bodyType: "json",
        input: { token: "0x...", chain: "bnb", mode: "auto" },
        inputSchema: {
          properties: {
            token: { type: "string", description: "Token contract address (0x...)." },
            chain: { type: "string", enum: ["eth", "bnb", "base"], description: "EVM chain." },
            mode: { type: "string", enum: ["auto", "new", "mature"], description: "Scoring mode." },
          },
          required: ["token", "chain"],
        },
        output: {
          example: {
            chain: "bnb",
            token: "0x...",
            verdict: "CAUTION",
            reasons: ["..."],
          },
          schema: {
            properties: {
              chain: { type: "string" },
              token: { type: "string" },
              verdict: { type: "string", enum: ["GO", "CAUTION", "DANGER"] },
              reasons: { type: "array", items: { type: "string" } },
              checks: { type: "array", items: { type: "object" } },
            },
          },
        },
      }),
    },
  } as any,
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
