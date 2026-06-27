// Cau hinh x402 V2 server (dung chung cho route handler qua withX402).
// Tach rieng de route.ts import. KHONG dung proxy.ts (do la cho page route).

import { x402ResourceServer } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { facilitator as cdpFacilitator } from "@coinbase/x402";
import { IS_MAINNET, FACILITATOR_URL } from "@/lib/x402config";

// Mainnet: facilitator CDP cua Coinbase (can CDP_API_KEY_ID + CDP_API_KEY_SECRET).
// Testnet: facilitator free https://x402.org/facilitator (khong can key).
const facilitatorClient = IS_MAINNET
  ? new HTTPFacilitatorClient(cdpFacilitator as any)
  : new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);
