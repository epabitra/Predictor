const { googleSheetsService } = require('../services/googleSheetsService');

/**
 * Check for matches starting within 1 hour and trigger prediction requests
 * This function runs every minute via CRON
 */
async function checkUpcomingMatches() {
  try {
    const upcomingMatches = await googleSheetsService.getUpcomingMatches();
    
    if (upcomingMatches.length > 0) {
      console.log(`🔔 Found ${upcomingMatches.length} upcoming match(es) within 1 hour`);
      
      for (const match of upcomingMatches) {
        await triggerPredictionRequest(match);
      }
    }
  } catch (error) {
    console.error('Error checking upcoming matches:', error);
  }
}

/**
 * Check for matches that started 2+ hours ago and mark missing predictions as "Not Predicted"
 * This function runs every 30 minutes via CRON
 */
async function checkMissingPredictions() {
  try {
    const matches = await googleSheetsService.getMatches();
    const now = new Date();
    
    for (const match of matches) {
      if (match.status === 'completed') continue; // Skip completed matches
      
      const matchTime = new Date(match.matchTime);
      const hoursSinceMatch = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);
      
      // If match started 2+ hours ago, mark missing predictions as "Not Predicted"
      if (hoursSinceMatch >= 2) {
        const predictions = await googleSheetsService.getPredictionsByMatch(match.id);
        
        for (const prediction of predictions) {
          if (!prediction.predictedWinner || prediction.predictedWinner === '') {
            // Keep the original prediction time so these entries appear first in sorting
            const updateData = {
              resultStatus: '❌ Not Predicted',
              isCorrect: 'Not Predicted'
            };
            
            // If predictionTime is empty, set it to the current time to ensure it appears first
            if (!prediction.predictionTime || prediction.predictionTime === '') {
              updateData.predictionTime = new Date().toISOString();
            }
            
            await googleSheetsService.update('predictions', prediction.id, updateData);
            console.log(`📝 Marked prediction ${prediction.id} as "Not Predicted" for match ${match.id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking missing predictions:', error);
  }
}

/**
 * Trigger prediction request for a specific match
 * This would typically send notifications to all predictors
 * For now, we'll just log the request and create prediction placeholders
 */
async function triggerPredictionRequest(match) {
  try {
    console.log(`📢 Prediction request triggered for match: ${match.teamA} vs ${match.teamB}`);
    console.log(`⏰ Match time: ${new Date(match.matchTime).toLocaleString()}`);
    
    // Get all predictors
    const predictors = await googleSheetsService.getPredictors();
    
    // Check if predictions already exist for this match
    const existingPredictions = await googleSheetsService.getPredictionsByMatch(match.id);
    const predictorIdsWithPredictions = existingPredictions.map(p => p.predictorId);
    
    // Create prediction placeholders for predictors who haven't predicted yet
    for (const predictor of predictors) {
      if (!predictorIdsWithPredictions.includes(predictor.id)) {
        await googleSheetsService.create('predictions', {
          matchId: match.id,
          predictorId: predictor.id,
          predictedWinner: '',
          predictionTime: new Date().toISOString(), // Set current time so these appear first
          isCorrect: '',
          resultStatus: '⏳ Not Predicted'
        });
        
        console.log(`📝 Created prediction placeholder for predictor: ${predictor.name}`);
      }
    }
    
    console.log(`✅ Prediction request completed for match: ${match.id}`);
    
  } catch (error) {
    console.error(`Error triggering prediction request for match ${match.id}:`, error);
  }
}

/**
 * Check for completed matches and update prediction results
 * This function can be called manually or via CRON
 */
async function checkCompletedMatches() {
  try {
    const completedMatches = await googleSheetsService.getCompletedMatches();
    
    if (completedMatches.length > 0) {
      console.log(`🏁 Found ${completedMatches.length} completed match(es)`);
      
      for (const match of completedMatches) {
        if (match.winner) {
          console.log(`✅ Match ${match.id} already has winner: ${match.winner}`);
        } else {
          console.log(`⚠️ Match ${match.id} completed but no winner set`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking completed matches:', error);
  }
}

/**
 * Clean up old prediction placeholders
 * Remove predictions that are older than 24 hours and still have no prediction
 */
async function cleanupOldPredictions() {
  try {
    const predictions = await googleSheetsService.getPredictions();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    for (const prediction of predictions) {
      if (prediction.predictionTime && prediction.predictedWinner === '') {
        const predictionTime = new Date(prediction.predictionTime);
        if (predictionTime < twentyFourHoursAgo) {
          await googleSheetsService.delete('predictions', prediction.id);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old prediction placeholders`);
    }
  } catch (error) {
    console.error('Error cleaning up old predictions:', error);
  }
}

/**
 * Generate daily statistics report
 * This function can be called daily via CRON
 */
async function generateDailyReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 Generating daily report for ${today}`);
    
    const totalPredictors = (await googleSheetsService.getPredictors()).length;
    const totalTournaments = (await googleSheetsService.getTournaments()).length;
    const totalMatches = (await googleSheetsService.getMatches()).length;
    const totalPredictions = (await googleSheetsService.getPredictions()).length;
    
    const completedMatches = await googleSheetsService.getCompletedMatches();
    const upcomingMatches = await googleSheetsService.getUpcomingMatches();
    
    const report = {
      date: today,
      totalPredictors,
      totalTournaments,
      totalMatches,
      totalPredictions,
      completedMatches: completedMatches.length,
      upcomingMatches: upcomingMatches.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📈 Daily Report:', report);
    return report;
    
  } catch (error) {
    console.error('Error generating daily report:', error);
  }
}

/**
 * Initialize all CRON jobs
 * This function is called when the server starts
 */
function initializeCronJobs() {
  console.log('⏰ Initializing CRON jobs...');
  
  // Main job: Check upcoming matches every minute
  // This is handled in server.js
  
  // Additional jobs can be added here if needed
  console.log('✅ CRON jobs initialized');
}

module.exports = {
  checkUpcomingMatches,
  triggerPredictionRequest,
  checkCompletedMatches,
  checkMissingPredictions,
  cleanupOldPredictions,
  generateDailyReport,
  initializeCronJobs
};
