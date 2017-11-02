import koaJwt from 'koa-jwt';
import config from '../config';

export default () =>
  koaJwt({ secret: config.auth.accessTokenSecretKey }).unless({
    path: [/^\/sign-in|sign-up|token/]
  });
