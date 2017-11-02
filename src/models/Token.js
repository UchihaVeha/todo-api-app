import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import db from '../db/db';

const fields = ['id', 'user_id', 'refresh_token', 'updated_at'];
const tableName = 'tokens';

const createRefreshToken = async userId => {
  const [token] = await db(tableName).insert(
    {
      user_id: userId,
      refresh_token: bcrypt.genSaltSync(10)
    },
    fields
  );
  return token.refresh_token;
};

const updateRefreshToken = async userId => {
  const [token] = await db(tableName)
    .where({ user_id: userId })
    .update({ refresh_token: bcrypt.genSaltSync(10) }, fields);
  return token.refresh_token;
};

const createAccessToken = userId =>
  jwt.sign(
    {
      id: userId
    },
    config.auth.accessTokenSecretKey,
    {
      expiresIn: config.auth.accessTokenExpiresIn
    }
  );

class Token {
  static createTokens = async userId => {
    const refreshToken = await createRefreshToken(userId);
    const accessToken = await createAccessToken(userId);
    return {
      refreshToken,
      accessToken
    };
  };

  static updateTokens = async userId => {
    const refreshToken = await updateRefreshToken(userId);
    const accessToken = await createAccessToken(userId);
    return {
      refreshToken,
      accessToken
    };
  };

  static findOne(params) {
    return db(tableName)
      .where(params)
      .first(fields);
  }

  static isExpired = date => {
    const expiresIn = config.auth.refreshTokenExpiresIn;
    const createdAt = new Date(date);
    const now = new Date();
    return createdAt.getTime() + expiresIn < now.getTime();
  };
}

export default Token;
