const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  setMatchWinner,
  getMatchesByTournament,
  getUpcomingMatches,
  getCompletedMatches
} = require('../controllers/matchController');

// Get all matches
router.get('/', getAllMatches);

// Get upcoming matches
router.get('/upcoming', getUpcomingMatches);

// Get completed matches
router.get('/completed', getCompletedMatches);

// Get matches by tournament
router.get('/tournament/:tournamentId', getMatchesByTournament);

// Get match by ID
router.get('/:id', getMatchById);

// Create new match
router.post('/', createMatch);

// Update match
router.put('/:id', updateMatch);

// Set match winner
router.put('/:id/winner', setMatchWinner);

// Delete match
router.delete('/:id', deleteMatch);

module.exports = router;
