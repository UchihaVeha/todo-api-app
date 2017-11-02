import Router from 'koa-router';
import Boom from 'boom';
import config from '../config';
import Todo, { fieldsSchema, filterSchema, idSchema } from '../models/Todo';
import validateRequestParams from '../middlewares/validateRequestParams';

const router = new Router({
  prefix: config.urlPrefix
});

router.get(
  '/todos/:id',
  validateRequestParams({ urlSchema: idSchema }),
  async ctx => {
    const { id } = ctx.params;
    const [todo] = await Todo.find({ id, user_id: ctx.state.user.id });
    if (!todo) {
      ctx.throw(Boom.notFound(`Todo this id=${id} not found`));
    }
    ctx.body = todo;
  }
);

router.get(
  '/todos',
  validateRequestParams({ urlSchema: filterSchema }),
  async ctx => {
    ctx.body = await Todo.find({
      ...ctx.request.query,
      user_id: ctx.state.user.id
    });
  }
);

router.post(
  '/todos',
  validateRequestParams({ bodySchema: fieldsSchema }),
  async ctx => {
    const [todo] = await Todo.save({
      ...ctx.request.body,
      user_id: ctx.state.user.id
    });
    ctx.status = 201;
    ctx.body = todo;
  }
);

router.patch(
  '/todos/:id',
  validateRequestParams({
    urlSchema: idSchema,
    bodySchema: fieldsSchema
  }),
  async ctx => {
    const { id } = ctx.params;
    const [todo] = await Todo.save(ctx.request.body, id);
    if (!todo) {
      ctx.throw(Boom.notFound(`Todo this id=${id} not found`));
    }
    ctx.status = 200;
    ctx.body = todo;
  }
);

router.delete(
  '/todos/:id',
  validateRequestParams({ urlSchema: idSchema }),
  async ctx => {
    const { id } = ctx.params;
    const [todo] = await Todo.remove(id);
    if (!todo) {
      ctx.throw(Boom.notFound(`Todo this id=${id} not found`));
    }
    ctx.status = 200;
    ctx.body = todo;
  }
);

export default router;
