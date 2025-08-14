# Sample Data for Tournament Predictor

This guide provides sample data to help you populate your Google Sheets and test the application.

## 1. Predictors Sheet

| id | name | parentPredictorId | createdDate |
|----|------|-------------------|-------------|
| 1 | John Smith | | 2024-01-15T10:00:00.000Z |
| 2 | Sarah Johnson | | 2024-01-15T10:30:00.000Z |
| 3 | Mike Davis | 1 | 2024-01-15T11:00:00.000Z |
| 4 | Lisa Wilson | 2 | 2024-01-15T11:30:00.000Z |
| 5 | Alex Brown | | 2024-01-15T12:00:00.000Z |

## 2. Tournaments Sheet

| id | name | startDate | endDate |
|----|------|-----------|---------|
| 1 | Premier League 2024 | 2024-02-01T00:00:00.000Z | 2024-05-31T23:59:59.000Z |
| 2 | Champions League 2024 | 2024-03-01T00:00:00.000Z | 2024-06-30T23:59:59.000Z |
| 3 | World Cup Qualifiers | 2024-04-01T00:00:00.000Z | 2024-07-31T23:59:59.000Z |

## 3. Matches Sheet

| id | tournamentId | teamA | teamB | matchTime | status | winner |
|----|--------------|-------|-------|-----------|--------|--------|
| 1 | 1 | Manchester United | Liverpool | 2024-02-15T20:00:00.000Z | scheduled | |
| 2 | 1 | Arsenal | Chelsea | 2024-02-16T15:00:00.000Z | scheduled | |
| 3 | 2 | Real Madrid | Barcelona | 2024-03-15T21:00:00.000Z | scheduled | |
| 4 | 1 | Manchester City | Tottenham | 2024-02-10T17:00:00.000Z | completed | Manchester City |
| 5 | 1 | Everton | Aston Villa | 2024-02-12T19:00:00.000Z | completed | Aston Villa |

## 4. Predictions Sheet

| id | matchId | predictorId | predictedWinner | predictionTime | isCorrect | resultStatus |
|----|---------|-------------|-----------------|----------------|-----------|--------------|
| 1 | 4 | 1 | Manchester City | 2024-02-09T14:00:00.000Z | true | ✅ Correct |
| 2 | 4 | 2 | Manchester City | 2024-02-09T14:30:00.000Z | true | ✅ Correct |
| 3 | 4 | 3 | Tottenham | 2024-02-09T15:00:00.000Z | false | ❌ Wrong |
| 4 | 4 | 4 | Manchester City | 2024-02-09T15:30:00.000Z | true | ✅ Correct |
| 5 | 4 | 5 | | | | ⏳ Not Predicted |
| 6 | 5 | 1 | Aston Villa | 2024-02-11T16:00:00.000Z | true | ✅ Correct |
| 7 | 5 | 2 | Everton | 2024-02-11T16:30:00.000Z | false | ❌ Wrong |
| 8 | 5 | 3 | Aston Villa | 2024-02-11T17:00:00.000Z | true | ✅ Correct |
| 9 | 5 | 4 | | | | ⏳ Not Predicted |
| 10 | 5 | 5 | Aston Villa | 2024-02-11T17:30:00.000Z | true | ✅ Correct |

## How to Use This Sample Data

1. **Copy the data** from each table above
2. **Paste it into your Google Sheets** in the corresponding sheets
3. **Make sure the headers are in the first row** (A1, B1, C1, etc.)
4. **Start with row 2** for the actual data

## Testing Scenarios

### Scenario 1: Upcoming Match Predictions
- Match ID 1 (Manchester United vs Liverpool) is scheduled for 2024-02-15
- The system will automatically create prediction placeholders 1 hour before
- Predictors can submit their predictions until 1 hour before the match

### Scenario 2: Completed Match Results
- Match ID 4 (Manchester City vs Tottenham) is completed
- Winner is set to "Manchester City"
- All predictions are automatically updated with correct/incorrect status

### Scenario 3: Parent-Child Predictors
- Mike Davis (ID 3) has John Smith (ID 1) as parent
- Lisa Wilson (ID 4) has Sarah Johnson (ID 2) as parent
- This creates a hierarchy for tracking prediction patterns

## Customizing the Sample Data

Feel free to modify this data to match your needs:

- **Change team names** to your preferred teams
- **Adjust dates** to future dates for testing
- **Add more predictors** to test scalability
- **Create more tournaments** for variety

## Notes

- **IDs must be unique** within each sheet
- **Dates should be in ISO format** (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Status values** for matches: `scheduled`, `in_progress`, `completed`, `cancelled`
- **Result status** for predictions: `✅ Correct`, `❌ Wrong`, `⏳ Not Predicted`, `⏳ Pending`

## Next Steps

After populating your sheets:

1. **Test the backend** by running `npm run server`
2. **Test the frontend** by running `npm run client`
3. **Verify data loading** in the dashboard
4. **Test CRUD operations** for each entity
5. **Test the prediction workflow** with upcoming matches

Happy testing! 🎯
