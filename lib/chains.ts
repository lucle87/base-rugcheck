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
  lockers: string[]; // dia chi cac LP locker pho bien (UNCX, Team Finance, PinkLock...).
  // Luu y: danh sach NAY khong day du. Phat hien khoa chi tinh cho cac locker liet ke;
  // burn (gui LP toi dia chi chet) moi la tin hieu chac chan, universal. Bo sung them
  // dia chi locker o day se mo rong pham vi phat hien.
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
    lockers: [
      "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214", // UNCX UniV2 (ETH)
      "0xFD235968e65B0990584585763f837A5b5330e6DE", // UNCX UniV3 (ETH)
      "0xE2fE530C047f2d85298b07D9333C05737f1435fB", // Team Finance (ETH)
      "0x71B5759d73262FBb223956913ecF4ecC51057641", // PinkLock v2 (multi-chain CREATE2)
    ],
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
    lockers: [
      "0xc765bdDB93b0D1c1A88282BA0fa6B2d00E3e0c83", // UNCX UniV2 (BSC)
      "0x0C89C0407775dd89b12918B9c0aa42Bf96518820", // Team Finance (BSC)
      "0x407993575c91ce7643a4d4cCACc9A98c36eE1BBE", // PinkLock v2 (BSC)
      "0x71B5759d73262FBb223956913ecF4ecC51057641", // PinkLock v2 alt
    ],
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
    lockers: [
      "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1", // UNCX (Base)
      "0xC4E637D37113192F4F1F060DaEbD7758De7F4131", // Team Finance (Base)
      "0x71B5759d73262FBb223956913ecF4ecC51057641", // PinkLock v2 (Base)
    ],
    explorer: "https://basescan.org/token/",
  },
};

export function pickChain(code?: string): ChainConf | null {
  const key = (code || "").toLowerCase().trim();
  return CHAINS[key] || null;
}
