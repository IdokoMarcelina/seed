/**
 * Parse Clarity value responses from the Stacks API
 */

// Parse a Clarity uint to JavaScript number
export const parseUint = (clarityValue) => {
    if (!clarityValue) return 0;

    // Handle standard CV object (UInt/Int)
    if (clarityValue && typeof clarityValue === 'object') {
        if ('value' in clarityValue) {
            return Number(clarityValue.value);
        }
    }

    // Handle hex string format (0x...)
    if (typeof clarityValue === 'string' && clarityValue.startsWith('0x')) {
        return parseInt(clarityValue.slice(2), 16);
    }

    // Handle object format with repr field (legacy)
    if (clarityValue.repr) {
        return parseInt(clarityValue.repr.replace('u', ''));
    }

    return Number(clarityValue);
};

// Parse a Clarity principal to string
export const parsePrincipal = (clarityValue) => {
    if (!clarityValue) return '';

    if (typeof clarityValue === 'string') {
        return clarityValue;
    }

    // Standard CV object (Principal)
    if (clarityValue.value) {
        // StandardPrincipal or ContractPrincipal
        if (typeof clarityValue.value === 'string') return clarityValue.value;
        // Sometimes it's address? check type
        if (clarityValue.address && clarityValue.contractName) {
            return `${clarityValue.address.hash160 || clarityValue.address}.${clarityValue.contractName.content || clarityValue.contractName}`;
        }
    }

    // Fallback for simple object structure
    if (clarityValue.address) return clarityValue.address;

    if (clarityValue.repr) {
        return clarityValue.repr;
    }

    return String(clarityValue);
};

// Parse a Clarity boolean
export const parseBool = (clarityValue) => {
    if (!clarityValue) return false;

    if (typeof clarityValue === 'boolean') {
        return clarityValue;
    }

    // Standard CV object
    if (clarityValue && typeof clarityValue === 'object' && 'value' in clarityValue) {
        return clarityValue.value === true;
    }

    if (clarityValue.repr) {
        return clarityValue.repr === 'true';
    }

    return String(clarityValue) === 'true';
};

// Parse campaign tuple from contract response
export const parseCampaign = (campaignData) => {
    if (!campaignData || !campaignData.value) {
        return null;
    }

    const data = campaignData.value;

    // Handle different response formats
    const getValue = (key) => {
        if (data[key]) return data[key];
        if (data.data && data.data[key]) return data.data[key];
        return null;
    };

    return {
        owner: parsePrincipal(getValue('owner')),
        goal: parseUint(getValue('goal')),
        deadline: parseUint(getValue('deadline')),
        raised: parseUint(getValue('raised')),
        finalized: parseBool(getValue('finalized')),
        tokenType: parseUint(getValue('token-type')),
    };
};

// Parse optional value (some/none)
export const parseOptional = (clarityValue, parser = (v) => v) => {
    if (!clarityValue) return null;

    if (clarityValue.type === 'none' || clarityValue === 'none') {
        return null;
    }

    if (clarityValue.type === 'some' && clarityValue.value) {
        return parser(clarityValue.value);
    }

    return parser(clarityValue);
};

// Parse response from read-only function call
export const parseReadOnlyResponse = (response) => {
    if (!response || !response.result) {
        return null;
    }

    return response.result;
};
