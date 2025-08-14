const express = require('express');
const router = express.Router();
const {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction,
  deletePrediction,
  getPredictionsByMatch,
  getPredictionsByPredictor,
  getPredictionStats
} = require('../controllers/predictionController');

// Get all predictions
router.get('/', getAllPredictions);

// Get prediction statistics
router.get('/stats', getPredictionStats);

// Get predictions by match
router.get('/match/:matchId', getPredictionsByMatch);

// Get predictions by predictor
router.get('/predictor/:predictorId', getPredictionsByPredictor);

// Get prediction by ID
router.get('/:id', getPredictionById);

// Create new prediction
router.post('/', createPrediction);

// Update prediction
router.put('/:id', updatePrediction);

// Delete prediction
router.delete('/:id', deletePrediction);

module.exports = router;
