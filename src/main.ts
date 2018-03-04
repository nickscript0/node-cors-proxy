import * as Koa from 'koa';

const app = new Koa();


app.use(async (ctx, next) => {
  //console.log(ctx.request.url);
  //ctx.body = `RESPONSE`;

  await next();
});

app.listen(8080);
