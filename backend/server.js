const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const predictorRoutes = require('./routes/predictors');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');
const predictionRoutes = require('./routes/predictions');
const dashboardRoutes = require('./routes/dashboard');

const { initializeGoogleSheets } = require('./services/googleSheetsService');
const { checkUpcomingMatches, checkMissingPredictions } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Tournament Predictor Backend is running'
  });
});

// API Routes
app.use('/api/predictors', predictorRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize Google Sheets service
let isInitialized = false;

async function startServer() {
  try {
    await initializeGoogleSheets();
    isInitialized = true;
    console.log('✅ Google Sheets service initialized successfully');
    
    // Start CRON job for checking upcoming matches
    cron.schedule('* * * * *', async () => {
      if (isInitialized) {
        try {
          await checkUpcomingMatches();
        } catch (error) {
          console.error('CRON job error:', error);
        }
      }
    });
    console.log('✅ CRON job started - checking matches every minute');
    
    // Start CRON job for checking missing predictions (every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
      if (isInitialized) {
        try {
          await checkMissingPredictions();
        } catch (error) {
          console.error('CRON job error:', error);
        }
      }
    });
    console.log('✅ CRON job started - checking missing predictions every 30 minutes');
    
    app.listen(PORT, () => {
      console.log(`🚀 Tournament Predictor Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
