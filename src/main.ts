import * as Koa from 'koa';
import * as request from 'request-promise-native';

import * as tld_test from './regexp-top-level-domain';

const app = new Koa();


app.use(async (ctx, next) => {
    await handleRequest(ctx);
    await next();
});

app.listen(8080);

async function handleRequest(ctx: Koa.Context) {
    const requestUrl = ctx.request.url.slice(1); // Remove the preceeding /

    const isValidCheck = isValidHost(requestUrl);
    if (!isValidCheck.valid) {
        ctx.response.status = 404;
        ctx.body = `Invalid hostname!! - ${isValidCheck.reason}`;
        return;
    }

    try {
        const responseBody = await request.get(requestUrl);
        ctx.body = responseBody;
    } catch (e) {
        ctx.body = e;
    }
}


function isValidHost(url: string): { valid: boolean, reason: string } {
    const hasHttp = url.startsWith('http://') || url.startsWith('https://');
    if (!hasHttp) {
        return { valid: false, reason: 'Does not start with http[s]://' };
    }
    if (tld_test.regexp.test(url)) {
        return { valid: false, reason: `Does not have a valid top level domain: ${url}` };
    }
    return { valid: true, reason: "" };
}