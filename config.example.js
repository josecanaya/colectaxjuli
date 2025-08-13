// config.js
// Global configuration for the crypto donation module
// IMPORTANT: Replace YOUR_ALCHEMY_KEY and DONATION_ADDRESS before going live

window.AppConfig = {
  DONATION_ADDRESS: "0x44CB1Be6f105BDDaFdd996f4664E945D000c420d",
  // Default network to use when connecting (Polygon recommended due to low fees)
  DEFAULT_CHAIN_KEY: "polygon",

  CHAINS: {
    ethereum: {
      key: "ethereum",
      chainIdHex: "0x1",
      name: "Ethereum",
      nativeSymbol: "ETH",
      rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/alchemy_key",
      explorer: "https://etherscan.io",
      supportsAlchemy: true,
    },
    polygon: {
      key: "polygon",
      chainIdHex: "0x89",
      name: "Polygon",
      nativeSymbol: "MATIC",
      rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/alchemy_key",
      explorer: "https://polygonscan.com",
      supportsAlchemy: true,
    },
    arbitrum: {
      key: "arbitrum",
      chainIdHex: "0xa4b1",
      name: "Arbitrum One",
      nativeSymbol: "ETH",
      rpcUrl: "https://arb-mainnet.g.alchemy.com/v2/alchemy_key",
      explorer: "https://arbiscan.io",
      supportsAlchemy: true,
    },
    base: {
      key: "base",
      chainIdHex: "0x2105",
      name: "Base",
      nativeSymbol: "ETH",
      rpcUrl: "https://base-mainnet.g.alchemy.com/v2/alchemy_key",
      explorer: "https://basescan.org",
      supportsAlchemy: true,
    },
    bsc: {
      key: "bsc",
      chainIdHex: "0x38",
      name: "BNB Smart Chain",
      nativeSymbol: "BNB",
      rpcUrl: "https://bsc-dataseed.binance.org",
      explorer: "https://bscscan.com",
      supportsAlchemy: false,
    },
    tron: {
      key: "tron",
      name: "Tron",
      nativeSymbol: "TRX",
      explorer: "https://tronscan.org",
      // Tron does not use EVM RPC/chainId. Managed via TronLink.
      supportsAlchemy: false,
    },
  },
  // Optional per-chain donation addresses. If not provided for an EVM chain, falls back to DONATION_ADDRESS.
  DONATION_ADDRESSES: {
    tron: "TYOURTRONDONATIONADDRXXXXX", // TODO: replace with your TRON base58 address
  },
  // Optional curated token lists for chains without Alchemy token scans
  TOKEN_LISTS: {
    bsc: [
      {
        address: "0x55d398326f99059fF775485246999027B3197955",
        symbol: "USDT",
        decimals: 18,
      },
      {
        address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        symbol: "USDC",
        decimals: 18,
      },
      {
        address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        symbol: "BUSD",
        decimals: 18,
      },
      {
        address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        symbol: "WBNB",
        decimals: 18,
      },
    ],
    tron: [
      {
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        symbol: "USDT",
        decimals: 6,
      },
      {
        address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
        symbol: "USDC",
        decimals: 6,
      },
    ],
  },
};
