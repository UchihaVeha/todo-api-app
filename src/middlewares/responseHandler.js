import Boom from 'boom';

export default () => async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      const { output } = Boom.notFound();
      ctx.status = output.statusCode;
      ctx.body = output.payload;
    } else {
      ctx.body = {
        statusCode: ctx.status,
        payload: ctx.body
      };
    }
  } catch (err) {
    if (err.isJoi) {
      const { details } = err;
      const { output } = Boom.badRequest();
      ctx.status = output.statusCode;
      ctx.body = { ...output.payload, details };
    } else if (err.isBoom) {
      ctx.status = err.output.statusCode;
      ctx.body = err.output.payload;
    } else if (err.status && err.status === 401) {
      const { output } = Boom.unauthorized();
      ctx.status = output.statusCode;
      ctx.body = { ...output.payload };
    } else {
      ctx.log.error(err);
      const { output } = Boom.badImplementation();
      ctx.status = output.statusCode;
      ctx.body = output.payload;
    }
  }
};
