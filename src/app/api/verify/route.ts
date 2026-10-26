import { NextResponse } from "next/server";
import { isHex, type Hex } from "viem";
import { getApp } from "@/lib/apps";
import { appIdOf } from "@/lib/consent";
import { publicClient, readConsent, registry } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// What an app calls before processing a child's data: is this consent live, for this app
// and this child, and which scopes does it cover? Apps can also call isValid() on-chain directly.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const consentId = url.searchParams.get("consentId") as Hex | null;
  const subject = url.searchParams.get("subject") as Hex | null;
  const app = getApp(url.searchParams.get("app"));
  if (!app || !consentId || !isHex(consentId) || !subject || !isHex(subject)) {
    return NextResponse.json({ error: "app, consentId and subject are required" }, { status: 400 });
  }

  const [valid, consent] = await Promise.all([
    publicClient.readContract({
      ...registry,
      functionName: "isValid",
      args: [consentId, appIdOf(app.slug), subject],
    }),
    readConsent(consentId),
  ]);

  return NextResponse.json({
    valid,
    ageBand: valid ? consent?.ageBand : null,
    scopes: valid ? consent?.scopes : [],
    expiresAt: consent?.expiresAt ?? null,
    revokedAt: consent?.revokedAt || null,
  });
}
