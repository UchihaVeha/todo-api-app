import moment from 'moment';
import request from '../utils/request';
import { createDatabase, dropDatabase } from '../utils/dbManager';

let App;
const dbName = 'test-todos';

let token = null;
const createTodo = async (data = {}) => {
  const defaultData = {
    title: 'test',
    onDate: new Date().toISOString(),
    isCompleted: true,
    tags: ['tag', 'tag_2']
  };
  const { body } = await request(App).post(
    '/v1/todos',
    {
      ...defaultData,
      ...data
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return body.payload;
};

beforeAll(async () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  await createDatabase(dbName);
  const config = require('../../src/config').default; // eslint-disable-line global-require
  config.db.test.connection.database = dbName;
  const db = require('../../src/db/db').default; // eslint-disable-line global-require
  App = require('../../src/app').default; // eslint-disable-line global-require
  await db.migrate.latest();
  const data = {
    email: 'test9@test.ua',
    password: 'password'
  };
  await request(App).post('/v1/sign-up', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const { body } = await request(App).post('/v1/sign-in', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  token = body.payload.accessToken;
});

afterAll(async () => {
  const db = require('../../src/db/db').default; // eslint-disable-line global-require
  await db.destroy();
  await dropDatabase(dbName);
});

describe('Todos middleware', () => {
  describe('Create Todo: POST /todos', async () => {
    test('should: create new todo', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString(),
        isCompleted: true,
        tags: ['tag', 'tag_2']
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 201);
      expect(body).toHaveProperty('payload.id', 1);
      expect(body).toHaveProperty('payload.isCompleted', data.isCompleted);
      expect(body).toHaveProperty('payload.title', data.title);
      expect(body).toHaveProperty(
        'payload.onDate',
        moment(data.onDate).toISOString()
      );
      expect(body).toHaveProperty('payload.tags');
      expect(body).toHaveProperty('payload.tags');
      const tags = body.payload.tags.map(tag => tag.name);
      expect(tags).toEqual(data.tags);
      expect(response).toHaveProperty('status', 201);
    });

    test('should: todo.isCompleted default false', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString()
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('payload.isCompleted', false);
      expect(response).toHaveProperty('status', 201);
    });

    test('should: todo.tags default empty array', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString()
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('payload.tags', []);
      expect(response).toHaveProperty('status', 201);
    });

    test('should: todo.title is required', async () => {
      const data = {
        onDate: new Date().toISOString()
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('details');
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });

    test('should: todo.onDate is required', async () => {
      const data = {
        title: 'test'
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('details');
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });

    test('should: todo.tags max length 20', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString(),
        tags: [...new Array(21)].map((v, i) => `test${i}`)
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('details');
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });

    test('should: todo.tags can be - min 2, max 50,  alphanumeric or _ or - ', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString(),
        tags: ['1', 't'.repeat(51), 'not valid', '!@#$%&*']
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('details');
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });

    test('should: tags be unique', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString(),
        tags: ['unique', 'unique']
      };
      const { response, body } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('details');
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });
  });
  describe('Update Todo: patch /todos/:id', async () => {
    test('should: update todo', async () => {
      const data = {
        title: 'test updated',
        onDate: new Date().toISOString(),
        isCompleted: false,
        tags: ['tag_2', 'tag_3']
      };
      const { id } = await createTodo();
      const { response, body } = await request(App).patch(
        `/v1/todos/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload.id', id);
      expect(body).toHaveProperty('payload.isCompleted', data.isCompleted);
      expect(body).toHaveProperty('payload.title', data.title);
      expect(body).toHaveProperty(
        'payload.onDate',
        moment(data.onDate).toISOString()
      );
      expect(body).toHaveProperty('payload.tags');
      const tags = body.payload.tags.map(tag => tag.name);
      expect(tags).toEqual(data.tags);
      expect(response).toHaveProperty('status', 200);
    });

    test('should: error if not exist', async () => {
      const data = {
        title: 'test',
        onDate: new Date().toISOString()
      };
      const id = 100000;
      const { response, body } = await request(App).patch(
        `/v1/todos/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 404);
      expect(body).toHaveProperty('message', `Todo this id=${id} not found`);
      expect(response).toHaveProperty('status', 404);
    });
  });

  describe('Fetch Todo: get /todos/:id', async () => {
    test('should: fetch todo by id', async () => {
      const { id } = await createTodo();
      const { response, body } = await request(App).get(
        `/v1/todos/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload.id', id);
      expect(response).toHaveProperty('status', 200);
    });
  });

  describe('Fetch Todos: get /todos', async () => {
    test('should: onDate param is required', async () => {
      const params = {};
      const { response, body } = await request(App).get('/v1/todos', params, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 400);
      expect(body.details).toMatchSnapshot();
      expect(response).toHaveProperty('status', 400);
    });

    test('should: filter by onDate param', async () => {
      const filterDay = moment()
        .add(-7, 'day')
        .toISOString();
      const beforeDay = moment(filterDay)
        .add(-1, 'day')
        .toISOString();
      const nextDay = moment(filterDay)
        .add(1, 'day')
        .toISOString();
      await createTodo({ onDate: beforeDay });
      await createTodo({ onDate: filterDay });
      await createTodo({ onDate: nextDay });
      const params = { onDate: filterDay };
      const { response, body } = await request(App).get('/v1/todos', params, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload');
      expect(body.payload).toHaveLength(1);
      expect(response).toHaveProperty('status', 200);
    });

    test('should: return with tags', async () => {
      const data = {
        onDate: new Date().toISOString(),
        tags: ['test1', 'test2']
      };
      const createdTodo = await createTodo(data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const { response, body } = await request(App).get(
        '/v1/todos',
        {
          onDate: data.onDate
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload');
      const foundTodo = body.payload.filter(t => t.id === createdTodo.id);
      expect(foundTodo[0]).toEqual(createdTodo);
      expect(response).toHaveProperty('status', 200);
    });

    test('should: return empty array if no tags', async () => {
      const params = {
        onDate: new Date().toISOString()
      };
      const data = {
        title: 'test tags',
        onDate: params.onDate
      };
      const { body: createdTodo } = await request(App).post('/v1/todos', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const { response, body } = await request(App).get('/v1/todos', params, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload');
      const foundTodo = body.payload.filter(
        t => t.id === createdTodo.payload.id
      );
      expect(foundTodo[0].tags).toEqual([]);
      expect(response).toHaveProperty('status', 200);
    });
  });

  describe('Delete Todo: delete /todos/:id', async () => {
    test('should: delete todo', async () => {
      const { id } = await createTodo();
      const { response, body } = await request(App).delete(
        `/v1/todos/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 200);
      expect(body).toHaveProperty('payload.id', id);
      expect(response).toHaveProperty('status', 200);
      const { response: r, body: b } = await request(App).get(
        `/v1/todos/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(b).toHaveProperty('statusCode', 404);
      expect(b).toHaveProperty('message', `Todo this id=${id} not found`);
      expect(r).toHaveProperty('status', 404);
    });

    test('should: error if not exist', async () => {
      const id = 100000;
      const { response, body } = await request(App).delete(
        `/v1/todos/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(body).toHaveProperty('statusCode', 404);
      expect(body).toHaveProperty('message', `Todo this id=${id} not found`);
      expect(response).toHaveProperty('status', 404);
    });
  });
});
