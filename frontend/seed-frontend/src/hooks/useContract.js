import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    uintCV,
    principalCV,
    PostConditionMode,
    cvToHex,
    cvToValue,
    hexToCV,
    standardPrincipalCV,
} from '@stacks/transactions';
// StacksTestnet class removed in v7, use networkFromName
import { networkFromName, ChainId, TransactionVersion } from '@stacks/network';
import {
    CONTRACT_ADDRESS,
    CONTRACT_NAME,
    NETWORK_URL,
    APP_DETAILS,
    stxToMicroStx,
} from '../contractConfig';
import { parseCampaign, parseUint, parsePrincipal } from '../utils/clarityParser';

// -- Read-only functions (moved outside hook for stability) --

/**
 * Get campaign details (read-only)
 */
export const getCampaign = async (campaignId) => {
    try {
        const url = '/v2/contracts/call-read/' + CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/get-campaign';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CONTRACT_ADDRESS,
                arguments: [cvToHex(uintCV(Number(campaignId)))],
            }),
        });

        if (!response.ok) {
            const text = await response.text(); // Read text to avoid JSON parse error on 429 etc.
            throw new Error(`Failed to fetch campaign: ${response.status} ${text}`);
        }

        const data = await response.json();
        const resultCV = hexToCV(data.result);
        return parseCampaign(resultCV);
    } catch (err) {
        console.error('Get campaign error:', err);
        throw err;
    }
};

/**
 * Get total campaign count (read-only)
 */
export const getCampaignCount = async () => {
    try {
        const url = '/v2/contracts/call-read/' + CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/get-campaign-count';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CONTRACT_ADDRESS,
                arguments: [],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch campaign count: ${response.status} ${text}`);
        }

        const data = await response.json();
        const resultCV = hexToCV(data.result);
        return parseUint(resultCV);
    } catch (err) {
        console.error('Get campaign count error:', err);
        return 0;
    }
};

/**
 * Get user's contribution to a campaign (read-only)
 */
export const getUserContribution = async (campaignId, userAddress) => {
    try {
        const url = '/v2/contracts/call-read/' + CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/get-contribution';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CONTRACT_ADDRESS,
                arguments: [
                    cvToHex(uintCV(Number(campaignId))),
                    cvToHex(standardPrincipalCV(userAddress)),
                ],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch contribution: ${response.status} ${text}`);
        }

        const data = await response.json();
        const resultCV = hexToCV(data.result);

        if (resultCV.type === 7) return parseUint(resultCV.value);
        return parseUint(resultCV);
    } catch (err) {
        console.error('Get contribution error:', err);
        return 0;
    }
};

/**
 * Get FT balance for a user in a campaign (read-only)
 */
export const getFTBalance = async (campaignId, userAddress) => {
    try {
        const url = '/v2/contracts/call-read/' + CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/get-ft-balance';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CONTRACT_ADDRESS,
                arguments: [
                    cvToHex(uintCV(Number(campaignId))),
                    cvToHex(standardPrincipalCV(userAddress)),
                ],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch FT balance: ${response.status} ${text}`);
        }

        const data = await response.json();
        const resultCV = hexToCV(data.result);

        if (resultCV.type === 7) return parseUint(resultCV.value);
        return parseUint(resultCV);
    } catch (err) {
        console.error('Get FT balance error:', err);
        return 0;
    }
};

/**
 * Get NFT owner (read-only)
 */
export const getNFTOwner = async (campaignId, tokenId) => {
    try {
        const url = '/v2/contracts/call-read/' + CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/get-nft-owner';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CONTRACT_ADDRESS,
                arguments: [
                    cvToHex(uintCV(Number(campaignId))),
                    cvToHex(uintCV(Number(tokenId))),
                ],
            }),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const resultCV = hexToCV(data.result);

        let val = resultCV;
        if (val.type === 7) val = val.value;

        if (val.type === 9) {
            return null;
        }
        if (val.type === 8) {
            return parsePrincipal(val.value);
        }
        return null;
    } catch (err) {
        console.error('Get NFT owner error:', err);
        return null;
    }
};

export const useContract = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize network for wallet transactions (v7 compatible)
    const network = networkFromName('testnet');
    // Ensure it's using the correct chain ID/Version if not set by default
    network.chainId = ChainId.Testnet;
    network.version = TransactionVersion.Testnet;

    /**
     * Create a new campaign
     */
    const createCampaign = useCallback(async (goalStx, durationBlocks, tokenType) => {
        setIsLoading(true);
        setError(null);

        try {
            const goalMicroStx = stxToMicroStx(goalStx);

            const options = {
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'create-campaign',
                functionArgs: [
                    uintCV(goalMicroStx),
                    uintCV(Number(durationBlocks)),
                    uintCV(Number(tokenType)),
                ],
                postConditionMode: PostConditionMode.Allow,
                appDetails: APP_DETAILS,
                onFinish: (data) => {
                    console.log('Campaign created:', data);
                    setIsLoading(false);
                    return data;
                },
                onCancel: () => {
                    setIsLoading(false);
                    setError('Transaction cancelled');
                },
            };

            return await openContractCall(options);
        } catch (err) {
            console.error('Create campaign error:', err);
            setError(err.message || 'Failed to create campaign');
            setIsLoading(false);
            throw err;
        }
    }, []);

    /**
     * Fund a campaign
     */
    const fundCampaign = useCallback(async (campaignId, amountStx) => {
        setIsLoading(true);
        setError(null);

        try {
            const amountMicroStx = stxToMicroStx(amountStx);

            const options = {
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'fund',
                functionArgs: [
                    uintCV(Number(campaignId)),
                    uintCV(amountMicroStx),
                ],
                postConditionMode: PostConditionMode.Allow,
                appDetails: APP_DETAILS,
                onFinish: (data) => {
                    console.log('Campaign funded:', data);
                    setIsLoading(false);
                    return data;
                },
                onCancel: () => {
                    setIsLoading(false);
                    setError('Transaction cancelled');
                },
            };

            return await openContractCall(options);
        } catch (err) {
            console.error('Fund campaign error:', err);
            setError(err.message || 'Failed to fund campaign');
            setIsLoading(false);
            throw err;
        }
    }, []);

    /**
     * Finalize a campaign
     */
    const finalizeCampaign = useCallback(async (campaignId) => {
        setIsLoading(true);
        setError(null);

        try {
            const options = {
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'finalize',
                functionArgs: [uintCV(Number(campaignId))],
                postConditionMode: PostConditionMode.Allow,
                appDetails: APP_DETAILS,
                onFinish: (data) => {
                    console.log('Campaign finalized:', data);
                    setIsLoading(false);
                    return data;
                },
                onCancel: () => {
                    setIsLoading(false);
                    setError('Transaction cancelled');
                },
            };

            return await openContractCall(options);
        } catch (err) {
            console.error('Finalize campaign error:', err);
            setError(err.message || 'Failed to finalize campaign');
            setIsLoading(false);
            throw err;
        }
    }, []);

    return {
        isLoading,
        error,
        createCampaign,
        fundCampaign,
        finalizeCampaign,
        getCampaign,       // Exported from top-level
        getCampaignCount,  // Exported from top-level
        getUserContribution, // Exported from top-level
        getFTBalance,      // Exported from top-level
        getNFTOwner,       // Exported from top-level
    };
};
