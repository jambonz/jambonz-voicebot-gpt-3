const {createServer} = require('http');
const {createEndpoint} = require('@jambonz/node-client-ws');
const server = createServer();
const makeService = createEndpoint({server});
const logger = require('pino')({level: process.env.LOGLEVEL || 'info'});
const port = process.env.WS_PORT || 3000;

require('./lib/routes')({logger, makeService});

server.listen(port, () => {
  logger.info(`Chat-GBT3 listening at http://localhost:${port}`);
});
