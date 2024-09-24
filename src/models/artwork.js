// src/models/artwork.js

const { Model, DataTypes } = require('sequelize');

class Artwork extends Model {
    static associate(models) {
        // Associations remain the same
        this.belongsToMany(models.Gallery, { through: 'GalleryArtwork' });
        this.hasMany(models.Translation, {
            foreignKey: 'entity_id',
            constraints: false,
            scope: {
                entity_type: 'Artwork'
            }
        });
        this.hasMany(models.Image, { foreignKey: 'artwork_id' });
        this.hasOne(models.ArtworkMetadata, { foreignKey: 'artwork_id' });
    }
}

const init = (sequelize) => {
    Artwork.init({
        // Attributes remain the same
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // Other attributes...
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
        modelName: 'Artwork',
        tableName: 'ARTWORK',
        timestamps: true,
        underscored: true
    });

    return Artwork;
};

module.exports = { init, Model: Artwork };