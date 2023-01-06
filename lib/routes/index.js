const {WsRouter} = require('@jambonz/node-client');
const router = new WsRouter();

router.use('/chat-gpt', require('./chat-gpt'));

module.exports = router;
