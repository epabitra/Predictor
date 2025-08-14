import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import { formatDateTime, getStatusBadge } from '../../utils/helpers';

const RecentMatches = ({ matches = [] }) => {
  // Sort matches by date (most recent first) and take first 5
  const recentMatches = matches
    .sort((a, b) => new Date(b.matchTime) - new Date(a.matchTime))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Matches</h3>
        <Trophy className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {recentMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent matches</p>
        ) : (
          recentMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {match.teamA} vs {match.teamB}
                  </span>
                  {getStatusBadge(match.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(match.matchTime)}
                </div>
              </div>
              {match.winner && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Winner</div>
                  <div className="text-sm font-medium text-green-600">{match.winner}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentMatches;
