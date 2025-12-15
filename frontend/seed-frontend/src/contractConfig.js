// Import network classes - using the network directly
const NETWORK_TYPE = 'testnet'; // Change to 'mainnet' for production

// Network configuration object
const networkConfig = {
    testnet: {
        coreApiUrl: '', // Use proxy in vite.config.js
        chainId: 0x80000000,
    },
    mainnet: {
        coreApiUrl: 'https://api.mainnet.hiro.so',
        chainId: 0x00000001,
    },
};

// Contract Configuration
export const CONTRACT_ADDRESS = 'STMX4RANCST3JVGD5J0KEQ6D20ZCFWRF1EKXZ8ER';
export const CONTRACT_NAME = 'seed';

// Network Configuration
export const NETWORK = networkConfig[NETWORK_TYPE];
export const NETWORK_URL = networkConfig[NETWORK_TYPE].coreApiUrl;

// Validation Constants (from contract)
export const MIN_GOAL = 1000000; // 1 STX in microSTX
export const MAX_GOAL = 100000000000000; // 100M STX in microSTX
export const MIN_DURATION = 144; // ~1 day in blocks
export const MAX_DURATION = 52560; // ~1 year in blocks

// Token Types
export const TOKEN_TYPE = {
    FT: 0,
    NFT: 1,
};

// Conversion Helpers
export const stxToMicroStx = (stx) => Math.floor(Number(stx) * 1000000);
export const microStxToStx = (microStx) => Number(microStx) / 1000000;

// App Configuration
export const APP_DETAILS = {
    name: 'Seed Platform',
    icon: window.location.origin + '/favicon.ico',
};

// Block time (approximate)
export const BLOCK_TIME_SECONDS = 600; // ~10 minutes per block
