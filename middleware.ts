// Cong thanh toan x402 cho /api/rugcheck.
// Dat o ROOT project (cung cap voi app/). Next.js 14 dung middleware.ts.
//
// Co preview bypass: POST /api/rugcheck?preview=KEY (PREVIEW_KEY trong env) thi
// BO QUA thanh toan de test local. XOA PREVIEW_KEY tren production.

import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware } from "x402-next";
import { facilitator as coinbaseFacilitator } from "@coinbase/x402";
import { PAY_TO, PRICE, X402_NETWORK, IS_MAINNET, FACILITATOR_URL } from "@/lib/x402config";

// Mainnet: facilitator cua Coinbase (can CDP key). Testnet: facilitator URL free.
const facilitatorConfig: any = IS_MAINNET
  ? coinbaseFacilitator
  : { url: FACILITATOR_URL };

const pay = paymentMiddleware(
  PAY_TO,
  {
    "/api/rugcheck": {
      price: PRICE,
      network: X402_NETWORK,
      config: {
        description:
          "On-chain token safety check (GO/CAUTION/DANGER) for EVM tokens on eth, bnb, or base.",
        mimeType: "application/json",
      },
    },
  },
  facilitatorConfig
);

export function middleware(req: NextRequest) {
  // Preview bypass cho test local.
  const preview = req.nextUrl.searchParams.get("preview");
  if (preview && process.env.PREVIEW_KEY && preview === process.env.PREVIEW_KEY) {
    return NextResponse.next();
  }
  return pay(req);
}

export const config = {
  matcher: ["/api/rugcheck", "/api/rugcheck/:path*"],
  runtime: "nodejs",
};
