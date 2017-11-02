import Joi from 'joi';

export default ({ urlSchema = null, bodySchema = null }) => (ctx, next) => {
  if (urlSchema) {
    Joi.assert(
      { ...ctx.request.query, ...ctx.params },
      urlSchema.options({ abortEarly: false })
    );
  }
  if (bodySchema) {
    Joi.assert(ctx.request.body, bodySchema.options({ abortEarly: false }));
  }
  return next();
};
