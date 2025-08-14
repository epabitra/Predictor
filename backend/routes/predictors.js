const express = require('express');
const router = express.Router();
const {
  getAllPredictors,
  getPredictorById,
  createPredictor,
  updatePredictor,
  deletePredictor,
  getPredictorStats,
  getAllPredictorsWithStats
} = require('../controllers/predictorController');

// Get all predictors
router.get('/', getAllPredictors);

// Get all predictors with statistics
router.get('/stats', getAllPredictorsWithStats);

// Get predictor by ID
router.get('/:id', getPredictorById);

// Get predictor statistics
router.get('/:id/stats', getPredictorStats);

// Create new predictor
router.post('/', createPredictor);

// Update predictor
router.put('/:id', updatePredictor);

// Delete predictor
router.delete('/:id', deletePredictor);

module.exports = router;
