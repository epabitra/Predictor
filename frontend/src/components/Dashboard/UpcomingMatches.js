import React from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { formatDateTime, getStatusBadge } from '../../utils/helpers';

const UpcomingMatches = ({ matches = [] }) => {
  // Filter upcoming matches (not completed, within next 7 days) and take first 5
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingMatches = matches
    .filter(match => {
      if (match.status === 'completed') return false;
      const matchTime = new Date(match.matchTime);
      return matchTime > now && matchTime <= sevenDaysFromNow;
    })
    .sort((a, b) => new Date(a.matchTime) - new Date(b.matchTime))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
        <Calendar className="h-5 w-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        {upcomingMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No upcoming matches</p>
        ) : (
          upcomingMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {match.teamA} vs {match.teamB}
                  </span>
                  {getStatusBadge(match.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(match.matchTime)}
                </div>
              </div>
              <div className="text-right">
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingMatches;
