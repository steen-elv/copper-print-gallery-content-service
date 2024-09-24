// src/models/artist.js

const { Model, DataTypes } = require('sequelize');

class Artist extends Model {
  static associate(models) {
    this.hasMany(models.Gallery, { foreignKey: 'artist_id' });
    this.hasMany(models.Artwork, { foreignKey: 'artist_id' });
  }
}

module.exports = (sequelize) => {
  Artist.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    keycloak_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    default_language: {
      type: DataTypes.STRING(10),
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
    modelName: 'Artist',
    tableName: 'ARTIST',
    timestamps: true,
    underscored: true
  });

  return Artist;
};