// GoPlus Token Security API (free, khong can key, ho tro eth=1, bnb=56, base=8453).
// Tra ve mot lan: honeypot, buy/sell tax, holder concentration, creator + quyen nguy hiem.
// Nguon: https://api.gopluslabs.io/api/v1/token_security/{chainId}?contract_addresses=0x...

const UA = "base-rugcheck/1.0";

export type GoPlusSignals = {
  available: boolean;
  isHoneypot: boolean | null;
  cannotSellAll: boolean | null;
  cannotBuy: boolean | null;
  buyTaxPct: number | null;
  sellTaxPct: number | null;
  holderCount: number | null;
  topHolderPct: number | null; // ho lon nhat (loai LP/burn/lock)
  top10Pct: number | null; // tong 10 ho lon (loai LP/burn/lock)
  creatorAddress: string | null;
  creatorPct: number | null;
  isMintable: boolean | null;
  canTakeBackOwnership: boolean | null;
  hiddenOwner: boolean | null;
  isOpenSource: boolean | null;
  transferPausable: boolean | null;
  hasBlacklist: boolean | null;
};

const EMPTY: GoPlusSignals = {
  available: false,
  isHoneypot: null,
  cannotSellAll: null,
  cannotBuy: null,
  buyTaxPct: null,
  sellTaxPct: null,
  holderCount: null,
  topHolderPct: null,
  top10Pct: null,
  creatorAddress: null,
  creatorPct: null,
  isMintable: null,
  canTakeBackOwnership: null,
  hiddenOwner: null,
  isOpenSource: null,
  transferPausable: null,
  hasBlacklist: null,
};

function b(v: any): boolean | null {
  if (v === "1" || v === 1) return true;
  if (v === "0" || v === 0) return false;
  return null;
}
function num(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
// GoPlus tra ti le dang phan so ("0.05" = 5%). Chuyen sang %.
function pct(v: any): number | null {
  const n = num(v);
  if (n == null) return null;
  return Number((n * 100).toFixed(2));
}

export async function fetchGoPlus(chainId: number, token: string): Promise<GoPlusSignals> {
  const addr = token.toLowerCase();
  const url =
    "https://api.gopluslabs.io/api/v1/token_security/" +
    chainId +
    "?contract_addresses=" +
    addr;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) return EMPTY;
    const data: any = await res.json();
    const rec = data?.result?.[addr];
    if (!rec) return EMPTY;

    // Holder concentration: loai LP, burn, locked (LP la binh thuong, khong tinh la tap trung).
    const holders: any[] = Array.isArray(rec.holders) ? rec.holders : [];
    const isBurn = (a: string) =>
      /^0x0+$/i.test(a) || /dead$/i.test((a || "").toLowerCase());
    const real = holders.filter((h) => {
      const tag = (h.tag || "").toLowerCase();
      if (tag.includes("lock") || tag.includes("burn")) return false;
      if (h.is_locked === 1 || h.is_locked === "1") return false;
      if (isBurn(h.address || "")) return false;
      return true;
    });
    const pcts = real
      .map((h) => pct(h.percent))
      .filter((x): x is number => x != null)
      .sort((a, b2) => b2 - a);
    const topHolderPct = pcts.length ? pcts[0] : null;
    const top10Pct = pcts.length
      ? Number(pcts.slice(0, 10).reduce((s, x) => s + x, 0).toFixed(2))
      : null;

    return {
      available: true,
      isHoneypot: b(rec.is_honeypot),
      cannotSellAll: b(rec.cannot_sell_all),
      cannotBuy: b(rec.cannot_buy),
      buyTaxPct: pct(rec.buy_tax),
      sellTaxPct: pct(rec.sell_tax),
      holderCount: num(rec.holder_count),
      topHolderPct,
      top10Pct,
      creatorAddress: rec.creator_address || null,
      creatorPct: pct(rec.creator_percent),
      isMintable: b(rec.is_mintable),
      canTakeBackOwnership: b(rec.can_take_back_ownership),
      hiddenOwner: b(rec.hidden_owner),
      isOpenSource: b(rec.is_open_source),
      transferPausable: b(rec.transfer_pausable),
      hasBlacklist: b(rec.is_blacklisted),
    };
  } catch {
    return EMPTY;
  }
}
