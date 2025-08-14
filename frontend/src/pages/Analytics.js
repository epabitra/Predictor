import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Trophy, Users, Target, Filter, ChevronUp, ChevronDown, Download, Gamepad2, BarChart3 } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDate, formatDateTime, displayValue } from '../utils/helpers';

const Analytics = () => {
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Fetch analytics data
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats
  });

  const { data: leaderboardResponse, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard-analytics'],
    queryFn: () => dashboardAPI.getLeaderboard({ limit: 50 })
  });

  const { data: trendsResponse, isLoading: trendsLoading } = useQuery({
    queryKey: ['prediction-trends', dateRange],
    queryFn: () => dashboardAPI.getPredictionTrends({ days: dateRange })
  });

  const { data: tournamentComparisonResponse, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament-comparison'],
    queryFn: dashboardAPI.getTournamentComparison
  });

  // Extract data from responses
  const stats = statsResponse?.data?.stats || {};
  const leaderboard = leaderboardResponse?.data || [];
  const trends = trendsResponse?.data || [];
  const tournamentComparison = tournamentComparisonResponse?.data || [];

  const isLoading = statsLoading || leaderboardLoading || trendsLoading || tournamentLoading;

  const handleExport = async (type) => {
    try {
      const response = await dashboardAPI.exportData({ type });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`${type} data exported successfully`);
    } catch (error) {
      showError(`Failed to export ${type} data: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('leaderboard')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export Leaderboard
          </button>
          <button
            onClick={() => handleExport('predictions')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export Predictions
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Predictors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPredictors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTournaments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gamepad2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prediction Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Prediction Trends ({dateRange} days)
          </h3>
          <div className="space-y-3">
            {trends.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No trend data available</p>
            ) : (
              trends.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{day.date}</div>
                    <div className="text-xs text-gray-500">{day.total} predictions</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{day.accuracy}%</div>
                    <div className="text-xs text-gray-500">
                      {day.correct} correct, {day.wrong} wrong
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tournament Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Tournament Performance
          </h3>
          <div className="space-y-3">
            {tournamentComparison.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tournament data available</p>
            ) : (
              tournamentComparison.map((tournament, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                    <div className="text-xs text-gray-500">
                      {tournament.stats?.totalMatches || 0} matches
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {tournament.stats?.accuracy || 0}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {tournament.stats?.correctPredictions || 0} correct
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
          Top Performers
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predictor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.slice(0, 10).map((predictor, index) => (
                <tr key={predictor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{displayValue(predictor.name)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{displayValue(predictor.total, '0')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{displayValue(predictor.correct, '0')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">{displayValue(predictor.accuracy, '0')}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
