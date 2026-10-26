"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddChildForm } from "@/components/guardian-setup";
import { Badge, Button, ButtonLink, Card, Spinner, formatDate } from "@/components/ui";
import { getApp } from "@/lib/apps";
import { api } from "@/lib/client-api";
import {
  AGE_BANDS,
  ONE_YEAR,
  ageBandFromBirthYear,
  appIdOf,
  buildReceipt,
  eip712Domain,
  grantTypes,
  receiptHash,
  subjectOf,
} from "@/lib/consent";
import { safeReturnPath } from "@/lib/paths";
import { useGuardian } from "@/lib/use-guardian";

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentRequest />
    </Suspense>
  );
}

function ConsentRequest() {
  const params = useSearchParams();
  const app = getApp(params.get("app"));
  const returnTo = safeReturnPath(params.get("return"));
  const state = params.get("state") ?? "";
  const g = useGuardian();

  const [childId, setChildId] = useState<string | null>(null);
  const [optional, setOptional] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!app || !returnTo) {
    return <Card className="text-danger">This permission request is incomplete or from an unknown app.</Card>;
  }
  if (!g.ready) return null;

  const here = `/consent?${params.toString()}`;
  const verified = (g.state?.verifiedAt ?? 0) > 0;

  if (!g.account || (g.state && !verified)) {
    return (
      <Card className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">{app.name} is asking for your permission</h1>
        <p className="text-sm text-ink-soft">
          Before you can approve, set up Assent once: create your parent key and confirm you&rsquo;re an adult. It
          takes under a minute and works for every app that uses Assent.
        </p>
        <ButtonLink href={`/parent?next=${encodeURIComponent(here)}`}>Set up Assent</ButtonLink>
      </Card>
    );
  }
  if (!g.state) return <p className="text-sm text-ink-soft">Loading&hellip;</p>;

  const child = g.children.find((c) => c.id === childId) ?? (g.children.length === 1 ? g.children[0] : undefined);
  const band = child ? ageBandFromBirthYear(child.birthYear) : null;
  const approvedScopes = app.scopes.filter((s) => s.required || optional[s.id]).map((s) => s.id);

  async function approve() {
    if (!child || band === null || !g.account || !g.state) return;
    setBusy(true);
    setError(null);
    try {
      const subject = subjectOf(child.secret, app!.slug);
      const expiresAt = Math.floor(Date.now() / 1000) + ONE_YEAR;
      const receipt = buildReceipt({ app: app!, guardian: g.account.address, subject, ageBand: band, expiresAt, approvedScopes });
      const signature = await g.account.signTypedData({
        domain: eip712Domain(),
        types: grantTypes,
        primaryType: "Grant",
        message: {
          appId: appIdOf(app!.slug),
          subject,
          receiptHash: receiptHash(receipt),
          ageBand: band,
          expiresAt: BigInt(expiresAt),
          nonce: BigInt(g.state.nonce),
        },
      });
      const { consentId } = await api<{ consentId: string }>("/api/grant", {
        app: app!.slug,
        guardian: g.account.address,
        subject,
        ageBand: band,
        expiresAt,
        approvedScopes,
        signature,
      });
      const back = new URL(returnTo!, window.location.origin);
      back.searchParams.set("consentId", consentId);
      back.searchParams.set("subject", subject);
      back.searchParams.set("state", state);
      window.location.assign(back.pathname + back.search);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Badge tone="brand">Permission request</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{app.name} would like your permission</h1>
        <p className="text-ink-soft">
          {app.operator} wants to use some of your child&rsquo;s data. Choose what to allow. You can withdraw this at
          any time from your dashboard.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold">Which child is this for?</h2>
        {g.children.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {g.children.map((c) => {
              const b = ageBandFromBirthYear(c.birthYear);
              const selected = child?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className={`rounded-xl border px-4 py-2 text-left text-sm ${selected ? "border-brand bg-brand/10" : "border-line hover:bg-muted"}`}
                >
                  <span className="font-medium">{c.nickname}</span>
                  <span className="block text-xs text-ink-soft">{b !== null ? AGE_BANDS[b].label : "Adult"}</span>
                </button>
              );
            })}
          </div>
        )}
        <AddChildForm onAdded={(c) => { setChildId(c.id); g.refresh(); }} />
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">What {app.name} is asking for</h2>
          <p className="text-sm text-ink-soft">
            Notice version {app.manifestVersion} &middot;{" "}
            <a className="underline" href={app.policyUrl} target="_blank" rel="noreferrer">full privacy policy</a>
          </p>
        </div>
        <ul className="divide-y divide-line">
          {app.scopes.map((s) => (
            <li key={s.id} className="flex gap-4 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--brand)]"
                checked={s.required || !!optional[s.id]}
                disabled={s.required}
                onChange={(e) => setOptional((o) => ({ ...o, [s.id]: e.target.checked }))}
                aria-label={s.label}
              />
              <div className="text-sm">
                <p className="font-medium">
                  {s.label} {s.required ? <Badge>Needed for the app to work</Badge> : <Badge tone="warn">Optional</Badge>}
                </p>
                <p className="mt-1 text-ink-soft">{s.purpose}.</p>
                <p className="mt-1 text-xs text-ink-soft">
                  Data: {s.data.join(", ")} &middot; Kept: {s.retention}
                  {s.sharedWith.length > 0 && <> &middot; Shared with: {s.sharedWith.join(", ")}</>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3 bg-muted/60 text-sm">
        <h2 className="font-semibold">What {app.name} will receive</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-soft">
          <li>
            {child && band !== null
              ? <>That a verified parent approved this for a child aged <b>{AGE_BANDS[band].label.toLowerCase()}</b></>
              : "That a verified parent approved this, and the child's age band"}
          </li>
          <li>A random ID for your child that only works in {app.name}</li>
          <li>The permissions you tick above, valid until {formatDate(Math.floor(Date.now() / 1000) + ONE_YEAR)}</li>
        </ul>
        <p className="text-ink-soft">Not your name, not your child&rsquo;s name, not their birthday.</p>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button onClick={approve} disabled={busy || !child || band === null}>
          {busy && <Spinner />} Approve and sign
        </Button>
        <ButtonLink href={returnTo} variant="secondary">Decline</ButtonLink>
      </div>
    </div>
  );
}
