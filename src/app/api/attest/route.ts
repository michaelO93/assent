import { NextResponse } from "next/server";
import { isAddress, keccak256, toHex } from "viem";
import { attestationMode } from "@/lib/config";
import { contractErrorMessage, publicClient, registry, sendTx } from "@/lib/server/chain";
import { guardRelay } from "@/lib/server/guard";
import { sessionRefFor } from "@/lib/server/idv";

// Adult identity verification against the (simulated) ID provider. In production this is where a
// provider such as Smile ID or Yoti checks the guardian; only a hash of the provider's reference
// ever reaches the chain, never the document or the person's details.
//
// In "direct" mode the attestor key records the result. In "cre" mode the app only opens a provider
// session and emits VerificationRequested; the Chainlink CRE workflow confirms the session across its
// DON and reports the verification onchain, so no single key decides who is a verified adult.
export async function POST(req: Request) {
  const { guardian } = (await req.json()) as { guardian?: string };
  if (!guardian || !isAddress(guardian)) {
    return NextResponse.json({ error: "A valid guardian address is required" }, { status: 400 });
  }

  const verifiedAt = await publicClient.readContract({ ...registry, functionName: "guardianVerifiedAt", args: [guardian] });
  if (verifiedAt > 0n) return NextResponse.json({ alreadyVerified: true, provider: "Simulated ID check" });

  const blocked = await guardRelay(req, "attest");
  if (blocked) return blocked;

  if (attestationMode === "cre") {
    try {
      const sessionRef = sessionRefFor(guardian);
      const { hash } = await sendTx({ ...registry, functionName: "requestVerification", args: [guardian, sessionRef] });
      return NextResponse.json({ pending: true, txHash: hash, provider: "Simulated ID check", via: "cre" });
    } catch (e) {
      return NextResponse.json({ error: contractErrorMessage(e) }, { status: 400 });
    }
  }

  const reference = `simulated-idv:${crypto.randomUUID()}`;
  try {
    const { hash } = await sendTx({
      ...registry,
      functionName: "verifyGuardian",
      args: [guardian, keccak256(toHex(reference))],
    });
    return NextResponse.json({ txHash: hash, provider: "Simulated ID check" });
  } catch (e) {
    return NextResponse.json({ error: contractErrorMessage(e) }, { status: 400 });
  }
}
