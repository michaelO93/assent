import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { lookupSession } from "@/lib/server/idv";

export const dynamic = "force-dynamic";

// Simulated ID provider: the session result the Chainlink CRE workflow checks before it
// reports a guardian as verified. GET /api/idv/sessions/{ref}?guardian=0x...
export async function GET(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const guardian = new URL(req.url).searchParams.get("guardian");
  if (!guardian || !isAddress(guardian)) {
    return NextResponse.json({ error: "guardian query parameter is required" }, { status: 400 });
  }
  const session = lookupSession(ref, guardian);
  return NextResponse.json(session, { status: session.status === "approved" ? 200 : 404 });
}
