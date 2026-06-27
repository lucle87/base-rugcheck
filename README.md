# Rug Check (Base / x402) - on-chain token safety, paid in USDC on Base

Cung loi rug check nhu ban EVM tren MPP, nhung lop thanh toan doi sang x402
(chuan cua Coinbase/Cloudflare) tren Base. Pay USDC gasless, settle ~2s, khong key.

Loi giu nguyen: lib/rugcheck.ts + lib/chains.ts (doc on-chain eth/bnb/base,
adaptive scoring). Chi thay lop tra tien: middleware.ts (x402) thay cho mppx.

## Kien truc
- middleware.ts  : cong x402, gate /api/rugcheck (co preview bypass de test local)
- app/api/rugcheck/route.ts : doc body + goi rugCheck (KHONG co code thanh toan)
- lib/rugcheck.ts, lib/chains.ts : loi (giong ban EVM)
- lib/x402config.ts : network, vi nhan, gia, facilitator
- openapi.json / llms.txt : discovery cho agent + x402scan

## Hai mang
- X402_NETWORK=base-sepolia (TESTNET truoc) : TESTNET. Facilitator free https://x402.org/facilitator,
  KHONG can CDP key. Dung de test truoc.
- X402_NETWORK=base : MAINNET. Dung facilitator Coinbase (@coinbase/x402),
  CAN CDP_API_KEY_ID + CDP_API_KEY_SECRET (lay o Coinbase Developer Platform).
  Day moi la cho ra tien that.

## Chay local (preview, khong can tra tien)
```
npm install
copy .env.example .env   (PAY_TO, CONTACT_EMAIL, PREVIEW_KEY=test123, X402_NETWORK=base-sepolia)
npm run dev
```
Test:
```
$body = '{"token":"0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82","chain":"bnb"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/rugcheck?preview=test123" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 8
```
=> preview bypass cong thanh toan, chi kiem loi rug check chay dung tren Base project.
XOA PREVIEW_KEY tren production.

## Kiem cong 402 that (khong preview)
```
Invoke-WebRequest -Uri "http://localhost:3000/api/rugcheck" -Method Post -ContentType "application/json" -Body '{"token":"0x...","chain":"bnb"}'
```
=> phai tra HTTP 402 voi header doi thanh toan x402. (Goi that can x402 client + USDC.)

## Deploy + dang ky
1. Push GitHub -> import Vercel.
2. ENV tren Vercel:
   - TESTNET: X402_NETWORK=base-sepolia, PAY_TO, RECIPIENT_ADDRESS, X402_PRICE=$0.02,
     FACILITATOR_URL=https://x402.org/facilitator, BASE_URL=domain chinh, CONTACT_EMAIL.
   - MAINNET: X402_NETWORK=base, PAY_TO, X402_PRICE=$0.02, CDP_API_KEY_ID, CDP_API_KEY_SECRET,
     BASE_URL=domain chinh, CONTACT_EMAIL. (KHONG can FACILITATOR_URL.)
   - KHONG dat PREVIEW_KEY tren production.
3. Redeploy bo tick build cache.
4. Kiem: /openapi.json va /llms.txt dung domain, gia, x-payment network dung.
5. Dang ky tren x402scan.com (tim nut submit/add endpoint). Discovery = /openapi.json.

## Luu y thang than
- DUNG x402 V2: @x402/next + @x402/core + @x402/evm (+ @coinbase/x402 cho mainnet).
  x402scan CHI nhan v2. Bo cu x402-next la v1 (bi tu choi). De "latest", chay duoc
  thi GHIM version (npm ls @x402/next @x402/core @x402/evm).
- KHONG test duoc x402 that trong moi truong cua minh (mang tat). Da typecheck offline.
  Ban phai test cong 402 + flow tra tien tren may.
- Mainnet CAN CDP key. Test xong tren base-sepolia roi moi chuyen base.
- Loi rug check da chung minh dung o ban EVP MPP (CAKE->CAUTION, USDC hien proxy).
- Khong phai cong cu quyet dinh giao dich. Co disclaimer.
