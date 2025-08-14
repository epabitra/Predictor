# Empty Value Handling Implementation

## Overview
Implemented consistent empty value handling across all tables in the application to display `--` for null, undefined, or empty string values, improving data presentation and user experience.

## Utility Functions Added

### `displayValue(value, fallback = '--')`
- **Purpose**: Display fallback text for empty values
- **Parameters**: 
  - `value`: The value to check
  - `fallback`: Custom fallback text (defaults to '--')
- **Returns**: The original value or fallback text
- **Usage**: For simple text values that don't need formatting

### `displayFormattedValue(value, formatter, fallback = '--')`
- **Purpose**: Display formatted values or fallback for empty values
- **Parameters**:
  - `value`: The value to check
  - `formatter`: Optional formatter function (e.g., `formatDateTime`, `formatDate`)
  - `fallback`: Custom fallback text (defaults to '--')
- **Returns**: The formatted value or fallback text
- **Usage**: For values that need formatting (dates, times, etc.)

## Tables Updated

### 1. **Predictions Table** (`frontend/src/pages/Predictions.js`)
- **Match Teams**: `{displayValue(match.teamA)} vs {displayValue(match.teamB)}`
- **Match Time**: `{displayFormattedValue(match.matchTime, formatDateTime)}`
- **Tournament**: `{displayValue(tournaments.find(t => t.id === match.tournamentId)?.name)}`
- **Predictor Name**: `{displayValue(predictor?.name)}`
- **Predicted Winner**: `{displayValue(prediction.predictedWinner)}`
- **Prediction Time**: `{displayFormattedValue(prediction.predictionTime, formatDateTime)}`

### 2. **Predictors Table** (`frontend/src/pages/Predictors.js`)
- **Name**: `{displayValue(predictor.name)}`
- **Parent**: `{displayValue(parentPredictors.find(p => p.id === predictor.parentPredictorId)?.name)}`
- **Created Date**: `{displayFormattedValue(predictor.createdDate, formatDate)}`

### 3. **Matches Table** (`frontend/src/pages/Matches.js`)
- **Teams**: `{displayValue(match.teamA)} vs {displayValue(match.teamB)}`
- **Tournament**: `{displayValue(tournaments.find(t => t.id === match.tournamentId)?.name)}`
- **Match Time**: `{displayFormattedValue(match.matchTime, formatDateTime)}`
- **Winner**: `{displayValue(match.winner)}` (shows '--' if not set)

### 4. **Tournaments Table** (`frontend/src/pages/Tournaments.js`)
- **Name**: `{displayValue(tournament.name)}`
- **Start Date**: `{displayFormattedValue(tournament.startDate, formatDate)}`
- **End Date**: `{displayFormattedValue(tournament.endDate, formatDate)}`

### 5. **Leaderboard Table** (`frontend/src/pages/Leaderboard.js`)
- **Name**: `{displayValue(predictor.name)}`
- **Total**: `{displayValue(predictor.total, '0')}`
- **Correct**: `{displayValue(predictor.correct, '0')}`
- **Wrong**: `{displayValue(predictor.wrong, '0')}`
- **Accuracy**: `{displayValue(predictor.accuracy, '0')}%`
- **Not Predicted**: `{displayValue(predictor.notPredicted, '0')}`

### 6. **Analytics Table** (`frontend/src/pages/Analytics.js`)
- **Name**: `{displayValue(predictor.name)}`
- **Total**: `{displayValue(predictor.total, '0')}`
- **Correct**: `{displayValue(predictor.correct, '0')}`
- **Accuracy**: `{displayValue(predictor.accuracy, '0')}%`

### 7. **Match Detail Table** (`frontend/src/pages/MatchDetail.js`)
- **Predictor Name**: `{displayValue(predictor?.name)}`
- **Predicted Winner**: `{displayValue(prediction.predictedWinner)}`
- **Prediction Time**: `{displayFormattedValue(prediction.predictionTime, formatDateTime)}`

### 8. **Predictor Detail Table** (`frontend/src/pages/PredictorDetail.js`)
- **Match**: `{displayValue(match.teamA)} vs {displayValue(match.teamB)}`
- **Tournament**: `{displayValue(tournament?.name)}`
- **Predicted Winner**: `{displayValue(prediction.predictedWinner)}`
- **Match Time**: `{displayFormattedValue(match.matchTime, formatDateTime)}`

### 9. **Tournament Detail Table** (`frontend/src/pages/TournamentDetail.js`)
- **Teams**: `{displayValue(match.teamA)} vs {displayValue(match.teamB)}`
- **Match Time**: `{displayFormattedValue(match.matchTime, formatDateTime)}`
- **Winner**: `{displayValue(match.winner, 'Not set')}`
- **Predictions**: Shows '--' if no predictions exist

### 10. **Match Reminders Table** (`frontend/src/pages/MatchReminders.js`)
- **Teams**: `{displayValue(match.teamA)} vs {displayValue(match.teamB)}`
- **Tournament**: `{displayValue(match.tournament, '--')}`
- **Match Time**: `{displayFormattedValue(match.matchTime, formatDateTime)}`

## Benefits

1. **Consistent Data Presentation**: All tables now show `--` for missing data instead of various fallback texts
2. **Better User Experience**: Users can quickly identify missing information
3. **Professional Appearance**: Clean, uniform display across all tables
4. **Maintainable Code**: Centralized logic for handling empty values
5. **Flexible Fallbacks**: Custom fallback text can be specified when needed
6. **Error Prevention**: Prevents display of "undefined" or "null" text

## Implementation Details

- **Helper Functions**: Added to `frontend/src/utils/helpers.js`
- **Import Updates**: All table pages now import the helper functions
- **Fallback Text**: Default fallback is `--` but can be customized per field
- **Formatting Support**: Dates and times are properly formatted when available
- **Null Safety**: Handles `null`, `undefined`, and empty string values

## Testing Recommendations

1. **Empty Data Scenarios**: Test tables with missing data to ensure `--` displays correctly
2. **Formatting**: Verify that dates and times format properly when data exists
3. **Custom Fallbacks**: Test custom fallback text for specific fields
4. **Edge Cases**: Test with various data types and edge cases
5. **Consistency**: Verify that all tables display empty values consistently

