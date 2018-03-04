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
    const requestUrl = ctx.request.url.slice(1);

    if (!isValidHost(requestUrl)) {
        ctx.response.status = 404;
        ctx.body = `Invalid hostname!! - ${requestUrl}`;
        return;
    }

    try {
        const responseBody = await request.get(requestUrl);
        ctx.body = responseBody;
    } catch (e) {
        ctx.body = e;
    }
}

function isValidHost(url: string) {
    const hasHttp = url.startsWith('http://') || url.startsWith('https://');
    return hasHttp && tld_test.regexp.test(url);
}