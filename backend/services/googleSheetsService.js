const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = null;
    this.auth = null;
  }

  async initialize() {
    try {
      this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_ID environment variable is required');
      }

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      // Initialize sheets if they don't exist
      await this.initializeSheets();
      
      console.log('Google Sheets service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async initializeSheets() {
    try {
      // Get existing sheets
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
      console.log('Existing sheets:', existingSheets);
      
      const requiredSheets = ['predictors', 'tournaments', 'matches', 'predictions'];
      console.log('Required sheets:', requiredSheets);

      // Create missing sheets
      for (const sheetName of requiredSheets) {
        if (!existingSheets.includes(sheetName)) {
          console.log(`Creating missing sheet: ${sheetName}`);
          await this.createSheet(sheetName);
          await this.setSheetHeaders(sheetName);
        } else {
          console.log(`Sheet ${sheetName} already exists`);
        }
      }
      
      // Verify all sheets exist after initialization
      const finalResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const finalSheets = finalResponse.data.sheets.map(sheet => sheet.properties.title);
      console.log('Final sheets after initialization:', finalSheets);
      
    } catch (error) {
      console.error('Error initializing sheets:', error);
      throw error;
    }
  }

  async createSheet(sheetName) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 20,
                  },
                },
              },
            },
          ],
        },
      });
      console.log(`Created sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async setSheetHeaders(sheetName) {
    const headers = this.getHeadersForSheet(sheetName);
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });
    } catch (error) {
      console.error(`Error setting headers for ${sheetName}:`, error);
      throw error;
    }
  }

  getHeadersForSheet(sheetName) {
    const headers = {
      predictors: ['id', 'name', 'parentPredictorId', 'createdDate'],
      tournaments: ['id', 'name', 'startDate', 'endDate'],
      matches: ['id', 'tournamentId', 'teamA', 'teamB', 'matchTime', 'status', 'winner'],
      predictions: ['id', 'matchId', 'predictorId', 'predictedWinner', 'predictionTime', 'isCorrect', 'resultStatus']
    };
    return headers[sheetName] || [];
  }

  // Generic CRUD operations
  async getAll(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Z`,
      });

      const rows = response.data.values || [];
      const headers = this.getHeadersForSheet(sheetName);
      
      return rows.map(row => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index] || null;
        });
        return item;
      });
    } catch (error) {
      console.error(`Error getting all from ${sheetName}:`, error);
      throw error;
    }
  }

  async getById(sheetName, id) {
    try {
      const allItems = await this.getAll(sheetName);
      return allItems.find(item => item.id === id);
    } catch (error) {
      console.error(`Error getting item by ID from ${sheetName}:`, error);
      throw error;
    }
  }

  async create(sheetName, data) {
    try {
      console.log(`Creating item in sheet: ${sheetName}`);
      console.log('Data to create:', data);
      
      const headers = this.getHeadersForSheet(sheetName);
      console.log('Headers for sheet:', headers);
      
      const id = uuidv4();
      
      const newItem = {
        id,
        ...data,
        ...(data.createdDate ? {} : { createdDate: new Date().toISOString() })
      };

      const row = headers.map(header => newItem[header] || '');
      console.log('Row to append:', row);
      console.log('Range to append to:', sheetName);
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
        valueInputOption: 'RAW',
        resource: {
          values: [row],
        },
      });

      console.log('Successfully created item:', newItem);
      return newItem;
    } catch (error) {
      console.error(`Error creating item in ${sheetName}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors
      });
      throw error;
    }
  }

  async update(sheetName, id, data) {
    try {
      const allItems = await this.getAll(sheetName);
      const rowIndex = allItems.findIndex(item => item.id === id);
      
      if (rowIndex === -1) {
        throw new Error(`Item with ID ${id} not found in ${sheetName}`);
      }

      const headers = this.getHeadersForSheet(sheetName);
      const updatedItem = { ...allItems[rowIndex], ...data };
      
      const row = headers.map(header => updatedItem[header] || '');
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [row],
        },
      });

      return updatedItem;
    } catch (error) {
      console.error(`Error updating item in ${sheetName}:`, error);
      throw error;
    }
  }

  async delete(sheetName, id) {
    try {
      const allItems = await this.getAll(sheetName);
      const rowIndex = allItems.findIndex(item => item.id === id);
      
      if (rowIndex === -1) {
        throw new Error(`Item with ID ${id} not found in ${sheetName}`);
      }

      // Clear the row (Google Sheets doesn't support row deletion via API easily)
      const headers = this.getHeadersForSheet(sheetName);
      const emptyRow = headers.map(() => '');
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [emptyRow],
        },
      });

      return { success: true, message: `Item ${id} deleted from ${sheetName}` };
    } catch (error) {
      console.error(`Error deleting item from ${sheetName}:`, error);
      throw error;
    }
  }

  // Specific entity methods
  async getPredictors() {
    return this.getAll('predictors');
  }

  async getTournaments() {
    return this.getAll('tournaments');
  }

  async getMatches() {
    return this.getAll('matches');
  }

  async getPredictions() {
    return this.getAll('predictions');
  }

  async getMatchesByTournament(tournamentId) {
    const matches = await this.getAll('matches');
    return matches.filter(match => match.tournamentId === tournamentId);
  }

  async getPredictionsByMatch(matchId) {
    const predictions = await this.getAll('predictions');
    return predictions.filter(prediction => prediction.matchId === matchId);
  }

  async getPredictionsByPredictor(predictorId) {
    const predictions = await this.getAll('predictions');
    return predictions.filter(prediction => prediction.predictorId === predictorId);
  }

  async updateMatchWinner(matchId, winner) {
    const match = await this.update('matches', matchId, { winner, status: 'completed' });
    
    // Update all predictions for this match
    const predictions = await this.getPredictionsByMatch(matchId);
    for (const prediction of predictions) {
      const isCorrect = prediction.predictedWinner === winner;
      const resultStatus = prediction.predictedWinner ? (isCorrect ? '✅ Correct' : '❌ Wrong') : '⏳ Not Predicted';
      
      await this.update('predictions', prediction.id, {
        isCorrect: isCorrect.toString(),
        resultStatus
      });
    }

    return match;
  }

  async getUpcomingMatches() {
    const matches = await this.getAll('matches');
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return matches.filter(match => {
      if (match.status === 'completed') return false;
      
      const matchTime = new Date(match.matchTime);
      return matchTime > now && matchTime <= oneHourFromNow;
    });
  }

  async getCompletedMatches() {
    const matches = await this.getAll('matches');
    return matches.filter(match => match.status === 'completed');
  }

  async getPredictorStats(predictorId) {
    const predictions = await this.getPredictionsByPredictor(predictorId);
    const total = predictions.length;
    const correct = predictions.filter(p => p.isCorrect === 'true').length;
    const wrong = predictions.filter(p => p.isCorrect === 'false').length;
    const notPredicted = predictions.filter(p => p.predictedWinner === '' || !p.predictedWinner).length;

    return {
      total,
      correct,
      wrong,
      notPredicted,
      accuracy: total > 0 ? ((correct / total) * 100).toFixed(2) : 0
    };
  }

  async getAllPredictorStats() {
    try {
      const predictors = await this.getPredictors();
      console.log('Fetched predictors:', predictors.length);
      
      if (!Array.isArray(predictors)) {
        console.error('getPredictors returned non-array:', predictors);
        return [];
      }
      
      const stats = [];

      for (const predictor of predictors) {
        try {
          const predictorStats = await this.getPredictorStats(predictor.id);
          stats.push({
            ...predictor,
            ...predictorStats
          });
        } catch (error) {
          console.error(`Error getting stats for predictor ${predictor.id}:`, error);
          // Add predictor with default stats
          stats.push({
            ...predictor,
            total: 0,
            correct: 0,
            wrong: 0,
            notPredicted: 0,
            accuracy: 0
          });
        }
      }

      console.log('Generated stats for predictors:', stats.length);
      const sortedStats = stats.sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));
      console.log('Sorted stats sample:', sortedStats.slice(0, 2));
      
      return sortedStats;
    } catch (error) {
      console.error('Error in getAllPredictorStats:', error);
      return [];
    }
  }
}

const googleSheetsService = new GoogleSheetsService();

async function initializeGoogleSheets() {
  await googleSheetsService.initialize();
}

module.exports = {
  googleSheetsService,
  initializeGoogleSheets
};
