// src/models/index.js

const Artist = require('./artist');
const Gallery = require('./gallery');
const Artwork = require('./artwork');
const GalleryArtwork = require('./galleryArtwork');

Artist.hasMany(Gallery, { foreignKey: 'artist_id' });
Gallery.belongsTo(Artist, { foreignKey: 'artist_id' });

Artist.hasMany(Artwork, { foreignKey: 'artist_id' });
Artwork.belongsTo(Artist, { foreignKey: 'artist_id' });

Gallery.belongsToMany(Artwork, {
    through: GalleryArtwork,
    foreignKey: 'gallery_id',
    otherKey: 'artwork_id'
});
Artwork.belongsToMany(Gallery, {
    through: GalleryArtwork,
    foreignKey: 'artwork_id',
    otherKey: 'gallery_id'
});

module.exports = {
    Artist,
    Gallery,
    Artwork,
    GalleryArtwork
};