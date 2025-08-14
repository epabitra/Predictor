const { googleSheetsService } = require('../services/googleSheetsService');

// Get overall dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const [predictors, tournaments, matches, predictions] = await Promise.all([
      googleSheetsService.getPredictors(),
      googleSheetsService.getTournaments(),
      googleSheetsService.getMatches(),
      googleSheetsService.getPredictions()
    ]);

    // Calculate overall statistics
    const stats = {
      totalPredictors: predictors.length,
      totalTournaments: tournaments.length,
      totalMatches: matches.length,
      totalPredictions: predictions.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      upcomingMatches: matches.filter(m => m.status !== 'completed').length,
      correctPredictions: predictions.filter(p => p.isCorrect === 'true').length,
      wrongPredictions: predictions.filter(p => p.isCorrect === 'false').length,
      pendingPredictions: predictions.filter(p => p.isCorrect === '' && p.predictedWinner).length,
      notPredicted: predictions.filter(p => !p.predictedWinner || p.predictedWinner === '').length
    };

    // Calculate overall accuracy
    const totalWithResults = stats.correctPredictions + stats.wrongPredictions;
    stats.overallAccuracy = totalWithResults > 0 
      ? ((stats.correctPredictions / totalWithResults) * 100).toFixed(2)
      : 0;

    // Get recent activity
    const recentMatches = matches
      .sort((a, b) => new Date(b.matchTime) - new Date(a.matchTime))
      .slice(0, 5);

    const recentPredictions = predictions
      .filter(p => p.predictionTime)
      .sort((a, b) => new Date(b.predictionTime) - new Date(a.predictionTime))
      .slice(0, 10)
      .map(prediction => {
        // Find the predictor and match details
        const predictor = predictors.find(p => p.id === prediction.predictorId);
        const match = matches.find(m => m.id === prediction.matchId);
        
        return {
          ...prediction,
          predictorName: predictor ? predictor.name : 'Unknown Predictor',
          matchDetails: match ? `${match.teamA} vs ${match.teamB}` : 'Unknown Match'
        };
      });

    // Get upcoming matches (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingMatches = matches.filter(match => {
      if (match.status === 'completed') return false;
      const matchTime = new Date(match.matchTime);
      return matchTime > now && matchTime <= sevenDaysFromNow;
    });

    console.log('Dashboard stats response:', {
      stats: {
        totalPredictors: stats.totalPredictors,
        totalTournaments: stats.totalTournaments,
        totalMatches: stats.totalMatches,
        totalPredictions: stats.totalPredictions
      },
      recentMatches: recentMatches.length,
      recentPredictions: recentPredictions.length,
      upcomingMatches: upcomingMatches.length
    });

    res.json({
      success: true,
      data: {
        stats,
        recentMatches,
        recentPredictions,
        upcomingMatches
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard data
const getLeaderboard = async (req, res, next) => {
  try {
    const { tournamentId, limit = 20 } = req.query;
    
    let predictorsWithStats;
    
    if (tournamentId) {
      // Get leaderboard for specific tournament
      const tournament = await googleSheetsService.getById('tournaments', tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }
      
      const matches = await googleSheetsService.getMatchesByTournament(tournamentId);
      const matchIds = matches.map(m => m.id);
      const allPredictions = await googleSheetsService.getPredictions();
      
      // Filter predictions for this tournament
      const tournamentPredictions = allPredictions.filter(p => matchIds.includes(p.matchId));
      
      // Calculate stats for each predictor
      const predictors = await googleSheetsService.getPredictors();
      predictorsWithStats = predictors.map(predictor => {
        const predictorPredictions = tournamentPredictions.filter(p => p.predictorId === predictor.id);
        const total = predictorPredictions.length;
        const correct = predictorPredictions.filter(p => p.isCorrect === 'true').length;
        const wrong = predictorPredictions.filter(p => p.isCorrect === 'false').length;
        const notPredicted = predictorPredictions.filter(p => !p.predictedWinner || p.predictedWinner === '');
        
        return {
          ...predictor,
          total,
          correct,
          wrong,
          notPredicted,
          accuracy: total > 0 ? ((correct / total) * 100).toFixed(2) : 0
        };
      }).filter(p => p.total > 0); // Only show predictors with predictions
      
    } else {
      // Get global leaderboard
      predictorsWithStats = await googleSheetsService.getAllPredictorStats();
    }
    
    // Ensure predictorsWithStats is an array
    if (!Array.isArray(predictorsWithStats)) {
      console.error('predictorsWithStats is not an array:', predictorsWithStats);
      predictorsWithStats = [];
    }
    
    // Sort by accuracy (descending) and limit results
    const sortedLeaderboard = predictorsWithStats
      .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy))
      .slice(0, parseInt(limit));
    
    // Add ranking
    const leaderboardWithRanking = sortedLeaderboard.map((predictor, index) => ({
      ...predictor,
      rank: index + 1
    }));
    
    console.log('Leaderboard response:', {
      count: leaderboardWithRanking.length,
      sample: leaderboardWithRanking.slice(0, 2)
    });
    
    res.json({
      success: true,
      data: leaderboardWithRanking,
      count: leaderboardWithRanking.length
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    next(error);
  }
};

// Get tournament performance comparison
const getTournamentComparison = async (req, res, next) => {
  try {
    const tournaments = await googleSheetsService.getTournaments();
    const matches = await googleSheetsService.getMatches();
    const predictions = await googleSheetsService.getPredictions();
    
    const tournamentStats = tournaments.map(tournament => {
      const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
      const matchIds = tournamentMatches.map(m => m.id);
      const tournamentPredictions = predictions.filter(p => matchIds.includes(p.matchId));
      
      const stats = {
        totalMatches: tournamentMatches.length,
        completedMatches: tournamentMatches.filter(m => m.status === 'completed').length,
        totalPredictions: tournamentPredictions.length,
        correctPredictions: tournamentPredictions.filter(p => p.isCorrect === 'true').length,
        wrongPredictions: tournamentPredictions.filter(p => p.isCorrect === 'false').length,
        notPredicted: tournamentPredictions.filter(p => !p.predictedWinner || p.predictedWinner === '').length
      };
      
      const totalWithResults = stats.correctPredictions + stats.wrongPredictions;
      stats.accuracy = totalWithResults > 0 
        ? ((stats.correctPredictions / totalWithResults) * 100).toFixed(2)
        : 0;
      
      return {
        ...tournament,
        stats
      };
    });
    
    res.json({
      success: true,
      data: tournamentStats,
      count: tournamentStats.length
    });
  } catch (error) {
    next(error);
  }
};

// Get prediction trends over time
const getPredictionTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const predictions = await googleSheetsService.getPredictions();
    
    // Filter predictions within the specified time range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const recentPredictions = predictions.filter(prediction => {
      if (!prediction.predictionTime) return false;
      const predictionTime = new Date(prediction.predictionTime);
      return predictionTime >= startDate && predictionTime <= now;
    });
    
    // Group predictions by date
    const predictionsByDate = {};
    recentPredictions.forEach(prediction => {
      const date = new Date(prediction.predictionTime).toISOString().split('T')[0];
      if (!predictionsByDate[date]) {
        predictionsByDate[date] = {
          date,
          total: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0
        };
      }
      
      predictionsByDate[date].total++;
      if (prediction.isCorrect === 'true') {
        predictionsByDate[date].correct++;
      } else if (prediction.isCorrect === 'false') {
        predictionsByDate[date].wrong++;
      }
    });
    
    // Calculate accuracy for each date
    Object.values(predictionsByDate).forEach(dayStats => {
      const totalWithResults = dayStats.correct + dayStats.wrong;
      dayStats.accuracy = totalWithResults > 0 
        ? ((dayStats.correct / totalWithResults) * 100).toFixed(2)
        : 0;
    });
    
    // Convert to array and sort by date
    const trends = Object.values(predictionsByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      data: trends,
      count: trends.length
    });
  } catch (error) {
    next(error);
  }
};

// Get predictor performance over time
const getPredictorPerformance = async (req, res, next) => {
  try {
    const { predictorId, days = 30 } = req.params;
    
    // Validate predictor exists
    const predictor = await googleSheetsService.getById('predictors', predictorId);
    if (!predictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    const predictions = await googleSheetsService.getPredictionsByPredictor(predictorId);
    
    // Filter predictions within the specified time range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const recentPredictions = predictions.filter(prediction => {
      if (!prediction.predictionTime) return false;
      const predictionTime = new Date(prediction.predictionTime);
      return predictionTime >= startDate && predictionTime <= now;
    });
    
    // Group predictions by date
    const predictionsByDate = {};
    recentPredictions.forEach(prediction => {
      const date = new Date(prediction.predictionTime).toISOString().split('T')[0];
      if (!predictionsByDate[date]) {
        predictionsByDate[date] = {
          date,
          total: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0
        };
      }
      
      predictionsByDate[date].total++;
      if (prediction.isCorrect === 'true') {
        predictionsByDate[date].correct++;
      } else if (prediction.isCorrect === 'false') {
        predictionsByDate[date].wrong++;
      }
    });
    
    // Calculate accuracy for each date
    Object.values(predictionsByDate).forEach(dayStats => {
      const totalWithResults = dayStats.correct + dayStats.wrong;
      dayStats.accuracy = totalWithResults > 0 
        ? ((dayStats.correct / totalWithResults) * 100).toFixed(2)
        : 0;
    });
    
    // Convert to array and sort by date
    const performance = Object.values(predictionsByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      data: {
        predictor,
        performance,
        count: performance.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export data to CSV format
const exportData = async (req, res, next) => {
  try {
    const { type, tournamentId } = req.query;
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'predictors':
        data = await googleSheetsService.getPredictors();
        filename = 'predictors.csv';
        break;
        
      case 'tournaments':
        data = await googleSheetsService.getTournaments();
        filename = 'tournaments.csv';
        break;
        
      case 'matches':
        if (tournamentId) {
          const tournament = await googleSheetsService.getById('tournaments', tournamentId);
          const matches = await googleSheetsService.getMatchesByTournament(tournamentId);
          data = matches.map(match => ({
            ...match,
            tournamentName: tournament.name
          }));
          filename = `matches_${tournament.name.replace(/\s+/g, '_')}.csv`;
        } else {
          data = await googleSheetsService.getMatches();
          filename = 'matches.csv';
        }
        break;
        
      case 'predictions':
        if (tournamentId) {
          const tournament = await googleSheetsService.getById('tournaments', tournamentId);
          const matches = await googleSheetsService.getMatchesByTournament(tournamentId);
          const matchIds = matches.map(m => m.id);
          const allPredictions = await googleSheetsService.getPredictions();
          const tournamentPredictions = allPredictions.filter(p => matchIds.includes(p.matchId));
          
          // Get predictor and match details
          const predictors = await googleSheetsService.getPredictors();
          data = tournamentPredictions.map(prediction => {
            const predictor = predictors.find(p => p.id === prediction.predictorId);
            const match = matches.find(m => m.id === prediction.matchId);
            return {
              ...prediction,
              predictorName: predictor ? predictor.name : 'Unknown',
              teamA: match ? match.teamA : 'Unknown',
              teamB: match ? match.teamB : 'Unknown',
              tournamentName: tournament.name
            };
          });
          filename = `predictions_${tournament.name.replace(/\s+/g, '_')}.csv`;
        } else {
          data = await googleSheetsService.getPredictions();
          filename = 'predictions.csv';
        }
        break;
        
      case 'leaderboard':
        data = await googleSheetsService.getAllPredictorStats();
        filename = 'leaderboard.csv';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type. Must be one of: predictors, tournaments, matches, predictions, leaderboard'
        });
    }
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found to export'
      });
    }
    
    // Convert to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getLeaderboard,
  getTournamentComparison,
  getPredictionTrends,
  getPredictorPerformance,
  exportData
};
