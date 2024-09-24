// src/models/tag.js

const { Model, DataTypes } = require('sequelize');

class Tag extends Model {
    static associate(models) {
        this.belongsToMany(models.Artwork, { through: models.ArtworkTag });
    }
}

module.exports = (sequelize) => {
    Tag.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        modelName: 'Tag',
        tableName: 'TAG',
        timestamps: true,
        underscored: true
    });

    return Tag;
};