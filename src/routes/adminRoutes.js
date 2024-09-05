// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { 
  createArtist, 
  getArtists, 
  getArtist, 
  updateArtist, 
  deleteArtist 
} = require('../controllers/adminController');

router.post('/artists', createArtist);
router.get('/artists', getArtists);
router.get('/artists/:artistId', getArtist);
router.put('/artists/:artistId', updateArtist);
router.delete('/artists/:artistId', deleteArtist);

module.exports = router;
