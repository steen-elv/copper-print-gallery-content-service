// src/models/index.js

const Artist = require('./artistModel');
const Gallery = require('./galleryModel');
const Print = require('./printModel');
const sequelize = require('../config/database');
const {DataTypes} = require("sequelize");

// Artist associations
Artist.hasMany(Gallery);
Artist.hasMany(Print);

// Gallery associations
Gallery.belongsTo(Artist);
Gallery.belongsToMany(Print, { through: 'GalleryPrint' });

// Print associations
Print.belongsTo(Artist);
Print.belongsToMany(Gallery, { through: 'GalleryPrint' });

// Define the GalleryPrint model for the many-to-many relationship
const GalleryPrint = sequelize.define('GalleryPrint', {
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = {
  Artist,
  Gallery,
  Print,
  GalleryPrint
};
