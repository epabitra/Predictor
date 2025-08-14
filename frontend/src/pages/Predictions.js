import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { predictionsAPI, matchesAPI, predictorsAPI, tournamentsAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDateTime, getResultStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';
import ResponsiveTable from '../components/ResponsiveTable';

const Predictions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedPredictorId, setSelectedPredictorId] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [filterMatch, setFilterMatch] = useState('all');
  const [filterPredictor, setFilterPredictor] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [filterTournament, setFilterTournament] = useState('all');
  const [sortField, setSortField] = useState('predictionTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const queryClient = useQueryClient();

  const { data: predictionsResponse = [], isLoading, error } = useQuery({
    queryKey: ['predictions'],
    queryFn: predictionsAPI.getAll
  });

  const { data: matchesResponse = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: matchesAPI.getAll
  });

  const { data: predictorsResponse = [] } = useQuery({
    queryKey: ['predictors'],
    queryFn: predictorsAPI.getAll
  });

  const { data: tournamentsResponse = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsAPI.getAll
  });

  // Extract the data from the responses
  const predictions = predictionsResponse?.data || [];
  const matches = matchesResponse?.data || [];
  const predictors = predictorsResponse?.data || [];
  const tournaments = tournamentsResponse?.data || [];

  // Ensure data is arrays before calling filter
  if (!Array.isArray(predictions)) {
    console.error('Predictions data is not an array:', predictions);
    console.error('Full response:', predictionsResponse);
  }

  if (!Array.isArray(matches)) {
    console.error('Matches data is not an array:', matches);
    console.error('Full response:', matchesResponse);
  }

  if (!Array.isArray(predictors)) {
    console.error('Predictors data is not an array:', predictors);
    console.error('Full response:', predictorsResponse);
  }

  const createMutation = useMutation({
    mutationFn: predictionsAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictions']);
      setShowModal(false);
      showSuccess(response?.message || 'Prediction created successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to create prediction');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, predictedWinner }) => predictionsAPI.update(id, { predictedWinner }),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictions']);
      setShowModal(false);
      setEditingPrediction(null);
      showSuccess(response?.message || 'Prediction updated successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to update prediction');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: predictionsAPI.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictions']);
      showSuccess(response?.message || 'Prediction deleted successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to delete prediction');
    }
  });

  const filteredPredictions = Array.isArray(predictions) ? predictions.filter(prediction => {
    const match = matches.find(m => m.id === prediction.matchId);
    const predictor = predictors.find(p => p.id === prediction.predictorId);
    
    const matchesSearch = 
      (match && (match.teamA.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 match.teamB.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (predictor && predictor.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMatch = filterMatch === 'all' || prediction.matchId === filterMatch;
    const matchesPredictor = filterPredictor === 'all' || prediction.predictorId === filterPredictor;
    const matchesResult = filterResult === 'all' || prediction.resultStatus === filterResult;
    const matchesTournament = filterTournament === 'all' || (match && match.tournamentId === filterTournament);
    
    return matchesSearch && matchesMatch && matchesPredictor && matchesResult && matchesTournament;
  }) : [];

  // Sort predictions
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'predictionTime':
        aValue = new Date(a.predictionTime || 0);
        bValue = new Date(b.predictionTime || 0);
        break;
      case 'matchTime':
        const matchA = matches.find(m => m.id === a.matchId);
        const matchB = matches.find(m => m.id === b.matchId);
        aValue = matchA ? new Date(matchA.matchTime || 0) : new Date(0);
        bValue = matchB ? new Date(matchB.matchTime || 0) : new Date(0);
        break;
      case 'predictor':
        const predictorA = predictors.find(p => p.id === a.predictorId);
        const predictorB = predictors.find(p => p.id === b.predictorId);
        aValue = predictorA ? predictorA.name.toLowerCase() : '';
        bValue = predictorB ? predictorB.name.toLowerCase() : '';
        break;
      case 'match':
        const matchA2 = matches.find(m => m.id === a.matchId);
        const matchB2 = matches.find(m => m.id === b.matchId);
        aValue = matchA2 ? `${matchA2.teamA} vs ${matchA2.teamB}`.toLowerCase() : '';
        bValue = matchB2 ? `${matchB2.teamA} vs ${matchB2.teamB}`.toLowerCase() : '';
        break;
      case 'result':
        aValue = a.resultStatus || '';
        bValue = b.resultStatus || '';
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedPredictions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPredictions = sortedPredictions.slice(startIndex, startIndex + pageSize);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingPrediction) {
      // For editing, only send predictedWinner (backend only accepts this)
      if (!editingPrediction.predictedWinner) {
        alert('Please select a predicted winner');
        return;
      }
      
      const data = {
        predictedWinner: editingPrediction.predictedWinner
      };
      console.log('Editing prediction with data:', { id: editingPrediction.id, ...data });
      updateMutation.mutate({ id: editingPrediction.id, predictedWinner: editingPrediction.predictedWinner });
    } else {
      // For new predictions, use the state values
      if (!selectedMatchId || !selectedPredictorId || !selectedWinner) {
        alert('Please fill in all fields');
        return;
      }
      
      const data = {
        matchId: selectedMatchId,
        predictorId: selectedPredictorId,
        predictedWinner: selectedWinner
      };
      console.log('Creating new prediction with data:', data);
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prediction) => {
    setEditingPrediction(prediction);
    setSelectedMatchId(prediction.matchId);
    setSelectedPredictorId(prediction.predictorId);
    setSelectedWinner(prediction.predictedWinner);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this prediction?')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingPrediction(null);
    setSelectedMatchId('');
    setSelectedPredictorId('');
    setSelectedWinner('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPrediction(null);
    setSelectedMatchId('');
    setSelectedPredictorId('');
    setSelectedWinner('');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (field, value) => {
    if (field === 'tournament') {
      setFilterTournament(value);
    } else if (field === 'search') {
      setSearchTerm(value);
    } else if (field === 'match') {
      setFilterMatch(value);
    } else if (field === 'predictor') {
      setFilterPredictor(value);
    } else if (field === 'result') {
      setFilterResult(value);
    }
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'match',
      header: 'Match',
      render: (prediction) => {
        const match = matches.find(m => m.id === prediction.matchId);
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {match ? `${displayValue(match.teamA)} vs ${displayValue(match.teamB)}` : '--'}
            </div>
            {match && (
              <div className="text-xs text-gray-500">
                {displayFormattedValue(match.matchTime, formatDateTime)}
              </div>
            )}
            {match && (
              <div className="text-xs text-blue-600">
                {displayValue(tournaments.find(t => t.id === match.tournamentId)?.name)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'predictor',
      header: 'Predictor',
      render: (prediction) => {
        const predictor = predictors.find(p => p.id === prediction.predictorId);
        return (
          <div className="text-sm text-gray-900">
            {displayValue(predictor?.name)}
          </div>
        );
      }
    },
    {
      key: 'prediction',
      header: 'Prediction',
      render: (prediction) => (
        <div className="text-sm font-medium text-gray-900">
          {displayValue(prediction.predictedWinner)}
        </div>
      )
    },
    {
      key: 'predictionTime',
      header: 'Prediction Time',
      render: (prediction) => (
        <div className="text-sm text-gray-500">
          {displayFormattedValue(prediction.predictionTime, formatDateTime)}
        </div>
      )
    },
    {
      key: 'result',
      header: 'Result',
      render: (prediction) => getResultStatusBadge(prediction.resultStatus)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (prediction) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(prediction);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(prediction.id);
            }}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Essential columns for mobile view
  const essentialColumns = [
    columns[0], // Match
    columns[2], // Prediction
    columns[4]  // Result
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading predictions: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Predictions</h1>
        <button
          onClick={openModal}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Prediction
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterMatch}
          onChange={(e) => handleFilterChange('match', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Matches</option>
          {matches.map(match => (
            <option key={match.id} value={match.id}>
              {match.teamA} vs {match.teamB}
            </option>
          ))}
        </select>
        <select
          value={filterPredictor}
          onChange={(e) => handleFilterChange('predictor', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Predictors</option>
          {predictors.map(predictor => (
            <option key={predictor.id} value={predictor.id}>
              {predictor.name}
            </option>
          ))}
        </select>
        <select
          value={filterResult}
          onChange={(e) => handleFilterChange('result', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Results</option>
          <option value="Correct">Correct</option>
          <option value="Wrong">Wrong</option>
          <option value="Not Predicted">Not Predicted</option>
        </select>
        <select
          value={filterTournament}
          onChange={(e) => handleFilterChange('tournament', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Tournaments</option>
          {tournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Results Info */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Showing:</span> {startIndex + 1}-{Math.min(startIndex + pageSize, sortedPredictions.length)} of {sortedPredictions.length} predictions
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Sorting by:</span> {sortField === 'predictionTime' ? 'Prediction Time' : 
                                                             sortField === 'matchTime' ? 'Match Time' : 
                                                             sortField === 'predictor' ? 'Predictor' : 
                                                             sortField === 'match' ? 'Match' : 
                                                             sortField === 'result' ? 'Result' : 'Unknown'} 
            ({sortDirection === 'desc' ? 'Newest First' : 'Oldest First'})
          </div>
          <button
            onClick={() => {
              setSortField('predictionTime');
              setSortDirection('desc');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Reset to Default (Prediction Time ↓)
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={paginatedPredictions}
        essentialColumns={essentialColumns}
        sortable={true}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        className="mb-6"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              if (totalPages <= 5 || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white border border-primary-700 shadow-md'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPrediction ? 'Edit Prediction' : 'Add Prediction'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Match</label>
                <select
                  name="matchId"
                  value={editingPrediction?.matchId || selectedMatchId}
                  onChange={(e) => {
                    if (editingPrediction) {
                      const newMatchId = e.target.value;
                      const newMatch = matches.find(m => m.id === newMatchId);
                      
                      // If changing match, reset the predicted winner if it's not valid for the new match
                      let newPredictedWinner = editingPrediction.predictedWinner;
                      if (newMatch && editingPrediction.predictedWinner) {
                        if (editingPrediction.predictedWinner !== newMatch.teamA && 
                            editingPrediction.predictedWinner !== newMatch.teamB) {
                          newPredictedWinner = '';
                        }
                      }
                      
                      setEditingPrediction({ 
                        ...editingPrediction, 
                        matchId: newMatchId,
                        predictedWinner: newPredictedWinner
                      });
                    } else {
                      setSelectedMatchId(e.target.value);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Match</option>
                  {matches.map(match => (
                    <option key={match.id} value={match.id}>
                      {match.teamA} vs {match.teamB} - {formatDateTime(match.matchTime)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Predictor</label>
                <select
                  name="predictorId"
                  value={editingPrediction?.predictorId || selectedPredictorId}
                  onChange={(e) => {
                    if (editingPrediction) {
                      setEditingPrediction({ ...editingPrediction, predictorId: e.target.value });
                    } else {
                      setSelectedPredictorId(e.target.value);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Predictor</option>
                  {predictors.map(predictor => (
                    <option key={predictor.id} value={predictor.id}>
                      {predictor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Predicted Winner</label>
                <select
                  name="predictedWinner"
                  value={editingPrediction?.predictedWinner || selectedWinner}
                  onChange={(e) => {
                    if (editingPrediction) {
                      setEditingPrediction({ ...editingPrediction, predictedWinner: e.target.value });
                    } else {
                      setSelectedWinner(e.target.value);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Winner</option>
                  {(() => {
                    const currentMatchId = editingPrediction?.matchId || selectedMatchId;
                    if (currentMatchId) {
                      const match = matches.find(m => m.id === currentMatchId);
                      if (match) {
                        return [
                          <option key="teamA" value={match.teamA}>{match.teamA}</option>,
                          <option key="teamB" value={match.teamB}>{match.teamB}</option>
                        ];
                      }
                    }
                    return [];
                  })()}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
