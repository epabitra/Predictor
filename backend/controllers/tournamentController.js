const { googleSheetsService } = require('../services/googleSheetsService');

// Get all tournaments
const getAllTournaments = async (req, res, next) => {
  try {
    const tournaments = await googleSheetsService.getTournaments();
    res.json({
      success: true,
      data: tournaments,
      count: tournaments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get tournament by ID
const getTournamentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await googleSheetsService.getById('tournaments', id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Get matches for this tournament
    const matches = await googleSheetsService.getMatchesByTournament(id);
    
    res.json({
      success: true,
      data: {
        ...tournament,
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new tournament
const createTournament = async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Tournament name is required'
      });
    }
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Tournament start date is required'
      });
    }
    
    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: 'Tournament end date is required'
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }
    
    if (start < now) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be in the past'
      });
    }
    
    const newTournament = await googleSheetsService.create('tournaments', {
      name,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: newTournament,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update tournament
const updateTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Tournament name is required'
      });
    }
    
    // Check if tournament exists
    const existingTournament = await googleSheetsService.getById('tournaments', id);
    if (!existingTournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Validate dates if provided
    let start, end;
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start date format'
        });
      }
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end date format'
        });
      }
    }
    
    // If both dates are provided, validate the relationship
    if (start && end && start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }
    
    // Check if there are matches that would conflict with new dates
    if (start || end) {
      const matches = await googleSheetsService.getMatchesByTournament(id);
      const finalStart = start || new Date(existingTournament.startDate);
      const finalEnd = end || new Date(existingTournament.endDate);
      
      for (const match of matches) {
        const matchTime = new Date(match.matchTime);
        if (matchTime < finalStart || matchTime > finalEnd) {
          return res.status(400).json({
            success: false,
            error: `Cannot update tournament dates: match ${match.teamA} vs ${match.teamB} is scheduled outside the new tournament period`
          });
        }
      }
    }
    
    const updatedTournament = await googleSheetsService.update('tournaments', id, {
      name,
      ...(startDate && { startDate: start.toISOString() }),
      ...(endDate && { endDate: end.toISOString() })
    });
    
    res.json({
      success: true,
      data: updatedTournament,
      message: 'Tournament updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete tournament
const deleteTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if tournament exists
    const existingTournament = await googleSheetsService.getById('tournaments', id);
    if (!existingTournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Check if tournament has matches
    const matches = await googleSheetsService.getMatchesByTournament(id);
    if (matches.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tournament with existing matches. Please delete matches first.'
      });
    }
    
    await googleSheetsService.delete('tournaments', id);
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get tournament statistics
const getTournamentStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if tournament exists
    const existingTournament = await googleSheetsService.getById('tournaments', id);
    if (!existingTournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const matches = await googleSheetsService.getMatchesByTournament(id);
    const allPredictions = await googleSheetsService.getPredictions();
    
    // Filter predictions for this tournament's matches
    const tournamentPredictions = allPredictions.filter(prediction => 
      matches.some(match => match.id === prediction.matchId)
    );
    
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      upcomingMatches: matches.filter(m => m.status !== 'completed').length,
      totalPredictions: tournamentPredictions.length,
      correctPredictions: tournamentPredictions.filter(p => p.isCorrect === 'true').length,
      wrongPredictions: tournamentPredictions.filter(p => p.isCorrect === 'false').length,
      notPredicted: tournamentPredictions.filter(p => p.predictedWinner === '' || !p.predictedWinner).length
    };
    
    // Calculate average prediction accuracy
    const totalPredictionsWithResults = stats.correctPredictions + stats.wrongPredictions;
    stats.averageAccuracy = totalPredictionsWithResults > 0 
      ? ((stats.correctPredictions / totalPredictionsWithResults) * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      data: {
        tournament: existingTournament,
        stats,
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get active tournaments (currently running or starting soon)
const getActiveTournaments = async (req, res, next) => {
  try {
    const tournaments = await googleSheetsService.getTournaments();
    const now = new Date();
    
    const activeTournaments = tournaments.filter(tournament => {
      const start = new Date(tournament.startDate);
      const end = new Date(tournament.endDate);
      
      // Tournament is active if it's currently running or starting within 7 days
      const isCurrentlyRunning = start <= now && end >= now;
      const isStartingSoon = start > now && start <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return isCurrentlyRunning || isStartingSoon;
    });
    
    res.json({
      success: true,
      data: activeTournaments,
      count: activeTournaments.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentStats,
  getActiveTournaments
};
