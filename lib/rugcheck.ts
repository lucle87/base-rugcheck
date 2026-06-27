// Rug check on-chain bang viem (RPC thuan, khong indexer/API tra phi).
//
// Doc duoc: ERC-20 hop le, owner da renounce chua, proxy nang cap duoc khong
// (nhieu loai slot, gom proxy doi cu cua USDC), bytecode co ham mint khong,
// LP co burn khong, va do sau thanh khoan (de phan loai token non / truong thanh).
//
// CHE DO THICH UNG (mode):
//  - new    : soi chat (mac dinh cho token non / thanh khoan thap / khong ro)
//  - mature : noi tay (token thanh khoan sau -> owner/mint thuong la quyen hop phap)
//  - auto   : tu chon dua tren do sau thanh khoan
//
// KHONG doc duoc: honeypot/ban duoc, phan bo holder, khoa LP o locker ben thu ba,
// y dinh doi ngu. "GO" = khong thay co dau hieu xau on-chain trong cac check da lam.

import { createPublicClient, http, getAddress } from "viem";
import { pickChain, ChainConf } from "./chains";

const DEAD = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000",
] as const;

// Cac storage slot luu dia chi implementation cua proxy (de bat proxy nang cap duoc).
const PROXY_SLOTS: { id: string; slot: `0x${string}` }[] = [
  { id: "EIP-1967", slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" },
  { id: "EIP-1967-beacon", slot: "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" },
  { id: "OZ-legacy", slot: "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3" },
  { id: "EIP-1822-UUPS", slot: "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7" },
];

const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

const ownableAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

const factoryAbi = [
  { type: "function", name: "getPair", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "address" }] },
] as const;

const pairAbi = [
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getReserves", stateMutability: "view", inputs: [], outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }] },
] as const;

export type Severity = "ok" | "warn" | "danger" | "info";
export type Mode = "auto" | "new" | "mature";

export type Check = { id: string; status: Severity; detail: string };

export type RugCheckResult = {
  type: "rugcheck";
  chain: string;
  chainLabel: string;
  token: string;
  tokenInfo: { name?: string; symbol?: string; decimals?: number; totalSupply?: string };
  mode: "new" | "mature";
  maturity: { established: boolean; nativeReserve: number | null; nativeSymbol: string; basis: string };
  verdict: "GO" | "CAUTION" | "DANGER";
  reasons: string[];
  checks: Check[];
  notChecked: string[];
  explorer: string;
  disclaimer: string;
};

function client(conf: ChainConf) {
  return createPublicClient({ chain: conf.chain, transport: http(conf.rpc) });
}

async function tryRead<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function isDead(addr: string | null): boolean {
  if (!addr) return false;
  const a = addr.toLowerCase();
  return DEAD.some((d) => d.toLowerCase() === a);
}

function slotHasAddress(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const body = raw.replace(/^0x/, "");
  // Co bat ky nibble khac 0 -> slot da set.
  return body.length > 0 && /[1-9a-f]/i.test(body);
}

type Signals = {
  erc20Valid: boolean;
  isProxy: boolean;
  proxyKind: string | null;
  ownerRenounced: boolean; // true neu renounce; false neu con owner; (null-> coi nhu khong xac dinh)
  ownerKnown: boolean;
  ownerActive: boolean;
  ownerAddr: string | null;
  hasMint: boolean;
  lpFound: boolean;
  lpBurned: boolean;
  lpBurnedPct: number | null;
  nativeReserve: number | null;
};

export async function rugCheck(
  tokenInput: string,
  chainCode: string,
  modeInput?: string
): Promise<RugCheckResult> {
  const conf = pickChain(chainCode);
  if (!conf) {
    throw new Error("Unsupported chain '" + chainCode + "'. Supported: eth, bnb, base.");
  }

  let token: `0x${string}`;
  try {
    token = getAddress(tokenInput.trim()) as `0x${string}`;
  } catch {
    throw new Error("Invalid token address.");
  }

  const requestedMode: Mode =
    modeInput === "new" || modeInput === "mature" ? (modeInput as Mode) : "auto";

  const pc = client(conf);

  // ---- ERC-20 ----
  const name = await tryRead(() => pc.readContract({ address: token, abi: erc20Abi, functionName: "name" }));
  const symbol = await tryRead(() => pc.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }));
  const decimals = await tryRead(() => pc.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }));
  const totalSupply = await tryRead(() => pc.readContract({ address: token, abi: erc20Abi, functionName: "totalSupply" }));
  const erc20Valid = symbol != null && decimals != null && totalSupply != null;

  const tokenInfo = {
    name: (name as string) || undefined,
    symbol: (symbol as string) || undefined,
    decimals: decimals != null ? Number(decimals) : undefined,
    totalSupply: totalSupply != null ? (totalSupply as bigint).toString() : undefined,
  };

  if (!erc20Valid) {
    return assemble(conf, token, tokenInfo, "new", { established: false, nativeReserve: null, nativeSymbol: conf.nativeSymbol, basis: "not a token" }, [
      { id: "erc20", status: "danger", detail: "Address does not expose a standard ERC-20 interface." },
    ], ["Not a standard ERC-20 token."], "DANGER");
  }

  // ---- Proxy (nhieu slot) ----
  let isProxy = false;
  let proxyKind: string | null = null;
  for (const ps of PROXY_SLOTS) {
    const raw = await tryRead(() => pc.getStorageAt({ address: token, slot: ps.slot }));
    if (slotHasAddress(raw)) {
      isProxy = true;
      proxyKind = ps.id;
      break;
    }
  }

  // ---- Ownership ----
  let ownerAddr = await tryRead(() => pc.readContract({ address: token, abi: ownableAbi, functionName: "owner" }));
  if (ownerAddr == null) {
    ownerAddr = await tryRead(() => pc.readContract({ address: token, abi: ownableAbi, functionName: "getOwner" }));
  }
  const ownerKnown = ownerAddr != null;
  const ownerRenounced = ownerKnown && isDead(ownerAddr as string);
  const ownerActive = ownerKnown && !ownerRenounced;

  // ---- Mint trong bytecode ----
  const code = await tryRead(() => pc.getBytecode({ address: token }));
  const codeHex = (typeof code === "string" ? code : "").toLowerCase();
  const hasMint = ["40c10f19", "a0712d68"].some((s) => codeHex.includes(s));

  // ---- Thanh khoan: tim cap token/WNATIVE, doc reserve + burn ----
  let lpFound = false;
  let lpBurned = false;
  let lpBurnedPct: number | null = null;
  let nativeReserve: number | null = null;

  try {
    const pair = (await pc.readContract({
      address: conf.factory,
      abi: factoryAbi,
      functionName: "getPair",
      args: [token, conf.wnative],
    })) as string;

    if (pair && !isDead(pair)) {
      lpFound = true;
      const pairAddr = pair as `0x${string}`;

      // burn %
      const lpTotal = await tryRead(() => pc.readContract({ address: pairAddr, abi: erc20Abi, functionName: "totalSupply" }));
      if (typeof lpTotal === "bigint" && lpTotal > 0n) {
        let burned = 0n;
        for (const d of DEAD) {
          const b = await tryRead(() =>
            pc.readContract({ address: pairAddr, abi: erc20Abi, functionName: "balanceOf", args: [d as `0x${string}`] })
          );
          if (typeof b === "bigint") burned += b;
        }
        lpBurnedPct = Number((burned * 10000n) / lpTotal) / 100;
        lpBurned = lpBurnedPct >= 90;
      }

      // native reserve (do sau thanh khoan)
      const token0 = await tryRead(() => pc.readContract({ address: pairAddr, abi: pairAbi, functionName: "token0" }));
      const reserves = await tryRead(() => pc.readContract({ address: pairAddr, abi: pairAbi, functionName: "getReserves" }));
      if (Array.isArray(reserves) && token0 != null) {
        const nativeIsToken0 = (token0 as string).toLowerCase() === conf.wnative.toLowerCase();
        const rNative = nativeIsToken0 ? reserves[0] : reserves[1];
        if (typeof rNative === "bigint") {
          nativeReserve = Number(rNative) / 1e18;
        }
      }
    }
  } catch {
    // bo qua, coi nhu khong co thanh khoan doc duoc
  }

  // ---- Phan loai non / truong thanh ----
  const established =
    nativeReserve != null && nativeReserve >= conf.matureNativeReserve;
  let effectiveMode: "new" | "mature";
  let basis: string;
  if (requestedMode === "new") {
    effectiveMode = "new";
    basis = "forced by request";
  } else if (requestedMode === "mature") {
    effectiveMode = "mature";
    basis = "forced by request";
  } else if (established) {
    effectiveMode = "mature";
    basis =
      "deep liquidity (~" + (nativeReserve as number).toFixed(1) + " " + conf.nativeSymbol + " >= " + conf.matureNativeReserve + ")";
  } else {
    effectiveMode = "new";
    basis =
      nativeReserve != null
        ? "shallow liquidity (~" + nativeReserve.toFixed(2) + " " + conf.nativeSymbol + "), treated as new"
        : "liquidity unknown, treated as new (strict)";
  }

  const sig: Signals = {
    erc20Valid,
    isProxy,
    proxyKind,
    ownerRenounced,
    ownerKnown,
    ownerActive,
    ownerAddr: (ownerAddr as string) || null,
    hasMint,
    lpFound,
    lpBurned,
    lpBurnedPct,
    nativeReserve,
  };

  return scoreAndAssemble(conf, token, tokenInfo, effectiveMode, basis, established, sig);
}

function scoreAndAssemble(
  conf: ChainConf,
  token: string,
  tokenInfo: RugCheckResult["tokenInfo"],
  mode: "new" | "mature",
  basis: string,
  established: boolean,
  s: Signals
): RugCheckResult {
  const strict = mode === "new";
  const checks: Check[] = [];
  let weight = 0;

  checks.push({ id: "erc20", status: "ok", detail: "Standard ERC-20 interface present." });

  // proxy
  if (s.isProxy) {
    weight += strict ? 3 : 1;
    checks.push({
      id: "proxy",
      status: strict ? "danger" : "warn",
      detail: "Upgradeable proxy (" + s.proxyKind + "): contract logic can be changed after deploy.",
    });
  } else {
    checks.push({ id: "proxy", status: "ok", detail: "No upgradeable-proxy implementation slot set." });
  }

  // ownership
  if (!s.ownerKnown) {
    checks.push({ id: "ownership", status: "info", detail: "No standard owner()/getOwner() function found." });
  } else if (s.ownerRenounced) {
    checks.push({ id: "ownership", status: "ok", detail: "Ownership renounced." });
  } else {
    weight += strict ? 2 : 1;
    checks.push({
      id: "ownership",
      status: "warn",
      detail: "Owner not renounced: owner retains privileged control (" + s.ownerAddr + ").",
    });
  }

  // mint
  if (s.hasMint && s.ownerActive) {
    weight += strict ? 2 : 1;
    checks.push({
      id: "mint",
      status: "warn",
      detail: "Mint function present and ownership not renounced: supply may be inflatable.",
    });
  } else if (s.hasMint) {
    checks.push({ id: "mint", status: "info", detail: "Mint function present in bytecode, but ownership appears renounced." });
  } else {
    checks.push({ id: "mint", status: "ok", detail: "No common mint selector found in bytecode." });
  }

  // liquidity burn
  if (!s.lpFound) {
    checks.push({
      id: "liquidity",
      status: "info",
      detail: "No " + conf.label + " native pair found on main DEX (token may be paired elsewhere or have no liquidity).",
    });
  } else if (s.lpBurned) {
    checks.push({ id: "liquidity", status: "ok", detail: "LP largely burned (~" + (s.lpBurnedPct ?? 0).toFixed(1) + "%)." });
  } else {
    if (strict) weight += 2; // token non: LP chua khoa la canh bao manh
    checks.push({
      id: "liquidity",
      status: strict ? "warn" : "info",
      detail:
        "LP not burned (~" + (s.lpBurnedPct ?? 0).toFixed(1) + "% burned)" +
        (strict ? ": liquidity could be removed. Third-party locks not detected." : " (common for mature tokens that lock rather than burn; locks not detected)."),
    });
  }

  // maturity note
  checks.push({
    id: "maturity",
    status: "info",
    detail:
      (established ? "Established: " : "Treated as new: ") + basis + ". Scoring mode: " + mode + ".",
  });

  // verdict theo mode
  let verdict: RugCheckResult["verdict"];
  if (strict) {
    verdict = weight >= 3 ? "DANGER" : weight >= 1 ? "CAUTION" : "GO";
  } else {
    verdict = weight >= 4 ? "DANGER" : weight >= 1 ? "CAUTION" : "GO";
  }

  let reasons = checks.filter((c) => c.status === "warn" || c.status === "danger").map((c) => c.detail);
  if (reasons.length === 0) reasons = ["No on-chain red flags detected in the checks performed."];

  return finalize(conf, token, tokenInfo, mode, established, s.nativeReserve, basis, verdict, reasons, checks);
}

function assemble(
  conf: ChainConf,
  token: string,
  tokenInfo: RugCheckResult["tokenInfo"],
  mode: "new" | "mature",
  maturity: RugCheckResult["maturity"],
  checks: Check[],
  reasons: string[],
  verdict: RugCheckResult["verdict"]
): RugCheckResult {
  return {
    type: "rugcheck",
    chain: conf.code,
    chainLabel: conf.label,
    token,
    tokenInfo,
    mode,
    maturity,
    verdict,
    reasons,
    checks,
    notChecked: NOT_CHECKED,
    explorer: conf.explorer + token,
    disclaimer: DISCLAIMER,
  };
}

function finalize(
  conf: ChainConf,
  token: string,
  tokenInfo: RugCheckResult["tokenInfo"],
  mode: "new" | "mature",
  established: boolean,
  nativeReserve: number | null,
  basis: string,
  verdict: RugCheckResult["verdict"],
  reasons: string[],
  checks: Check[]
): RugCheckResult {
  return assemble(
    conf,
    token,
    tokenInfo,
    mode,
    { established, nativeReserve, nativeSymbol: conf.nativeSymbol, basis },
    checks,
    reasons,
    verdict
  );
}

const NOT_CHECKED = [
  "Honeypot / sellability (cannot buy-sell simulate via plain RPC)",
  "Holder concentration / top-holder distribution (needs an indexer)",
  "Off-chain liquidity locks in third-party lockers",
  "Team intent, social signals, or future dev actions",
];

const DISCLAIMER =
  "On-chain heuristic check only. A 'GO' means no on-chain red flags were found in the checks performed, NOT that the token is safe. Scoring adapts to liquidity depth: established tokens with deep liquidity are scored leniently (owner/mint privileges are often legitimate), new/shallow tokens strictly. Reputable tokens with central control may still show CAUTION. It does NOT detect honeypots, holder concentration, off-chain locks, or team intent. Never the sole basis for a trade. Do your own research.";
