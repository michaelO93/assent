import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { sessionRefFor } from "@/lib/server/idv";

// Simulated ID provider: start a verification session for a guardian.
export async function POST(req: Request) {
  const { guardian } = (await req.json()) as { guardian?: string };
  if (!guardian || !isAddress(guardian)) {
    return NextResponse.json({ error: "A valid guardian address is required" }, { status: 400 });
  }
  return NextResponse.json({ sessionRef: sessionRefFor(guardian), status: "approved" });
}
