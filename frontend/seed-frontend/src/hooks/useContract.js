import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV, PostConditionMode } from '@stacks/transactions';
import {
    CONTRACT_ADDRESS,
    CONTRACT_NAME,
    NETWORK_URL,
    APP_DETAILS,
    stxToMicroStx,
} from '../contractConfig';
import { parseCampaign, parseUint, parsePrincipal } from '../utils/clarityParser';

export const useContract = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Create a new campaign
     */
    const createCampaign = async (goalStx, durationBlocks, tokenType) => {
        setIsLoading(true);
        setError(null);

        try {
            const goalMicroStx = stxToMicroStx(goalStx);

            const options = {
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
    };

    /**
     * Fund a campaign
     */
    const fundCampaign = async (campaignId, amountStx) => {
        setIsLoading(true);
        setError(null);

        try {
            const amountMicroStx = stxToMicroStx(amountStx);

            const options = {
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
    };

    /**
     * Finalize a campaign
     */
    const finalizeCampaign = async (campaignId) => {
        setIsLoading(true);
        setError(null);

        try {
            const options = {
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
    };

    /**
     * Get campaign details (read-only)
     */
    const getCampaign = async (campaignId) => {
        try {
            const url = `${NETWORK_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-campaign`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: CONTRACT_ADDRESS,
                    arguments: [`0x${Number(campaignId).toString(16).padStart(32, '0')}`],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch campaign');
            }

            const data = await response.json();
            return parseCampaign(data);
        } catch (err) {
            console.error('Get campaign error:', err);
            throw err;
        }
    };

    /**
     * Get total campaign count (read-only)
     */
    const getCampaignCount = async () => {
        try {
            const url = `${NETWORK_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-campaign-count`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: CONTRACT_ADDRESS,
                    arguments: [],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch campaign count');
            }

            const data = await response.json();
            return parseUint(data.result);
        } catch (err) {
            console.error('Get campaign count error:', err);
            return 0;
        }
    };

    /**
     * Get user's contribution to a campaign (read-only)
     */
    const getUserContribution = async (campaignId, userAddress) => {
        try {
            const url = `${NETWORK_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-contribution`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: CONTRACT_ADDRESS,
                    arguments: [
                        `0x${Number(campaignId).toString(16).padStart(32, '0')}`,
                        `0x${userAddress}`,
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contribution');
            }

            const data = await response.json();
            return parseUint(data.result);
        } catch (err) {
            console.error('Get contribution error:', err);
            return 0;
        }
    };

    /**
     * Get FT balance for a user in a campaign (read-only)
     */
    const getFTBalance = async (campaignId, userAddress) => {
        try {
            const url = `${NETWORK_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-ft-balance`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: CONTRACT_ADDRESS,
                    arguments: [
                        `0x${Number(campaignId).toString(16).padStart(32, '0')}`,
                        `0x${userAddress}`,
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch FT balance');
            }

            const data = await response.json();
            return parseUint(data.result);
        } catch (err) {
            console.error('Get FT balance error:', err);
            return 0;
        }
    };

    /**
     * Get NFT owner (read-only)
     */
    const getNFTOwner = async (campaignId, tokenId) => {
        try {
            const url = `${NETWORK_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-nft-owner`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: CONTRACT_ADDRESS,
                    arguments: [
                        `0x${Number(campaignId).toString(16).padStart(32, '0')}`,
                        `0x${Number(tokenId).toString(16).padStart(32, '0')}`,
                    ],
                }),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return parsePrincipal(data.result);
        } catch (err) {
            console.error('Get NFT owner error:', err);
            return null;
        }
    };

    return {
        isLoading,
        error,
        createCampaign,
        fundCampaign,
        finalizeCampaign,
        getCampaign,
        getCampaignCount,
        getUserContribution,
        getFTBalance,
        getNFTOwner,
    };
};
