// src/models/artwork.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Artwork = sequelize.define('Artwork', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    tableName: 'ARTWORK',
    timestamps: false
});

module.exports = Artwork;