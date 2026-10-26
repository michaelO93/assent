"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";

export default function AuditSearch() {
  const router = useRouter();
  const [id, setId] = useState("");
  const valid = /^0x[0-9a-fA-F]{64}$/.test(id.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit a consent</h1>
        <p className="mt-2 text-ink-soft">
          For regulators, auditors and app compliance teams. Paste a consent ID to see who signed what, when, and
          whether it still holds. Everything here is read from the public registry, so nobody has to trust the app or Assent.
        </p>
      </div>
      <Card>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) router.push(`/audit/${id.trim()}`);
          }}
        >
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="0x… consent ID"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm"
          />
          <Button type="submit" disabled={!valid}>Look up</Button>
        </form>
      </Card>
    </div>
  );
}
