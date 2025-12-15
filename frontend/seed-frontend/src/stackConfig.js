// stackConfig.js
// Try the direct subpath export
import { StacksTestnet } from '@stacks/network/dist/index.js';
import { UserSession, AppConfig } from '@stacks/connect';

export const network = new StacksTestnet();

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });