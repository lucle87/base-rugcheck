// Cau hinh thanh toan x402 V2 tren Base cho Rug Check.
// V2 dung CAIP-2 network id: Base mainnet = eip155:8453, Base Sepolia = eip155:84532.
// Loi rug check (lib/rugcheck.ts, lib/chains.ts) giu nguyen, chi thay lop tra tien.

export type X402Caip2 = "eip155:8453" | "eip155:84532";

// Nhan ca "base"/"base-sepolia" lan dang caip2 trong env cho tien.
const RAW = (process.env.X402_NETWORK || "base-sepolia").toLowerCase().trim();
export const X402_NETWORK: X402Caip2 =
  RAW === "base" || RAW === "eip155:8453" ? "eip155:8453" : "eip155:84532";

export const IS_MAINNET = X402_NETWORK === "eip155:8453";
export const NETWORK_LABEL = IS_MAINNET ? "base" : "base-sepolia";

// Vi nhan USDC tren Base (dia chi EVM).
export const PAY_TO = (process.env.PAY_TO ||
  process.env.RECIPIENT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Gia moi call. LUU Y: Next.js mo rong bien trong .env, dau $ bi hieu la tham chieu
// bien (vd $0 -> rong), nen "$0.01" co the bi cat thanh ".01". Ham nay chuan hoa lai
// de luon ra dang "$0.01" du env la "0.01", "$0.01", hay ".01".
function normalizePrice(raw: string): string {
  let p = (raw || "0.02").trim();
  p = p.replace(/^\$/, ""); // bo dau $ neu con
  if (p.startsWith(".")) p = "0" + p; // ".01" -> "0.01"
  if (p === "" || p === "0") p = "0.02"; // fallback an toan
  return "$" + p;
}
export const PRICE = normalizePrice(process.env.X402_PRICE || "0.02");

// Facilitator cho TESTNET (mainnet dung facilitator CDP qua @coinbase/x402).
export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

export const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "lucle87@example.com";

// Da la caip2 san.
export const CAIP2 = X402_NETWORK;
