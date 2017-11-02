import Router from 'koa-router';
import Boom from 'boom';
import config from '../config';
import User, { fieldsSchema } from '../models/User';
import Token from '../models/Token';
import validateRequestParams from '../middlewares/validateRequestParams';

const router = new Router({
  prefix: config.urlPrefix
});

router.post(
  '/sign-in',
  validateRequestParams({ bodySchema: fieldsSchema }),
  async ctx => {
    const { email, password } = ctx.request.body;
    const user = await User.findOne({ email }, [
      'id',
      'email',
      'password_hash'
    ]);
    if (!user) {
      ctx.throw(Boom.unauthorized('Email is not registered'));
    }
    if (!await User.comparePassword(password, user.password_hash)) {
      ctx.throw(Boom.unauthorized('Email or Password is incorrect'));
    }
    delete user.password_hash;
    const { refreshToken, accessToken } = await Token.updateTokens(user.id);

    ctx.body = {
      refreshToken,
      accessToken,
      expiresIn: config.auth.accessTokenExpiresIn,
      user
    };
  }
);

router.post(
  '/sign-up',
  validateRequestParams({ bodySchema: fieldsSchema }),
  async ctx => {
    const { email, password } = ctx.request.body;
    const emailIsExist = await User.findOne({ email });
    if (emailIsExist) {
      ctx.throw(Boom.unauthorized('Email is already registered'));
    }
    const passwordHash = await User.createHashPassword(password);
    const [user] = await User.create({
      email,
      password_hash: passwordHash
    });
    const { refreshToken, accessToken } = await Token.createTokens(user.id);

    ctx.body = {
      refreshToken,
      accessToken,
      expiresIn: config.auth.accessTokenExpiresIn,
      user
    };
  }
);

router.post('/token', async ctx => {
  const { refreshToken } = ctx.request.body;
  const token = await Token.findOne({ refresh_token: refreshToken });
  if (!token) {
    ctx.throw(Boom.unauthorized('refreshToken is invalid'));
  }
  if (Token.isExpired(token.updated_at)) {
    ctx.throw(Boom.unauthorized('refreshToken is expired'));
  }
  const user = await User.findOne({ id: token.user_id });
  const {
    refreshToken: newRefreshToken,
    accessToken: newAccessToken
  } = await Token.updateTokens(user.id);

  ctx.body = {
    refreshToken: newRefreshToken,
    accessToken: newAccessToken,
    expiresIn: config.auth.accessTokenExpiresIn,
    user
  };
});

export default router;
