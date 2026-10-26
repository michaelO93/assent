"use client";

import { useState } from "react";
import type { Address } from "viem";
import { Badge, Button, Card, Mono, Spinner, formatDate } from "@/components/ui";
import { api } from "@/lib/client-api";
import { addChild, type Child } from "@/lib/guardian";
import { AGE_BANDS, ageBandFromBirthYear } from "@/lib/consent";

export function CreateKeyCard({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Set up your parent key</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Assent creates a signing key on this device. Only you can use it to give or withdraw consent, so not even
          Assent can do it for you. No email, no password, no wallet app.
        </p>
      </div>
      <Button onClick={onCreate}>Create my parent key</Button>
    </Card>
  );
}

export function VerifyAdultCard({
  address,
  verifiedAt,
  onVerified,
}: {
  address: Address;
  verifiedAt: number;
  onVerified: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (verifiedAt > 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Verified adult</h2>
          <p className="text-sm text-ink-soft">Since {formatDate(verifiedAt)} &middot; <Mono>{address}</Mono></p>
        </div>
        <Badge tone="good">Verified</Badge>
      </Card>
    );
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/attest", { guardian: address });
      onVerified();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Confirm you&rsquo;re an adult</h2>
        <p className="mt-1 text-sm text-ink-soft">
          You do this once, not once per app. An identity provider checks your ID and Assent records only that the
          check passed. Your document and details are never stored by Assent or shared with apps.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-warn/50 bg-warn/5 p-4 text-sm">
        <p className="font-medium text-warn">Demo: simulated ID check</p>
        <p className="mt-1 text-ink-soft">
          In production this step hands off to a provider such as Smile ID or Yoti. Here it passes automatically.
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={verify} disabled={busy}>
        {busy && <Spinner />} Run ID check
      </Button>
    </Card>
  );
}

export function AddChildForm({ onAdded }: { onAdded: (child: Child) => void }) {
  const thisYear = new Date().getFullYear();
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState(thisYear - 9);
  const band = ageBandFromBirthYear(birthYear);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nickname.trim() || band === null) return;
        onAdded(addChild(nickname.trim(), birthYear));
        setNickname("");
      }}
    >
      <label className="grid gap-1 text-sm">
        <span className="text-ink-soft">Child&rsquo;s first name</span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Ada"
          className="w-44 rounded-lg border border-line bg-surface px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-ink-soft">Birth year</span>
        <select
          value={birthYear}
          onChange={(e) => setBirthYear(Number(e.target.value))}
          className="rounded-lg border border-line bg-surface px-3 py-2"
        >
          {Array.from({ length: 17 }, (_, i) => thisYear - 1 - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={!nickname.trim() || band === null}>
        Add child
      </Button>
      <p className="w-full text-xs text-ink-soft">
        {band !== null ? `Apps will only see the age band: ${AGE_BANDS[band].label}. ` : ""}
        The name and birth year stay on this device.
      </p>
    </form>
  );
}
