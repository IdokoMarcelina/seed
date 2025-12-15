import React from "react";
import { useCampaigns } from "../hooks/useCampaigns";
import CampaignCard from "./CampaignCard";

export default function CampaignList() {
  const { campaigns, isLoading, error, currentBlock, refresh } = useCampaigns();

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-900 rounded-lg border border-red-500 p-6">
        <p className="text-red-400">Error loading campaigns: {error}</p>
        <button
          onClick={refresh}
          className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
        <p className="text-gray-400">No campaigns yet.</p>
        <p className="text-sm text-gray-500 mt-2">Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-400 text-sm">
          Showing {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded transition disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.cid}
            campaign={campaign}
            currentBlock={currentBlock}
            onUpdate={refresh}
          />
        ))}
      </div>
    </div>
  );
}
