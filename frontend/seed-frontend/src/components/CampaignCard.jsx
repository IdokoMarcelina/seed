import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatStx, calculateProgress, calculateTimeRemaining, getTokenTypeEmoji } from '../utils/formatters';

export default function CampaignCard({ campaign, currentBlock, onUpdate }) {
    const { isConnected, userAddress, connectWallet } = useWallet();
    const { fundCampaign, finalizeCampaign } = useContract();
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isOwner = isConnected && userAddress === campaign.owner;
    const isActive = currentBlock <= campaign.deadline && !campaign.finalized;
    const progress = calculateProgress(campaign.raised, campaign.goal);
    const timeRemaining = calculateTimeRemaining(currentBlock, campaign.deadline);
    const goalReached = campaign.raised >= campaign.goal;

    const handleFund = async () => {
        if (!isConnected) {
            await connectWallet();
            return;
        }

        if (!fundAmount || Number(fundAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setIsProcessing(true);
        try {
            await fundCampaign(campaign.cid, fundAmount);
            alert('Funding transaction submitted! It may take a few minutes to confirm.');
            setShowFundModal(false);
            setFundAmount('');
            if (onUpdate) {
                setTimeout(onUpdate, 5000);
            }
        } catch (err) {
            console.error('Funding error:', err);
            alert('Failed to fund campaign: ' + (err.message || 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalize = async () => {
        if (!isOwner) {
            alert('Only the campaign owner can finalize');
            return;
        }

        if (!goalReached && isActive) {
            alert('Cannot finalize: goal not reached and deadline not passed');
            return;
        }

        setIsProcessing(true);
        try {
            await finalizeCampaign(campaign.cid);
            alert('Finalization transaction submitted!');
            if (onUpdate) {
                setTimeout(onUpdate, 5000);
            }
        } catch (err) {
            console.error('Finalization error:', err);
            alert('Failed to finalize campaign: ' + (err.message || 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 hover:shadow-lg hover:shadow-yellow-500/20 transition">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-semibold mb-1">Campaign #{campaign.cid}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${campaign.finalized ? 'bg-blue-900 text-blue-300' :
                                isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                            }`}>
                            {campaign.finalized ? 'Finalized' : isActive ? 'Active' : 'Ended'}
                        </span>
                    </div>
                    <div className="text-2xl">
                        {getTokenTypeEmoji(campaign.tokenType)}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-yellow-400 font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Goal</p>
                        <p className="text-white font-semibold text-lg">{formatStx(campaign.goal)} STX</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Raised</p>
                        <p className="text-green-400 font-semibold text-lg">{formatStx(campaign.raised)} STX</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Time Remaining</p>
                        <p className="text-white font-semibold">{timeRemaining}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Token Type</p>
                        <p className="text-white font-semibold text-sm">
                            {campaign.tokenType === 0 ? 'FT' : 'NFT'}
                        </p>
                    </div>
                </div>

                {/* Owner */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Owner</p>
                    <p className="text-white text-xs font-mono break-all bg-black px-3 py-2 rounded">
                        {campaign.owner}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isActive && !campaign.finalized && (
                        <button
                            onClick={() => setShowFundModal(true)}
                            className="flex-1 bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition"
                        >
                            Fund Campaign
                        </button>
                    )}
                    {isOwner && !campaign.finalized && (goalReached || !isActive) && (
                        <button
                            onClick={handleFinalize}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-500 transition disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Finalize'}
                        </button>
                    )}
                </div>
            </div>

            {/* Fund Modal */}
            {showFundModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-yellow-400 mb-4">Fund Campaign #{campaign.cid}</h3>

                        <div className="mb-4">
                            <p className="text-gray-400 text-sm mb-2">
                                Goal: {formatStx(campaign.goal)} STX | Raised: {formatStx(campaign.raised)} STX
                            </p>
                            <p className="text-gray-400 text-sm">
                                Remaining: {formatStx(campaign.goal - campaign.raised)} STX
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Amount (STX)</label>
                            <input
                                type="number"
                                placeholder="e.g., 10"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                className="w-full p-3 bg-black border border-gray-700 rounded text-white focus:border-yellow-500 outline-none transition"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowFundModal(false);
                                    setFundAmount('');
                                }}
                                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFund}
                                disabled={isProcessing}
                                className="flex-1 bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Fund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
