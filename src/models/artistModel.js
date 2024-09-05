// src/models/artist.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artist = sequelize.define('Artist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  keycloakId: {
    type: DataTypes.STRING,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  defaultLanguage: {
    type: DataTypes.ENUM('en', 'da'),
    defaultValue: 'en'
  },
  lastIndexed: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = Artist;
