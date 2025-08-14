import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Users, Trophy, Filter, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { tournamentsAPI, matchesAPI, predictionsAPI } from '../services/api';
import { formatDateTime, getStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsAPI.getById(id)
  });

  const { data: matches = [], isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => matchesAPI.getByTournamentId(id)
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => import('../services/api').then(api => api.predictionsAPI.getAll())
  });

  const isLoading = tournamentLoading || matchesLoading;
  const error = tournamentError || matchesError;

  const filteredMatches = matches.filter(match => 
    filterStatus === 'all' || match.status === filterStatus
  );

  const stats = {
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
    liveMatches: matches.filter(m => m.status === 'live').length,
    upcomingMatches: matches.filter(m => m.status === 'scheduled').length,
    totalPredictions: predictions.filter(p => 
      matches.some(m => m.id === p.matchId)
    ).length
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', className: 'badge-warning' },
      live: { label: 'Live', className: 'badge-success' },
      completed: { label: 'Completed', className: 'badge-secondary' },
      cancelled: { label: 'Cancelled', className: 'badge-danger' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'badge-secondary' };
    return <span className={config.className}>{config.label}</span>;
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading tournament: {error.message}</div>;
  if (!tournament) return <div className="text-center p-4">Tournament not found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
          <p className="text-gray-600">Tournament Details</p>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDateTime(tournament.startDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">End Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDateTime(tournament.endDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {(() => {
                  const now = new Date();
                  const startDate = new Date(tournament.startDate);
                  const endDate = new Date(tournament.endDate);
                  
                  if (now < startDate) return 'Upcoming';
                  if (now >= startDate && now <= endDate) return 'Active';
                  return 'Completed';
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedMatches}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live</p>
              <p className="text-2xl font-bold text-orange-600">{stats.liveMatches}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcomingMatches}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tournament Matches</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predictions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMatches.map((match) => {
              const matchPredictions = predictions.filter(p => p.matchId === match.id);
              const correctPredictions = matchPredictions.filter(p => p.resultStatus === 'Correct').length;
              const totalPredictions = matchPredictions.length;
              
              return (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {displayValue(match.teamA)} vs {displayValue(match.teamB)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{displayFormattedValue(match.matchTime, formatDateTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(match.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {displayValue(match.winner, 'Not set')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {totalPredictions > 0 ? (
                        <span>
                          {correctPredictions}/{totalPredictions} correct
                          <span className="text-xs text-gray-400 ml-2">
                            ({Math.round((correctPredictions / totalPredictions) * 100)}%)
                          </span>
                        </span>
                      ) : (
                        '--'
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredMatches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No matches found with the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
