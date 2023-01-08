# jambonz-chat-gpt

This is an example jambonz application that demonstrates how to use the websocket interface to interact with the OpenAI GPT-3 API in a voice call.

## Features

- Callers can ask questions and receive responses from OpenAI GPT-3 in a voice call.
- The conversation is stateful, so you can ask follow-up questions.
- Any of the [GPT-3 models](https://beta.openai.com/docs/models/gpt-3) can be used (defaults to text-davinci-003, the best and slowest)
- Uses the websocket interface as an alternative to HTTP webhooks.

## Installation

1. Install the dependencies:

```shell
git clone https://github.com/jambonz/jambonz-chat-gpt.git
cd jambonz-chat-gpt
npm install
```

2. Edit the provided `ecosystem.config.js` file to insert your OpenAI and jambonz credentials.  

**jambonz variables**

The standard jambonz configuration must be supplied:
- `JAMBONZ_ACCOUNT_SID` - your account sid
- `JAMBONZ_API_KEY` - an api key for your jambonz account
- `WEBHOOK_SECRET` - the webhook secret for your account

**openai variables**

To access openai you must have created an [account](https://openai.com/api/) and generated an api key.
- `OPENAI_API_KEY` - an openai api key
- `OPENAI_API_MODEL` - the GPT-3 model to use (defaults to text-davinci-003)
