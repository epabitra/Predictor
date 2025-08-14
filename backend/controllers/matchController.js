const { googleSheetsService } = require('../services/googleSheetsService');

// Get all matches
const getAllMatches = async (req, res, next) => {
  try {
    const matches = await googleSheetsService.getMatches();
    
    // Get tournaments for each match
    const tournaments = await googleSheetsService.getTournaments();
    const matchesWithTournaments = matches.map(match => {
      const tournament = tournaments.find(t => t.id === match.tournamentId);
      return {
        ...match,
        tournamentName: tournament ? tournament.name : 'Unknown Tournament'
      };
    });
    
    res.json({
      success: true,
      data: matchesWithTournaments,
      count: matchesWithTournaments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get match by ID
const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = await googleSheetsService.getById('matches', id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Get tournament details
    const tournament = await googleSheetsService.getById('tournaments', match.tournamentId);
    
    // Get predictions for this match
    const predictions = await googleSheetsService.getPredictionsByMatch(id);
    
    // Get predictor details for each prediction
    const predictors = await googleSheetsService.getPredictors();
    const predictionsWithPredictors = predictions.map(prediction => {
      const predictor = predictors.find(p => p.id === prediction.predictorId);
      return {
        ...prediction,
        predictorName: predictor ? predictor.name : 'Unknown Predictor'
      };
    });
    
    res.json({
      success: true,
      data: {
        ...match,
        tournament,
        predictions: predictionsWithPredictors
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new match
const createMatch = async (req, res, next) => {
  try {
    const { tournamentId, teamA, teamB, matchTime } = req.body;
    
    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID is required'
      });
    }
    
    if (!teamA || !teamB) {
      return res.status(400).json({
        success: false,
        error: 'Both teams are required'
      });
    }
    
    if (!matchTime) {
      return res.status(400).json({
        success: false,
        error: 'Match time is required'
      });
    }
    
    // Validate tournament exists
    const tournament = await googleSheetsService.getById('tournaments', tournamentId);
    if (!tournament) {
      return res.status(400).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Validate match time is within tournament period
    const matchDateTime = new Date(matchTime);
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    
    if (isNaN(matchDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid match time format'
      });
    }
    
    if (matchDateTime < tournamentStart || matchDateTime > tournamentEnd) {
      return res.status(400).json({
        success: false,
        error: 'Match time must be within tournament period'
      });
    }
    
    // Check if match time is in the future
    const now = new Date();
    if (matchDateTime <= now) {
      return res.status(400).json({
        success: false,
        error: 'Match time must be in the future'
      });
    }
    
    const newMatch = await googleSheetsService.create('matches', {
      tournamentId,
      teamA,
      teamB,
      matchTime: matchDateTime.toISOString(),
      status: 'scheduled',
      winner: ''
    });
    
    res.status(201).json({
      success: true,
      data: newMatch,
      message: 'Match created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update match
const updateMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tournamentId, teamA, teamB, matchTime, status } = req.body;
    
    // Check if match exists
    const existingMatch = await googleSheetsService.getById('matches', id);
    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Validate tournament if provided
    if (tournamentId) {
      const tournament = await googleSheetsService.getById('tournaments', tournamentId);
      if (!tournament) {
        return res.status(400).json({
          success: false,
          error: 'Tournament not found'
        });
      }
    }
    
    // Validate match time if provided
    let matchDateTime;
    if (matchTime) {
      matchDateTime = new Date(matchTime);
      if (isNaN(matchDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid match time format'
        });
      }
      
      // Check if match time is in the future
      const now = new Date();
      if (matchDateTime <= now) {
        return res.status(400).json({
          success: false,
          error: 'Match time must be in the future'
        });
      }
      
      // Validate match time is within tournament period
      const finalTournamentId = tournamentId || existingMatch.tournamentId;
      const tournament = await googleSheetsService.getById('tournaments', finalTournamentId);
      const tournamentStart = new Date(tournament.startDate);
      const tournamentEnd = new Date(tournament.endDate);
      
      if (matchDateTime < tournamentStart || matchDateTime > tournamentEnd) {
        return res.status(400).json({
          success: false,
          error: 'Match time must be within tournament period'
        });
      }
    }
    
    // Validate status if provided
    if (status && !['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: scheduled, in_progress, completed, cancelled'
      });
    }
    
    const updatedMatch = await googleSheetsService.update('matches', id, {
      ...(tournamentId && { tournamentId }),
      ...(teamA && { teamA }),
      ...(teamB && { teamB }),
      ...(matchTime && { matchTime: matchDateTime.toISOString() }),
      ...(status && { status })
    });
    
    res.json({
      success: true,
      data: updatedMatch,
      message: 'Match updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete match
const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if match exists
    const existingMatch = await googleSheetsService.getById('matches', id);
    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Check if match has predictions
    const predictions = await googleSheetsService.getPredictionsByMatch(id);
    if (predictions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete match with existing predictions'
      });
    }
    
    await googleSheetsService.delete('matches', id);
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Set match winner
const setMatchWinner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { winner } = req.body;
    
    if (!winner) {
      return res.status(400).json({
        success: false,
        error: 'Winner is required'
      });
    }
    
    // Check if match exists
    const existingMatch = await googleSheetsService.getById('matches', id);
    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Validate winner is one of the teams
    if (winner !== existingMatch.teamA && winner !== existingMatch.teamB) {
      return res.status(400).json({
        success: false,
        error: `Winner must be either ${existingMatch.teamA} or ${existingMatch.teamB}`
      });
    }
    
    // Update match with winner and status
    const updatedMatch = await googleSheetsService.updateMatchWinner(id, winner);
    
    res.json({
      success: true,
      data: updatedMatch,
      message: 'Match winner set and predictions updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get matches by tournament
const getMatchesByTournament = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    
    // Validate tournament exists
    const tournament = await googleSheetsService.getById('tournaments', tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const matches = await googleSheetsService.getMatchesByTournament(tournamentId);
    
    res.json({
      success: true,
      data: {
        tournament,
        matches
      },
      count: matches.length
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming matches
const getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await googleSheetsService.getUpcomingMatches();
    
    // Get tournament details for each match
    const tournaments = await googleSheetsService.getTournaments();
    const matchesWithTournaments = matches.map(match => {
      const tournament = tournaments.find(t => t.id === match.tournamentId);
      return {
        ...match,
        tournamentName: tournament ? tournament.name : 'Unknown Tournament'
      };
    });
    
    res.json({
      success: true,
      data: matchesWithTournaments,
      count: matchesWithTournaments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get completed matches
const getCompletedMatches = async (req, res, next) => {
  try {
    const matches = await googleSheetsService.getCompletedMatches();
    
    // Get tournament details for each match
    const tournaments = await googleSheetsService.getTournaments();
    const matchesWithTournaments = matches.map(match => {
      const tournament = tournaments.find(t => t.id === match.tournamentId);
      return {
        ...match,
        tournamentName: tournament ? tournament.name : 'Unknown Tournament'
      };
    });
    
    res.json({
      success: true,
      data: matchesWithTournaments,
      count: matchesWithTournaments.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  setMatchWinner,
  getMatchesByTournament,
  getUpcomingMatches,
  getCompletedMatches
};
