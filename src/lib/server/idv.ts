import "server-only";
import { createHmac } from "node:crypto";
import type { Address, Hex } from "viem";

// A stand-in identity-verification provider (think Smile ID or Yoti). A real provider runs a
// document + liveness check and returns a session result; this one approves every session it
// issued. Sessions are stateless: the reference is an HMAC of the guardian address, so any
// caller (including every node in a Chainlink DON) gets the same deterministic answer.

const SECRET = process.env.IDV_MOCK_SECRET ?? "assent-simulated-idv";

export function sessionRefFor(guardian: Address): Hex {
  return `0x${createHmac("sha256", SECRET).update(guardian.toLowerCase()).digest("hex")}`;
}

export function lookupSession(ref: string, guardian: Address) {
  if (ref.toLowerCase() !== sessionRefFor(guardian)) return { status: "not_found" as const };
  return {
    status: "approved" as const,
    provider: "Simulated ID provider",
    guardian: guardian.toLowerCase(),
    adult: true,
    reference: ref.toLowerCase(),
  };
}
