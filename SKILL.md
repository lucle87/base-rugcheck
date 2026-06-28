---
name: base-rugcheck
description: >
  Token safety / rug-check for EVM tokens (Ethereum, BNB Chain, Base). Use BEFORE
  buying, swapping, or interacting with an unfamiliar ERC-20, especially new meme
  coins. Given a token contract address and chain, returns a GO / CAUTION / DANGER
  verdict covering honeypot/sellability, buy & sell tax, holder concentration,
  deployer privileges, upgradeable proxy, ownership, mint capability, and LP burn.
  Pay-per-call in USDC via x402 on Base. No API key, no signup.
homepage: https://base-rugcheck.vercel.app
openapi: https://base-rugcheck.vercel.app/openapi.json
llms: https://base-rugcheck.vercel.app/llms.txt
price: $0.01 USDC per call
payment: x402 (USDC on Base, eip155:8453)
---

# base-rugcheck

Pre-trade token safety check for EVM tokens. One call returns a clear verdict and
the individual signals behind it, read from chain via RPC and enriched with GoPlus
security data.

## When to use this

Use this skill when the user (or your plan) involves any of:
- "Is this token safe?" / "Is this a scam / honeypot / rug?"
- About to buy, swap into, snipe, or approve an unfamiliar ERC-20.
- Vetting a new meme coin or a freshly deployed contract.
- Pre-transaction due diligence for a trading workflow.

Supported chains: `eth` (Ethereum), `bnb` (BNB Chain), `base` (Base).

## When NOT to use this

- Non-EVM tokens (e.g. Solana SPL). This service is EVM only.
- A "GO" is NOT a guarantee of safety. It means no red flags were found in the
  checks performed. Always present it as a risk signal, not a green light.
- It does not detect off-chain liquidity locks in third-party lockers, or future
  team actions. The honeypot result relies on GoPlus simulation and can miss a
  trap deployed minutes ago.

## How to call

`POST https://base-rugcheck.vercel.app/api/rugcheck`

Request body (JSON):
```json
{ "token": "0x...", "chain": "base", "mode": "auto" }
```
- `token` (required): the ERC-20 contract address.
- `chain` (required): one of `eth`, `bnb`, `base`.
- `mode` (optional): `auto` (default), `new` (strict scoring for fresh meme
  coins), or `mature` (lenient scoring for established tokens). `auto` picks
  based on liquidity depth.

### Payment (x402)

An unpaid request returns `HTTP 402` with x402 payment terms:
- Network: Base mainnet (`eip155:8453`)
- Asset: USDC
- Amount: $0.01
- payTo: `0xcd6b6d99b7751ff30b68fa1365488eb73fa7cefa`

Pay with an x402 client (the payment receipt is the credential), then retry the
same request with the payment header attached. No account or API key is needed.

## Response

```json
{
  "verdict": "GO | CAUTION | DANGER",
  "chain": "bnb",
  "token": "0x...",
  "tokenInfo": { "name": "...", "symbol": "...", "decimals": 18, "totalSupply": "..." },
  "mode": "new | mature",
  "reasons": ["human-readable strings for each warn/danger finding"],
  "checks": [
    { "id": "erc20",         "status": "ok|warn|danger|info", "detail": "..." },
    { "id": "proxy",         "status": "...", "detail": "..." },
    { "id": "ownership",     "status": "...", "detail": "..." },
    { "id": "mint",          "status": "...", "detail": "..." },
    { "id": "liquidity",     "status": "...", "detail": "..." },
    { "id": "honeypot",      "status": "...", "detail": "..." },
    { "id": "tax",           "status": "...", "detail": "..." },
    { "id": "concentration", "status": "...", "detail": "..." },
    { "id": "deployer",      "status": "...", "detail": "..." }
  ],
  "notChecked": ["off-chain locks", "team intent"],
  "explorer": "https://bscscan.com/token/0x...",
  "disclaimer": "..."
}
```

### How to interpret

- `verdict`:
  - `DANGER` — a serious red flag was found (honeypot / cannot sell, extreme tax,
    or high accumulated risk). Advise the user to avoid.
  - `CAUTION` — some risk signals present (e.g. owner not renounced, mint
    capability, moderate concentration). Surface the reasons; do not auto-proceed.
  - `GO` — no red flags in the checks performed. Still not a safety guarantee.
- `checks[].status`: `danger` and `warn` are the items driving the verdict;
  `ok`/`info` are context. The key high-risk checks are `honeypot`, `tax`,
  `concentration`, and `deployer`.
- Reputable, centrally-controlled tokens (e.g. an exchange token) may legitimately
  show `CAUTION` because the owner retains control. Read `mode` and `reasons`
  before concluding it is unsafe.

## Example

Request:
```
POST https://base-rugcheck.vercel.app/api/rugcheck
{ "token": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", "chain": "bnb" }
```
Returns `CAUTION` for CAKE: honeypot OK (sellable), holder concentration OK
(top holder ~1.6%), deployer holds ~0% with no risky privileges; the CAUTION is
driven by owner not renounced and mint present, which is expected for an
established protocol token.

## Notes for the agent

- Always relay the `reasons` and the `disclaimer` to the user. Never present a
  `GO` as "safe to buy".
- One token + one chain per call. For multi-chain checks, call once per chain.
- Cost is $0.01 per call; budget accordingly before invoking.
