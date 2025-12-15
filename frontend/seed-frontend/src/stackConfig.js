// Network configuration for Stacks
import { UserSession, AppConfig } from '@stacks/connect';

// Using testnet configuration
export const network = {
    coreApiUrl: 'https://api.testnet.hiro.so',
    chainId: 0x80000000,
};

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });
