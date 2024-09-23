// src/models/translation.js

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Translation = sequelize.define('Translation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    language_code: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    field_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    translated_content: {
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
    tableName: 'TRANSLATION',
    timestamps: false
});

module.exports = Translation;