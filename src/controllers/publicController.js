// src/controllers/publicController.js

const { Gallery, Print, GalleryPrint } = require('../models');
const { Op } = require('sequelize');

exports.getGalleries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, language } = req.query;
    const offset = (page - 1) * limit;

    const galleries = await Gallery.findAndCountAll({
      where: { status: 'published' },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'printCount', 'createdAt', 'updatedAt']
    });

    res.json({
      galleries: galleries.rows,
      totalCount: galleries.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(galleries.count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getGallery = async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    const { page = 1, limit = 20, language } = req.query;
    const offset = (page - 1) * limit;

    const gallery = await Gallery.findOne({
      where: { id: galleryId, status: 'published' },
      include: [{
        model: Print,
        through: { attributes: ['order'] },
        attributes: ['id', 'title', 'thumbnailUrl'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[GalleryPrint, 'order', 'ASC']]
      }],
      attributes: ['id', 'title', 'description', 'printCount', 'createdAt', 'updatedAt']
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const totalPrints = await gallery.countPrints();

    res.json({
      ...gallery.toJSON(),
      prints: gallery.Prints,
      totalCount: totalPrints,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPrints / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrint = async (req, res, next) => {
  try {
    const { printId } = req.params;
    const { language, imageVersion } = req.query;

    const print = await Print.findOne({
      where: { id: printId, status: 'published' },
      attributes: ['id', 'title', 'description', 'technique', 'plateType', 'dimensions', 'year', 'editionSize', 'paperType', 'images', 'createdAt', 'updatedAt']
    });

    if (!print) {
      return res.status(404).json({ message: 'Print not found' });
    }

    let responseData = print.toJSON();

    // Handle imageVersion
    if (imageVersion) {
      if (responseData.images[imageVersion]) {
        responseData.images = { [imageVersion]: responseData.images[imageVersion] };
      } else {
        return res.status(400).json({ message: 'Requested image version not found' });
      }
    }

    // TODO: Handle language parameter for multilingual content

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// Update getPrints method to include image versions
exports.getPrints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, language, galleryId, technique, year, plateType, paperType, imageVersion } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'published' };
    if (galleryId) whereClause['$Galleries.id$'] = galleryId;
    if (technique) whereClause.technique = technique;
    if (year) whereClause.year = year;
    if (plateType) whereClause.plateType = plateType;
    if (paperType) whereClause.paperType = paperType;

    const prints = await Print.findAndCountAll({
      where: whereClause,
      include: [{ model: Gallery, attributes: [], through: { attributes: [] } }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'technique', 'plateType', 'dimensions', 'year', 'editionSize', 'paperType', 'images', 'createdAt', 'updatedAt'],
      distinct: true
    });

    let responseData = prints.rows.map(print => {
      let printData = print.toJSON();
      if (imageVersion) {
        printData.images = printData.images[imageVersion] ? { [imageVersion]: printData.images[imageVersion] } : {};
      }
      return printData;
    });

    res.json({
      prints: responseData,
      totalCount: prints.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(prints.count / limit)
    });
  } catch (error) {
    next(error);
  }
};