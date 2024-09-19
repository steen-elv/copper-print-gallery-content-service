// src/models/index.js

const Artist = require('./artist');
const Gallery = require('./gallery');
const Print = require('./print');
const sequelize = require('../config/database');
const {DataTypes} = require("sequelize");

// Artist associations
Artist.hasMany(Gallery);
Artist.hasMany(Print);

// Gallery associations
Gallery.belongsTo(Artist);
Gallery.belongsToMany(Print, {through: 'GalleryPrint', as: 'prints'});

// Print associations
Print.belongsTo(Artist);
Print.belongsToMany(Gallery, {through: 'GalleryPrint', as: 'galleries'});

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
