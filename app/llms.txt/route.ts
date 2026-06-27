import { PRICE, BASE_URL, X402_NETWORK, PAY_TO } from "@/lib/x402config";

export const dynamic = "force-dynamic";

export async function GET() {
  const text = `# Rug Check (Base / x402) - on-chain token safety for EVM tokens

Give a token address and chain, get a GO / CAUTION / DANGER verdict read directly
from chain. Pay-per-call in USDC via the x402 protocol on Base. No API key, no signup.

## Why this exists
Market-data APIs tell you a token's price, not whether it is a trap. This reads the
token contract straight from chain and flags the structural risks an agent should
know before trading: upgradeable proxy, owner still in control, mint capability,
liquidity not burned. Scoring adapts to liquidity depth so established tokens are
not over-flagged while fresh meme coins are scored strictly.

## What it checks (on-chain via RPC)
- ERC-20 validity (is it even a token, or just a wallet)
- Upgradeable proxy (EIP-1967, beacon, OZ-legacy, UUPS) - logic can change
- Ownership renounced or owner still in control
- Mint capability in bytecode
- LP burned percentage on the main DEX pair
- Liquidity depth (used to classify token as new vs mature)

## What it does NOT check (be honest with the user)
- Honeypot / sellability simulation
- Holder concentration / top-holder distribution
- Off-chain liquidity locks in third-party lockers
- Team intent or future actions
A GO means no on-chain red flags were found in the checks performed, NOT "safe".
Reputable centrally-controlled tokens may still show CAUTION.

## Scoring mode
- new    : strict. Owner not renounced, mint, and unburned LP push toward DANGER.
- mature : lenient. Those are usually legitimate for established tokens.
- auto   : picks new or mature from on-chain liquidity depth (default).

## Endpoint
POST ${BASE_URL}/api/rugcheck   (price: ${PRICE} per call, paid in USDC via x402 on ${X402_NETWORK})

Request body (JSON):
{ "token": "0x...", "chain": "bnb", "mode": "auto" }
  - token : token contract address (required)
  - chain : eth | bnb | base (required)
  - mode  : auto (default) | new | mature (optional)

## Payment (x402)
Unpaid requests return HTTP 402 with an x402 payment requirement: USDC on Base,
recipient ${PAY_TO}. An x402-capable client (x402-fetch, x402-axios, or an agent
wallet) signs a gasless USDC transfer (EIP-3009) and retries. Settlement ~2s.

## Notes
- Source: direct on-chain RPC reads (eth, bnb, base).
- Informational only, never the sole basis for a trade.
- Discovery document: ${BASE_URL}/openapi.json
`;
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
