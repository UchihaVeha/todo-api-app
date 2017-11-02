import Router from 'koa-router';
import config from '../config';

const router = new Router({
  prefix: config.urlPrefix
});

router.get('/ping', async ctx => {
  ctx.body = 'working';
  ctx.status = 200;
});

export default () => router.routes();
