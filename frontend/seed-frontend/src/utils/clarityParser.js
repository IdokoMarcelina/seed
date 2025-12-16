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

    // Handle type-based boolean (e.g., { type: 'true' } or { type: 'false' })
    if (clarityValue && typeof clarityValue === 'object') {
        if (clarityValue.type === 'true') return true;
        if (clarityValue.type === 'false') return false;
        
        // Standard CV object with value property
        if ('value' in clarityValue) {
            return clarityValue.value === true;
        }
    }

    if (clarityValue.repr) {
        return clarityValue.repr === 'true';
    }

    return String(clarityValue) === 'true';
};

// Parse campaign tuple from contract response
export const parseCampaign = (campaignData) => {
    if (!campaignData) {
        return null;
    }

    // Handle optional/some type - campaign might be wrapped in (some {...})
    let data = campaignData;
    
    // If it's a some type, unwrap it
    if (campaignData.type === 'some' && campaignData.value) {
        data = campaignData.value;
    }
    
    // If it's a tuple type, get the value object
    if (data.type === 'tuple' && data.value) {
        data = data.value;
    }
    
    // Now data should be the actual campaign fields
    if (!data) {
        return null;
    }

    // Helper to safely get and parse field values
    const getField = (key) => {
        const field = data[key];
        if (!field) return null;
        
        // If field has a value property, return it, otherwise return field itself
        return field.value !== undefined ? field.value : field;
    };

    return {
        owner: parsePrincipal(getField('owner')),
        goal: parseUint(getField('goal')),
        deadline: parseUint(getField('deadline')),
        raised: parseUint(getField('raised')),
        finalized: parseBool(getField('finalized')),
        tokenType: parseUint(getField('token-type')),
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
