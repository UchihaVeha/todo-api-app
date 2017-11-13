require('babel-register'); // eslint-disable-line import/no-extraneous-dependencies
const App = require('./src/app').default;
const config = require('./src/config').default;

App.listen(config.port, config.host, () => {
  console.log('Server listening port: %d , host: %s', config.port, config.host); // eslint-disable-line no-console
});
