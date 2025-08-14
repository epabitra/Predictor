const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeaderboard,
  getTournamentComparison,
  getPredictionTrends,
  getPredictorPerformance,
  exportData
} = require('../controllers/dashboardController');

// Get overall dashboard statistics
router.get('/stats', getDashboardStats);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Get tournament comparison
router.get('/tournament-comparison', getTournamentComparison);

// Get prediction trends
router.get('/trends', getPredictionTrends);

// Get predictor performance over time
router.get('/predictor-performance/:predictorId', getPredictorPerformance);

// Export data to CSV
router.get('/export', exportData);

module.exports = router;
