import React, { useState } from "react";

export default function CreateCampaign() {
  const [form, setForm] = useState({
    goal: "",
    duration: "",
    tokenType: "0",
  });

  return (
    <form className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-3">Goal (in STX)</label>
        <input
          type="number"
          placeholder="Enter goal"
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-3">Duration (blocks)</label>
        <input
          type="number"
          placeholder="Enter duration"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none"
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-3">Token Type</label>
        <select
          value={form.tokenType}
          onChange={(e) => setForm({ ...form, tokenType: e.target.value })}
          className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none"
        >
          <option value="0">FT (Fungible Token)</option>
          <option value="1">NFT (Non-Fungible Token)</option>
        </select>
      </div>

      <button
        type="button"
        className="bg-yellow-500 text-black font-semibold py-3 px-4 rounded-md hover:bg-yellow-400 transition w-full"
      >
        Create Campaign
      </button>
    </form>
  );
}
