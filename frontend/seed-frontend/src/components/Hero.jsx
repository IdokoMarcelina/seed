import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center py-24 px-6">
      <h1 className="text-5xl font-bold mb-4 text-yellow-400">
        Decentralized Crowdfunding Platform
      </h1>
      <p className="text-gray-400 max-w-xl mb-8">
        Create, fund, and grow innovative projects securely on the Stacks blockchain.
      </p>
      <div className="flex space-x-4">
        <Link
          to="/campaigns"
          className="bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold hover:bg-yellow-400 transition"
        >
          Explore Campaigns
        </Link>
        <Link
          to="/dashboard"
          className="border border-yellow-500 text-yellow-500 px-6 py-3 rounded-md font-semibold hover:bg-yellow-500 hover:text-black transition"
        >
          Start a Campaign
        </Link>
      </div>
    </section>
  );
}
