import { URL } from 'url';

import * as Koa from 'koa';
import * as request from 'request-promise-native';

import * as tld_test from './regexp-top-level-domain';
import { RequestCache } from './Cache';

import { envVars } from './environment';

const cache = new RequestCache(envVars.cacheExpirySeconds);
const CACHE_INFO_PREFIX = '/cache_info';

const app = new Koa();


app.use(async (ctx, next) => {
    await handleRequest(ctx);
    await next();
});

app.listen(8080);

function removeUrlPrefix(url: string, removePrefix: string | undefined): string {
    let trimmedUrl;
    if (removePrefix) {
        // Remove the entire prefix e.g. /proxy
        trimmedUrl = url.slice(removePrefix.length);
    }

    // Remove the preceeding /, in all cases
    trimmedUrl = trimmedUrl.slice(1);
    return trimmedUrl;
}

async function handleRequest(ctx: Koa.Context) {
    // Validate User Agent: Javascript can't change this header, so commented out
    // if (!allowedUserAgent(ctx.request)) {
    //     ctx.response.status = 400;
    //     ctx.body = `Not Allowed User Agent`;
    //     return;
    // }

    // Validate url starts with / (we make assumptions on this later)
    if (!ctx.request.url.startsWith('/')) {
        ctx.response.status = 400;
        ctx.body = 'Paths must start with /';
        return;
    }


    if (ctx.request.url.startsWith(CACHE_INFO_PREFIX)) {
        const cacheUrlString = removeUrlPrefix(ctx.request.url, CACHE_INFO_PREFIX);
        ctx.response.body = cache.getCacheInfo(cacheUrlString);
        return;
    }

    const urlString = removeUrlPrefix(ctx.request.url, envVars.ignoreUrlPrefix);

    const isValidCheck = isValidRequest(urlString);
    if (!isValidCheck.valid) {
        ctx.response.status = 404;
        ctx.body = `Invalid url: ${isValidCheck.reason}`;
        return;
    }

    try {
        let responseBody = await cache.get(urlString);
        if (responseBody === null) {
            responseBody = await request.get(urlString);
            // Only cache if it is not null / empty
            if (responseBody) cache.set(urlString, responseBody);
            console.log(`Requested: ${urlString}`);
        } else {
            console.log(`Cached hit: ${urlString}`);
        }
        ctx.body = responseBody;
        if (envVars.corsAll) ctx.response.set('Access-Control-Allow-Origin', '*');
    } catch (e) {
        console.log(e);
        ctx.response.status = 500;
        ctx.body = 'Problem occurred during request';
    }
}

function isValidRequest(urlString: string): { valid: boolean, reason: string } {
    let url;

    // Validate url parses
    try {
        url = new URL(urlString);
    } catch (err) {
        console.log(err);
        return { valid: false, reason: "Unable to parse url" };
    }

    // Validate protocol
    const hasHttp = url.href.startsWith('http://') || url.href.startsWith('https://');
    if (!hasHttp) {
        return { valid: false, reason: 'Does not start with http[s]://' };
    }

    // Validate TLD
    if (!envVars.extraTLDs.includes(url.hostname) && url.hostname !== 'localhost'
        && !tld_test.regexp.test(url.hostname)) {
        return { valid: false, reason: `Does not have a valid top level domain: ${url}` };
    }
    return { valid: true, reason: "" };
}

// Browser requests can't set the User-Agent header apparently
// Chrome gives error: Refused to set unsafe header "User-Agent"
// function allowedUserAgent(clientRequest: Koa.Request) {
//     const userAgent: string | undefined = clientRequest.get('user-agent');
//     const allowed = !userAgent || userAgent === 'SAFE';
//     if (!allowed) console.log(`Blocked User Agent: ${userAgent}`);
//     return allowed;
// }
