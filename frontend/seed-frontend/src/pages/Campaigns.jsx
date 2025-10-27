import React from "react";
import CampaignList from "../components/CampaignList";

export default function Campaigns() {
  return (
    <div className="px-8 py-10">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">Active Campaigns</h2>
      <CampaignList />
    </div>
  );
}
