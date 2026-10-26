import { NextResponse } from "next/server";
import { isAddress, isHex, type Address, type Hex } from "viem";
import { getApp } from "@/lib/apps";
import {
  NO_REQUEST,
  appIdOf,
  buildReceipt,
  isBytes32,
  normalizeScopes,
  receiptHash,
  validateScopes,
  type AgeBand,
} from "@/lib/consent";
import { contractErrorMessage, publicClient, registry, sendTx } from "@/lib/server/chain";
import { MAX_CONSENTS_PER_GUARDIAN, guardRelay } from "@/lib/server/guard";

type GrantBody = {
  app: string;
  guardian: Address;
  subject: Hex;
  ageBand: AgeBand;
  expiresAt: number;
  approvedScopes: string[];
  requestId?: Hex;
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
  if (body.requestId !== undefined && !isBytes32(body.requestId)) return bad("Invalid request id");
  const requestId = body.requestId ?? NO_REQUEST;
  const scopes = body.approvedScopes ?? [];
  const scopeError = validateScopes(app, scopes);
  if (scopeError) return bad(scopeError);

  const existing = await publicClient.readContract({ ...registry, functionName: "consentsOf", args: [body.guardian] });
  if (existing.length >= MAX_CONSENTS_PER_GUARDIAN) {
    return bad(`This demo allows ${MAX_CONSENTS_PER_GUARDIAN} consents per parent`);
  }
  const blocked = await guardRelay(req, "write");
  if (blocked) return blocked;

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
        {
          guardian: body.guardian,
          appId: appIdOf(app.slug),
          subject: body.subject,
          receiptHash: hash,
          ageBand: body.ageBand,
          expiresAt: BigInt(body.expiresAt!),
          requestId,
          scopes: normalizeScopes(app, scopes),
        },
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
