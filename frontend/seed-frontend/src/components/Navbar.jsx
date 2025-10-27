import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
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
      <button className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition">
        Connect Wallet
      </button>
    </nav>
  );
}
