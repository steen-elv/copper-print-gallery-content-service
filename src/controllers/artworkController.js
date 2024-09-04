// src/controllers/artworkController.js

const Artwork = require('../models/artwork');

exports.getArtworks = async (req, res, next) => {
  try {
    const artworks = await Artwork.findAll();
    res.json(artworks);
  } catch (error) {
    next(error);
  }
};

exports.createArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.create(req.body);
    res.status(201).json(artwork);
  } catch (error) {
    next(error);
  }
};

exports.updateArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findByPk(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    await artwork.update(req.body);
    res.json(artwork);
  } catch (error) {
    next(error);
  }
};

exports.deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findByPk(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    await artwork.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
