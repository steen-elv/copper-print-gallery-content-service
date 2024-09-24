// src/models/translation.js

const { Model, DataTypes } = require('sequelize');

class Translation extends Model {
    static associate(models) {
        // No direct associations defined in the DDL
    }
}

module.exports = (sequelize) => {
    Translation.init({
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
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Translation',
        tableName: 'TRANSLATION',
        timestamps: true,
        underscored: true
    });

    return Translation;
};