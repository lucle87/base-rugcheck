import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rug Check (Base / x402) - on-chain token safety for EVM tokens",
  description: "GO/CAUTION/DANGER verdict for EVM tokens read on-chain. Pay-per-call in USDC via x402 on Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#070b13", color: "#e6ecf7", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
