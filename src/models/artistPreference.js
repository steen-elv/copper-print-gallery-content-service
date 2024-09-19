// src/models/artistPreference.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtistPreference = sequelize.define('ArtistPreference', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    artist_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    preference_key: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    preference_value: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'ARTIST_PREFERENCE',
    timestamps: false
});

module.exports = ArtistPreference;