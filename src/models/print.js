// src/models/print.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Print = sequelize.define('Print', {
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
  plateType: {
    type: DataTypes.STRING
  },
  dimensions: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.INTEGER
  },
  editionSize: {
    type: DataTypes.INTEGER
  },
  editionNumber: {
    type: DataTypes.INTEGER
  },
  paperType: {
    type: DataTypes.STRING
  },
  inkType: {
    type: DataTypes.STRING
  },
  printingPress: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  artistNotes: {
    type: DataTypes.TEXT
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value));
    }
  }
}, {
  timestamps: true
});

module.exports = Print;