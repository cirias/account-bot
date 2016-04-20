import Sequelize from 'sequelize';
import sequelize from '../sequelize.js';

const Update = sequelize.define('update', {
  id: {
    field: 'id',
    type: Sequelize.BIGINT,
    primaryKey: true,
  },
  data: {
    field: 'data',
    type: Sequelize.JSONB,
    allowNull: false,
  },
}, {
  createdAt: 'create_timestamp',
  updatedAt: 'update_timestamp',
  freezeTableName: true, // Model tableName will be the same as the model name
});

export default Update;
