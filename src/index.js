import App from './app';
import config from './config';

App.listen(config.port, config.host, () => {
  console.log('Server listening port: %d , host: %s', config.port, config.host); // eslint-disable-line no-console
});
