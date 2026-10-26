import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { appSlugOf } from "@/lib/consent";
import { publicClient, readConsent, registry } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const [verifiedAt, nonce, ids] = await Promise.all([
    publicClient.readContract({ ...registry, functionName: "guardianVerifiedAt", args: [address] }),
    publicClient.readContract({ ...registry, functionName: "nonces", args: [address] }),
    publicClient.readContract({ ...registry, functionName: "consentsOf", args: [address] }),
  ]);
  const consents = await Promise.all(ids.map((id) => readConsent(id)));

  return NextResponse.json({
    verifiedAt: Number(verifiedAt),
    nonce: nonce.toString(),
    consents: consents
      .filter((c) => c !== null)
      .map((c) => ({ ...c, app: appSlugOf(c.appId) ?? null }))
      .reverse(),
  });
}
