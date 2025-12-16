import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useCampaigns } from "../hooks/useCampaigns";
import CreateCampaign from "../components/CreateCampaign";
import CampaignCard from "../components/CampaignCard";

export default function Dashboard() {
  const { isConnected, userAddress, connectWallet } = useWallet();
  const { campaigns, currentBlock, refresh } = useCampaigns();
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [fundedCampaigns, setFundedCampaigns] = useState([]);

  useEffect(() => {
    if (isConnected && userAddress && campaigns.length > 0) {
      // Filter campaigns owned by user
      const owned = campaigns.filter(c => c.owner === userAddress);
      
      // Sort owned campaigns: Active first, then by newest
      owned.sort((a, b) => {
        const aIsActive = currentBlock <= a.deadline && !a.finalized;
        const bIsActive = currentBlock <= b.deadline && !b.finalized;
        
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        if (a.finalized && !b.finalized) return 1;
        if (!a.finalized && b.finalized) return -1;
        return b.cid - a.cid; // Newest first
      });
      
      setUserCampaigns(owned);

      // Filter campaigns user doesn't own
      const funded = campaigns.filter(c => c.owner !== userAddress);
      
      // Sort funded campaigns: Active first, then by newest
      funded.sort((a, b) => {
        const aIsActive = currentBlock <= a.deadline && !a.finalized;
        const bIsActive = currentBlock <= b.deadline && !b.finalized;
        
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        if (a.finalized && !b.finalized) return 1;
        if (!a.finalized && b.finalized) return -1;
        return b.cid - a.cid; // Newest first
      });
      
      setFundedCampaigns(funded);
    } else {
      setUserCampaigns([]);
      setFundedCampaigns([]);
    }
  }, [isConnected, userAddress, campaigns, currentBlock]);

  if (!isConnected) {
    return (
      <div className="px-8 py-10">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">Dashboard</h2>
          <p className="text-gray-400 mb-8">
            Connect your wallet to view your campaigns and create new ones.
          </p>
          <button
            onClick={connectWallet}
            className="bg-yellow-500 text-black px-8 py-3 rounded-md font-semibold hover:bg-yellow-400 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <h2 className="text-3xl font-bold text-yellow-400 mb-8">Dashboard</h2>

      {/* Create Campaign Section */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-gray-300 mb-4">Create New Campaign</h3>
        <CreateCampaign />
      </div>

      {/* User's Campaigns */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-300">
            My Campaigns ({userCampaigns.length})
          </h3>
          <button
            onClick={refresh}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded transition"
          >
            Refresh
          </button>
        </div>

        {userCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-400">You haven't created any campaigns yet.</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.cid}
                campaign={campaign}
                currentBlock={currentBlock}
                onUpdate={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Other Campaigns to Fund */}
      <div>
        <h3 className="text-xl font-semibold text-gray-300 mb-4">
          Other Campaigns ({fundedCampaigns.length})
        </h3>

        {fundedCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-400">No other campaigns available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundedCampaigns.slice(0, 6).map((campaign) => (
              <CampaignCard
                key={campaign.cid}
                campaign={campaign}
                currentBlock={currentBlock}
                onUpdate={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
