const bent = require('bent');
const postCompletion = bent('https://api.openai.com', 'POST', 'json', 200, {
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
});

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/chat-gpt3'});

  svc.on('session:new', (session) => {
    session.locals = {
      transcripts: [],
      logger: logger.child({call_sid: session.call_sid})
    };
    session.locals.logger.info({session}, `new incoming call: ${session.call_sid}`);

    session
      .on('/prompt', onUserPrompt.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session));

    session
      .pause({length: 0.5})
      .gather({
        input: ['speech'],
        actionHook: '/prompt',
        listenDuringPrompt: true,
        timeout: 20,
        say: { text: 'Hi there!  I am open AI\'s GPT 3 large language model.  Ask me anything!'}
      })
      .send();
  });
};

const onUserPrompt = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got speech evt: ${JSON.stringify(evt)}`);

  switch (evt.reason) {
    case 'speechDetected':
      sendCompletion(session, evt);
      break;
    case 'timeout':
      goodbye(session);
      break;
    default:
      session.reply();
      break;
  }
};

const sendCompletion = async(session, evt) => {
  const {logger, transcripts} = session.locals;
  const {transcript, confidence} = evt.speech.alternatives[0];
  let text, truncated = false;

  /* play a typing sound while we want for gpt3 to respond */
  session
    .play({url: 'https://recordings.jambonz.us/keyboard-typing.wav'})
    .reply();

  if (confidence < 0.6) {
    text = 'Sorry, I didn\'t understand that.  Could you try again?';
  }
  else {
    /* get a completion from gpt3 */
    while (transcripts.length > 8) transcripts.shift();
    transcripts.push(`Human: ${transcript}`);
    const prompt = `${transcripts.join('\n\n')}\n\nAI:`;
    logger.info({prompt}, 'sending prompt to openai');
    try {
      const completion = await postCompletion('/v1/completions', {
        model: process.env.OPENAI_MODEL || 'text-davinci-003',
        prompt,
        max_tokens: process.env.MAX_TOKENS || 132,
        user: session.call_sid
      });
      logger.info({completion}, 'got completion from openai');
      transcripts.push(`AI: ${completion.choices[0].text}`);
      if (completion.choices[0].finish_reason === 'length') {
        truncated = true;
        session
          .say({text: 'This is quite a long answer, so I am only going to give you the first part'})
          .pause({length: 0.5});
      }
      text = completion.choices[0].text.trim();
      const paused = text
        .replace(/\n\n/g, '<break strength="strong"/>')
        .replace(/\n/g, '<break strength="medium"/>');

      text = `<speak>${paused}${truncated ?
        '<break strength="strong"/>Well, that\'s all I can say about that given our limited time.' : ''}</speak>`;
    } catch (err) {
      logger.info({err}, 'error getting completion from openai');
      text = 'Sorry, I am having trouble connecting to open AI.  Please check your credentials and try again later.';
    }
  }

  /* now send another command, interrupting the typing sound */
  session
    .gather({
      input: ['speech'],
      actionHook: '/prompt',
      listenDuringPrompt: true,
      timeout: 20,
      say: { text }
    })
    .send();
};

const goodbye = async(session) => {
  session
    .say({text: 'Sorry, I didn\'t hear anything.  Bye for now!'})
    .hangup()
    .reply();
};

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({session, code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
