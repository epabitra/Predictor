# Tournament Predictor

A full-stack web application for managing tournament predictions using React.js frontend, Node.js backend, and Google Sheets API as the database.

## Features

- **Tournament Management**: Create, edit, and delete tournaments
- **Match Management**: Add matches to tournaments with scheduling
- **Predictor System**: Manage predictors with parent-child relationships
- **Prediction Engine**: Automated prediction requests 1 hour before matches
- **Results Tracking**: Auto-update prediction correctness after match results
- **Dashboard**: Comprehensive statistics and leaderboards
- **Export**: CSV export functionality for data analysis

## Tech Stack

- **Frontend**: React.js 18, TailwindCSS, Chart.js
- **Backend**: Node.js 18.20.8, Express.js
- **Database**: Google Sheets API
- **Automation**: Node-cron for scheduled tasks

## Prerequisites

- Node.js v18.20.8 or higher
- npm or yarn
- Google Cloud Platform account
- Google Sheets API enabled

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm run setup
```

### 2. Google Sheets API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API

#### Step 2: Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "tournament-predictor")
4. Grant "Editor" role
5. Create and download the JSON key file

#### Step 3: Create Google Sheet
1. Create a new Google Sheet
2. Share it with the service account email (from JSON key)
3. Give "Editor" permissions
4. Copy the Sheet ID from the URL

#### Step 4: Configure Environment
1. Copy `.env.example` to `.env` in the backend folder
2. Add your Google Sheets credentials:
   ```
   GOOGLE_SHEETS_ID=your_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
   GOOGLE_PRIVATE_KEY=your_private_key_from_json
   ```

### 3. Run the Application

```bash
# Development mode (both frontend and backend)
npm run dev

# Or run separately:
npm run server    # Backend only
npm run client   # Frontend only
```

## Project Structure

```
tournament-predictor/
├── backend/                 # Node.js server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── services/           # Google Sheets service
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React.js application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main app component
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## Google Sheets Structure

The application uses 4 main sheets:

1. **predictors**: id, name, parentPredictorId, createdDate
2. **tournaments**: id, name, startDate, endDate
3. **matches**: id, tournamentId, teamA, teamB, matchTime, status, winner
4. **predictions**: id, matchId, predictorId, predictedWinner, predictionTime, isCorrect, resultStatus

## API Endpoints

### Predictors
- `GET /api/predictors` - Get all predictors
- `POST /api/predictors` - Create predictor
- `PUT /api/predictors/:id` - Update predictor
- `DELETE /api/predictors/:id` - Delete predictor
- `GET /api/predictors/:id/stats` - Get predictor statistics

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match
- `PUT /api/matches/:id/winner` - Set match winner

### Predictions
- `GET /api/predictions` - Get all predictions
- `POST /api/predictions` - Create prediction
- `GET /api/predictions/match/:matchId` - Get predictions for match
- `GET /api/predictions/predictor/:predictorId` - Get predictions for predictor

## Automation

The application includes a CRON job that runs every minute to:
- Check for matches starting within 1 hour
- Trigger prediction requests for all predictors
- Update prediction statuses after match completion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
