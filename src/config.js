import path from 'path';

const production = 'production';
const development = 'development';
const test = 'test';

const environment = {
  production,
  development,
  test
}[process.env.NODE_ENV || development];

const dbPath = path.resolve(__dirname, 'db');

const env = {
  dev: environment === development,
  prod: environment === production,
  test: environment === test
};

const config = {
  port: process.env.PORT || 3006,
  host: process.env.HOST || '0.0.0.0',
  env,
  urlPrefix: '/v1',
  auth: {
    accessTokenSecretKey: 'my secret',
    accessTokenExpiresIn: 8 * 60 * 60,
    refreshTokenExpiresIn: 2 * 24 * 60 * 60 * 1000
  },
  log: {
    level: env.dev ? 'info' : 'error'
  },
  db: {
    test: {
      client: 'postgresql',
      connection: {
        user: 'postgres'
      },
      migrations: {
        directory: path.resolve(dbPath, 'migrations')
      },
      seeds: {
        directory: path.resolve(dbPath, 'seeds', 'test')
      }
    },
    development: {
      client: 'postgresql',
      connection: {
        database: 'time-logger',
        user: 'time-logger',
        password: 'timelogger'
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        directory: path.resolve(dbPath, 'migrations')
      },
      seeds: {
        directory: path.resolve(dbPath, 'seeds', 'development')
      }
    },
    production: {
      client: 'postgresql',
      connection: process.env.DATABASE_URL,
      migrations: {
        directory: path.resolve(dbPath, 'migrations')
      },
      seeds: {
        directory: path.resolve(dbPath, 'seeds', 'production')
      }
    }
  }
};

export const getDbConfig = () => config.db[environment];
export default config;
