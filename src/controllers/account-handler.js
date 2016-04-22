import User from '../models/user.js';
import Update from '../models/update.js';
import google from 'googleapis';
import GoogleAuth from 'google-auth-library';
import credentials from '../../client_secret.json';

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];

async function createUpdate(update) {
  await Update.create({
    id: update.update_id,
    data: update,
  });

  const [user] = await User.findOrCreate({ where: { id: update.message.from.id } });
  update._user = user;
  update._state = update._user.session.state;
  return update;
}

async function start(update) {
  if (update._user.session.state === 'unautherized') {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const auth = new GoogleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return {
      method: 'sendMessage',
      chat_id: update.message.chat.id,
      text: `
Hi! ${update.message.from.first_name}
Let me help you manage expenses.
To this end, I need to access your Google Drive and Worksheets.
I will place all the data in the sheet - 'Spreadsheet Running Account'.
Please open this url, then send the code back to me:
${authUrl}
`,
    };
  }

  return {
    method: 'sendMessage',
    chat_id: update.message.chat.id,
    text: `
Hi! ${update.message.from.first_name}
`,
  };
}

function saveToken(update) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  return new Promise((resolve, reject) => {
    console.log('oauth2Client.getToken');
    oauth2Client.getToken(update.message.text, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return reject(err);
      }

      resolve(token);
    });
  }).then(token => {
    update._user.credentials = token;
    update._user.session = { state: 'autherized' };
    return update._user.save();
  }).then(() => ({
    method: 'sendMessage',
    chat_id: update.message.chat.id,
    text: `Great! You can add new entry now! For example, sending message '19.2 Books'` +
      ` to me will add an entry with 19.2 as value and Books as category.`,
  }));
}

async function addEntry(update) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  oauth2Client.credentials = update._user.credentials;

  const scriptId = 'MkuM6DWwk3XAQI3PneL1id00LTOfyky5F';
  const script = google.script('v1');

  // Make the API request. The request object is included here as 'resource'.
  return new Promise((resolve, reject) => {
    const [, value, , category] = /^([+-]?\d+(\.\d+)?)\s+(\S+)/.exec(update.message.text);
    script.scripts.run({
      auth: oauth2Client,
      resource: {
        function: 'addEntry',
        parameters: [[new Date(), category, value]],
      },
      scriptId,
    }, (err, resp) => {
      if (err) {
        // The API encountered a problem before the script started executing.
        console.log('The API returned an error: ' + err);
        return reject(err);
      }

      if (resp.error) {
        // The API executed, but the script returned an error.

        // Extract the first (and only) set of error details. The values of this
        // object are the script's 'errorMessage' and 'errorType', and an array
        // of stack trace elements.
        const error = resp.error.details[0];
        console.log('Script error message: ' + error.errorMessage);
        return reject(resp.error);
      }

      resolve({
        method: 'sendMessage',
        chat_id: update.message.chat.id,
        parse_mode: 'Markdown',
        text: `Got it!`,
      });
    });
  });
}

async function help(update) {
  return {
    method: 'sendMessage',
    chat_id: update.message.chat.id,
    parse_mode: 'Markdown',
    text: `
- /help - print usage
`,
  };
}

async function controller(req, res) {
  let reply;
  try {
    const update = await createUpdate(req.body);
    switch (true) {
      case update.message.text === '/start':
        req.log.info({ route: '/start' });
        reply = await start(update);
        break;
      case update.message.text === '/help':
        req.log.info({ route: '/help' });
        reply = await help(update);
        break;
      case /^(?!\/)/.test(update.message.text) &&
            update._user.session.state === 'unautherized':
        req.log.info({ route: 'saveToken' });
        reply = await saveToken(update);
        break;
      case /^([+-]?\d+(\.\d+)?)\s+(\S+)/.test(update.message.text) &&
            update._user.session.state === 'autherized':
        req.log.info({ route: 'addEntry' });
        reply = await addEntry(update);
        break;
      default:
        req.log.info({ route: 'default' });
        reply = {
          method: 'sendMessage',
          chat_id: update.message.chat.id,
          parse_mode: 'Markdown',
          text: `I don't understand.`,
        };
        break;
    }
  } catch (err) {
    req.log.error(err);
    reply = {
      method: 'sendMessage',
      chat_id: req.body.message.chat.id,
      text: `Oops! Something went wrong. Please try it again.`,
    };
  }
  req.log.info({ reply });
  res.status(200).send(reply);
}

export default controller;
