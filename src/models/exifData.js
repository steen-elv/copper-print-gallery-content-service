// src/models/exifData.js

const { Model, DataTypes } = require('sequelize');

class ExifData extends Model {
    static associate(models) {
        this.belongsTo(models.Image, { foreignKey: 'image_id' });
    }
}

module.exports = (sequelize) => {
    ExifData.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        image_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'IMAGE',
                key: 'id'
            }
        },
        key: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        value: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'ExifData',
        tableName: 'EXIF_DATA',
        timestamps: false
    });

    return ExifData;
};