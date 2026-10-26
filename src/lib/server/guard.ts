import "server-only";
import { NextResponse } from "next/server";
import { parseEther } from "viem";
import { publicClient, relayer } from "./chain";

// Abuse guards for the public demo, where the relayer pays gas for every visitor.
// Limits are per server instance and reset when it recycles: enough to stop casual
// draining of test ETH, not a substitute for a shared store (e.g. Redis) in production.

type Bucket = "attest" | "write";

const LIMITS: Record<Bucket, { max: number; windowMs: number }> = {
  attest: { max: 5, windowMs: 60 * 60 * 1000 },
  write: { max: 30, windowMs: 60 * 60 * 1000 },
};

/** Below this the relayer stops sending, so the demo pauses instead of running dry mid-judging. */
const MIN_RELAYER_BALANCE = parseEther("0.02");
const BALANCE_TTL_MS = 60 * 1000;

const hits = new Map<string, number[]>();
let balanceCache: { ok: boolean; at: number } | null = null;

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(req: Request, bucket: Bucket): number | null {
  const { max, windowMs } = LIMITS[bucket];
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return Math.ceil((recent[0] + windowMs - now) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  return null;
}

async function relayerFunded(): Promise<boolean> {
  if (balanceCache && Date.now() - balanceCache.at < BALANCE_TTL_MS) return balanceCache.ok;
  const balance = await publicClient.getBalance({ address: relayer().account.address });
  balanceCache = { ok: balance >= MIN_RELAYER_BALANCE, at: Date.now() };
  return balanceCache.ok;
}

/** Returns a response to send instead of relaying, or null when the request may proceed. */
export async function guardRelay(req: Request, bucket: Bucket): Promise<NextResponse | null> {
  const retryAfter = rateLimited(req, bucket);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: "Too many requests from your connection. Please try again later." },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }
  if (!(await relayerFunded())) {
    return NextResponse.json(
      { error: "The demo is paused: its test-network gas budget is used up." },
      { status: 503 },
    );
  }
  return null;
}

export const MAX_CONSENTS_PER_GUARDIAN = 25;
