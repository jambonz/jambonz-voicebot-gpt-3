const {WebhookResponse} = require('@jambonz/node-client');
const bent = require('bent');
const postCompletion = bent('https://api.openai.com', 'POST', 'json', 200, {
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
});

const onSessionNew =  (ws, logger, {msgid, payload}) => {
  const from = payload.from;
  try {
    logger.info({msgid, payload}, `got session:new from caller ${from}`);
    const app = new WebhookResponse();
    app
      .gather({
        input: ['speech'],
        actionHook: '/chat-gpt/action',
        listenDuringPrompt: true,
        timeout: 20,
        say: { text: 'Hi there!  I am chat GPT.  Ask me anything!'}
      });
    ws.ack(msgid, app);
  } catch (err) {
    logger.error(err, 'Error in onSessionNew');
  }
};

const onVerbHook =  async(ws, logger, {msgid, hook, payload}) => {
  logger.info({msgid, payload, hook}, 'got verb:hook');
  try {
    const from = payload.from;
    if (!payload.speech) {
      logger.info('no speech detected, hanging up');
      const app = new WebhookResponse();
      app
        .say({text: 'Sorry, I didn\'t hear anything.  Bye for now!'})
        .hangup();
      return ws.ack(msgid, app);
    }

    // respond with ack immediately, then give chatGPT time to respond
    const res = new WebhookResponse();
    res.play({url: 'https://recordings.jambonz.us/keyboard-typing.wav'});
    ws.ack(msgid, res);

    const app = new WebhookResponse();
    let text, truncated;
    if (payload.speech.alternatives[0].confidence < 0.6) {
      text = 'Sorry, I didn\'t understand that.  Could you try again?';
    }
    else {
      const completion = await postCompletion('/v1/completions', {
        model: process.env.OPENAI_MODEL || 'text-davinci-003',
        prompt: payload.speech.alternatives[0].transcript,
        max_tokens: 132,
        user: from
      });
      logger.info({completion}, 'got completion from openai');

      if (completion.choices[0].finish_reason === 'length') {
        truncated = true;
        app
          .say({text: 'This is quite a long answer, so I am only going to give you the first part'})
          .pause({length: 0.5});
      }
      text = completion.choices[0].text.trim();
    }
    const paused = text
      .replace(/\n\n/g, '<break strength="strong"/>')
      .replace(/\n/g, '<break strength="medium"/>');

    logger.info({text, paused}, 'added breaks');

    text = `<speak>${paused}${truncated ? 
      '<break strength="strong"/>Well, that\'s all I can say about that' : ''}</speak>`;

    logger.info({text}, 'chatGPT response to caller');

    app
      .gather({
        input: ['speech'],
        actionHook: '/chat-gpt/action',
        listenDuringPrompt: true,
        timeout: 20,
        say: { text }
      });
    ws.sendCommand('redirect', app);
  } catch (err) {
    logger.error(err, 'Error in onVerbHook');
  }
};

const onCallStatus =  (ws, logger, {msgid, payload}) => {
  logger.info({msgid, payload}, 'got call:status');
};

const onError =  (ws, logger, {msgid, payload}) => {
  logger.info({msgid, payload}, 'got error');
};

const onClose =  (ws, logger) => {
  logger.info('socket closed from far end');
};

const handler = async(ws) => {
  const {logger} = ws.locals;
  ws
    .on('session:new', onSessionNew.bind(null, ws, logger))
    .on('verb:hook', onVerbHook.bind(null, ws, logger))
    .on('call:status', onCallStatus.bind(null, ws, logger))
    .on('jambonz:error', onError.bind(null, ws, logger))
    .on('close', onClose.bind(null, ws, logger));
};

module.exports = handler;
