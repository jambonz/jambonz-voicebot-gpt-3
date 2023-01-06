const {WebSocketServer} = require('ws');
const {WsRouter, WsSession, handleProtocols} = require('@jambonz/node-client');
const router = new WsRouter();
const logger = require('pino')({level: process.env.LOGLEVEL || 'info'});
const port = process.env.WS_PORT || 3000;
const wss = new WebSocketServer({ port, handleProtocols });

router.use(require('./lib/routes'));

wss.on('listening', () => {
  logger.info(`websocket server listening on port ${port}`);
});
wss.on('connection', (ws, req) => {
  new WsSession({logger, router, ws, req});
});
