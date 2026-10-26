"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddChildForm, CreateKeyCard, VerifyAdultCard } from "@/components/guardian-setup";
import { Badge, Button, ButtonLink, Card, Spinner, formatDate } from "@/components/ui";
import { getApp } from "@/lib/apps";
import { api, type ConsentView } from "@/lib/client-api";
import { AGE_BANDS, eip712Domain, revokeTypes, subjectOf } from "@/lib/consent";
import { removeChild, type Child } from "@/lib/guardian";
import { safeReturnPath } from "@/lib/paths";
import { useGuardian } from "@/lib/use-guardian";

export default function ParentPage() {
  return (
    <Suspense>
      <ParentDashboard />
    </Suspense>
  );
}

function ParentDashboard() {
  const next = safeReturnPath(useSearchParams().get("next"));
  const g = useGuardian();

  if (!g.ready) return null;

  const verified = (g.state?.verifiedAt ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Parent dashboard</h1>
        <p className="mt-2 text-ink-soft">Every app your children use with your permission, and what each one may do.</p>
      </div>

      {g.error && <Card className="text-sm text-danger">Couldn&rsquo;t reach the registry: {g.error}</Card>}

      {!g.account ? (
        <CreateKeyCard onCreate={() => g.create()} />
      ) : (
        <>
          <VerifyAdultCard
            address={g.account.address}
            verifiedAt={g.state?.verifiedAt ?? 0}
            verifiedVia={g.state?.verifiedVia}
            onVerified={g.refresh}
          />

          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Your children</h2>
              <p className="mt-1 text-sm text-ink-soft">Stored only on this device.</p>
            </div>
            {g.children.length > 0 && (
              <ul className="divide-y divide-line">
                {g.children.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <span>
                      <span className="font-medium">{c.nickname}</span>{" "}
                      <span className="text-sm text-ink-soft">born {c.birthYear}</span>
                    </span>
                    <Button
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        removeChild(c.id);
                        g.refresh();
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <AddChildForm onAdded={() => g.refresh()} />
          </Card>

          {next && verified && g.children.length > 0 && (
            <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/40">
              <p className="text-sm">You&rsquo;re set up. Go back to the app that asked for your permission.</p>
              <ButtonLink href={next}>Continue</ButtonLink>
            </Card>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Permissions you&rsquo;ve given</h2>
            {!g.state ? (
              <p className="text-sm text-ink-soft">Loading&hellip;</p>
            ) : g.state.consents.length === 0 ? (
              <Card className="text-sm text-ink-soft">
                None yet. When an app asks for your permission you&rsquo;ll see it here.{" "}
                <Link href="/demo/doodle-quest" className="text-brand underline">Try the demo app</Link>.
              </Card>
            ) : (
              g.state.consents.map((c) => (
                <ConsentCard
                  key={c.consentId}
                  consent={c}
                  child={childFor(g.children, c)}
                  nonce={BigInt(g.state!.nonce)}
                  sign={g.account!.signTypedData}
                  onChange={() => g.refresh()}
                />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

function childFor(children: Child[], c: ConsentView) {
  return c.app ? children.find((child) => subjectOf(child.secret, c.app!) === c.subject) : undefined;
}

function ConsentCard({
  consent: c,
  child,
  nonce,
  sign,
  onChange,
}: {
  consent: ConsentView;
  child?: Child;
  nonce: bigint;
  sign: (args: Parameters<NonNullable<ReturnType<typeof useGuardian>["account"]>["signTypedData"]>[0]) => Promise<`0x${string}`>;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const app = getApp(c.app);
  const now = Date.now() / 1000;
  const status = c.revokedAt ? "revoked" : c.expiresAt < now ? "expired" : "active";

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      const signature = await sign({
        domain: eip712Domain(),
        types: revokeTypes,
        primaryType: "Revoke",
        message: { consentId: c.consentId, nonce },
      });
      await api("/api/revoke", { consentId: c.consentId, signature });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {app?.name ?? "Unknown app"}
            {child && <span className="font-normal text-ink-soft"> &middot; for {child.nickname}</span>}
          </h3>
          <p className="text-sm text-ink-soft">
            {AGE_BANDS[c.ageBand]?.label} &middot; granted {formatDate(c.grantedAt)}
            {status === "active" && <> &middot; renews by {formatDate(c.expiresAt)}</>}
            {status === "revoked" && <> &middot; withdrawn {formatDate(c.revokedAt)}</>}
          </p>
        </div>
        <Badge tone={status === "active" ? "good" : status === "revoked" ? "bad" : "warn"}>
          {status === "active" ? "Active" : status === "revoked" ? "Withdrawn" : "Expired"}
        </Badge>
      </div>

      {app && (
        <ul className="flex flex-wrap gap-2">
          {app.scopes.map((s) => (
            <li key={s.id}>
              <Badge tone={c.scopes.includes(s.id) ? "brand" : "neutral"}>
                {c.scopes.includes(s.id) ? "✓" : "✕"} {s.label}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <Button variant="danger" onClick={revoke} disabled={busy}>
            {busy && <Spinner />} Withdraw permission
          </Button>
        )}
        <ButtonLink href={`/audit/${c.consentId}`} variant="ghost">View audit record</ButtonLink>
      </div>
    </Card>
  );
}
