import request from '../utils/request';
import { createDatabase, dropDatabase } from '../utils/dbManager';
import wait from '../utils/wait';

let App;
const dbName = 'test-db-1';

beforeAll(async () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  await createDatabase(dbName);
  const config = require('../../src/config').default; // eslint-disable-line global-require
  config.db.test.connection.database = dbName;
  const db = require('../../src/db/db').default; // eslint-disable-line global-require
  App = require('../../src/app').default; // eslint-disable-line global-require
  await db.migrate.latest();
});

afterAll(async () => {
  const db = require('../../src/db/db').default; // eslint-disable-line global-require
  await db.destroy();
  await dropDatabase(dbName);
});

describe('Authorize middleware', () => {
  describe('Route: /sign-up', async () => {
    test('should be mandatory - email', async () => {
      const data = {
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should not be empty - email', async () => {
      const data = {
        email: '',
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should not be invalid - email', async () => {
      const data = {
        email: 'invalidEmail',
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should not be empty - password', async () => {
      const data = {
        email: 'test1@test.ua',
        password: ''
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should allow only alpha-numeric characters - password ', async () => {
      const data = {
        email: 'test2@test.ua',
        password: '!@#$%^&*()'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should not be too short - password', async () => {
      const data = {
        email: 'test3@test.ua',
        password: 'pass'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should not be too long - password', async () => {
      const data = {
        email: 'test4@test.ua',
        password: 'p'.repeat(61)
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should be unique email', async () => {
      const data = {
        email: 'test5@test.ua',
        password: 'password'
      };
      await request(App).post('/v1/sign-up', data);
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 401);
      expect(body).toHaveProperty('error', 'Unauthorized');
      expect(body).toHaveProperty('message', 'Email is already registered');
      expect(response.status).toEqual(401);
    });

    test('should register user', async () => {
      const data = {
        email: 'test6@test.ua',
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-up', data);
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).not.toHaveProperty('error');
      expect(body).toHaveProperty('payload');
      expect(body).toHaveProperty('payload.accessToken');
      expect(body).toHaveProperty('payload.refreshToken');
      expect(body).toHaveProperty('payload.user');
      expect(body).toHaveProperty('payload.user.id');
      expect(body).toHaveProperty('payload.user.email', data.email);
      expect(body).not.toHaveProperty('payload.user.password');
      expect(response.status).toEqual(200);
    });
  });

  describe('Route: /sign-in ', async () => {
    test('should not be invalid - email', async () => {
      const data = {
        email: 'invalidEmail',
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-in', data);
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response.status).toEqual(400);
    });

    test('should be registered - email', async () => {
      const data = {
        email: 'test7@test.ua',
        password: 'password'
      };
      const { response, body } = await request(App).post('/v1/sign-in', data);
      expect(body).toHaveProperty('statusCode', 401);
      expect(body).toHaveProperty('error', 'Unauthorized');
      expect(body).toHaveProperty('message', 'Email is not registered');
      expect(response.status).toEqual(401);
    });

    test('should be valid password', async () => {
      const data = {
        email: 'test8@test.ua',
        password: 'password'
      };
      await request(App).post('/v1/sign-up', data);
      data.password = 'notvalidpassword';
      const { response, body } = await request(App).post('/v1/sign-in', data);
      expect(body).toHaveProperty('statusCode', 401);
      expect(body).toHaveProperty('error', 'Unauthorized');
      expect(body).toHaveProperty('message', 'Email or Password is incorrect');
      expect(response.status).toEqual(401);
    });

    test('should authorize user', async () => {
      const data = {
        email: 'test9@test.ua',
        password: 'password'
      };
      await request(App).post('/v1/sign-up', data);
      const { response, body } = await request(App).post('/v1/sign-in', data);
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).not.toHaveProperty('error');
      expect(body).toHaveProperty('payload');
      expect(body).toHaveProperty('payload.accessToken');
      expect(body).toHaveProperty('payload.refreshToken');
      expect(body).toHaveProperty('payload.expiresIn');
      expect(body).toHaveProperty('payload.user');
      expect(body).toHaveProperty('payload.user.id');
      expect(body).toHaveProperty('payload.user.email', data.email);
      expect(body).not.toHaveProperty('payload.user.password');
      expect(response.status).toEqual(200);
    });
  });

  test('should not be invalid - refreshToken', async () => {
    const data = { refreshToken: 'invalidRefreshToken' };
    const { response, body } = await request(App).post('/v1/token', data);
    expect(body).toHaveProperty('statusCode', 401);
    expect(body).toHaveProperty('error', 'Unauthorized');
    expect(body).toHaveProperty('message', 'refreshToken is invalid');
    expect(response.status).toEqual(401);
  });

  describe('Route: /token', () => {
    test('should not be expired - refreshToken', async () => {
      const signUpData = {
        email: 'test10@test.ua',
        password: 'password'
      };
      const {
        body: { payload: { refreshToken: signUpRefreshToken } }
      } = await request(App).post('/v1/sign-up', signUpData);

      const config = require('../../src/config').default; // eslint-disable-line global-require
      const { refreshTokenExpiresIn } = config.auth;
      config.auth.refreshTokenExpiresIn = 1;

      const data = { refreshToken: signUpRefreshToken };
      const { response, body } = await request(App).post('/v1/token', data);
      expect(body).toHaveProperty('statusCode', 401);
      expect(body).toHaveProperty('error', 'Unauthorized');
      expect(body).toHaveProperty('message', 'refreshToken is expired');
      expect(response.status).toEqual(401);
      config.auth.refreshTokenExpiresIn = refreshTokenExpiresIn;
    });

    test('should issue new tokens', async () => {
      const signUpData = {
        email: 'test11@test.ua',
        password: 'password'
      };
      const {
        body: {
          payload: {
            refreshToken: signUpRefreshToken,
            accessToken: signUpAccessToken,
            user: signUpModel
          }
        }
      } = await request(App).post('/v1/sign-up', signUpData);
      await wait(1000);
      const data = { refreshToken: signUpRefreshToken };
      const { response, body } = await request(App).post('/v1/token', data);
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).not.toHaveProperty('error');
      expect(body).toHaveProperty('payload');
      expect(body).toHaveProperty('payload.accessToken');
      expect(body.payload.accessToken).not.toEqual(signUpAccessToken);
      expect(body).toHaveProperty('payload.refreshToken');
      expect(body.payload.refreshToken).not.toEqual(signUpRefreshToken);
      expect(body).toHaveProperty('payload.expiresIn');
      expect(body).toHaveProperty('payload.user');
      expect(body.payload.user).toEqual(signUpModel);
      expect(response.status).toEqual(200);
    });
  });
});
