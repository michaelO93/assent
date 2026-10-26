import { NextResponse } from "next/server";
import { getApp } from "@/lib/apps";
import { NO_REQUEST, appIdOf, isBytes32 } from "@/lib/consent";
import { publicClient, readConsent, registry } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// Polled by the device that showed the QR code. Once a parent approves on their own phone,
// the registry maps the request id to the consent, and the child's device picks it up here.
export async function GET(req: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const app = getApp(new URL(req.url).searchParams.get("app"));
  if (!app || !isBytes32(requestId) || requestId === NO_REQUEST) {
    return NextResponse.json({ error: "app and a request id are required" }, { status: 400 });
  }

  const consentId = await publicClient.readContract({
    ...registry,
    functionName: "consentByRequest",
    args: [requestId],
  });
  if (consentId === NO_REQUEST) return NextResponse.json({ status: "pending" });

  const consent = await readConsent(consentId);
  if (!consent || consent.appId !== appIdOf(app.slug)) {
    return NextResponse.json({ error: "This request belongs to a different app" }, { status: 409 });
  }
  return NextResponse.json({ status: "approved", consentId, subject: consent.subject });
}
