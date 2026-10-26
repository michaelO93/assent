# idv-attestation: decentralized adult-ID attestation for Assent

A Chainlink CRE workflow that removes Assent's single trusted key from identity verification.

1. A parent asks to be verified. The app opens a session with the ID provider and calls
   `ConsentRegistry.requestVerification(guardian, sessionRef)`, which emits `VerificationRequested`.
2. This workflow's **EVM log trigger** fires on that event (Base Sepolia).
3. Every DON node calls the ID provider's API (`GET /api/idv/sessions/{sessionRef}?guardian=…`) and
   the DON agrees on the answer with **identical-result consensus**.
4. Only if the provider approved the session, the DON signs a report `(guardian, keccak256(reference))`
   and the **EVM write** capability delivers it through the Chainlink forwarder to
   `ConsentRegistry.onReport()`, which marks the guardian verified and records the forwarder as the verifier.

No identity data goes onchain: only a hash of the provider's session reference.

## Run the simulation

From `cre/` (needs `cre login`, and `CRE_ETH_PRIVATE_KEY` in `cre/.env` funded on Base Sepolia):

```bash
bun install --cwd ./idv-attestation
# emit a request for a fresh test guardian (prints the tx hash)
npm run request-verification --prefix ../chain
# dry run, then broadcast the verification onchain
cre workflow simulate idv-attestation --non-interactive --trigger-index 0 \
  --evm-tx-hash <tx> --evm-event-index 0 --target staging-settings --broadcast
```

Or keep it listening and drive it from the app (run the app with `NEXT_PUBLIC_ATTESTATION_MODE=cre`, then click
"Run ID check" on the parent dashboard):

```bash
cre workflow simulate idv-attestation --listen --broadcast --target staging-settings
```

## Recorded runs (Base Sepolia)

| Run | Result |
| --- | --- |
| Approved session, broadcast | Guardian verified via the forwarder: [0xfb61d4…cdc5](https://sepolia.basescan.org/tx/0xfb61d4b03da28f1975fc1738ba75cbc1344aa189de3c117d9d545c0cb5f9cdc5) |
| Session the provider never issued | Rejected by the workflow; nothing written |
| From the app, listen mode | Dashboard shows "Verified via Chainlink CRE": [0x364eef…7c7b](https://sepolia.basescan.org/tx/0x364eefef573bef86350d3733e88470688cf95783100f3d178b0759315fc97c7b) |

## Limits

- Simulation delivers reports through Chainlink's **MockKeystoneForwarder**, which does not verify DON
  signatures, so during simulation anyone could submit a report through it. Production deploys the
  workflow and calls `setCreForwarder(0xF8344CFd5c43616a4366C34E3EEE75af79a74482)` (the Base Sepolia
  KeystoneForwarder), which only delivers DON-signed reports.
- The ID provider is simulated (`src/lib/server/idv.ts`): it approves every session it issued.
