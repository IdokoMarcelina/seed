import { microStxToStx, BLOCK_TIME_SECONDS } from '../contractConfig';

/**
 * Format STX amount with proper decimals
 */
export const formatStx = (microStx, decimals = 2) => {
    const stx = microStxToStx(microStx);
    return stx.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

/**
 * Format address to show first and last characters
 */
export const formatAddress = (address, startChars = 8, endChars = 6) => {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Calculate time remaining from block height
 * @param {number} currentBlock - Current block height
 * @param {number} deadlineBlock - Deadline block height
 * @returns {string} Formatted time remaining
 */
export const calculateTimeRemaining = (currentBlock, deadlineBlock) => {
    const blocksRemaining = deadlineBlock - currentBlock;

    if (blocksRemaining <= 0) {
        return 'Ended';
    }

    const secondsRemaining = blocksRemaining * BLOCK_TIME_SECONDS;
    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (raised, goal) => {
    if (goal === 0) return 0;
    return Math.min((raised / goal) * 100, 100);
};

/**
 * Format date from timestamp
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Get token type label
 */
export const getTokenTypeLabel = (tokenType) => {
    return tokenType === 0 ? 'FT (Fungible Token)' : 'NFT (Non-Fungible Token)';
};

/**
 * Get token type emoji
 */
export const getTokenTypeEmoji = (tokenType) => {
    return tokenType === 0 ? '🪙' : '🖼️';
};
