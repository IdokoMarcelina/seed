import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useContract } from "../hooks/useContract";
import { useCampaigns } from "../hooks/useCampaigns";
import { MIN_GOAL, MAX_GOAL, MIN_DURATION, MAX_DURATION, microStxToStx } from "../contractConfig";

export default function CreateCampaign() {
  const { isConnected, connectWallet } = useWallet();
  const { createCampaign, isLoading } = useContract();
  const { refresh } = useCampaigns();

  const [form, setForm] = useState({
    goal: "",
    duration: "",
    tokenType: "0"
  });

  const handleCreateCampaign = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        console.error('Wallet connection failed:', err);
      }
      return;
    }

    // Validation
    if (!form.goal || !form.duration) {
      alert("Please fill in all fields");
      return;
    }

    const goalStx = Number(form.goal);
    const durationBlocks = Number(form.duration);

    if (goalStx <= 0 || durationBlocks <= 0) {
      alert("Goal and duration must be positive numbers");
      return;
    }

    // Check against contract limits
    const goalMicroStx = goalStx * 1000000;
    if (goalMicroStx < MIN_GOAL) {
      alert(`Minimum goal is ${microStxToStx(MIN_GOAL)} STX`);
      return;
    }
    if (goalMicroStx > MAX_GOAL) {
      alert(`Maximum goal is ${microStxToStx(MAX_GOAL)} STX`);
      return;
    }
    if (durationBlocks < MIN_DURATION) {
      alert(`Minimum duration is ${MIN_DURATION} blocks (~1 day)`);
      return;
    }
    if (durationBlocks > MAX_DURATION) {
      alert(`Maximum duration is ${MAX_DURATION} blocks (~1 year)`);
      return;
    }

    try {
      await createCampaign(goalStx, durationBlocks, form.tokenType);
      alert("Campaign creation submitted! It may take a few minutes to confirm.");
      setForm({ goal: "", duration: "", tokenType: "0" });

      // Refresh campaigns after a delay
      setTimeout(() => {
        refresh();
      }, 5000);
    } catch (err) {
      console.error("Create campaign error:", err);
      if (!err.message?.includes('cancelled')) {
        alert("Failed to create campaign: " + (err.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md mx-auto shadow-xl">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">Create Campaign</h2>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Goal (in STX)</label>
        <input
          type="number"
          placeholder="e.g., 1000"
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none transition"
          min="0"
          step="0.01"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum: {microStxToStx(MIN_GOAL)} STX
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Duration (blocks)</label>
        <input
          type="number"
          placeholder="e.g., 144 (≈ 1 day)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none transition"
          min="1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum: {MIN_DURATION} blocks (~1 day) | 1 block ≈ 10 minutes
        </p>
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-2">Token Type</label>
        <select
          value={form.tokenType}
          onChange={(e) => setForm({ ...form, tokenType: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none transition"
        >
          <option value="0">🪙 FT (Fungible Token)</option>
          <option value="1">🖼️ NFT (Non-Fungible Token)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Reward type for backers
        </p>
      </div>

      <button
        type="button"
        onClick={handleCreateCampaign}
        disabled={isLoading}
        className="bg-yellow-500 text-black font-semibold py-3 px-4 rounded-md hover:bg-yellow-400 transition w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </span>
        ) : !isConnected ? (
          'Connect Wallet to Create'
        ) : (
          'Create Campaign'
        )}
      </button>
    </div>
  );
}