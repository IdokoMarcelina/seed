import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';
import { NETWORK_URL } from '../contractConfig';

export const useCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentBlock, setCurrentBlock] = useState(0);
    const { getCampaignCount, getCampaign } = useContract();

    // Fetch current block height
    const fetchCurrentBlock = useCallback(async () => {
        try {
            const response = await fetch(`${NETWORK_URL}/v2/info`);
            if (!response.ok) {
                // If rate limited or error, just log and return, don't crash
                console.warn(`Fetch info failed: ${response.status}`);
                return;
            }
            const data = await response.json();
            setCurrentBlock(data.stacks_tip_height || 0);
        } catch (err) {
            console.error('Error fetching current block:', err);
        }
    }, []);

    // Fetch all campaigns
    const fetchCampaigns = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current block height
            await fetchCurrentBlock();

            // Get total campaign count
            const count = await getCampaignCount();

            if (count === 0) {
                setCampaigns([]);
                setIsLoading(false);
                return;
            }

            // Fetch each campaign
            const campaignPromises = [];
            for (let cid = 1; cid <= Math.min(count, 100); cid++) {
                campaignPromises.push(
                    getCampaign(cid)
                        .then((campaign) => ({
                            cid,
                            ...campaign,
                        }))
                        .catch((err) => {
                            console.error(`Error fetching campaign ${cid}:`, err);
                            return null;
                        })
                );
            }

            const campaignData = await Promise.all(campaignPromises);
            const validCampaigns = campaignData.filter((c) => c !== null);

            setCampaigns(validCampaigns);
        } catch (err) {
            console.error('Error fetching campaigns:', err);
            setError(err.message || 'Failed to fetch campaigns');
        } finally {
            setIsLoading(false);
        }
    }, [getCampaignCount, getCampaign, fetchCurrentBlock]);

    // Auto-fetch on mount
    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Refresh function
    const refresh = useCallback(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    return {
        campaigns,
        isLoading,
        error,
        currentBlock,
        refresh,
    };
};
