// src/models/galleryArtwork.js

const { Model, DataTypes } = require('sequelize');

class GalleryArtwork extends Model {
    static associate(models) {
        // This is a junction table, so it doesn't need its own associations
    }
}

module.exports = (sequelize) => {
    GalleryArtwork.init({
        gallery_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'GALLERY',
                key: 'id'
            }
        },
        artwork_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'ARTWORK',
                key: 'id'
            }
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        modelName: 'GalleryArtwork',
        tableName: 'GALLERY_ARTWORK',
        timestamps: true,
        underscored: true
    });

    return GalleryArtwork;
};