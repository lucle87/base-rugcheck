// Cau hinh thanh toan x402 tren Base cho Rug Check.
// Loi rug check (lib/rugcheck.ts, lib/chains.ts) giu nguyen, chi thay lop tra tien.
//
// X402_NETWORK:
//   "base-sepolia" = testnet, dung facilitator free https://x402.org/facilitator,
//                    KHONG can CDP key. Dung de test truoc.
//   "base"         = mainnet, dung facilitator cua Coinbase (@coinbase/x402),
//                    CAN CDP_API_KEY_ID + CDP_API_KEY_SECRET. Day moi ra tien that.

export type X402Network = "base" | "base-sepolia";

export const X402_NETWORK: X402Network =
  (process.env.X402_NETWORK as X402Network) || "base-sepolia";

export const IS_MAINNET = X402_NETWORK === "base";

// Vi nhan tien tren Base (dia chi EVM).
export const PAY_TO = (process.env.PAY_TO ||
  process.env.RECIPIENT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Gia dang chuoi USD kieu x402: "$0.02".
export const PRICE = process.env.X402_PRICE || "$0.02";

// Facilitator cho testnet (mainnet dung facilitator import tu @coinbase/x402).
export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

export const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "lucle87@example.com";

// CAIP-2 network id cho discovery (Base mainnet = eip155:8453, sepolia = eip155:84532).
export const CAIP2 = IS_MAINNET ? "eip155:8453" : "eip155:84532";
