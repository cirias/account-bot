import User from './src/models/user.js';
import Update from './src/models/update.js';

Promise.all([
  User.sync({ force: true }),
  Update.sync({ force: true }),
]).then(() => {
  console.log('init database success');
}).catch(console.error);
