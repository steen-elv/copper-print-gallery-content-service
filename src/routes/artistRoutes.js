// src/routes/artistRoutes.js

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
  removePrintFromGallery,
  getPrints,
  createPrint,
  getPrint,
  updatePrint,
  deletePrint
} = require('../controllers/artistController');

// Gallery routes
router.get('/galleries', getGalleries);
router.post('/galleries', createGallery);
router.get('/galleries/:galleryId', getGallery);
router.put('/galleries/:galleryId', updateGallery);
router.delete('/galleries/:galleryId', deleteGallery);
router.get('/galleries/:galleryId/prints', getGalleryPrints);
router.put('/galleries/:galleryId/prints', updatePrintOrder);
router.post('/galleries/:galleryId/prints/:printId', addPrintToGallery);
router.delete('/galleries/:galleryId/prints/:printId', removePrintFromGallery);

// Print routes
router.get('/prints', getPrints);
router.post('/prints', createPrint);
router.get('/prints/:printId', getPrint);
router.put('/prints/:printId', updatePrint);
router.delete('/prints/:printId', deletePrint);

module.exports = router;
