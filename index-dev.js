require('babel-register'); // eslint-disable-line import/no-extraneous-dependencies
const App = require('./src/app').default;
const config = require('./src/config').default;

App.listen(config.port);
