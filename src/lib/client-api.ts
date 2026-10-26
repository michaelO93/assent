"use client";

import type { Address, Hex } from "viem";

export type ConsentView = {
  consentId: Hex;
  guardian: Address;
  appId: Hex;
  subject: Hex;
  receiptHash: Hex;
  ageBand: number;
  grantedAt: number;
  expiresAt: number;
  revokedAt: number;
  scopes: string[];
  app: string | null;
};

export type GuardianState = { verifiedAt: number; nonce: string; consents: ConsentView[] };

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const fetchGuardian = (address: Address) => api<GuardianState>(`/api/guardian/${address}`);
