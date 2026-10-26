import { NextResponse } from "next/server";
import { isAddress, keccak256, toHex } from "viem";
import { contractErrorMessage, publicClient, registry, sendTx } from "@/lib/server/chain";
import { guardRelay } from "@/lib/server/guard";

// Simulated adult identity verification. In production this is where an ID provider
// (e.g. Smile ID, Yoti) confirms the guardian is an adult; only a hash of the provider's
// reference ever reaches the chain, never the document or the person's details.
export async function POST(req: Request) {
  const { guardian } = (await req.json()) as { guardian?: string };
  if (!guardian || !isAddress(guardian)) {
    return NextResponse.json({ error: "A valid guardian address is required" }, { status: 400 });
  }

  const verifiedAt = await publicClient.readContract({ ...registry, functionName: "guardianVerifiedAt", args: [guardian] });
  if (verifiedAt > 0n) return NextResponse.json({ alreadyVerified: true, provider: "Simulated ID check" });

  const blocked = await guardRelay(req, "attest");
  if (blocked) return blocked;

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
