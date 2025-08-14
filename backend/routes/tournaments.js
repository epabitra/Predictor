const express = require('express');
const router = express.Router();
const {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentStats,
  getActiveTournaments
} = require('../controllers/tournamentController');

// Get all tournaments
router.get('/', getAllTournaments);

// Get active tournaments
router.get('/active', getActiveTournaments);

// Get tournament by ID
router.get('/:id', getTournamentById);

// Get tournament statistics
router.get('/:id/stats', getTournamentStats);

// Create new tournament
router.post('/', createTournament);

// Update tournament
router.put('/:id', updateTournament);

// Delete tournament
router.delete('/:id', deleteTournament);

module.exports = router;
