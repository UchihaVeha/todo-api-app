import fetch from 'node-fetch';
import queryString from 'querystring';

const createServer = app =>
  new Promise(resolve => {
    const server = app.listen(0, () => {
      resolve(server);
    });
  });

const closeServer = server =>
  new Promise(resolve => {
    server.close(() => {
      resolve();
    });
  });

const request = async (app, path, params = {}, options) => {
  const server = await createServer(app);
  let query = '';
  if (options.method === 'GET' || options.method === 'DELETE') {
    query = `?${queryString.stringify(params)}`;
  } else {
    options.body = JSON.stringify(params);
    options.headers = Object.assign({}, options.headers, {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(options.body)
    });
  }
  const { port } = server.address();
  const response = await fetch(
    `http://127.0.0.1:${port}${path}${query}`,
    options
  );
  const body = await response.json();
  closeServer(server);
  return { response, body };
};

export default app => ({
  get: (path, params, options) =>
    request(app, path, params, { ...options, method: 'GET' }),
  post: (path, params, options) =>
    request(app, path, params, { ...options, method: 'POST' }),
  patch: (path, params, options) =>
    request(app, path, params, { ...options, method: 'PATCH' }),
  delete: (path, params, options) =>
    request(app, path, params, { ...options, method: 'DELETE' })
});
