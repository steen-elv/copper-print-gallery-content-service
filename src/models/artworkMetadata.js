// src/models/artworkMetadata.js

const { Model, DataTypes } = require('sequelize');

class ArtworkMetadata extends Model {
    static associate(models) {
        this.belongsTo(models.Artwork, { foreignKey: 'artwork_id' });
    }
}

module.exports = (sequelize) => {
    ArtworkMetadata.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        artwork_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
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
        modelName: 'ArtworkMetadata',
        tableName: 'ARTWORK_METADATA',
        timestamps: true,
        underscored: true
    });

    return ArtworkMetadata;
};