import React from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../contexts/WalletContext";
import { formatAddress } from "../utils/formatters";

export default function Navbar() {
  const { isConnected, userAddress, isLoading, connectWallet, disconnectWallet } = useWallet();

  const handleWalletAction = async () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      try {
        await connectWallet();
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    }
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-yellow-500">
      <div className="flex items-center space-x-2">
        <div className="bg-yellow-500 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl">
          S
        </div>
        <h1 className="text-2xl text-gray-400 font-bold">Seed</h1>
      </div>
      <div className="flex space-x-6 text-sm">
        <Link to="/" className="hover:text-yellow-400">Home</Link>
        <Link to="/campaigns" className="hover:text-yellow-400">Campaigns</Link>
        <Link to="/dashboard" className="hover:text-yellow-400">Dashboard</Link>
      </div>
      <button
        onClick={handleWalletAction}
        disabled={isLoading}
        className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          'Connecting...'
        ) : isConnected ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            {formatAddress(userAddress)}
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
    </nav>
  );
}
