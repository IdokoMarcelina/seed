import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, UserSession } from '@stacks/connect';
import { APP_DETAILS } from '../contractConfig';

const WalletContext = createContext();

// Initialize user session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);

    // Check if wallet is already connected on mount
    useEffect(() => {
        const checkConnection = () => {
            if (userSession.isUserSignedIn()) {
                const userData = userSession.loadUserData();
                setIsConnected(true);
                const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
                setUserAddress(address);
            } else if (userSession.isSignInPending()) {
                userSession.handlePendingSignIn().then((userData) => {
                    setIsConnected(true);
                    const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
                    setUserAddress(address);
                }).catch((error) => {
                    console.error('Error handling pending sign in:', error);
                });
            }
        };

        checkConnection();
    }, []);

    const extractAddress = (resp) => {
        console.log('Wallet response:', resp); // Debug log

        // Helper to check if string looks like a Stacks address
        const isStacksAddress = (str) => {
            // Basic check: starts with S (Mainnet) or S/T (Testnet) and long enough
            return typeof str === 'string' && (str.startsWith('S') || str.startsWith('T')) && str.length > 20;
        };

        // 1. Standard rpc result structure (Leather/Hiro)
        if (resp.result && resp.result.addresses) {
            const stxAddr = resp.result.addresses.find(addr =>
                (addr.type === 'stx' || addr.symbol === 'STX')
            );
            if (stxAddr && stxAddr.address) return stxAddr.address;
        }

        // 2. Direct addresses array (older/other wallets)
        if (Array.isArray(resp.addresses)) {
            const stxAddr = resp.addresses.find(addr =>
                (addr.type === 'stx' || addr.symbol === 'STX')
            );
            if (stxAddr && stxAddr.address) return stxAddr.address;

            // Simple array of strings?
            if (resp.addresses.length > 0 && typeof resp.addresses[0] === 'string') {
                if (isStacksAddress(resp.addresses[0])) return resp.addresses[0];
            }
        }

        // 3. Xverse specific (sometimes returns nested object or different keys)
        // Check for 'address' property at root or inside result
        if (resp.address && isStacksAddress(resp.address)) return resp.address;
        if (resp.result && resp.result.address && isStacksAddress(resp.result.address)) return resp.result.address;

        // 4. Fallback: Search recursively/aggressively for any valid looking address
        // (Use with caution, but helpful for debugging new wallet versions)
        const candidates = [
            resp?.result?.addresses?.[0]?.address,
            resp?.result?.addresses?.[0],
            resp?.addresses?.[0]?.address,
            resp?.addresses?.[0]
        ];

        for (const c of candidates) {
            if (isStacksAddress(c)) return c;
        }

        return null;
    };

    const connectWithProvider = async (provider, name) => {
        setIsLoading(true);
        try {
            if (!provider) {
                // Double check if it's injected now (sometimes takes a ms)
                await new Promise(r => setTimeout(r, 500));
                // Check again
                const retryProvider = name.includes('Leather') ? window.LeatherProvider :
                    name.includes('Hiro') ? window.HiroWalletProvider :
                        name.includes('Xverse') ? (window.XverseProviders?.StacksProvider || window.XverseProvider) :
                            window.StacksProvider;

                if (!retryProvider) {
                    alert(`${name} is not detected. Please ensure the extension is installed and active.`);
                    setIsLoading(false);
                    return;
                }
                provider = retryProvider;
            }

            console.log(`Requesting addresses from ${name}...`);
            const resp = await provider.request('getAddresses');
            console.log(`${name} raw response:`, resp);

            const address = extractAddress(resp);

            if (address) {
                console.log(`Connected to ${name}:`, address);
                setIsConnected(true);
                setUserAddress(address);
                setShowWalletModal(false);
                setIsLoading(false);
                return;
            }

            console.error('Extraction failed. Response:', resp);
            throw new Error('No STX address found in wallet response');
        } catch (err) {
            console.error(`${name} connection error:`, err);
            // Don't alert if user just closed the popup (common 'User rejected' error)
            const msg = err.message || err.toString();
            if (!msg.includes('rejected') && !msg.includes('closed') && !msg.includes('User denied')) {
                alert(`Failed to connect with ${name}. Details: ${msg}`);
            }
            setIsLoading(false);
        }
    };

    const connectWithLeather = () => connectWithProvider(window.LeatherProvider, 'Leather Wallet');

    const connectWithHiro = () => connectWithProvider(window.HiroWalletProvider, 'Hiro Wallet');

    const connectWithXverse = () => {
        const provider = window.XverseProviders?.StacksProvider || window.XverseProvider;
        connectWithProvider(provider, 'Xverse Wallet');
    };

    const connectWithStandard = () => connectWithProvider(window.StacksProvider, 'Standard Stacks Wallet');

    const connectWallet = () => {
        setShowWalletModal(true);
    };

    const disconnectWallet = () => {
        if (userSession.isUserSignedIn()) {
            userSession.signUserOut();
        }
        setIsConnected(false);
        setUserAddress('');
    };

    const value = {
        isConnected,
        userAddress,
        isLoading,
        connectWallet,
        disconnectWallet,
        userSession,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}

            {/* Wallet Selection Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-yellow-400">Connect Wallet</h3>
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                            Choose your preferred Stacks wallet to connect
                        </p>

                        <div className="space-y-3">
                            {/* Xverse Wallet */}
                            <button
                                onClick={connectWithXverse}
                                disabled={isLoading}
                                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 flex items-center gap-4 transition disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-black rounded-lg border border-gray-600 flex items-center justify-center text-2xl font-bold text-white">
                                    X
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-white font-semibold">Xverse Wallet</p>
                                    <p className="text-gray-400 text-xs">Bitcoin wallet for Stacks</p>
                                </div>
                            </button>

                            {/* Leather Wallet */}
                            <button
                                onClick={connectWithLeather}
                                disabled={isLoading}
                                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 flex items-center gap-4 transition disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
                                    🦊
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-white font-semibold">Leather Wallet</p>
                                    <p className="text-gray-400 text-xs">Formerly Hiro Wallet</p>
                                </div>
                            </button>

                            {/* Hiro Wallet */}
                            <button
                                onClick={connectWithHiro}
                                disabled={isLoading}
                                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 flex items-center gap-4 transition disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
                                    🔷
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-white font-semibold">Hiro Wallet</p>
                                    <p className="text-gray-400 text-xs">Browser extension</p>
                                </div>
                            </button>

                            {/* Generic Stacks Wallet */}
                            <button
                                onClick={connectWithStandard}
                                disabled={isLoading}
                                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 flex items-center gap-4 transition disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-2xl">
                                    👛
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-white font-semibold">Other Stacks Wallet</p>
                                    <p className="text-gray-400 text-xs">Attempts generic connection</p>
                                </div>
                            </button>
                        </div>

                        {isLoading && (
                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center gap-2 text-yellow-400">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connecting...
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-gray-500 text-xs text-center">
                                Need a wallet?{' '}
                                <a href="https://www.xverse.app" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                                    Xverse
                                </a>
                                {' • '}
                                <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                                    Leather
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </WalletContext.Provider>
    );
};
