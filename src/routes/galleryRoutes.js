// src/routes/galleryRoutes.js

const express = require('express');
const router = express.Router();

// TODO: Implement gallery controllers
// const { getGalleries, createGallery, updateGallery, deleteGallery } = require('../controllers/galleryController');

router.get('/', (req, res) => {
  res.json({ message: 'Get galleries route' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create gallery route' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update gallery route' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete gallery route' });
});

module.exports = router;
