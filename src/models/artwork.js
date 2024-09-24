// src/models/artwork.js

const { Model, DataTypes } = require('sequelize');

class Artwork extends Model {
    static associate(models) {
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

module.exports = (sequelize) => {
    Artwork.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // Add other attributes here
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