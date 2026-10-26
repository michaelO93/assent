# Assent

**Verifiable parental consent, without the surveillance.** A parent says yes to a children's app once, the app gets
proof of that consent and a per-app pseudonym for the child, and the parent can withdraw it at any time. The child's
identity never leaves the parent's device.

Built for the [BLI Legal Tech Hackathon 2](https://dorahacks.io/hackathon/legal-hack-2026) (LegalTech & RegTech track:
data privacy for minors). Deadline: 2026-11-01 01:01 UTC.

## The problem

COPPA (US), GDPR Article 8 (EU), the UK Age Appropriate Design Code and Nigeria's NDPA 2023 require parental consent
before processing a child's data. Today apps either:

- ask the child to tick "I'm over 13", which proves nothing and regulators reject, or
- collect parents' ID documents and card details, which creates a new trove of sensitive data, and
- keep the consent record in their own database, where it can be edited, backdated or lost.

## How Assent works

1. **Verify once.** The parent confirms they're an adult with an ID provider. Only a hash of the provider's reference
   is recorded (`verifyGuardian`). *Simulated in this prototype.*
2. **Approve what's asked.** The app's data-use notice (purposes, data, retention, sharing) is shown scope by scope.
   The parent approves and signs an EIP-712 `Grant` with a key that never leaves their device.
3. **App gets a yes, not an identity.** A relayer submits the signed grant. The app receives a consent ID and a
   per-app pseudonym `keccak256(childSecret, appId)`, so two apps can't link the same child.
4. **Revoke any time.** A guardian-signed `Revoke` flips the record. The app's next `isValid` check fails.
5. **Audit without trust.** Anyone can rebuild the consent receipt from the app's notice and the on-chain fields and
   check its hash matches what the parent signed.

**Why a ledger:** grants and revocations are signed by the parent and verified by the contract, so neither the app
nor Assent's operator can fabricate, backdate or quietly delete consent. The record outlives any one company's database.

| On-chain | Never leaves the parent's device |
| --- | --- |
| Guardian address, per-app child pseudonym, age band, approved scopes, receipt hash, granted/expires/withdrawn times | Child's name and birth year, parent's ID and personal details, anything linking a child across apps |

## Layout

```
chain/          Hardhat project: ConsentRegistry.sol, tests, deploy script
src/lib/        consent model (receipts, typed data, pseudonyms), demo app manifests, chain client
src/app/api/    attest, grant, revoke, verify, guardian/[address], consent/[id]
src/app/        landing, /parent, /consent, /demo/[app], /audit, /developers
```

## Run locally

```bash
cd chain && npm install && npx hardhat node          # terminal 1: local chain on :8545
cd chain && npm run deploy:local                      # terminal 2: deploys + writes src/lib/generated/
npm install && npm run dev                            # terminal 3: http://localhost:3000
npm test --prefix chain                               # contract tests
```

The Hardhat node resets when stopped; run `deploy:local` again after restarting it. Clear the site's localStorage too,
since the old parent key's consents no longer exist.

## Deploy to Base Sepolia

Live registry: [`0xa94b978946d23f141f1c0cdc9e9eb5e69d1f81e9`](https://sepolia.basescan.org/address/0xa94b978946d23f141f1c0cdc9e9eb5e69d1f81e9) on Base Sepolia.

No faucet working for you? Mine Sepolia ETH at [sepolia-faucet.pk910.de](https://sepolia-faucet.pk910.de/), then
`npm run bridge --prefix chain` moves it to Base Sepolia through Base's official bridge.

1. Create a fresh test-only key and fund it from a Base Sepolia faucet.
2. `DEPLOYER_PRIVATE_KEY=0x… npm run deploy:base-sepolia --prefix chain`
3. Set in the web host: `NEXT_PUBLIC_ASSENT_NETWORK=baseSepolia`, `RELAYER_PRIVATE_KEY=0x…` (same key: it's the
   attestor), optionally `RPC_URL`.

## Prototype limits (say these out loud in the pitch)

- The adult ID check is simulated. Production: Smile ID / Yoti / VerifyMe hand-off.
- The parent key lives in localStorage. Production: passkey-backed smart account (the contract already accepts
  ERC-1271 signatures via `SignatureChecker`).
- One key relays and attests. Production: separate attestor per ID provider, rate-limited relayer.
- The child-to-parent hand-off is a button. Production: QR code on the child's device opens the request on the
  parent's phone.

## Plan to the deadline

- [x] **Day 1 (Oct 26)**: contract + tests, consent/grant/revoke/verify API, parent dashboard, consent screen, demo
  app, audit view; full loop verified locally
- [ ] **Day 2 (Oct 27)**: deploy to Base Sepolia + Vercel, BaseScan links, QR hand-off between devices
- [ ] **Day 3 (Oct 28)**: polish (mobile, empty/error states), second demo app showing unlinkable pseudonyms,
  legal mapping page (COPPA / GDPR Art. 8 / NDPA requirement → feature)
- [ ] **Day 4 (Oct 29)**: demo video script + recording, README screenshots
- [ ] **Day 5 (Oct 30)**: DoraHacks submission; Oct 31 is buffer
