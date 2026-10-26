import hre from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// Emits VerificationRequested for a guardian, the event the CRE identity workflow listens for.
// GUARDIAN=0x... to use an existing parent address; otherwise a fresh test address is used.
// SESSION_REF=0x... forces a session id the provider never issued.
// Prints the tx hash to pass to `cre workflow simulate --evm-tx-hash`.
async function main() {
  const deployment = JSON.parse(
    readFileSync(resolve(__dirname, `../../src/lib/generated/deployment.${hre.network.name}.json`), "utf8"),
  );
  const guardian = (process.env.GUARDIAN ?? privateKeyToAccount(generatePrivateKey()).address) as `0x${string}`;
  const idvUrl = process.env.IDV_URL ?? "https://assent-sage.vercel.app/api/idv/sessions";

  const res = await fetch(idvUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ guardian }),
  });
  // SESSION_REF overrides the provider's session, e.g. to show an unapproved session is rejected.
  const sessionRef = (process.env.SESSION_REF ??
    ((await res.json()) as { sessionRef: string }).sessionRef) as `0x${string}`;

  const registry = await hre.viem.getContractAt("ConsentRegistry", deployment.address);
  const hash = await registry.write.requestVerification([guardian, sessionRef]);
  await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash });
  console.log(`guardian ${guardian}`);
  console.log(`session  ${sessionRef}`);
  console.log(`tx       ${hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
