# DoraHacks submission: Assent

Copy each section into the matching field on the DoraHacks "Submit BUIDL" form. Field names on the form may differ
slightly; the content maps one-to-one. Items marked **[you]** need your input.

---

## BUIDL name

Assent

## Vision / one-liner

Verifiable, revocable parental consent for children's apps: parents decide, apps get proof, and children's identities
never leave the family's device.

## Track

LegalTech & RegTech (data privacy for minors)

## Tags

`RegTech` `LegalTech` `Privacy` `Children` `Consent` `COPPA` `GDPR` `NDPA` `Ethereum` `Base`

## Links

- **Live demo:** https://assent-sage.vercel.app (start at https://assent-sage.vercel.app/demo/doodle-quest)
- **GitHub:** https://github.com/michaelO93/assent
- **Demo video:** **[you]** paste the YouTube or Loom link once it's uploaded
- **Contract (Base Sepolia):** https://sepolia.basescan.org/address/0x18bf6248cd8dfa615987a6c2b201a09ec81bd437
- **Legal mapping:** https://assent-sage.vercel.app/legal

## Team

**[you]** Michael Onyeforo: your role (e.g. "Solo builder: product, contracts, full-stack") and any links you want
to share.

---

## Details (paste as Markdown)

### The problem

Children's data-protection laws (COPPA in the US, GDPR Article 8 in the EU, the UK Children's Code and Nigeria's
Data Protection Act 2023) require parental consent before an app processes a child's data. In practice:

- **Age gates prove nothing.** "Are you over 13?" is one tap for any child.
- **Real verification creates new risk.** Apps that check properly collect parents' ID documents and card details,
  which become another trove of sensitive data to breach.
- **Consent can't be proven.** When a regulator asks, the app produces a row in its own database: editable,
  backdatable and easy to lose.

Regulators are enforcing this. Epic Games paid $275 million in 2022 to settle COPPA charges.

### What Assent does

Assent is a consent layer that children's apps integrate in three OAuth-style steps.

1. **The child asks.** The app explains in plain words what it wants and shows a QR code.
2. **The parent decides on their own phone.** They verify once that they're an adult, then see each data use: the
   purpose, the data, how long it's kept, and who it's shared with. Optional uses start switched off. They approve
   what they choose and sign with a key that never leaves their device.
3. **The app gets proof, not an identity.** It receives the approved permissions, the child's age band (under 13,
   13 to 15, or 16 to 17) and a random ID that only works in that app. It never sees the child's name or birthday,
   and two apps can't link the same child.
4. **The parent can withdraw at any time.** One tap, and the app's next check fails.
5. **Anyone can audit.** A regulator or auditor can look up a consent, see when it was granted and withdrawn,
   rebuild the exact notice the parent agreed to, and verify its hash against the signed record.

### Why a ledger

Every grant and withdrawal is signed by the parent (EIP-712) and verified by the smart contract. Neither the app nor
Assent's own operator can fabricate consent, backdate it, or quietly delete a withdrawal. The evidence outlives any
one company's database, and checking it requires trusting no one.

| On-chain | Never leaves the parent's device |
| --- | --- |
| Parent's pseudonymous signing address, per-app child pseudonym, age band, approved permissions, receipt hash, timestamps | Child's name and birth year, parent's ID and personal details, anything that links a child across apps |

### Legal mapping

We mapped Assent against **22 requirements** across COPPA, GDPR, the UK Children's Code and the NDPA 2023:
**15 addressed, 6 partly addressed, 1 gap**, each cited and explained at https://assent-sage.vercel.app/legal. We
marked the shortfalls on purpose: for example, the 13 to 15 age band can't distinguish EU countries that set the
consent age at 14 or 15, and Assent can't yet confirm that an app actually deleted data after a withdrawal. The page
also answers the hard questions: blockchain versus the right to erasure, how parenthood is established, and who the
data controller is.

### How it's built

- **Smart contract:** `ConsentRegistry` (Solidity 0.8.28, OpenZeppelin EIP-712 and SignatureChecker, so smart-account
  and passkey wallets work too). It covers guardian-signed grants and revocations, attestor-verified guardians, a
  per-app pseudonym and receipt hash per consent, and request IDs that link a QR-code request to its approval. There
  are 9 Hardhat tests, including signature forgery, replay and request-ID tampering.
- **App:** Next.js 15, TypeScript, viem and Tailwind, on Vercel. A relayer pays gas, so parents need no wallet or
  crypto. Abuse guards include per-IP rate limits, a per-parent cap and a gas floor.
- **Network:** Base Sepolia testnet.
- **Integration:** apps redirect to Assent (or show its QR code) and then call one endpoint, or read `isValid()`
  on-chain directly, before processing a child's data. See https://assent-sage.vercel.app/developers.

### Prototype limits

- The adult ID check is **simulated**. Production would hand off to a provider such as Smile ID, Dojah or VerifyMe
  (Nigeria) or Yoti (UK/EU).
- The parent's key is stored in the browser. Production would use a passkey-backed smart account, which the contract
  already supports.
- Rate limits are per server instance. Production would use a shared store.
- This is a prototype analysis, not legal advice.

### What's next

1. Interviews with children's app and edtech operators in Nigeria, the UK and the US to validate demand and pricing.
2. A real identity provider integration and passkeys.
3. On-chain deletion confirmations from apps, and per-jurisdiction age bands.
4. A legal review with counsel, and exploring the FTC's process for approving new parental-consent methods under COPPA.
5. Business model: apps pay per verified parent or active consent; free for parents.
