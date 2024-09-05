// src/controllers/galleryController.js

const Gallery = require('../models/gallery');
const Print = require('../models/print');  // We'll need to create this model
const { Op } = require('sequelize');

exports.getGalleries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const galleries = await Gallery.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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

exports.createGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.create(req.body);
    res.status(201).json(gallery);
  } catch (error) {
    next(error);
  }
};

exports.getGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId, {
      include: [{ model: Print, as: 'prints', through: { attributes: ['order'] } }]
    });
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    res.json(gallery);
  } catch (error) {
    next(error);
  }
};

exports.updateGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    await gallery.update(req.body);
    res.json(gallery);
  } catch (error) {
    next(error);
  }
};

exports.deleteGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    await gallery.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.getGalleryPrints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const gallery = await Gallery.findByPk(req.params.galleryId, {
      include: [{
        model: Print,
        as: 'prints',
        through: { attributes: ['order'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['order', 'ASC']]
      }]
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const totalCount = await gallery.countPrints();

    res.json({
      prints: gallery.prints,
      totalCount: totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePrintOrder = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const { printOrders } = req.body;

    for (let printOrder of printOrders) {
      await gallery.addPrint(printOrder.printId, { through: { order: printOrder.newOrder } });
    }

    res.status(200).json({ message: 'Print order updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.addPrintToGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId);
    const print = await Print.findByPk(req.params.printId);

    if (!gallery || !print) {
      return res.status(404).json({ message: 'Gallery or Print not found' });
    }

    const { order } = req.body;

    await gallery.addPrint(print, { through: { order } });

    res.status(201).json({ message: 'Print added to gallery successfully' });
  } catch (error) {
    next(error);
  }
};

exports.removePrintFromGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.galleryId);
    const print = await Print.findByPk(req.params.printId);

    if (!gallery || !print) {
      return res.status(404).json({ message: 'Gallery or Print not found' });
    }

    await gallery.removePrint(print);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};