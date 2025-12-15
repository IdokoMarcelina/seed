import React, { useState, useEffect } from "react";
import { openContractCall, showConnect } from "@stacks/connect";
import { 
  uintCV, 
  cvToJSON,
  PostConditionMode
} from "@stacks/transactions";

// Network configuration - adjust based on your setup
const network = {
  coreApiUrl: "https://api.testnet.hiro.so", // Use "https://api.mainnet.hiro.so" for mainnet
  chainId: 0x80000000, // Testnet chain ID (use 0x00000001 for mainnet)
};

const CONTRACT_ADDRESS = "STMX4RANCST3JVGD5J0KEQ6D20ZCFWRF1EKXZ8ER";
const CONTRACT_NAME = "seed";

export default function CreateCampaign() {
  const [form, setForm] = useState({ goal: "", duration: "", tokenType: "0" });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  // Check connection status
  useEffect(() => {
    const checkConnection = () => {
      try {
        if (window.StacksProvider) {
          window.StacksProvider.getAddresses()
            .then(addresses => {
              if (addresses && addresses.length > 0) {
                setIsConnected(true);
                setUserAddress(addresses[0]);
              }
            })
            .catch(() => {
              setIsConnected(false);
              setUserAddress("");
            });
        }
      } catch (err) {
        console.log("StacksProvider check error:", err);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectWallet = async () => {
    try {
      await showConnect({
        appDetails: { 
          name: "Seed Platform", 
          icon: window.location.origin + "/favicon.ico" 
        },
        onFinish: () => {
          setIsConnected(true);
          setTimeout(() => {
            if (window.StacksProvider) {
              window.StacksProvider.getAddresses()
                .then(addresses => {
                  if (addresses && addresses.length > 0) {
                    setUserAddress(addresses[0]);
                  }
                })
                .catch(err => console.log("Error getting addresses:", err));
            }
          }, 1000);
        },
      });
    } catch (err) {
      console.error("Connection error:", err);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const handleCreateCampaign = async () => {
    if (!isConnected || !userAddress) {
      return handleConnectWallet();
    }

    if (!form.goal || !form.duration) {
      alert("Please fill in all fields");
      return;
    }

    if (Number(form.goal) <= 0 || Number(form.duration) <= 0) {
      alert("Goal and duration must be positive numbers");
      return;
    }

    setLoading(true);

    try {
      const options = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "create-campaign",
        functionArgs: [
          uintCV(Number(form.goal) * 1000000), // Convert to microSTX
          uintCV(Number(form.duration)),
          uintCV(Number(form.tokenType)),
        ],
        postConditionMode: PostConditionMode.Allow,
        appDetails: {
          name: "Seed Platform",
          icon: window.location.origin + "/favicon.ico",
        },
        onFinish: (data) => {
          console.log("Transaction submitted:", data);
          alert("Campaign creation submitted! Transaction ID: " + data.txId);
          setForm({ goal: "", duration: "", tokenType: "0" });
          setLoading(false);
          setTimeout(() => fetchCampaigns(), 5000);
        },
        onCancel: () => {
          console.log("Transaction cancelled");
          setLoading(false);
        },
      };

      await openContractCall(options);
    } catch (err) {
      console.error("Create campaign error:", err);
      alert("Failed to create campaign: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  // Fetch campaigns from the blockchain
  const fetchCampaigns = async () => {
    setFetchingCampaigns(true);
    
    try {
      const countUrl = `${network.coreApiUrl}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-campaign-count`;
      
      const countResponse = await fetch(countUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: CONTRACT_ADDRESS,
          arguments: [],
        }),
      });

      if (!countResponse.ok) {
        throw new Error("Failed to fetch campaign count");
      }

      const countData = await countResponse.json();
      const campaignCount = countData.result ? parseInt(countData.result.replace(/^0x/, ""), 16) : 0;
      
      if (campaignCount === 0) {
        setCampaigns([]);
        setFetchingCampaigns(false);
        return;
      }

      const campaignData = [];

      for (let cid = 1; cid <= Math.min(campaignCount, 20); cid++) {
        try {
          const campaignUrl = `${network.coreApiUrl}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-campaign`;
          
          const campaignResponse = await fetch(campaignUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: CONTRACT_ADDRESS,
              arguments: [`0x${cid.toString(16).padStart(32, "0")}`],
            }),
          });

          if (campaignResponse.ok) {
            const data = await campaignResponse.json();
            if (data.result) {
              // Parse the response - this is a simplified parser
              campaignData.push({
                cid,
                owner: "Loading...",
                goal: "Loading...",
                raised: "0",
                deadline: "Loading...",
                tokenType: "0",
                finalized: false
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching campaign ${cid}:`, err);
        }
      }

      setCampaigns(campaignData);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setFetchingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-8 text-center">
          🌱 Seed Platform
        </h1>
        
        {/* Connection Status */}
        <div className="mb-6 text-center">
          {isConnected && userAddress ? (
            <div className="inline-flex items-center gap-2 bg-green-900 border border-green-500 rounded-lg px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-green-400 text-sm">
                Connected: {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
              </p>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="bg-yellow-500 text-black font-semibold py-3 px-8 rounded-md hover:bg-yellow-400 transition shadow-lg hover:shadow-yellow-500/50"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Create Campaign Form */}
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md mx-auto mb-8 shadow-xl">
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
            <p className="text-xs text-gray-500 mt-1">Minimum funding goal</p>
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
            <p className="text-xs text-gray-500 mt-1">Campaign duration in blocks</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">Token Type</label>
            <select
              value={form.tokenType}
              onChange={(e) => setForm({ ...form, tokenType: e.target.value })}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none transition"
            >
              <option value="0">FT (Fungible Token)</option>
              <option value="1">NFT (Non-Fungible Token)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Reward type for backers</p>
          </div>

          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={loading}
            className="bg-yellow-500 text-black font-semibold py-3 px-4 rounded-md hover:bg-yellow-400 transition w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Campaign"
            )}
          </button>
        </div>

        {/* Active Campaigns List */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">Active Campaigns</h2>
            <button
              onClick={fetchCampaigns}
              disabled={fetchingCampaigns}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded transition disabled:opacity-50"
            >
              {fetchingCampaigns ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          
          {fetchingCampaigns && campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-gray-400">No campaigns yet.</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to create one!</p>
            </div>
          ) : (
            campaigns.map((c) => (
              <div key={c.cid} className="bg-gray-800 border border-gray-700 p-6 rounded-lg mb-4 hover:border-yellow-500 transition">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Campaign ID</p>
                    <p className="text-white font-semibold text-lg">{c.cid}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Goal</p>
                    <p className="text-white font-semibold text-lg">{c.goal}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Raised</p>
                    <p className="text-green-400 font-semibold text-lg">{c.raised}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Deadline</p>
                    <p className="text-white font-semibold">{c.deadline}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Token Type</p>
                    <p className="text-white font-semibold">
                      {c.tokenType === "0" ? "🪙 FT" : "🖼️ NFT"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      c.finalized ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"
                    }`}>
                      {c.finalized ? "Finalized" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Owner</p>
                  <p className="text-white text-xs font-mono break-all bg-black px-3 py-2 rounded">
                    {c.owner}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}