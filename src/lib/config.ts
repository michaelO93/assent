import { baseSepolia, hardhat, type Chain } from "viem/chains";
import localhost from "./generated/deployment.localhost.json";
import baseSepoliaDeployment from "./generated/deployment.baseSepolia.json";

export type NetworkName = "localhost" | "baseSepolia";

export const network: NetworkName =
  process.env.NEXT_PUBLIC_ASSENT_NETWORK === "baseSepolia" ? "baseSepolia" : "localhost";

const deployments = { localhost, baseSepolia: baseSepoliaDeployment };
const chains: Record<NetworkName, Chain> = { localhost: hardhat, baseSepolia };

export const deployment = deployments[network] as {
  chainId: number;
  address: string | null;
  attestor: string | null;
  creForwarder?: string | null;
};

/**
 * "direct": the attestor key records ID checks (default, works without anything else running).
 * "cre": the app only requests verification; a Chainlink CRE workflow checks the ID provider and
 * reports back through the forwarder. Needs the workflow running (simulated or deployed).
 */
export const attestationMode: "direct" | "cre" =
  process.env.NEXT_PUBLIC_ATTESTATION_MODE === "cre" ? "cre" : "direct";

export function verifiedVia(verifiedBy: string | null | undefined): "cre" | "attestor" | null {
  if (!verifiedBy || /^0x0+$/.test(verifiedBy)) return null;
  return deployment.creForwarder && verifiedBy.toLowerCase() === deployment.creForwarder.toLowerCase()
    ? "cre"
    : "attestor";
}

export const chain = chains[network];

export function explorerTx(hash: string): string | null {
  return network === "baseSepolia" ? `https://sepolia.basescan.org/tx/${hash}` : null;
}

export function explorerAddress(address: string): string | null {
  return network === "baseSepolia" ? `https://sepolia.basescan.org/address/${address}` : null;
}
