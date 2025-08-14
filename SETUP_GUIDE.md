# Tournament Predictor - Complete Setup Guide

This guide will walk you through setting up the Tournament Predictor application step by step.

## Prerequisites

- **Node.js v18.20.8 or higher** - [Download here](https://nodejs.org/)
- **npm or yarn** (comes with Node.js)
- **Google Cloud Platform account** - [Sign up here](https://console.cloud.google.com/)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## Step 1: Clone and Setup

### Option A: Automated Setup (Recommended)
```bash
# Run the setup script (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Or on Windows
setup.bat
```

### Option B: Manual Setup
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Step 2: Google Sheets API Setup

### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `tournament-predictor`
4. Click "Create"

### 2.2 Enable Google Sheets API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### 2.3 Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. **Service account name**: `tournament-predictor-api`
4. **Service account description**: `API service account for Tournament Predictor`
5. Click "Create and Continue"
6. **Role**: Select "Editor" (or "Viewer" if you want read-only access)
7. Click "Continue" → "Done"

### 2.4 Generate Service Account Key
1. Click on your service account email
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - this downloads your key file
6. **Keep this file secure!** It contains sensitive credentials

### 2.5 Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new blank spreadsheet
3. **Rename it** to "Tournament Predictor Database"
4. **Copy the Sheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the `1GnH9Ik7eacls0iJr_Vn3pR54Aqg03_yPFr5zh1neM5Q` part

### 2.6 Share Sheet with Service Account
1. In your Google Sheet, click "Share" (top right)
2. **Add people and groups**: paste your service account email
3. **Role**: Editor
4. **Uncheck** "Notify people"
5. Click "Share"

## Step 3: Configure Environment Variables

### 3.1 Create Environment File
```bash
# Copy the example file
cp backend/env.example backend/.env
```

### 3.2 Edit Environment File
Open `backend/.env` and fill in your credentials:

```env
# Google Sheets API Configuration
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3.3 Get Your Credentials
1. **Sheet ID**: From Step 2.5
2. **Service Account Email**: From your service account (ends with `@project.iam.gserviceaccount.com`)
3. **Private Key**: Open your downloaded JSON key file and copy the `private_key` value

## Step 4: Populate Sample Data
Yes, you need to create the sheets yourself in your Google Spreadsheet.

**How to create sheets and what names to use:**

1. Open your Google Spreadsheet ("Tournament Predictor Database").
2. At the bottom, you'll see tabs for each sheet (by default, one called "Sheet1").
3. Rename "Sheet1" to `predictors` (right-click the tab → "Rename").
4. Add new sheets for the others:
   - Click the "+" button (bottom left) to add a new sheet.
   - Rename each new sheet as follows:
     - `tournaments`
     - `matches`
     - `predictions`
5. You should have **four sheets** in total, named exactly:
   - `predictors`
   - `tournaments`
   - `matches`
   - `predictions`

**Tip:** Sheet names are case-sensitive and must match exactly as above for the application to work properly.

### 4.1 Use the Sample Data Guide
1. Open `sample-data.md`
2. Copy the data from each table
3. Paste into your Google Sheets in the corresponding sheets
4. Make sure headers are in row 1, data starts in row 2

### 4.2 Verify Sheet Structure
Your Google Sheet should have 4 sheets:
- **predictors** - with columns: id, name, parentPredictorId, createdDate
- **tournaments** - with columns: id, name, startDate, endDate
- **matches** - with columns: id, tournamentId, teamA, teamB, matchTime, status, winner
- **predictions** - with columns: id, matchId, predictorId, predictedWinner, predictionTime, isCorrect, resultStatus

## Step 5: Test the Application

### 5.1 Start Backend
```bash
# Terminal 1
npm run server

# You should see:
# ✅ Google Sheets service initialized successfully
# ✅ CRON job started - checking matches every minute
# 🚀 Tournament Predictor Backend running on port 5000
```

### 5.2 Start Frontend
```bash
# Terminal 2
npm run client

# This will open http://localhost:3000 in your browser
```

### 5.3 Verify Everything Works
1. **Dashboard loads** with statistics
2. **No console errors** in browser
3. **Backend health check**: Visit `http://localhost:5000/health`
4. **Data appears** in the dashboard

## Step 6: Test Core Functionality

### 6.1 Create a Tournament
1. Go to Tournaments page
2. Click "Add Tournament"
3. Fill in details and save
4. Verify it appears in the list

### 6.2 Add a Match
1. Go to Matches page
2. Click "Add Match"
3. Select tournament, enter teams and time
4. Save and verify

### 6.3 Test Predictions
1. Go to Predictions page
2. Create a prediction for a match
3. Verify it appears in the list

## Troubleshooting

### Common Issues

#### 1. "Google Sheets service initialization failed"
- Check your `.env` file has correct credentials
- Verify service account has Editor access to the sheet
- Check the sheet ID is correct

#### 2. "CORS error" in browser
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check backend is running on port 5000

#### 3. "Module not found" errors
- Run `npm install` in all directories (root, backend, frontend)
- Check Node.js version is 18.20.8+

#### 4. "Port already in use"
- Change `PORT` in `.env` to another number (e.g., 5001)
- Update `FRONTEND_URL` accordingly

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run server
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Use PM2 for Backend
```bash
npm install -g pm2
pm2 start backend/server.js --name "tournament-predictor"
pm2 startup
pm2 save
```

## Security Considerations

1. **Never commit** your `.env` file to version control
2. **Rotate service account keys** regularly
3. **Limit service account permissions** to only what's needed
4. **Use HTTPS** in production
5. **Implement authentication** for production use

## Support

If you encounter issues:

1. **Check the logs** in your terminal
2. **Verify Google Sheets API** is enabled
3. **Check service account permissions**
4. **Review the README.md** for additional details
5. **Check sample-data.md** for data format examples

## Next Steps

After successful setup:

1. **Customize the data** for your tournaments
2. **Add more predictors** and matches
3. **Test the CRON automation** with upcoming matches
4. **Explore the dashboard** and analytics features
5. **Export data** to CSV for analysis

---

🎯 **Happy Tournament Predicting!** 🎯

Your application is now ready to manage tournament predictions with automated workflows and comprehensive analytics.
