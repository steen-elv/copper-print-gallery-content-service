// src/models/exifData.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const ExifData = sequelize.define('ExifData', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    key: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'EXIF_DATA',
    timestamps: false
});

module.exports = ExifData;