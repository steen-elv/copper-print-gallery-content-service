// src/models/artworkTag.js

const { Model, DataTypes } = require('sequelize');

class ArtworkTag extends Model {
    static associate(models) {
        // This is a junction table, so it doesn't need its own associations
    }
}

module.exports = (sequelize) => {
    ArtworkTag.init({
        artwork_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'ARTWORK',
                key: 'id'
            }
        },
        tag_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'TAG',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'ArtworkTag',
        tableName: 'ARTWORK_TAG',
        timestamps: false
    });

    return ArtworkTag;
};