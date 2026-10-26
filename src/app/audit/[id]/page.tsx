"use client";

import { use, useEffect, useState } from "react";
import { Badge, Card, Mono, formatDate } from "@/components/ui";
import { api, type ConsentView } from "@/lib/client-api";
import { AGE_BANDS, canonicalJson } from "@/lib/consent";
import { deployment, explorerAddress, network } from "@/lib/config";

type Audit = {
  consent: ConsentView;
  app: { slug: string; name: string; operator: string } | null;
  valid: boolean;
  guardianVerifiedAt: number;
  guardianVerifiedVia: "cre" | "attestor" | null;
  receipt: unknown;
  receiptMatches: boolean;
};

export default function AuditRecord({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Audit>(`/api/consent/${id}`).then(setData, (e) => setError((e as Error).message));
  }, [id]);

  if (error) return <Card className="text-danger">{error}</Card>;
  if (!data) return <p className="text-sm text-ink-soft">Reading the registry&hellip;</p>;

  const { consent: c } = data;
  const registryLink = deployment.address ? explorerAddress(deployment.address) : null;
  const events = [
    { at: c.grantedAt, label: "Consent granted", detail: `Signed by the guardian. Scopes: ${c.scopes.join(", ")}` },
    ...(c.revokedAt ? [{ at: c.revokedAt, label: "Consent withdrawn", detail: "Signed by the guardian." }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Consent record</h1>
          <Mono>{c.consentId}</Mono>
        </div>
        <Badge tone={data.valid ? "good" : "bad"}>{data.valid ? "Valid now" : "Not valid now"}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">Parties</h2>
          <Row k="App">{data.app ? `${data.app.name} (${data.app.operator})` : <Mono>{c.appId}</Mono>}</Row>
          <Row k="Guardian"><Mono>{c.guardian}</Mono></Row>
          <Row k="Guardian ID check">
            {data.guardianVerifiedAt
              ? `Passed ${formatDate(data.guardianVerifiedAt)}, ${
                  data.guardianVerifiedVia === "cre"
                    ? "confirmed by a Chainlink DON (CRE workflow)"
                    : "recorded by the Assent attestor key"
                }`
              : "Not currently verified"}
          </Row>
          <Row k="Child (pseudonym)"><Mono>{c.subject}</Mono></Row>
          <Row k="Age band">{AGE_BANDS[c.ageBand]?.label}</Row>
        </Card>
        <Card className="space-y-3 text-sm">
          <h2 className="font-semibold">Timeline</h2>
          <ol className="space-y-3 border-l border-line pl-4">
            {events.map((e) => (
              <li key={e.label}>
                <p className="font-medium">{e.label}</p>
                <p className="text-ink-soft">{formatDate(e.at)}</p>
                <p className="text-xs text-ink-soft">{e.detail}</p>
              </li>
            ))}
            {!c.revokedAt && (
              <li>
                <p className="font-medium">{c.expiresAt * 1000 > Date.now() ? "Expires" : "Expired"}</p>
                <p className="text-ink-soft">{formatDate(c.expiresAt)}</p>
              </li>
            )}
          </ol>
        </Card>
      </div>

      <Card className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Consent receipt: exactly what the parent was shown and agreed to</h2>
          <Badge tone={data.receiptMatches ? "good" : "bad"}>
            {data.receiptMatches ? "Hash matches the signed record" : "Hash does not match"}
          </Badge>
        </div>
        <p className="text-ink-soft">
          Rebuilt from the app&rsquo;s published notice and the on-chain fields. Its hash must equal the{" "}
          <Mono>receiptHash</Mono> the guardian signed: <Mono>{c.receiptHash}</Mono>
        </p>
        <pre className="max-h-80 overflow-auto rounded-xl bg-muted p-4 text-xs">
          {JSON.stringify(JSON.parse(canonicalJson(data.receipt)), null, 2)}
        </pre>
      </Card>

      <p className="text-xs text-ink-soft">
        Registry <Mono>{deployment.address}</Mono> on {network === "baseSepolia" ? "Base Sepolia" : "a local test chain"}
        {registryLink && <> &middot; <a className="underline" href={registryLink} target="_blank" rel="noreferrer">view on BaseScan</a></>}
      </p>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs text-ink-soft">{k}</span>
      <span>{children}</span>
    </div>
  );
}
