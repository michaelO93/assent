import hre from "hardhat";
import { formatEther, parseAbi, parseEther } from "viem";

// Moves the deployer's Sepolia ETH to the same address on Base Sepolia through Base's
// official L1StandardBridge (docs.base.org/specifications/reference/base-contracts).
const BASE_SEPOLIA_L1_BRIDGE = "0xfd0Bf71F60660E2f608ed56e1659C450eB113120";
const KEEP_FOR_GAS = parseEther("0.005");

async function main() {
  if (hre.network.name !== "sepolia") throw new Error("Run with --network sepolia");
  const [wallet] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const balance = await publicClient.getBalance({ address: wallet.account.address });
  const amount = balance - KEEP_FOR_GAS;
  if (amount <= 0n) throw new Error(`Only ${formatEther(balance)} Sepolia ETH; need more than ${formatEther(KEEP_FOR_GAS)}`);

  const hash = await wallet.writeContract({
    address: BASE_SEPOLIA_L1_BRIDGE,
    abi: parseAbi(["function depositETH(uint32 _minGasLimit, bytes _extraData) payable"]),
    functionName: "depositETH",
    args: [200_000, "0x"],
    value: amount,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Bridged ${formatEther(amount)} ETH (status: ${receipt.status})`);
  console.log(`https://sepolia.etherscan.io/tx/${hash}`);
  console.log("Funds usually reach Base Sepolia within a few minutes.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
