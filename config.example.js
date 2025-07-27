// Configuration file for API keys and constants
// Copy this file to config.js and add your actual values
window.CONFIG = {
  ALCHEMY_API_KEY: "your-alchemy-api-key-here", // Get from https://dashboard.alchemy.com/
  DONATION_WALLET: "0x0000000000000000000000000000000000000000", // Replace with campaign wallet
  NETWORKS: [
    { name: "Ethereum", id: "eth-mainnet", displayName: "ETH" },
    { name: "Polygon", id: "polygon-mainnet", displayName: "MATIC" },
    { name: "Arbitrum", id: "arb-mainnet", displayName: "ARB" },
    { name: "Optimism", id: "opt-mainnet", displayName: "OP" },
    { name: "Base", id: "base-mainnet", displayName: "BASE" },
    { name: "BSC", id: "bnb-mainnet", displayName: "BNB" },
    { name: "Avalanche", id: "avax-mainnet", displayName: "AVAX" },
  ],
};
