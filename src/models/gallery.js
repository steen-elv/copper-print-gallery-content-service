// src/models/gallery.js

const { Model, DataTypes } = require('sequelize');

class Gallery extends Model {
  static associate(models) {
    this.belongsTo(models.Artist, { foreignKey: 'artist_id' });
    this.belongsToMany(models.Artwork, { through: models.GalleryArtwork });
    // Add Translation association
    this.hasMany(models.Translation, {
      foreignKey: 'entity_id',
      constraints: false,
      scope: {
        entity_type: 'Gallery'
      }
    });
  }
}

module.exports = (sequelize) => {
  Gallery.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    artist_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING( 50),
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
    modelName: 'Gallery',
    tableName: 'GALLERY',
    timestamps: true,
    underscored: true
  });

  return Gallery;
};