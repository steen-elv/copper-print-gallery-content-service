// src/routes/artworkRoutes.js

const express = require('express');
const router = express.Router();

// TODO: Implement artwork controllers
// const { getArtworks, createArtwork, updateArtwork, deleteArtwork } = require('../controllers/artworkController');

router.get('/', (req, res) => {
  res.json({ message: 'Get artworks route' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create artwork route' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update artwork route' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete artwork route' });
});

module.exports = router;
