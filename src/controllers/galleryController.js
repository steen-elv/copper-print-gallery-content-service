// src/controllers/galleryController.js

const Gallery = require('../models/gallery');

exports.getGalleries = async (req, res, next) => {
  try {
    const galleries = await Gallery.findAll();
    res.json(galleries);
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

exports.updateGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);
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
    const gallery = await Gallery.findByPk(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    await gallery.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
