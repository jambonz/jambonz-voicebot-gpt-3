module.exports = {
  apps : [{
    name: 'jambonz-chat-gpt',
    script: 'app.js',
    instance_var: 'INSTANCE_ID',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      LOGLEVEL: 'info',
      WS_PORT: 3080,
      OPENAI_API_KEY: '',
      OPENAI_API_MODEL: 'text-davinci-003',
      JAMBONZ_ACCOUNT_SID: '',
      JAMBONZ_API_KEY: '',
      WEBHOOK_SECRET: ''
    }
  }]
};
