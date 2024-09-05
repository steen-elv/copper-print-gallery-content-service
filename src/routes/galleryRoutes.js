// src/routes/galleryRoutes.js

const express = require('express');
const router = express.Router();
const {
    getGalleries,
    createGallery,
    getGallery,
    updateGallery,
    deleteGallery,
    getGalleryPrints,
    updatePrintOrder,
    addPrintToGallery,
    removePrintFromGallery
} = require('../controllers/galleryController');

router.get('/', getGalleries);
router.post('/', createGallery);
router.get('/:galleryId', getGallery);
router.put('/:galleryId', updateGallery);
router.delete('/:galleryId', deleteGallery);
router.get('/:galleryId/prints', getGalleryPrints);
router.put('/:galleryId/prints', updatePrintOrder);
router.post('/:galleryId/prints/:printId', addPrintToGallery);
router.delete('/:galleryId/prints/:printId', removePrintFromGallery);

module.exports = router;