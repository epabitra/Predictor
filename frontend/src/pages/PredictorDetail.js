import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Users, Trophy, Filter, ChevronUp, ChevronDown, CheckCircle, XCircle, Minus, TrendingUp } from 'lucide-react';
import { predictorsAPI, predictionsAPI, matchesAPI, tournamentsAPI } from '../services/api';
import { formatDateTime, getResultStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';

const PredictorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterResult, setFilterResult] = useState('all');
  const [filterTournament, setFilterTournament] = useState('all');

  const { data: predictor, isLoading: predictorLoading, error: predictorError } = useQuery({
    queryKey: ['predictor', id],
    queryFn: () => predictorsAPI.getById(id)
  });

  const { data: predictions = [], isLoading: predictionsLoading, error: predictionsError } = useQuery({
    queryKey: ['predictor-predictions', id],
    queryFn: () => predictionsAPI.getByPredictorId(id)
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: matchesAPI.getAll
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsAPI.getAll()
  });

  const isLoading = predictorLoading || predictionsLoading;
  const error = predictorError || predictionsError;

  const filteredPredictions = predictions.filter(prediction => {
    const match = matches.find(m => m.id === prediction.matchId);
    const tournament = tournaments.find(t => t.id === match?.tournamentId);
    
    const matchesResult = filterResult === 'all' || prediction.resultStatus === filterResult;
    const matchesTournament = filterTournament === 'all' || tournament?.id === filterTournament;
    
    return matchesResult && matchesTournament;
  });

  const stats = {
    total: predictions.length,
    correct: predictions.filter(p => p.resultStatus === 'Correct').length,
    wrong: predictions.filter(p => p.resultStatus === 'Wrong').length,
    notPredicted: predictions.filter(p => p.resultStatus === 'Not Predicted').length,
    accuracy: predictions.length > 0 ? 
      Math.round((predictions.filter(p => p.resultStatus === 'Correct').length / predictions.length) * 100) : 0
  };

  const currentStreak = (() => {
    let streak = 0;
    const sortedPredictions = [...predictions]
      .sort((a, b) => new Date(b.predictionTime) - new Date(a.predictionTime));
    
    for (const prediction of sortedPredictions) {
      if (prediction.resultStatus === 'Correct') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading predictor: {error.message}</div>;
  if (!predictor) return <div className="text-center p-4">Predictor not found</div>;

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
          <h1 className="text-3xl font-bold text-gray-900">{predictor.name}</h1>
          <p className="text-gray-600">Predictor Details</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Correct</p>
              <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wrong</p>
              <p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Not Predicted</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notPredicted}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Minus className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">{stats.accuracy}%</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Streak</h3>
            <p className="text-3xl font-bold text-orange-600">{currentStreak} correct predictions</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Results</option>
          <option value="Correct">Correct</option>
          <option value="Wrong">Wrong</option>
          <option value="Not Predicted">Not Predicted</option>
        </select>
        <select
          value={filterTournament}
          onChange={(e) => setFilterTournament(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Tournaments</option>
          {tournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Prediction History</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPredictions.map((prediction) => {
              const match = matches.find(m => m.id === prediction.matchId);
              const tournament = tournaments.find(t => t.id === match?.tournamentId);
              
              return (
                <tr key={prediction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {match ? `${displayValue(match.teamA)} vs ${displayValue(match.teamB)}` : '--'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {displayValue(tournament?.name)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {displayValue(prediction.predictedWinner)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {match ? displayFormattedValue(match.matchTime, formatDateTime) : '--'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResultStatusBadge(prediction.resultStatus)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPredictions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No predictions found with the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictorDetail;
