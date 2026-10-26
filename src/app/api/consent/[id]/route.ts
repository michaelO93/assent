import { NextResponse } from "next/server";
import { isHex, type Hex } from "viem";
import { getAppVersions } from "@/lib/apps";
import { appSlugOf, buildReceipt, receiptHash, type AgeBand } from "@/lib/consent";
import { publicClient, readConsent, registry } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// Audit view of one consent: the on-chain record plus the receipt rebuilt from the app's
// manifest, with a check that its hash matches what the guardian signed.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isHex(id) || id.length !== 66) return NextResponse.json({ error: "Invalid consent id" }, { status: 400 });

  const consent = await readConsent(id as Hex);
  if (!consent) return NextResponse.json({ error: "No consent with this id" }, { status: 404 });

  const versions = getAppVersions(appSlugOf(consent.appId));
  const app = versions[0];
  const [guardianVerifiedAt, valid] = await Promise.all([
    publicClient.readContract({ ...registry, functionName: "guardianVerifiedAt", args: [consent.guardian] }),
    publicClient.readContract({
      ...registry,
      functionName: "isValid",
      args: [consent.consentId, consent.appId, consent.subject],
    }),
  ]);

  // Rebuild the receipt against each published notice version; the one whose hash matches
  // the signed record is the notice the parent actually saw.
  const candidates = versions.map((v) =>
    buildReceipt({
      app: v,
      guardian: consent.guardian,
      subject: consent.subject,
      ageBand: consent.ageBand as AgeBand,
      expiresAt: consent.expiresAt,
      approvedScopes: consent.scopes,
    }),
  );
  const matched = candidates.find((r) => receiptHash(r) === consent.receiptHash);
  const receipt = matched ?? candidates[0] ?? null;

  return NextResponse.json({
    consent,
    app: app ? { slug: app.slug, name: app.name, operator: app.operator } : null,
    valid,
    guardianVerifiedAt: Number(guardianVerifiedAt),
    receipt,
    receiptMatches: !!matched,
  });
}
