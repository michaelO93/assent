import { NextResponse } from "next/server";
import { isHex, type Hex } from "viem";
import { contractErrorMessage, registry, sendTx } from "@/lib/server/chain";

export async function POST(req: Request) {
  const { consentId, signature } = (await req.json()) as { consentId?: Hex; signature?: Hex };
  if (!consentId || !isHex(consentId) || consentId.length !== 66) {
    return NextResponse.json({ error: "Invalid consent id" }, { status: 400 });
  }
  if (!signature || !isHex(signature)) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  try {
    const { hash } = await sendTx({ ...registry, functionName: "revoke", args: [consentId, signature] });
    return NextResponse.json({ txHash: hash });
  } catch (e) {
    return NextResponse.json({ error: contractErrorMessage(e) }, { status: 400 });
  }
}
