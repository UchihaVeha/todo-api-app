import bcrypt from 'bcryptjs';
import Joi from 'joi';
import db from '../db/db';

export const fieldsSchema = Joi.object().keys({
  email: Joi.string()
    .email()
    .max(255)
    .required(),
  password: Joi.string()
    .alphanum()
    .min(6)
    .max(60)
});

const table = 'users';
const fields = ['id', 'email'];

class User {
  static findOne(params, columns = fields) {
    return db(table)
      .where(params)
      .first(columns);
  }

  static create(data) {
    return db(table).insert(data, fields);
  }

  static update(id, data) {
    return db(table)
      .where({ id })
      .update(data, fields);
  }

  static createHashPassword = password => bcrypt.hash(password, 8);
  static comparePassword = (password, hash) => bcrypt.compare(password, hash);
}

export default User;
