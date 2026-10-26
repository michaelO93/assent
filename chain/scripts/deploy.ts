import hre from "hardhat";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Deploys ConsentRegistry and writes its address + ABI into the web app.
// The attestor (who marks guardians as verified adults) defaults to the deployer.
async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const attestor = (process.env.ATTESTOR_ADDRESS as `0x${string}` | undefined) ?? deployer.account.address;

  const registry = await hre.viem.deployContract("ConsentRegistry", [attestor]);

  // Chainlink forwarder that may deliver CRE identity-check reports. Defaults to the Base Sepolia
  // MockKeystoneForwarder used by `cre workflow simulate --broadcast` (docs: Forwarder Directory);
  // switch to the production KeystoneForwarder with setCreForwarder() once the workflow is deployed.
  const forwarder = (process.env.CRE_FORWARDER ??
    (hre.network.name === "baseSepolia" ? "0x82300bd7c3958625581cc2f77bc6464dcecdf3e5" : "")) as `0x${string}` | "";
  if (forwarder && attestor === deployer.account.address) {
    const hash = await registry.write.setCreForwarder([forwarder]);
    await publicClient.waitForTransactionReceipt({ hash });
  }
  const chainId = await publicClient.getChainId();
  const artifact = await hre.artifacts.readArtifact("ConsentRegistry");

  const outDir = resolve(__dirname, "../../src/lib/generated");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, `deployment.${hre.network.name}.json`),
    JSON.stringify({ chainId, address: registry.address, attestor, creForwarder: forwarder || null }, null, 2) + "\n",
  );
  writeFileSync(
    resolve(outDir, "abi.ts"),
    `export const consentRegistryAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
  );
  console.log(`ConsentRegistry deployed to ${registry.address} on ${hre.network.name} (chain ${chainId})`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
