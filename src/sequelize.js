import config from './config.js';
import Sequelize from 'sequelize';

const { db } = config;

const sequelize = new Sequelize(db.database, db.username, db.password, {
  host: db.host,
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },

});

export default sequelize;
