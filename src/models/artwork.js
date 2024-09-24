// src/models/artwork.js

const { Model, DataTypes } = require('sequelize');

class Artwork extends Model {
    static associate(models) {
        this.belongsTo(models.Artist, { foreignKey: 'artist_id' });
        this.belongsToMany(models.Gallery, { through: models.GalleryArtwork });
        this.hasOne(models.ArtworkMetadata, { foreignKey: 'artwork_id' });
        this.hasMany(models.Image, { foreignKey: 'artwork_id' });
        this.belongsToMany(models.Tag, { through: models.ArtworkTag });
        this.hasMany(models.Translation, {
            foreignKey: 'entity_id',
            constraints: false,
            scope: {
                entity_type: 'Artwork'
            }
        });
    }
}

module.exports = (sequelize) => {
    Artwork.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        artist_id: {
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
        },
        last_indexed: {
            type: DataTypes.DATE
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