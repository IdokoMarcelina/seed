import React from "react";
import CreateCampaign from "../components/CreateCampaign";

export default function Dashboard() {
  return (
    <div className="px-8 py-10">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">Create a Campaign</h2>
      <CreateCampaign />
    </div>
  );
}
