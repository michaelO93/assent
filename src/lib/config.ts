import { baseSepolia, hardhat, type Chain } from "viem/chains";
import localhost from "./generated/deployment.localhost.json";
import baseSepoliaDeployment from "./generated/deployment.baseSepolia.json";

export type NetworkName = "localhost" | "baseSepolia";

export const network: NetworkName =
  process.env.NEXT_PUBLIC_ASSENT_NETWORK === "baseSepolia" ? "baseSepolia" : "localhost";

const deployments = { localhost, baseSepolia: baseSepoliaDeployment };
const chains: Record<NetworkName, Chain> = { localhost: hardhat, baseSepolia };

export const deployment = deployments[network] as { chainId: number; address: string | null; attestor: string | null };
export const chain = chains[network];

export function explorerTx(hash: string): string | null {
  return network === "baseSepolia" ? `https://sepolia.basescan.org/tx/${hash}` : null;
}

export function explorerAddress(address: string): string | null {
  return network === "baseSepolia" ? `https://sepolia.basescan.org/address/${address}` : null;
}
