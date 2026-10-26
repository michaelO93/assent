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
  const chainId = await publicClient.getChainId();
  const artifact = await hre.artifacts.readArtifact("ConsentRegistry");

  const outDir = resolve(__dirname, "../../src/lib/generated");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, `deployment.${hre.network.name}.json`),
    JSON.stringify({ chainId, address: registry.address, attestor }, null, 2) + "\n",
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
