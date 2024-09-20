// src/controllers/publicController.js

const { Gallery, Artwork, ArtworkMetadata, Image, GalleryArtwork ,Translation} = require('../models');
const { Op } = require('sequelize');

exports.getGalleries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { language } = req.query;

    const offset = (page - 1) * limit;

    const galleries = await Gallery.findAndCountAll({
      where: { status: 'published' },
      limit: limit,
      offset: offset,
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'printCount', 'createdAt', 'updatedAt']
    });

    res.json({
      galleries: galleries.rows,
      totalCount: galleries.count,
      currentPage: page,
      totalPages: Math.ceil(galleries.count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getGallery = async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    const { language } = req.query;

    const gallery = await Gallery.findOne({
      where: { id: galleryId },
      include: [{
        model: Artwork,
        through: {
          model: GalleryArtwork,
          attributes: ['order']
        },
        include: [
          {
            model: ArtworkMetadata,
            attributes: ['artist_name', 'year_created', 'medium', 'technique', 'dimensions']
          },
          {
            model: Image,
            where: { version: 'thumbnail' },
            attributes: ['public_url'],
            required: false
          }
        ]
      }],
      order: [[Artwork, GalleryArtwork, 'order', 'ASC']],
      attributes: ['id', 'title', 'description', 'created_at', 'updated_at']
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Transform the data to match the expected response format
    const response = {
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      createdAt: gallery.created_at,
      updatedAt: gallery.updated_at,
      printCount: gallery.Artworks.length,
      prints: gallery.Artworks.map(artwork => ({
        id: artwork.id,
        title: artwork.ArtworkMetadata.artist_name,
        thumbnailUrl: artwork.Images[0]?.public_url || null,
        order: artwork.GalleryArtwork.order
      }))
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.getPrints = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      language,
      galleryId,
      technique,
      year,
      plateType,
      paperType
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build the where clause based on the query parameters
    const whereClause = {};
    if (technique) whereClause['$ArtworkMetadata.technique$'] = technique;
    if (year) whereClause['$ArtworkMetadata.year_created$'] = Number(year);
    if (plateType) whereClause['$ArtworkMetadata.plate_material$'] = plateType;
    if (paperType) whereClause['$ArtworkMetadata.paper_type$'] = paperType;

    const include = [
      {
        model: ArtworkMetadata,
        attributes: ['title']
      },
      {
        model: Image,
        where: { version: 'thumbnail' },
        attributes: ['public_url'],
        required: false
      }
    ];

    if (galleryId) {
      include.push({
        model: Gallery,
        where: { id: galleryId },
        attributes: [],
        through: { attributes: ['order'] }
      });
    }

    const { count, rows } = await Artwork.findAndCountAll({
      where: whereClause,
      include: include,
      limit: limitNum,
      offset: offset,
      distinct: true,
      order: galleryId ? [[Gallery, GalleryArtwork, 'order', 'ASC']] : [['created_at', 'DESC']]
    });

    const prints = rows.map(artwork => ({
      id: artwork.id,
      title: artwork.ArtworkMetadata.title,
      thumbnailUrl: artwork.Images[0]?.public_url || null,
      order: galleryId ? artwork.Galleries[0]?.GalleryArtwork.order : null
    }));

    res.json({
      prints: prints,
      totalCount: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum)
    });

  } catch (error) {
    next(error);
  }
};

exports.getPrint = async (req, res, next) => {
  try {
    const { printId } = req.params;
    const { language = 'en', imageVersion } = req.query;  // Default language to English if not provided

    const artwork = await Artwork.findOne({
      where: { id: printId },
      include: [
        {
          model: ArtworkMetadata,
          attributes: ['title', 'description', 'artist_name', 'year_created', 'technique', 'plate_material', 'dimensions', 'edition_size', 'paper_type']
        },
        {
          model: Image,
          attributes: ['version', 'public_url', 'width', 'height']
        },
        {
          model: Translation,
          where: {
            language_code: language,
            entity_type: 'Artwork',
            field_name: { [Op.in]: ['title', 'description'] }
          },
          required: false
        }
      ]
    });

    if (!artwork) {
      return res.status(404).json({ message: 'Print not found' });
    }

    // Prepare the response object with translations
    const response = {
      id: artwork.id,
      title: getTranslatedField(artwork, 'title', language),
      description: getTranslatedField(artwork, 'description', language),
      technique: artwork.ArtworkMetadata.technique,
      plateType: artwork.ArtworkMetadata.plate_material,
      dimensions: artwork.ArtworkMetadata.dimensions,
      year: artwork.ArtworkMetadata.year_created,
      editionSize: artwork.ArtworkMetadata.edition_size,
      paperType: artwork.ArtworkMetadata.paper_type,
      createdAt: artwork.created_at,
      updatedAt: artwork.updated_at
    };

    // Handle image versions
    if (imageVersion) {
      const requestedImage = artwork.Images.find(img => img.version === imageVersion);
      response.images = requestedImage ?
          { [imageVersion]: { url: requestedImage.public_url, width: requestedImage.width, height: requestedImage.height } } :
          {};
    } else {
      response.images = artwork.Images.reduce((acc, img) => {
        acc[img.version] = { url: img.public_url, width: img.width, height: img.height };
        return acc;
      }, {});
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Helper function to get translated field
function getTranslatedField(artwork, fieldName, language) {
  const translation = artwork.Translations.find(t => t.field_name === fieldName);
  if (translation) {
    return translation.translated_content;
  }
  // Fallback to original content if translation not available
  return artwork.ArtworkMetadata[fieldName];
}
