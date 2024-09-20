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
      return res.status(404).json({ message: 'Print not found' });
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
    next(error);
  }
};

// Helper function to get translated field
function getTranslatedField(artwork, fieldName, fallback) {
  const translation = artwork.Translations.find(t => t.field_name === fieldName);
  return translation ? translation.translated_content : fallback;
}