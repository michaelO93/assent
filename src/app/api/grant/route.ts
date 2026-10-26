import { NextResponse } from "next/server";
import { isAddress, isHex, type Address, type Hex } from "viem";
import { getApp } from "@/lib/apps";
import {
  appIdOf,
  buildReceipt,
  normalizeScopes,
  receiptHash,
  validateScopes,
  type AgeBand,
} from "@/lib/consent";
import { contractErrorMessage, registry, sendTx } from "@/lib/server/chain";

type GrantBody = {
  app: string;
  guardian: Address;
  subject: Hex;
  ageBand: AgeBand;
  expiresAt: number;
  approvedScopes: string[];
  signature: Hex;
};

// Relays a guardian-signed grant. The server rebuilds the receipt itself from the app's
// manifest, so a grant can only be recorded against a notice the app actually published.
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<GrantBody>;
  const app = getApp(body.app);
  if (!app) return NextResponse.json({ error: "Unknown app" }, { status: 400 });
  if (!body.guardian || !isAddress(body.guardian)) return bad("Invalid guardian");
  if (!body.subject || !isHex(body.subject) || body.subject.length !== 66) return bad("Invalid subject");
  if (body.ageBand !== 0 && body.ageBand !== 1 && body.ageBand !== 2) return bad("Invalid age band");
  if (!Number.isInteger(body.expiresAt)) return bad("Invalid expiry");
  if (!body.signature || !isHex(body.signature)) return bad("Missing signature");
  const scopes = body.approvedScopes ?? [];
  const scopeError = validateScopes(app, scopes);
  if (scopeError) return bad(scopeError);

  const receipt = buildReceipt({
    app,
    guardian: body.guardian,
    subject: body.subject,
    ageBand: body.ageBand,
    expiresAt: body.expiresAt!,
    approvedScopes: scopes,
  });
  const hash = receiptHash(receipt);

  try {
    const { hash: txHash, result } = await sendTx({
      ...registry,
      functionName: "grant",
      args: [
        body.guardian,
        appIdOf(app.slug),
        body.subject,
        hash,
        body.ageBand,
        BigInt(body.expiresAt!),
        normalizeScopes(app, scopes),
        body.signature,
      ],
    });
    return NextResponse.json({ consentId: result as Hex, txHash, receiptHash: hash, receipt });
  } catch (e) {
    return bad(contractErrorMessage(e));
  }
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
