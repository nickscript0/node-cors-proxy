import { URL } from 'url';

import * as Koa from 'koa';
import * as request from 'request-promise-native';

import * as tld_test from './regexp-top-level-domain';
import { RequestCache } from './Cache';

const cache = new RequestCache();
const app = new Koa();


app.use(async (ctx, next) => {
    await handleRequest(ctx);
    await next();
});

app.listen(8080);

async function handleRequest(ctx: Koa.Context) {
    // Validate User Agent
    if (hasUserAgent(ctx.request)) {
        ctx.response.status = 400;
        ctx.body = `Not Allowed User Agent`;
        return;
    }

    const urlString = ctx.request.url.slice(1); // Remove the preceeding /

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
        ctx.body = e;
    }
}


function isValidRequest(urlString: string): { valid: boolean, reason: string } {
    let url;

    // Validate url parses
    try {
        url = new URL(urlString);
    } catch (err) {
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

function hasUserAgent(clientRequest: Koa.Request) {
    const userAgent: string = clientRequest.get('user-agent');
    console.log(`Blocked User Agent: ${userAgent}`);
    return userAgent && userAgent !== '';
}
