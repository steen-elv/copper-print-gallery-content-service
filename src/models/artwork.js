// src/models/artwork.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artwork = sequelize.define('Artwork', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  technique: {
    type: DataTypes.STRING
  },
  dimensions: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.INTEGER
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  }
});

module.exports = Artwork;
