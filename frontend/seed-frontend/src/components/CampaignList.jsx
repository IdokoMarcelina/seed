import React, { useState, useMemo } from "react";
import { useCampaigns } from "../hooks/useCampaigns";
import CampaignCard from "./CampaignCard";

export default function CampaignList() {
  const { campaigns, isLoading, error, currentBlock, refresh } = useCampaigns();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTokenType, setFilterTokenType] = useState("all");
  const [sortBy, setSortBy] = useState("status"); // Default to active first

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((campaign) => {
        const isActive = currentBlock <= campaign.deadline && !campaign.finalized;
        if (filterStatus === "active") return isActive;
        if (filterStatus === "ended") return !isActive && !campaign.finalized;
        if (filterStatus === "finalized") return campaign.finalized;
        return true;
      });
    }

    // Filter by token type
    if (filterTokenType !== "all") {
      filtered = filtered.filter((campaign) => {
        if (filterTokenType === "ft") return campaign.tokenType === 0;
        if (filterTokenType === "nft") return campaign.tokenType === 1;
        return true;
      });
    }

    // Sort campaigns
    filtered.sort((a, b) => {
      const aIsActive = currentBlock <= a.deadline && !a.finalized;
      const bIsActive = currentBlock <= b.deadline && !b.finalized;
      
      if (sortBy === "newest") {
        return b.cid - a.cid;
      } else if (sortBy === "oldest") {
        return a.cid - b.cid;
      } else if (sortBy === "status") {
        // Active first, then ended, then finalized
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        if (a.finalized && !b.finalized) return 1;
        if (!a.finalized && b.finalized) return -1;
        return b.cid - a.cid; // Then by newest
      } else if (sortBy === "goal-high") {
        return b.goal - a.goal;
      } else if (sortBy === "goal-low") {
        return a.goal - b.goal;
      } else if (sortBy === "progress") {
        const aProgress = a.goal > 0 ? (a.raised / a.goal) : 0;
        const bProgress = b.goal > 0 ? (b.raised / b.goal) : 0;
        return bProgress - aProgress;
      }
      return 0;
    });

    return filtered;
  }, [campaigns, filterStatus, filterTokenType, sortBy, currentBlock]);

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
      {/* Modern Filter Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Left side - Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterStatus === "all"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterStatus === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("ended")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterStatus === "ended"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Ended
              </button>
              <button
                onClick={() => setFilterStatus("finalized")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterStatus === "finalized"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Finalized
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-700"></div>

            {/* Token Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTokenType("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterTokenType === "all"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterTokenType("ft")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterTokenType === "ft"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🪙 FT
              </button>
              <button
                onClick={() => setFilterTokenType("nft")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterTokenType === "nft"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🖼️ NFT
              </button>
            </div>
          </div>

          {/* Right side - Sort & Count */}
          <div className="flex gap-3 items-center">
            <span className="text-gray-400 text-sm">
              {filteredCampaigns.length} of {campaigns.length}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-md border border-gray-700 focus:border-yellow-500 outline-none cursor-pointer"
            >
              <option value="status">Status (Active First)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="goal-high">Highest Goal</option>
              <option value="goal-low">Lowest Goal</option>
              <option value="progress">Most Progress</option>
            </select>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-md transition disabled:opacity-50 border border-gray-700"
            >
              {isLoading ? "↻" : "↻ Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-gray-400">No campaigns match your filters.</p>
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterTokenType("all");
            }}
            className="mt-4 text-yellow-400 hover:text-yellow-300 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
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
  );
}
