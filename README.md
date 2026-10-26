# Assent

**Live demo: [assent-sage.vercel.app](https://assent-sage.vercel.app)** · start at the [demo app](https://assent-sage.vercel.app/demo/doodle-quest)

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

## Decentralized ID attestation with Chainlink CRE

By default one attestor key records that a parent passed the ID check, which makes Assent a single trusted
party. [`cre/idv-attestation`](cre/idv-attestation) is a Chainlink CRE workflow that takes over that job: it
listens for `VerificationRequested`, has every DON node confirm the session with the ID provider, reaches
consensus, and writes the verification through the Chainlink forwarder to `ConsentRegistry.onReport()`. The
registry records who verified each parent, and the dashboard and audit page show "verified via Chainlink
CRE". Simulated with `--broadcast` on Base Sepolia; see the workflow README for recorded transactions.

## Layout

```
chain/          Hardhat project: ConsentRegistry.sol, tests, deploy and request-verification scripts
cre/            Chainlink CRE project: idv-attestation workflow (TypeScript)
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

Live registry: [`0x0607087d9ce704d70f9355c847e18236629f31d4`](https://sepolia.basescan.org/address/0x0607087d9ce704d70f9355c847e18236629f31d4) on Base Sepolia.

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
- QR hand-off: the request id in the QR code is a bearer secret until the parent approves. Anyone who photographs
  the code before then could receive the consent on their own device. Production: short expiry plus a code shown
  on both screens.

## Plan to the deadline

- [x] **Day 1 (Oct 26)**: contract + tests, consent/grant/revoke/verify API, parent dashboard, consent screen, demo
  app, audit view; full loop verified locally
- [x] **Day 2 (done Oct 26)**: deployed to Base Sepolia + Vercel, BaseScan links
- [x] QR hand-off between the child's and parent's devices (request id recorded on-chain, child device polls)
- [ ] **Day 3 (Oct 28)**: polish (mobile, empty/error states), second demo app showing unlinkable pseudonyms,
  legal mapping page (COPPA / GDPR Art. 8 / NDPA requirement → feature)
- [ ] **Day 4 (Oct 29)**: demo video script + recording, README screenshots
- [ ] **Day 5 (Oct 30)**: DoraHacks submission; Oct 31 is buffer
