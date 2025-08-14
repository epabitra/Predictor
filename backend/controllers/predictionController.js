const { googleSheetsService } = require('../services/googleSheetsService');

// Get all predictions
const getAllPredictions = async (req, res, next) => {
  try {
    const predictions = await googleSheetsService.getPredictions();
    
    // Get match and predictor details for each prediction
    const matches = await googleSheetsService.getMatches();
    const predictors = await googleSheetsService.getPredictors();
    
    const predictionsWithDetails = predictions.map(prediction => {
      const match = matches.find(m => m.id === prediction.matchId);
      const predictor = predictors.find(p => p.id === prediction.predictorId);
      
      return {
        ...prediction,
        match: match ? {
          id: match.id,
          teamA: match.teamA,
          teamB: match.teamB,
          matchTime: match.matchTime,
          status: match.status,
          winner: match.winner
        } : null,
        predictor: predictor ? {
          id: predictor.id,
          name: predictor.name
        } : null
      };
    });
    
    res.json({
      success: true,
      data: predictionsWithDetails,
      count: predictionsWithDetails.length
    });
  } catch (error) {
    next(error);
  }
};

// Get prediction by ID
const getPredictionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prediction = await googleSheetsService.getById('predictions', id);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }
    
    // Get match and predictor details
    const match = await googleSheetsService.getById('matches', prediction.matchId);
    const predictor = await googleSheetsService.getById('predictors', prediction.predictorId);
    
    res.json({
      success: true,
      data: {
        ...prediction,
        match,
        predictor
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new prediction
const createPrediction = async (req, res, next) => {
  try {
    const { matchId, predictorId, predictedWinner } = req.body;
    
    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required'
      });
    }
    
    if (!predictorId) {
      return res.status(400).json({
        success: false,
        error: 'Predictor ID is required'
      });
    }
    
    if (!predictedWinner) {
      return res.status(400).json({
        success: false,
        error: 'Predicted winner is required'
      });
    }
    
    // Validate match exists
    const match = await googleSheetsService.getById('matches', matchId);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Validate predictor exists
    const predictor = await googleSheetsService.getById('predictors', predictorId);
    if (!predictor) {
      return res.status(400).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    // Check if match is already completed
    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot predict on completed match'
      });
    }
    
    // Check if match is too close to start (within 1 hour)
    const matchTime = new Date(match.matchTime);
    const now = new Date();
    const oneHourFromMatch = new Date(matchTime.getTime() - 60 * 60 * 1000);
    
    // REMOVED: 1-hour restriction - predictions can now be made until match time
    // if (now >= oneHourFromMatch) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Predictions are closed for this match (within 1 hour of start time)'
    //   });
    // }
    
    // Validate predicted winner is one of the teams
    if (predictedWinner !== match.teamA && predictedWinner !== match.teamB) {
      return res.status(400).json({
        success: false,
        error: `Predicted winner must be either ${match.teamA} or ${match.teamB}`
      });
    }
    
    // Check if prediction already exists for this match and predictor
    const existingPredictions = await googleSheetsService.getPredictionsByMatch(matchId);
    const existingPrediction = existingPredictions.find(p => p.predictorId === predictorId);
    
    if (existingPrediction && existingPrediction.predictedWinner) {
      return res.status(400).json({
        success: false,
        error: 'Prediction already exists for this match and predictor'
      });
    }
    
    // If prediction placeholder exists, update it; otherwise create new
    let newPrediction;
    if (existingPrediction) {
      newPrediction = await googleSheetsService.update('predictions', existingPrediction.id, {
        predictedWinner,
        predictionTime: new Date().toISOString(),
        isCorrect: '',
        resultStatus: '⏳ Pending'
      });
    } else {
      newPrediction = await googleSheetsService.create('predictions', {
        matchId,
        predictorId,
        predictedWinner,
        predictionTime: new Date().toISOString(),
        isCorrect: '',
        resultStatus: '⏳ Pending'
      });
    }
    
    res.status(201).json({
      success: true,
      data: newPrediction,
      message: 'Prediction created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update prediction
const updatePrediction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { predictedWinner } = req.body;
    
    console.log('Update prediction request:', { id, predictedWinner });
    
    if (!predictedWinner) {
      console.log('Validation failed: No predicted winner');
      return res.status(400).json({
        success: false,
        error: 'Predicted winner is required'
      });
    }
    
    // Check if prediction exists
    const existingPrediction = await googleSheetsService.getById('predictions', id);
    if (!existingPrediction) {
      console.log('Validation failed: Prediction not found');
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }
    
    console.log('Existing prediction:', existingPrediction);
    
    // Get match details
    const match = await googleSheetsService.getById('matches', existingPrediction.matchId);
    if (!match) {
      console.log('Validation failed: Match not found');
      return res.status(400).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    console.log('Match details:', match);
    
    // Check if match is already completed
    if (match.status === 'completed') {
      console.log('Validation failed: Match already completed');
      return res.status(400).json({
        success: false,
        error: 'Cannot update prediction on completed match'
      });
    }
    
    // Check if match is too close to start (within 1 hour)
    const matchTime = new Date(match.matchTime);
    const now = new Date();
    const oneHourFromMatch = new Date(matchTime.getTime() - 60 * 60 * 1000);
    
    console.log('Time check:', { 
      matchTime: matchTime.toISOString(), 
      now: now.toISOString(), 
      oneHourFromMatch: oneHourFromMatch.toISOString(),
      isTooClose: now >= oneHourFromMatch
    });
    
    // REMOVED: 1-hour restriction - predictions can now be made until match time
    // if (now >= oneHourFromMatch) {
    //   console.log('Validation failed: Match too close to start time');
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Predictions are closed for this match (within 1 hour of start time)'
    //   });
    // }
    
    // Validate predicted winner is one of the teams
    console.log('Team validation:', { 
      predictedWinner, 
      teamA: match.teamA, 
      teamB: match.teamB,
      isValid: predictedWinner === match.teamA || predictedWinner === match.teamB
    });
    
    if (predictedWinner !== match.teamA && predictedWinner !== match.teamB) {
      console.log('Validation failed: Invalid team selected');
      return res.status(400).json({
        success: false,
        error: `Predicted winner must be either ${match.teamA} or ${match.teamB}`
      });
    }
    
    const updatedPrediction = await googleSheetsService.update('predictions', id, {
      predictedWinner,
      predictionTime: new Date().toISOString(),
      isCorrect: '',
      resultStatus: '⏳ Pending'
    });
    
    console.log('Prediction updated successfully:', updatedPrediction);
    
    res.json({
      success: true,
      data: updatedPrediction,
      message: 'Prediction updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete prediction
const deletePrediction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if prediction exists
    const existingPrediction = await googleSheetsService.getById('predictions', id);
    if (!existingPrediction) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }
    
    // Get match details
    const match = await googleSheetsService.getById('matches', existingPrediction.matchId);
    if (match && match.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete prediction on completed match'
      });
    }
    
    await googleSheetsService.delete('predictions', id);
    
    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get predictions by match
const getPredictionsByMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    // Validate match exists
    const match = await googleSheetsService.getById('matches', matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const predictions = await googleSheetsService.getPredictionsByMatch(matchId);
    
    // Get predictor details for each prediction
    const predictors = await googleSheetsService.getPredictors();
    const predictionsWithPredictors = predictions.map(prediction => {
      const predictor = predictors.find(p => p.id === prediction.predictorId);
      return {
        ...prediction,
        predictor: predictor ? {
          id: predictor.id,
          name: predictor.name
        } : null
      };
    });
    
    res.json({
      success: true,
      data: {
        match,
        predictions: predictionsWithPredictors
      },
      count: predictionsWithPredictors.length
    });
  } catch (error) {
    next(error);
  }
};

// Get predictions by predictor
const getPredictionsByPredictor = async (req, res, next) => {
  try {
    const { predictorId } = req.params;
    
    // Validate predictor exists
    const predictor = await googleSheetsService.getById('predictors', predictorId);
    if (!predictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    const predictions = await googleSheetsService.getPredictionsByPredictor(predictorId);
    
    // Get match details for each prediction
    const matches = await googleSheetsService.getMatches();
    const predictionsWithMatches = predictions.map(prediction => {
      const match = matches.find(m => m.id === prediction.matchId);
      return {
        ...prediction,
        match: match ? {
          id: match.id,
          teamA: match.teamA,
          teamB: match.teamB,
          matchTime: match.matchTime,
          status: match.status,
          winner: match.winner
        } : null
      };
    });
    
    res.json({
      success: true,
      data: {
        predictor,
        predictions: predictionsWithMatches
      },
      count: predictionsWithMatches.length
    });
  } catch (error) {
    next(error);
  }
};

// Get prediction statistics
const getPredictionStats = async (req, res, next) => {
  try {
    const predictions = await googleSheetsService.getPredictions();
    
    const stats = {
      total: predictions.length,
      correct: predictions.filter(p => p.isCorrect === 'true').length,
      wrong: predictions.filter(p => p.isCorrect === 'false').length,
      pending: predictions.filter(p => p.isCorrect === '' && p.predictedWinner).length,
      notPredicted: predictions.filter(p => !p.predictedWinner || p.predictedWinner === '').length
    };
    
    // Calculate accuracy
    const totalWithResults = stats.correct + stats.wrong;
    stats.accuracy = totalWithResults > 0 ? ((stats.correct / totalWithResults) * 100).toFixed(2) : 0;
    
    // Get recent predictions (last 10)
    const recentPredictions = predictions
      .filter(p => p.predictionTime)
      .sort((a, b) => new Date(b.predictionTime) - new Date(a.predictionTime))
      .slice(0, 10);
    
    res.json({
      success: true,
      data: {
        stats,
        recentPredictions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPredictions,
  getPredictionById,
  createPrediction,
  updatePrediction,
  deletePrediction,
  getPredictionsByMatch,
  getPredictionsByPredictor,
  getPredictionStats
};
