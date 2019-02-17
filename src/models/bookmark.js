'use strict';
module.exports = (sequelize, DataTypes) => {
  var bookmark = sequelize.define('bookmark', {
    guid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    link: {
      allowNull: false,
      type: DataTypes.STRING(256)
    },
    description: {
      allowNull: true,
      type: DataTypes.TEXT
    },
    favorites: {
      allowNull: true,
      defaultValue: false,
      type: DataTypes.BOOLEAN
    }
  });

  return bookmark;
}