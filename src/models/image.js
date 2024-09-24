// src/models/image.js

const { Model, DataTypes } = require('sequelize');

class Image extends Model {
    static associate(models) {
        this.belongsTo(models.Artwork, { foreignKey: 'artwork_id' });
    }
}

module.exports = (sequelize) => {
    Image.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        artwork_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        original_filename: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        storage_bucket: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        storage_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        public_url: {
            type: DataTypes.STRING(255)
        },
        width: {
            type: DataTypes.INTEGER
        },
        height: {
            type: DataTypes.INTEGER
        },
        format: {
            type: DataTypes.STRING(50)
        },
        file_size: {
            type: DataTypes.INTEGER
        },
        version: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        parent_version: {
            type: DataTypes.STRING(50)
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        processed_at: {
            type: DataTypes.DATE
        },
        processing_details: {
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
        modelName: 'Image',
        tableName: 'IMAGE',
        timestamps: true,
        underscored: true
    });

    return Image;
};