const { googleSheetsService } = require('../services/googleSheetsService');

// Get all predictors
const getAllPredictors = async (req, res, next) => {
  try {
    const predictors = await googleSheetsService.getPredictors();
    res.json({
      success: true,
      data: predictors,
      count: predictors.length
    });
  } catch (error) {
    next(error);
  }
};

// Get predictor by ID
const getPredictorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const predictor = await googleSheetsService.getById('predictors', id);
    
    if (!predictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    res.json({
      success: true,
      data: predictor
    });
  } catch (error) {
    next(error);
  }
};

// Create new predictor
const createPredictor = async (req, res, next) => {
  try {
    const { name, parentPredictorId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Predictor name is required'
      });
    }
    
    // Validate parent predictor if provided
    if (parentPredictorId) {
      const parentPredictor = await googleSheetsService.getById('predictors', parentPredictorId);
      if (!parentPredictor) {
        return res.status(400).json({
          success: false,
          error: 'Parent predictor not found'
        });
      }
    }
    
    const newPredictor = await googleSheetsService.create('predictors', {
      name,
      parentPredictorId: parentPredictorId || '',
      createdDate: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: newPredictor,
      message: 'Predictor created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update predictor
const updatePredictor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parentPredictorId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Predictor name is required'
      });
    }
    
    // Check if predictor exists
    const existingPredictor = await googleSheetsService.getById('predictors', id);
    if (!existingPredictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    // Validate parent predictor if provided
    if (parentPredictorId) {
      const parentPredictor = await googleSheetsService.getById('predictors', parentPredictorId);
      if (!parentPredictor) {
        return res.status(400).json({
          success: false,
          error: 'Parent predictor not found'
        });
      }
      
      // Prevent circular references
      if (parentPredictorId === id) {
        return res.status(400).json({
          success: false,
          error: 'Predictor cannot be its own parent'
        });
      }
    }
    
    const updatedPredictor = await googleSheetsService.update('predictors', id, {
      name,
      parentPredictorId: parentPredictorId || ''
    });
    
    res.json({
      success: true,
      data: updatedPredictor,
      message: 'Predictor updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete predictor
const deletePredictor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if predictor exists
    const existingPredictor = await googleSheetsService.getById('predictors', id);
    if (!existingPredictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    // Check if predictor has children
    const allPredictors = await googleSheetsService.getPredictors();
    const hasChildren = allPredictors.some(p => p.parentPredictorId === id);
    
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete predictor with children. Please reassign or delete children first.'
      });
    }
    
    // Check if predictor has predictions
    const predictions = await googleSheetsService.getPredictionsByPredictor(id);
    if (predictions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete predictor with existing predictions'
      });
    }
    
    await googleSheetsService.delete('predictors', id);
    
    res.json({
      success: true,
      message: 'Predictor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get predictor statistics
const getPredictorStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if predictor exists
    const existingPredictor = await googleSheetsService.getById('predictors', id);
    if (!existingPredictor) {
      return res.status(404).json({
        success: false,
        error: 'Predictor not found'
      });
    }
    
    const stats = await googleSheetsService.getPredictorStats(id);
    const predictions = await googleSheetsService.getPredictionsByPredictor(id);
    
    // Get recent predictions (last 10)
    const recentPredictions = predictions
      .filter(p => p.predictionTime)
      .sort((a, b) => new Date(b.predictionTime) - new Date(a.predictionTime))
      .slice(0, 10);
    
    // Calculate current streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sortedPredictions = predictions
      .filter(p => p.predictionTime)
      .sort((a, b) => new Date(a.predictionTime) - new Date(b.predictionTime));
    
    for (const prediction of sortedPredictions) {
      if (prediction.isCorrect === 'true') {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    
    // Current streak is the last consecutive correct predictions
    tempStreak = 0;
    for (let i = sortedPredictions.length - 1; i >= 0; i--) {
      if (sortedPredictions[i].isCorrect === 'true') {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;
    
    res.json({
      success: true,
      data: {
        predictor: existingPredictor,
        stats: {
          ...stats,
          currentStreak,
          maxStreak
        },
        recentPredictions,
        totalPredictions: predictions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all predictors with statistics
const getAllPredictorsWithStats = async (req, res, next) => {
  try {
    const predictorsWithStats = await googleSheetsService.getAllPredictorStats();
    
    res.json({
      success: true,
      data: predictorsWithStats,
      count: predictorsWithStats.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPredictors,
  getPredictorById,
  createPredictor,
  updatePredictor,
  deletePredictor,
  getPredictorStats,
  getAllPredictorsWithStats
};
