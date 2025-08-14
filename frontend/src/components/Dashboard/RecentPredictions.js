import React from 'react';
import { Clock, User, Target } from 'lucide-react';
import { formatDateTime, getResultStatusBadge } from '../../utils/helpers';

const RecentPredictions = ({ predictions = [] }) => {
  // Sort predictions by date (most recent first) and take first 5
  const recentPredictions = predictions
    .filter(p => p.predictionTime) // Only show predictions with timestamps
    .sort((a, b) => new Date(b.predictionTime) - new Date(a.predictionTime))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
        <Target className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {recentPredictions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent predictions</p>
        ) : (
          recentPredictions.map((prediction) => (
            <div key={prediction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {prediction.predictorName || `Predictor ${prediction.predictorId}`}
                  </span>
                  <span className="text-sm text-gray-600">
                    predicted {prediction.predictedWinner}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(prediction.predictionTime)}
                </div>
              </div>
              <div className="text-right">
                {getResultStatusBadge(prediction.resultStatus)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentPredictions;
