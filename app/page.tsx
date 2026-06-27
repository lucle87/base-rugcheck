import { PRICE, BASE_URL, X402_NETWORK } from "@/lib/x402config";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Rug Check (Base / x402)</h1>
      <p style={{ color: "#9aa0aa", marginTop: 0 }}>
        On-chain token safety check for EVM tokens (Ethereum, BNB Chain, Base). Give a token
        address and chain, get a GO / CAUTION / DANGER verdict read directly from chain.
        Pay-per-call in USDC via the x402 protocol on Base. No API key, no signup.
      </p>

      <div style={{ background: "#0e1320", border: "1px solid #1e2a44", borderRadius: 14, padding: 20, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>For agents</h2>
        <p style={{ color: "#9aa0aa", fontSize: 14 }}>
          Discovery: <a href="/openapi.json" style={{ color: "#5b9dff" }}>{BASE_URL}/openapi.json</a>
          {"  ·  "}
          <a href="/llms.txt" style={{ color: "#5b9dff" }}>/llms.txt</a>
        </p>
        <pre style={{ background: "#070b13", border: "1px solid #1e2a44", borderRadius: 10, padding: 14, overflowX: "auto", fontSize: 13 }}>{`POST ${BASE_URL}/api/rugcheck
Content-Type: application/json

{ "token": "0x...", "chain": "bnb", "mode": "auto" }

Price: ${PRICE} per call (USDC via x402 on ${X402_NETWORK})`}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>What it checks</h2>
        <ul style={{ color: "#9aa0aa", fontSize: 14, lineHeight: 1.7, paddingLeft: 18 }}>
          <li>ERC-20 validity (token vs wallet)</li>
          <li>Upgradeable proxy (EIP-1967, beacon, OZ-legacy, UUPS)</li>
          <li>Ownership renounced or owner in control</li>
          <li>Mint capability in bytecode</li>
          <li>LP burned percentage on main DEX pair</li>
          <li>Liquidity depth (adaptive new vs mature scoring)</li>
        </ul>
      </div>

      <p style={{ color: "#9aa0aa", fontSize: 13, marginTop: 24 }}>
        On-chain heuristic only. A GO means no on-chain red flags were found in the checks
        performed, not that the token is safe. Does not detect honeypots or holder concentration.
        Reputable centrally-controlled tokens may show CAUTION. Never the sole basis for a trade.
      </p>
    </main>
  );
}
