import { URL } from 'url';

import * as Koa from 'koa';
import * as request from 'request-promise-native';

import * as tld_test from './regexp-top-level-domain';
import { RequestCache } from './Cache';

const cache = new RequestCache();
const app = new Koa();

// If requests have a prefix path that should be ignored e.g. set to /proxy for
//  requests of the form https://domainA/proxy/https://domainB/path
export const IGNORE_URL_PREFIX = process.env.IGNORE_URL_PREFIX || null;
if (IGNORE_URL_PREFIX) console.log(`IGNORE_URL_PREFIX set: ${IGNORE_URL_PREFIX}`);

app.use(async (ctx, next) => {
    await handleRequest(ctx);
    await next();
});

app.listen(8080);

function removeUrlPrefix(url: string): string {
    let trimmedUrl;
    if (IGNORE_URL_PREFIX) {
        // Remove the entire prefix e.g. /proxy
        trimmedUrl = url.slice(IGNORE_URL_PREFIX.length);
    }

    // Remove the preceeding /, in all cases
    trimmedUrl = trimmedUrl.slice(1);
    return trimmedUrl;
}

async function handleRequest(ctx: Koa.Context) {
    // Validate User Agent
    if (!allowedUserAgent(ctx.request)) {
        ctx.response.status = 400;
        ctx.body = `Not Allowed User Agent`;
        return;
    }

    // Validate url starts with / (we make assumptions on this later)
    if (!ctx.request.url.startsWith('/')) {
        ctx.response.status = 400;
        ctx.body = 'Paths must start with /';
        return;
    }

    const urlString = removeUrlPrefix(ctx.request.url);

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
        // CORS is not necessary if the proxy is on the same server as the web app
        // ctx.response.set('Access-Control-Allow-Origin', '*');
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
    if (!tld_test.regexp.test(url.hostname)) {
        return { valid: false, reason: `Does not have a valid top level domain: ${url}` };
    }
    return { valid: true, reason: "" };
}

function allowedUserAgent(clientRequest: Koa.Request) {
    const userAgent: string | undefined = clientRequest.get('user-agent');
    const allowed = !userAgent || userAgent === 'SAFE';
    if (!allowed) console.log(`Blocked User Agent: ${userAgent}`);
    return allowed;
}
