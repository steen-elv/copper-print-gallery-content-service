// src/models/artworkTag.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtworkTag = sequelize.define('ArtworkTag', {
    artwork_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    }
}, {
    tableName: 'ARTWORK_TAG',
    timestamps: false
});

module.exports = ArtworkTag;