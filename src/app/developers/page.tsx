import { Card } from "@/components/ui";

const redirect = `// 1. Send the parent to Assent with your app id and a random state
const state = crypto.randomUUID();
sessionStorage.setItem("assent-state", state);
location.href = "https://assent.example/consent?" + new URLSearchParams({
  app: "doodle-quest",
  return: "/assent/callback",
  state,
});`;

const callback = `// 2. Assent redirects back with ?consentId=…&subject=…&state=…
// Check state, then store consentId + subject against the child's account.`;

const verify = `// 3. Before processing the child's data, check the consent is live
const res = await fetch(\`/api/verify?app=doodle-quest&consentId=\${id}&subject=\${subject}\`);
const { valid, ageBand, scopes } = await res.json();
if (!valid) lockAccount();               // withdrawn or expired
if (!scopes.includes("gallery.share")) hideSharing();`;

const onchain = `// Or read the registry yourself, no Assent server needed
await publicClient.readContract({
  address: REGISTRY, abi, functionName: "isValid",
  args: [consentId, keccak256(toHex("doodle-quest")), subject],
});`;

export default function Developers() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add Assent to your app</h1>
        <p className="mt-2 text-ink-soft">
          Three steps, OAuth-style. You never handle parents&rsquo; IDs, and your consent records hold up to an audit
          because the parent signed them, not you.
        </p>
      </div>
      {[redirect, callback, verify, onchain].map((code, i) => (
        <Card key={i} className="p-0">
          <pre className="overflow-x-auto p-5 text-xs leading-relaxed">{code}</pre>
        </Card>
      ))}
    </div>
  );
}
