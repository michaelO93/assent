import { encodePacked, keccak256, toBytes, toHex, type Address, type Hex } from "viem";
import { APPS, type AppManifest } from "./apps";
import { deployment } from "./config";

export const AGE_BANDS = [
  { value: 0, label: "Under 13" },
  { value: 1, label: "13 to 15" },
  { value: 2, label: "16 to 17" },
] as const;

export type AgeBand = 0 | 1 | 2;

export function ageBandFromBirthYear(birthYear: number, now = new Date()): AgeBand | null {
  const age = now.getFullYear() - birthYear; // conservative: may be a year older than real age
  if (age < 13) return 0;
  if (age < 16) return 1;
  if (age < 18) return 2;
  return null;
}

export const appIdOf = (slug: string): Hex => keccak256(toHex(slug));

/** Per-app pseudonym for a child. Two apps see two unrelated values for the same child. */
export const subjectOf = (childSecret: Hex, slug: string): Hex =>
  keccak256(encodePacked(["bytes32", "bytes32"], [childSecret, appIdOf(slug)]));

export const eip712Domain = () =>
  ({
    name: "Assent",
    version: "1",
    chainId: deployment.chainId,
    verifyingContract: deployment.address as Address,
  }) as const;

export const grantTypes = {
  Grant: [
    { name: "appId", type: "bytes32" },
    { name: "subject", type: "bytes32" },
    { name: "receiptHash", type: "bytes32" },
    { name: "ageBand", type: "uint8" },
    { name: "expiresAt", type: "uint64" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export const revokeTypes = {
  Revoke: [
    { name: "consentId", type: "bytes32" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export type ReceiptInput = {
  app: AppManifest;
  guardian: Address;
  subject: Hex;
  ageBand: AgeBand;
  expiresAt: number;
  approvedScopes: string[];
};

/**
 * The consent receipt: exactly what the guardian agreed to. It contains no personal data and
 * is rebuilt from the app's manifest plus on-chain fields, so anyone holding the manifest can
 * recompute its hash and check it against the registry.
 */
export function buildReceipt({ app, guardian, subject, ageBand, expiresAt, approvedScopes }: ReceiptInput) {
  const approved = new Set(approvedScopes);
  return {
    v: 1,
    registry: { chainId: deployment.chainId, address: deployment.address },
    app: {
      slug: app.slug,
      name: app.name,
      operator: app.operator,
      policyUrl: app.policyUrl,
      manifestVersion: app.manifestVersion,
    },
    guardian: guardian.toLowerCase(),
    subject,
    ageBand,
    expiresAt,
    approved: app.scopes.filter((s) => approved.has(s.id)),
    declined: app.scopes.filter((s) => !approved.has(s.id)).map((s) => s.id),
  };
}

export type Receipt = ReturnType<typeof buildReceipt>;

/** JSON with recursively sorted keys, so the same receipt always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const receiptHash = (receipt: Receipt): Hex => keccak256(toBytes(canonicalJson(receipt)));

/** Scope ids in manifest order, as stored on-chain. */
export function normalizeScopes(app: AppManifest, approvedScopes: string[]): string {
  const approved = new Set(approvedScopes);
  return app.scopes.filter((s) => approved.has(s.id)).map((s) => s.id).join(",");
}

export function validateScopes(app: AppManifest, approvedScopes: string[]): string | null {
  const known = new Set(app.scopes.map((s) => s.id));
  const unknown = approvedScopes.find((s) => !known.has(s));
  if (unknown) return `Unknown scope: ${unknown}`;
  const missing = app.scopes.find((s) => s.required && !approvedScopes.includes(s.id));
  if (missing) return `Required scope missing: ${missing.id}`;
  return null;
}

export const ONE_YEAR = 365 * 24 * 60 * 60;

export function appSlugOf(appId: Hex): string | undefined {
  return Object.keys(APPS).find((slug) => appIdOf(slug) === appId.toLowerCase());
}
