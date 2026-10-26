import { ButtonLink, Card } from "@/components/ui";

const problems = [
  {
    title: "Tick-box age gates prove nothing",
    body: "“I am over 13” is one click for any child. Regulators no longer accept it as consent.",
  },
  {
    title: "Real verification hoards sensitive data",
    body: "Apps that check properly collect parents’ IDs and card details, creating a new breach risk.",
  },
  {
    title: "Consent can’t be proven later",
    body: "When a regulator asks, the app has a database row it controls. It can be edited, backdated or lost.",
  },
];

const steps = [
  ["Verify once", "A parent proves they are an adult with an ID provider. Only a hash of the check is recorded."],
  ["Approve what’s asked", "The app shows exactly what data it wants and why. The parent approves each use and signs."],
  ["App gets a yes, not an identity", "The app receives a per-app pseudonym and the approved scopes. Never the child’s name or birthday."],
  ["Revoke any time", "One tap withdraws consent. The app’s next check fails, and the record shows when."],
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="max-w-3xl space-y-6">
        <p className="text-sm font-medium text-brand">Verifiable parental consent, without the surveillance</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Let parents say yes to an app, without handing it their child&rsquo;s identity.
        </h1>
        <p className="text-lg text-ink-soft">
          COPPA, GDPR Article 8, the UK Children&rsquo;s Code and Nigeria&rsquo;s NDPA 2023 all require parental consent
          before processing a child&rsquo;s data. Assent gives apps proof of that consent and gives parents control of
          it. Every grant and withdrawal is signed by the parent and recorded on a public ledger nobody can quietly edit.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/demo/doodle-quest">Try the demo app</ButtonLink>
          <ButtonLink href="/parent" variant="secondary">Parent dashboard</ButtonLink>
          <ButtonLink href="/legal" variant="ghost">How it maps to the law</ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {problems.map((p) => (
          <Card key={p.title}>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{p.body}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {steps.map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="font-semibold">On the ledger</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li>Parent&rsquo;s pseudonymous signing address</li>
            <li>A per-app pseudonym for the child</li>
            <li>Age band (under 13, 13&ndash;15, 16&ndash;17)</li>
            <li>Approved scopes and a hash of the consent receipt</li>
            <li>When consent was granted, when it expires, when it was withdrawn</li>
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold">Never leaves the parent&rsquo;s device</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li>The child&rsquo;s name and birth year</li>
            <li>The parent&rsquo;s ID document and personal details</li>
            <li>Anything that links the same child across two apps</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
