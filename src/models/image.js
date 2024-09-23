// src/models/image.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Image = sequelize.define('Image', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    artwork_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    original_filename: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    storage_bucket: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    storage_path: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    public_url: {
        type: DataTypes.STRING(255)
    },
    width: {
        type: DataTypes.INTEGER
    },
    height: {
        type: DataTypes.INTEGER
    },
    format: {
        type: DataTypes.STRING(50)
    },
    file_size: {
        type: DataTypes.INTEGER
    },
    version: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    parent_version: {
        type: DataTypes.STRING(50)
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    processed_at: {
        type: DataTypes.DATE
    },
    processing_details: {
        type: DataTypes.TEXT
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
    tableName: 'IMAGE',
    timestamps: false
});

module.exports = Image;