import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: { version: "0.8.28", settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } } },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
};

export default config;
