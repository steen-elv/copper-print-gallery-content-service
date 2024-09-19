// src/models/index.js

const Artist = require('./artist');
const ArtistPreference = require('./artistPreference');
const Gallery = require('./gallery');
const Artwork = require('./artwork');
const GalleryArtwork = require('./galleryArtwork');
const Image = require('./image');
const ExifData = require('./exifData');
const ArtworkMetadata = require('./artworkMetadata');
const Tag = require('./tag');
const ArtworkTag = require('./artworkTag');
const Translation = require('./translation');

// Artist associations
Artist.hasMany(ArtistPreference, { foreignKey: 'artist_id' });
Artist.hasMany(Gallery, { foreignKey: 'artist_id' });
Artist.hasMany(Artwork, { foreignKey: 'artist_id' });

// Gallery associations
Gallery.belongsTo(Artist, { foreignKey: 'artist_id' });
Gallery.belongsToMany(Artwork, {
    through: GalleryArtwork,
    foreignKey: 'gallery_id',
    otherKey: 'artwork_id'
});

// Artwork associations
Artwork.belongsTo(Artist, { foreignKey: 'artist_id' });
Artwork.belongsToMany(Gallery, {
    through: GalleryArtwork,
    foreignKey: 'artwork_id',
    otherKey: 'gallery_id'
});
Artwork.hasMany(Image, { foreignKey: 'artwork_id' });
Artwork.hasOne(ArtworkMetadata, { foreignKey: 'artwork_id' });
Artwork.belongsToMany(Tag, {
    through: ArtworkTag,
    foreignKey: 'artwork_id',
    otherKey: 'tag_id'
});

// Image associations
Image.belongsTo(Artwork, { foreignKey: 'artwork_id' });
Image.hasMany(ExifData, { foreignKey: 'image_id' });

// Tag associations
Tag.belongsToMany(Artwork, {
    through: ArtworkTag,
    foreignKey: 'tag_id',
    otherKey: 'artwork_id'
});

// Note: Translation is not directly associated with other models
// as it uses a generic entity_id and entity_type

module.exports = {
    Artist,
    ArtistPreference,
    Gallery,
    Artwork,
    GalleryArtwork,
    Image,
    ExifData,
    ArtworkMetadata,
    Tag,
    ArtworkTag,
    Translation
};