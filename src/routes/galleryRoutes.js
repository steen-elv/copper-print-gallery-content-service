// src/routes/galleryRoutes.js

const express = require('express');
const router = express.Router();
const { getGalleries, createGallery, updateGallery, deleteGallery } = require('../controllers/galleryController');

router.get('/', getGalleries);
router.post('/', createGallery);
router.put('/:id', updateGallery);
router.delete('/:id', deleteGallery);

module.exports = router;