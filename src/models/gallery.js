// src/models/gallery.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Gallery = sequelize.define('Gallery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  artist_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_indexed: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'GALLERY',
  timestamps: false
});

// Add association with Translation model
Gallery.associate = (models) => {
  Gallery.hasMany(models.Translation, {
    foreignKey: 'entity_id',
    constraints: false,
    scope: {
      entity_type: 'Gallery'
    }
  });
};

module.exports = Gallery;