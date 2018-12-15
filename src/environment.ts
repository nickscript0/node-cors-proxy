/* Environment Variables */

// If requests have a prefix path that should be ignored e.g. set to /proxy for
//  requests of the form https://domainA/proxy/https://domainB/path
const IGNORE_URL_PREFIX = process.env.IGNORE_URL_PREFIX || undefined; // e.g. IGNORE_URL_PREFIX=/proxy

// Duration requests should be cached
const CACHE_EXPIRY_SECONDS = process.env.CACHE_EXPIRY_SECONDS || '3600'; // e.g. CACHE_EXPIRY_SECONDS=60

// Comma separated extra Top level domains to allow, useful for testing in containers with single word hostnames
const EXTRA_TLDS = process.env.EXTRA_TLDS; // e.g. EXTRA_TLDS=web,test

// Whether to turn on CORS for all origins (Access-Control-Allow-Origin *), default false (off)
// Note: CORS is not necessary if the proxy is on the same server as the web app
const CORS_ALL = process.env.CORS_ALL; // e.g. CORS_ALL=true

interface EnvVars {
    ignoreUrlPrefix: string | undefined;
    cacheExpirySeconds: number;
    extraTLDs: string[];
    corsAll: boolean;
}

function parseCsv(csv: string | undefined) {
    if (!csv) return [];
    return csv.split(',').map(s => s.trim());
}


export const envVars: EnvVars = {
    ignoreUrlPrefix: IGNORE_URL_PREFIX,
    cacheExpirySeconds: parseInt(CACHE_EXPIRY_SECONDS),
    extraTLDs: parseCsv(EXTRA_TLDS),
    corsAll: (CORS_ALL && CORS_ALL.toLowerCase() === 'true') ? true : false
};

// Log environment variables
console.log(`Parsed environment variables: ${JSON.stringify(envVars, undefined, 2)}`);

