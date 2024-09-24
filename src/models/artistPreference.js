// src/models/artistPreference.js

const { Model, DataTypes } = require('sequelize');

class ArtistPreference extends Model {
    static associate(models) {
        this.belongsTo(models.Artist, { foreignKey: 'artist_id' });
    }
}

module.exports = (sequelize) => {
    ArtistPreference.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        artist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ARTIST',
                key: 'id'
            }
        },
        preference_key: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        preference_value: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'ArtistPreference',
        tableName: 'ARTIST_PREFERENCE',
        timestamps: false
    });

    return ArtistPreference;
};