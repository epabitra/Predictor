import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Users, Trophy, Filter, ChevronUp, ChevronDown, CheckCircle, XCircle, Minus, TrendingUp } from 'lucide-react';
import { matchesAPI, predictionsAPI, predictorsAPI, tournamentsAPI } from '../services/api';
import { formatDateTime, getResultStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterResult, setFilterResult] = useState('all');

  const { data: match, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesAPI.getById(id)
  });

  const { data: predictions = [], isLoading: predictionsLoading, error: predictionsError } = useQuery({
    queryKey: ['match-predictions', id],
    queryFn: () => predictionsAPI.getByMatchId(id)
  });

  const { data: tournament } = useQuery({
    queryKey: ['tournament', match?.tournamentId],
    queryFn: () => match?.tournamentId ? tournamentsAPI.getById(match.tournamentId) : null,
    enabled: !!match?.tournamentId
  });

  const { data: predictors = [] } = useQuery({
    queryKey: ['predictors'],
    queryFn: () => import('../services/api').then(api => api.predictorsAPI.getAll())
  });

  const isLoading = matchLoading || predictionsLoading;
  const error = matchError || predictionsError;

  const filteredPredictions = predictions.filter(prediction => 
    filterResult === 'all' || prediction.resultStatus === filterResult
  );

  const stats = {
    totalPredictions: predictions.length,
    correctPredictions: predictions.filter(p => p.resultStatus === 'Correct').length,
    wrongPredictions: predictions.filter(p => p.resultStatus === 'Wrong').length,
    notPredicted: predictions.filter(p => p.resultStatus === 'Not Predicted').length,
    accuracy: predictions.length > 0 ? 
      Math.round((predictions.filter(p => p.resultStatus === 'Correct').length / predictions.length) * 100) : 0
  };

  const teamAPredictions = predictions.filter(p => p.predictedWinner === match?.teamA);
  const teamBPredictions = predictions.filter(p => p.predictedWinner === match?.teamB);

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading match: {error.message}</div>;
  if (!match) return <div className="text-center p-4">Match not found</div>;

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
          <h1 className="text-3xl font-bold text-gray-900">{match.teamA} vs {match.teamB}</h1>
          <p className="text-gray-600">Match Details</p>
        </div>
      </div>

      {/* Match Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tournament</p>
              <p className="text-lg font-semibold text-gray-900">{tournament?.name || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Match Time</p>
              <p className="text-lg font-semibold text-gray-900">{formatDateTime(match.matchTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {getResultStatusBadge(match.status)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Winner</p>
              <p className="text-lg font-semibold text-gray-900">
                {match.winner ? match.winner : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Correct</p>
              <p className="text-2xl font-bold text-green-600">{stats.correctPredictions}</p>
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
              <p className="text-2xl font-bold text-red-600">{stats.wrongPredictions}</p>
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

      {/* Team Prediction Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{match.teamA} Predictions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Predictions:</span>
              <span className="font-semibold">{teamAPredictions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Correct:</span>
              <span className="font-semibold text-green-600">
                {teamAPredictions.filter(p => p.resultStatus === 'Correct').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Wrong:</span>
              <span className="font-semibold text-red-600">
                {teamAPredictions.filter(p => p.resultStatus === 'Wrong').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{match.teamB} Predictions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Predictions:</span>
              <span className="font-semibold">{teamBPredictions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Correct:</span>
              <span className="font-semibold text-green-600">
                {teamBPredictions.filter(p => p.resultStatus === 'Correct').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Wrong:</span>
              <span className="font-semibold text-red-600">
                {teamBPredictions.filter(p => p.resultStatus === 'Wrong').length}
              </span>
            </div>
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
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Prediction Breakdown</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predictor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPredictions.map((prediction) => {
              const predictor = predictors.find(p => p.id === prediction.predictorId);
              
              return (
                <tr key={prediction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {predictor ? displayValue(predictor.name) : '--'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {displayValue(prediction.predictedWinner)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {displayFormattedValue(prediction.predictionTime, formatDateTime)}
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

export default MatchDetail;
