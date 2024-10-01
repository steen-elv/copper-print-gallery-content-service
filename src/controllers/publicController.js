// src/controllers/publicController.js

const { Gallery, Artwork, ArtworkMetadata, Image, GalleryArtwork ,Translation} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getGalleries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, language = 'en' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Gallery.findAndCountAll({
      include: [
        {
          model: Translation,
          where: {
            language_code: language,
            field_name: { [Op.in]: ['title', 'description'] }
          },
          required: false
        },
        {
          model: Artwork,
          attributes: [],
          through: { attributes: [] }
        }
      ],
      attributes: [
        'id',
        'created_at',
        'updated_at',
        [sequelize.fn('COUNT', sequelize.col('Artworks.id')), 'printCount']
      ],
      group: ['Gallery.id', 'Translations.id'],
      limit: Number(limit),
      offset: Number(offset),
      order: [['updated_at', 'DESC']],
      distinct: true,
      subQuery: false
    });

    const galleries = rows.map(gallery => ({
      id: gallery.id,
      title: getTranslatedField(gallery, 'title', 'No Title'),
      description: getTranslatedField(gallery, 'description', 'No Description'),
      printCount: Number(gallery.getDataValue('printCount')),
      createdAt: gallery.created_at,
      updatedAt: gallery.updated_at
    }));

    res.json({
      galleries: galleries,
      totalCount: count.length, // count is now an array of objects due to grouping
      currentPage: Number(page),
      totalPages: Math.ceil(count.length / limit)
    });
  } catch (error) {
    console.error('Error in getGalleries:', error);
    next(error);
  }
};

exports.getGallery = async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    const { language = 'en' } = req.query;

    const gallery = await Gallery.findOne({
      where: { id: galleryId },
      include: [
        {
          model: Translation,
          where: {
            language_code: language,
            field_name: { [Op.in]: ['title', 'description'] }
          },
          required: false
        },
        {
          model: Artwork,
          include: [
            {
              model: ArtworkMetadata,
              attributes: ['title']
            },
            {
              model: Image,
              where: { version: 'thumbnail' },
              attributes: ['public_url'],
              required: false
            },
            {
              model: Translation,
              where: {
                language_code: language,
                field_name: 'title'
              },
              required: false
            }
          ],
          through: { attributes: ['order'] }
        }
      ],
      order: [[{ model: Artwork, as: 'Artworks' }, 'GalleryArtwork', 'order', 'ASC']]
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const response = {
      id: gallery.id,
      title: getTranslatedField(gallery, 'title', 'No Title'),
      description: getTranslatedField(gallery, 'description', 'No Description'),
      printCount: gallery.Artworks.length,
      createdAt: gallery.created_at,
      updatedAt: gallery.updated_at,
      prints: gallery.Artworks.map(artwork => ({
        id: artwork.id,
        title: getTranslatedField(artwork, 'title', artwork.ArtworkMetadata.title || 'No Title'),
        thumbnailUrl: artwork.Images[0]?.public_url || null,
        order: artwork.Gallery_Artwork.order
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getGallery:', error);
    next(error);
  }
};

exports.getPrints = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      language = 'en',
      technique,
      year,
      plateType,
      paperType
    } = req.query;
    const { galleryId } = req.params;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build the where clause based on the query parameters
    const metadataWhereClause = {};

    if (technique) metadataWhereClause.technique = technique;
    if (year) metadataWhereClause.year_created = Number(year);
    if (plateType) metadataWhereClause.plate_material = plateType;
    if (paperType) metadataWhereClause.paper_type = paperType;

    const { count, rows } = await Artwork.findAndCountAll({
      include: [
        {
          model: Gallery,
          where: {id: galleryId},
        },
        {
          model: ArtworkMetadata,
          where: metadataWhereClause,
          required: Object.keys(metadataWhereClause).length > 0
        },
        {
          model: Translation,
          where: {
            language_code: language,
            field_name: 'title'
          },
          required: false
        },
        {
          model: Image,
          where: { version: 'thumbnail' },
          required: false
        }
      ],
      limit: limitNum,
      offset: offset,
      distinct: true,
      order: [['created_at', 'DESC']]
    });

    const prints = rows.map(artwork => ({
      id: artwork.id,
      title: artwork.Translations[0]?.translated_content || 'No Title',
      thumbnailUrl: artwork.Images[0]?.public_url || null
    }));

    res.json({
      prints,
      totalCount: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error('Error in getPrints:', error);
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
          attributes: ['artist_name', 'year_created', 'technique', 'plate_material', 'dimensions', 'edition_info', 'paper_type']
        },
        {
          model: Image,
          attributes: ['version', 'public_url', 'width', 'height']
        },
        {
          model: Translation,
          where: {
            entity_type: 'Artwork',
            language_code: language,
            field_name: { [Op.in]: ['title', 'description'] }
          },
          required: false
        }
      ]
    });

    if (!artwork) {
      let err = new Error('Artwork not found');
      err.status = 404;
      err.resourceNotFound = true;
      throw err;
    }

    // Prepare the response object with translations
    const response = {
      id: artwork.id,
      title: getTranslatedField(artwork, 'title', 'No Title'),
      description: getTranslatedField(artwork, 'description', 'No Description'),
      technique: artwork.ArtworkMetadata.technique,
      plateType: artwork.ArtworkMetadata.plate_material,
      dimensions: artwork.ArtworkMetadata.dimensions,
      year: artwork.ArtworkMetadata.year_created,
      editionSize: artwork.ArtworkMetadata.edition_info,
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
    console.error('Error in getPrint:', error);
    next(error);
  }
};

// Helper function to get translated field
function getTranslatedField(artwork, fieldName, fallback) {
  const translation = artwork.Translations.find(t => t.field_name === fieldName);
  return translation ? translation.translated_content : fallback;
}