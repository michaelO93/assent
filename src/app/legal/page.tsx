import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui";
import { HARD_QUESTIONS, LAWS, type Status } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal mapping · Assent",
  description: "How Assent meets COPPA, GDPR Article 8, the UK Children's Code and Nigeria's NDPA 2023, and where it doesn't yet.",
};

const statusLabel: Record<Status, { label: string; tone: "good" | "warn" | "bad" }> = {
  addressed: { label: "Addressed", tone: "good" },
  partial: { label: "Partly", tone: "warn" },
  gap: { label: "Gap", tone: "bad" },
};

export default function LegalPage() {
  const all = LAWS.flatMap((l) => l.requirements);
  const count = (s: Status) => all.filter((r) => r.status === s).length;

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Legal mapping</h1>
        <p className="text-ink-soft">
          What four children&rsquo;s data-protection regimes require, and how Assent meets each requirement. Where it
          doesn&rsquo;t yet, we say so: those rows are the roadmap.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge tone="good">{count("addressed")} addressed</Badge>
          <Badge tone="warn">{count("partial")} partly</Badge>
          <Badge tone="bad">{count("gap")} gaps</Badge>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LAWS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="text-brand underline-offset-2 hover:underline">{l.name}</a>
          ))}
          <a href="#questions" className="text-brand underline-offset-2 hover:underline">Hard questions</a>
        </nav>
      </div>

      {LAWS.map((law) => (
        <section key={law.id} id={law.id} className="scroll-mt-6 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{law.name}</h2>
            <p className="text-sm text-ink-soft">{law.scope}</p>
          </div>
          <div className="space-y-3">
            {law.requirements.map((r) => (
              <Card key={r.rule} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:gap-6">
                <div>
                  <p className="font-medium">{r.rule}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">{r.cite}</p>
                </div>
                <div className="text-sm">
                  <p>{r.how}</p>
                  {r.note && <p className="mt-2 text-ink-soft">{r.note}</p>}
                </div>
                <div className="sm:text-right">
                  <Badge tone={statusLabel[r.status].tone}>{statusLabel[r.status].label}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section id="questions" className="scroll-mt-6 space-y-3">
        <h2 className="text-xl font-semibold">Hard questions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {HARD_QUESTIONS.map((h) => (
            <Card key={h.q} className="p-5">
              <p className="font-medium">{h.q}</p>
              <p className="mt-2 text-sm text-ink-soft">{h.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <p className="max-w-3xl text-xs text-ink-soft">
        Prototype analysis prepared for the BLI Legal Tech Hackathon 2, October 2026. It is not legal advice, and a
        production deployment would need review by counsel in each jurisdiction.
      </p>
    </div>
  );
}
