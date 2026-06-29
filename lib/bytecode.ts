// Phan tich bytecode runtime cua hop dong (phan 2).
// KHONG phai "so sanh voi database rug" (cai do can mot tap rug da gan nhan +
// luu tru, khong lam duoc o serverless stateless). Thay vao do, hai thu lam duoc
// va trung thuc:
//   1. fingerprint: keccak256 cua bytecode, mot ma dinh danh hop dong (de nhan
//      dien clone neu sau nay co luu tru, va de nguoi dung doi chieu).
//   2. capabilities: quet 4-byte selector cua cac ham NHAY CAM co mat trong bytecode.
//      Day la HEURISTIC: "hop dong CO THE lam X", khong phai "se lam X". Nhieu token
//      hop le cung co cac ham nay. Chi mang tinh canh bao, khong tu dong la DANGER.
import { keccak256, toFunctionSelector, type Hex } from "viem";

const DANGEROUS: { sig: string; label: string }[] = [
  { sig: "blacklist(address)", label: "blacklist" },
  { sig: "addToBlackList(address)", label: "blacklist" },
  { sig: "setBlacklist(address,bool)", label: "blacklist" },
  { sig: "pause()", label: "pausable" },
  { sig: "setMaxTxAmount(uint256)", label: "maxTx limit" },
  { sig: "setMaxWalletAmount(uint256)", label: "maxWallet limit" },
  { sig: "setFees(uint256,uint256)", label: "adjustable fees" },
  { sig: "setTaxes(uint256,uint256)", label: "adjustable fees" },
  { sig: "setBuyTax(uint256)", label: "adjustable buy tax" },
  { sig: "setSellTax(uint256)", label: "adjustable sell tax" },
  { sig: "enableTrading()", label: "trading gate" },
  { sig: "setTradingEnabled(bool)", label: "trading gate" },
  { sig: "setSwapEnabled(bool)", label: "swap gate" },
  { sig: "mint(address,uint256)", label: "mint" },
];

// Tinh san selector luc nap module (toFunctionSelector lay keccak that, khong doan).
const SELECTORS = DANGEROUS.map((d) => {
  let sel = "";
  try {
    sel = toFunctionSelector(d.sig).slice(2).toLowerCase();
  } catch {
    sel = "";
  }
  return { label: d.label, sel };
}).filter((x) => x.sel.length === 8);

export function analyzeBytecode(code: string | null): {
  fingerprint: string | null;
  sizeBytes: number;
  capabilities: string[];
} {
  if (!code || code.length < 4 || code === "0x") {
    return { fingerprint: null, sizeBytes: 0, capabilities: [] };
  }
  const hex = code.toLowerCase();
  let fingerprint: string | null = null;
  try {
    fingerprint = keccak256(code as Hex);
  } catch {
    fingerprint = null;
  }
  const found = new Set<string>();
  for (const s of SELECTORS) {
    if (hex.includes(s.sel)) found.add(s.label);
  }
  const sizeBytes = Math.max(0, Math.floor((hex.replace(/^0x/, "").length) / 2));
  return { fingerprint, sizeBytes, capabilities: Array.from(found) };
}
