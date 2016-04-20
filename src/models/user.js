import Sequelize from 'sequelize';
import sequelize from '../sequelize.js';

const User = sequelize.define('user', {
  id: {
    field: 'id',
    type: Sequelize.BIGINT,
    primaryKey: true,
  },
  credentials: {
    field: 'credentials',
    type: Sequelize.JSONB,
    allowNull: true,
  },
  session: {
    field: 'session',
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {
      state: 'unautherized',
    },
    /*
     * {
     *   state: 'default',
     * }
     * {
     *   state: 'newEntry.chooseCategory',
     *   data: ammount,
     * }
     * {
     *   state: 'statistics.chooseMonth',
     * }
     */
  },
}, {
  createdAt: 'create_timestamp',
  updatedAt: 'update_timestamp',
  freezeTableName: true, // Model tableName will be the same as the model name
});

export default User;
