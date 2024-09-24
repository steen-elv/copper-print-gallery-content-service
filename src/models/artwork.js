// src/models/artwork.js

const { Model, DataTypes } = require('sequelize');

class Artwork extends Model {
    static init(sequelize) {
        super.init({
            // Define attributes here
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            // ... other attributes
        }, {
            sequelize,
            modelName: 'Artwork',
            tableName: 'ARTWORK',
            // ... other options
        });
    }

    static associate(models) {
        // Define associations here
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

module.exports = Artwork;