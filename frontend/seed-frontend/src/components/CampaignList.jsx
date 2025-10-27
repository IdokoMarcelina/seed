import React from "react";

export default function CampaignList() {
  const mockCampaigns = [
    { id: 1, title: "Solar Farm Initiative", goal: "10,000 STX", raised: "6,500 STX", deadline: "3 days left" },
    { id: 2, title: "Blockchain Education Hub", goal: "5,000 STX", raised: "2,400 STX", deadline: "5 days left" },
    { id: 3, title: "NFT Art Collection", goal: "20,000 STX", raised: "19,000 STX", deadline: "1 day left" },
    {id: 4, title: "NFT Solid collection:", goal: "500 Stx", raised: "30 STX", deadline: "1"}
  ];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockCampaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-gray-900 border border-yellow-500 rounded-lg p-6 hover:shadow-lg hover:shadow-yellow-500/20 transition"
        >
          <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
          <p className="text-gray-400 text-sm mb-2">Goal: {campaign.goal}</p>
          <p className="text-gray-400 text-sm mb-2">Raised: {campaign.raised}</p>
          <p className="text-gray-400 text-sm mb-4">Deadline: {campaign.deadline}</p>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition">
            Fund Campaign
          </button>
        </div>
      ))}
    </div>
  );
}
