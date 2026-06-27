// Cau hinh tung chain EVM. Them chain = them 1 entry o day (cung chuan ERC-20).
// RPC public free, co the override bang env. WNATIVE + factory dung de check LP.
// matureNativeReserve: nguong reserve WNATIVE (don vi native) de coi token la
// "da truong thanh" (thanh khoan sau). Heuristic, chinh duoc.

import { mainnet, bsc, base } from "viem/chains";

export type ChainConf = {
  code: string;
  label: string;
  chain: any; // viem chain object
  rpc: string;
  wnative: `0x${string}`; // WETH / WBNB
  nativeSymbol: string;
  factory: `0x${string}`; // DEX v2 factory de tim cap token/WNATIVE
  matureNativeReserve: number; // reserve WNATIVE toi thieu de coi la "established"
  explorer: string;
};

export const CHAINS: Record<string, ChainConf> = {
  eth: {
    code: "eth",
    label: "Ethereum",
    chain: mainnet,
    rpc: process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com",
    wnative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    nativeSymbol: "ETH",
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    matureNativeReserve: 30,
    explorer: "https://etherscan.io/token/",
  },
  bnb: {
    code: "bnb",
    label: "BNB Chain",
    chain: bsc,
    rpc: process.env.BNB_RPC_URL || "https://bsc-rpc.publicnode.com",
    wnative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    nativeSymbol: "BNB",
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    matureNativeReserve: 150,
    explorer: "https://bscscan.com/token/",
  },
  base: {
    code: "base",
    label: "Base",
    chain: base,
    rpc: process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com",
    wnative: "0x4200000000000000000000000000000000000006",
    nativeSymbol: "ETH",
    factory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
    matureNativeReserve: 20,
    explorer: "https://basescan.org/token/",
  },
};

export function pickChain(code?: string): ChainConf | null {
  const key = (code || "").toLowerCase().trim();
  return CHAINS[key] || null;
}
