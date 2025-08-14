import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const LeaderboardPreview = () => {
  const { data: leaderboardResponse, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => dashboardAPI.getLeaderboard()
  });

  if (isLoading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">Error loading leaderboard</div>;

  // Extract the leaderboard data from the response
  const leaderboard = leaderboardResponse?.data || [];
  
  // Ensure leaderboard is an array before calling slice
  if (!Array.isArray(leaderboard)) {
    console.error('Leaderboard data is not an array:', leaderboard);
    return <div className="text-red-500">Invalid leaderboard data format</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Predictors</h3>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </div>
      
      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No leaderboard data available</p>
        ) : (
          leaderboard.slice(0, 5).map((predictor, index) => (
            <div key={predictor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{predictor.name}</div>
                  <div className="text-xs text-gray-500">
                    {predictor.total || 0} predictions
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">{predictor.accuracy}%</div>
                <div className="text-xs text-gray-500">
                  {predictor.correct || 0} correct
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {leaderboard.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View Full Leaderboard
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPreview;
