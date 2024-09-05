// src/routes/printRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getPrints, 
  createPrint, 
  getPrint, 
  updatePrint, 
  deletePrint
} = require('../controllers/printController');

router.get('/', getPrints);
router.post('/', createPrint);
router.get('/:printId', getPrint);
router.put('/:printId', updatePrint);
router.delete('/:printId', deletePrint);

module.exports = router;
