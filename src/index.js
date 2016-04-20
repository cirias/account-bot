import config from './config.js';

import express from 'express';
import bodyParser from 'body-parser';
import bunyanLogger from 'express-bunyan-logger';

import router from './router.js';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bunyanLogger({
  name: config.name,
  level: config.logLevel,
}));

app.use(`/${config.token}`, router);

app.listen(config.port, () => {
  console.log('Listening on', config.port);
});
