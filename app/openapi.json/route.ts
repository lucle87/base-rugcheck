import { PRICE, PAY_TO, BASE_URL, CONTACT_EMAIL, X402_NETWORK, CAIP2 } from "@/lib/x402config";

export const dynamic = "force-dynamic";

export async function GET() {
  const priceUsd = PRICE.replace("$", "");
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "Rug Check (Base / x402)",
      version: "1.0.0",
      description:
        "On-chain token safety check for EVM tokens (Ethereum, BNB Chain, Base). Give a token address and chain, get a GO / CAUTION / DANGER verdict read directly from chain via RPC: honeypot/sellability simulation, buy/sell tax, holder concentration, deployer privileges, upgradeable-proxy, ownership renounce, mint capability, LP burn AND lock status (major lockers), and bytecode capability flags (blacklist/pausable/adjustable fees), with scoring that adapts to liquidity depth. Pay-per-call in USDC via the x402 protocol on Base. No API key, no signup.",
      "x-guidance":
        "Use this WHEN an agent needs an on-chain safety read on an EVM token (especially new meme coins) before acting. Body: { token, chain, mode? }. chain one of: eth, bnb, base. mode is 'auto' (default), 'new' (strict, for fresh meme coins), or 'mature' (lenient). Returns verdict GO/CAUTION/DANGER, reasons, and individual checks. IMPORTANT: a GO means no on-chain red flags in the checks performed, NOT that the token is safe. Reputable centrally-controlled tokens may show CAUTION. Unpaid requests return HTTP 402 with an x402 payment requirement (USDC on Base); pay with an x402 client and retry. Full agent docs at /llms.txt.",
      contact: { name: "Rug Check Base", email: CONTACT_EMAIL, url: BASE_URL },
    },
    servers: [{ url: BASE_URL }],
    "x-docs": { llmsTxt: BASE_URL + "/llms.txt" },
    "x402Version": 2,
    "x-discovery": { ownershipProofs: [PAY_TO] },
    "x-payment": {
      x402Version: 2,
      protocol: "x402",
      network: X402_NETWORK,
      caip2: CAIP2,
      asset: "USDC",
      payTo: PAY_TO,
      price: { amount: priceUsd, currency: "USD" },
    },
    "x-chains": ["eth", "bnb", "base"],
    paths: {
      "/api/rugcheck": {
        post: {
          operationId: "rugCheckBase",
          summary: "On-chain rug/safety check for an EVM token (GO/CAUTION/DANGER), paid via x402 on Base",
          tags: ["crypto", "security", "token", "rugcheck", "evm", "base", "meme", "x402"],
          "x-agent-guidance": {
            whenToUse:
              "Use as a go/no-go safety gate before an agent buys, swaps, or interacts with an unfamiliar ERC-20 on Ethereum, BNB Chain, or Base, especially new meme coins. The first due-diligence step in any EVM token workflow.",
            input:
              "POST JSON: { token (contract 0x...), chain (eth|bnb|base), mode? (auto|new|mature) }. mode=auto adapts to liquidity depth; new=strict for fresh coins; mature=lenient for established tokens.",
            output:
              "verdict (GO|CAUTION|DANGER), reasons[], checks[] (ERC-20 validity, sellability/tax via GoPlus, ownership, upgradeable proxy, mint, LP burn/lock, bytecode capabilities), tokenInfo, notChecked[].",
            paymentFlow:
              "First call returns HTTP 402 with an x402 payment requirement (USDC on Base). Pay with an x402 client, then retry the same request to get 200.",
          },
          "x-payment-info": {
            x402Version: 2,
            price: { mode: "fixed", amount: priceUsd, currency: "USD" },
            protocols: ["x402"],
            network: X402_NETWORK,
            asset: "USDC",
            payTo: PAY_TO,
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Token contract address (0x...)." },
                    chain: { type: "string", enum: ["eth", "bnb", "base"], description: "EVM chain to read the token on." },
                    mode: {
                      type: "string",
                      enum: ["auto", "new", "mature"],
                      description: "Scoring mode. auto (default) adapts to liquidity depth; new = strict; mature = lenient.",
                    },
                  },
                  required: ["token", "chain"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Rug check verdict and checks.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      chain: { type: "string" },
                      token: { type: "string" },
                      tokenInfo: { type: "object" },
                      mode: { type: "string", enum: ["new", "mature"] },
                      maturity: { type: "object" },
                      verdict: { type: "string", enum: ["GO", "CAUTION", "DANGER"] },
                      reasons: { type: "array", items: { type: "string" } },
                      checks: { type: "array", items: { type: "object" } },
                      notChecked: { type: "array", items: { type: "string" } },
                      explorer: { type: "string" },
                      disclaimer: { type: "string" },
                    },
                    required: ["type", "chain", "token", "verdict", "reasons"],
                  },
                },
              },
            },
            "400": { description: "Bad Request - missing/invalid token or chain." },
            "402": { description: "Payment Required (x402, USDC on Base)" },
          },
        },
      },
    },
  };

  return Response.json(doc, { headers: { "Cache-Control": "no-store" } });
}
