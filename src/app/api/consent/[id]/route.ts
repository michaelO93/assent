import { NextResponse } from "next/server";
import { isHex, type Hex } from "viem";
import { getApp } from "@/lib/apps";
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

  const app = getApp(appSlugOf(consent.appId));
  const [guardianVerifiedAt, valid] = await Promise.all([
    publicClient.readContract({ ...registry, functionName: "guardianVerifiedAt", args: [consent.guardian] }),
    publicClient.readContract({
      ...registry,
      functionName: "isValid",
      args: [consent.consentId, consent.appId, consent.subject],
    }),
  ]);

  const receipt = app
    ? buildReceipt({
        app,
        guardian: consent.guardian,
        subject: consent.subject,
        ageBand: consent.ageBand as AgeBand,
        expiresAt: consent.expiresAt,
        approvedScopes: consent.scopes,
      })
    : null;

  return NextResponse.json({
    consent,
    app: app ? { slug: app.slug, name: app.name, operator: app.operator } : null,
    valid,
    guardianVerifiedAt: Number(guardianVerifiedAt),
    receipt,
    receiptMatches: receipt ? receiptHash(receipt) === consent.receiptHash : false,
  });
}
