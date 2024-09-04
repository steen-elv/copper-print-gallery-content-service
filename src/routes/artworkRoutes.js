// src/routes/artworkRoutes.js

const express = require('express');
const router = express.Router();
const { getArtworks, createArtwork, updateArtwork, deleteArtwork } = require('../controllers/artworkController');

router.get('/', getArtworks);
router.post('/', createArtwork);
router.put('/:id', updateArtwork);
router.delete('/:id', deleteArtwork);

module.exports = router;