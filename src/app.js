import Koa from 'koa';
import logger from 'koa-pino-logger';
import bodyParser from 'koa-bodyparser';
import cors from 'kcors';
import ping from './controllers/ping';
import responseHandler from './middlewares/responseHandler';
import authorize from './controllers/authorize';
import jwtHandler from './middlewares/JwtHandler';
import todos from './controllers/todos';
import config from './config';

const app = new Koa();
app.use(
  cors({
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);
app.use(logger(config.log));
app.use(responseHandler());
app.use(bodyParser());
app.use(ping());
app.use(authorize.routes());
app.use(authorize.allowedMethods());
app.use(jwtHandler());
app.use(todos.routes());
app.use(todos.allowedMethods());

export default app;
