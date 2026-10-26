import "server-only";
import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { consentRegistryAbi } from "../generated/abi";
import { chain, deployment, network } from "../config";

// Hardhat's first default account. Public test key, only ever used against the local chain.
const HARDHAT_ACCOUNT_0 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const rpcUrl = process.env.RPC_URL ?? (network === "localhost" ? "http://127.0.0.1:8545" : undefined);

export const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

function relayerKey(): Hex {
  const key = process.env.RELAYER_PRIVATE_KEY ?? (network === "localhost" ? HARDHAT_ACCOUNT_0 : undefined);
  if (!key) throw new Error("RELAYER_PRIVATE_KEY is not set");
  return key as Hex;
}

/** One key in the demo: it relays guardian-signed transactions and acts as the adult-ID attestor. */
export function relayer() {
  const account = privateKeyToAccount(relayerKey());
  return createWalletClient({ account, chain, transport: http(rpcUrl) });
}

export function registryAddress(): Address {
  if (!deployment.address) throw new Error(`ConsentRegistry is not deployed on ${network}`);
  return deployment.address as Address;
}

export const registry = { abi: consentRegistryAbi, get address() { return registryAddress(); } };

export type OnchainConsent = {
  consentId: Hex;
  guardian: Address;
  appId: Hex;
  subject: Hex;
  receiptHash: Hex;
  ageBand: number;
  grantedAt: number;
  expiresAt: number;
  revokedAt: number;
  scopes: string[];
};

export async function readConsent(consentId: Hex): Promise<OnchainConsent | null> {
  const c = await publicClient.readContract({ ...registry, functionName: "getConsent", args: [consentId] });
  if (c.guardian === "0x0000000000000000000000000000000000000000") return null;
  return {
    consentId,
    guardian: c.guardian,
    appId: c.appId,
    subject: c.subject,
    receiptHash: c.receiptHash,
    ageBand: c.ageBand,
    grantedAt: Number(c.grantedAt),
    expiresAt: Number(c.expiresAt),
    revokedAt: Number(c.revokedAt),
    scopes: c.scopes ? c.scopes.split(",") : [],
  };
}

/** Simulate first so contract errors come back by name, then send and wait for inclusion. */
export async function sendTx(
  request: Parameters<typeof publicClient.simulateContract>[0],
): Promise<{ hash: Hex; result: unknown }> {
  const sim = await publicClient.simulateContract(request);
  const hash = await relayer().writeContract(sim.request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Transaction ${hash} reverted`);
  return { hash, result: sim.result };
}

export function contractErrorMessage(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; cause?: { data?: { errorName?: string } } };
  const name = err.cause?.data?.errorName;
  return name ?? err.shortMessage ?? err.message ?? "Unknown error";
}
