import pgtools from 'pgtools';
import { getDbConfig } from '../../src/config';

export const createDatabase = async dbName => {
  const { user, password } = getDbConfig().connection;
  await pgtools.createdb({ user, password }, dbName);
  return dbName;
};

export const dropDatabase = async dbName => {
  const { user, password } = getDbConfig().connection;
  await pgtools.dropdb({ user, password }, dbName);
};
