// src/models/artworkMetadata.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const ArtworkMetadata = sequelize.define('ArtworkMetadata', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    artwork_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    artist_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    year_created: {
        type: DataTypes.INTEGER
    },
    medium: {
        type: DataTypes.STRING(100)
    },
    technique: {
        type: DataTypes.STRING(100)
    },
    dimensions: {
        type: DataTypes.STRING(100)
    },
    edition_info: {
        type: DataTypes.STRING(255)
    },
    style_movement: {
        type: DataTypes.STRING(100)
    },
    plate_material: {
        type: DataTypes.STRING(100)
    },
    paper_type: {
        type: DataTypes.STRING(100)
    },
    ink_type: {
        type: DataTypes.STRING(100)
    },
    printing_press: {
        type: DataTypes.STRING(100)
    },
    location: {
        type: DataTypes.STRING(255)
    },
    availability: {
        type: DataTypes.STRING(50)
    },
    price: {
        type: DataTypes.DECIMAL(10, 2)
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
    tableName: 'ARTWORK_METADATA',
    timestamps: false
});

module.exports = ArtworkMetadata;