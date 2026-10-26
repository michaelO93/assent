import hre from "hardhat";
import { formatEther } from "viem";

// Prints the deployer's address and balance, to check faucet funds have arrived.
async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const balance = await (await hre.viem.getPublicClient()).getBalance({ address: deployer.account.address });
  console.log(`${deployer.account.address} has ${formatEther(balance)} ETH on ${hre.network.name}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
