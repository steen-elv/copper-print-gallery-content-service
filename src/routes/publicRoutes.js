// src/routes/publicRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getGalleries, 
  getGallery, 
  getPrints, 
  getPrint 
} = require('../controllers/publicController');

router.get('/galleries', getGalleries);
router.get('/galleries/:galleryId', getGallery);
router.get('/prints', getPrints);
router.get('/prints/:printId', getPrint);

module.exports = router;
