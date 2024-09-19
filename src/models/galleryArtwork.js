// src/models/galleryArtwork.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GalleryArtwork = sequelize.define('GalleryArtwork', {
    gallery_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    artwork_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    order: {
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
    }
}, {
    tableName: 'GALLERY_ARTWORK',
    timestamps: false
});

module.exports = GalleryArtwork;