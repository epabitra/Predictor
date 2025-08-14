import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Search, Filter, ChevronUp, ChevronDown, Trophy, Users, Calendar, Clock } from 'lucide-react';
import { matchesAPI, tournamentsAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDateTime, getStatusBadge, getResultBadge, displayValue, displayFormattedValue } from '../utils/helpers';
import ResponsiveTable from '../components/ResponsiveTable';

const Matches = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [filterTournament, setFilterTournament] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('matchTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const queryClient = useQueryClient();

  const { data: matchesResponse = [], isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: matchesAPI.getAll
  });

  const { data: tournamentsResponse = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsAPI.getAll
  });

  // Extract the data from the responses
  const matches = matchesResponse?.data || [];
  const tournaments = tournamentsResponse?.data || [];

  // Ensure data is arrays before calling filter
  if (!Array.isArray(matches)) {
    console.error('Matches data is not an array:', matches);
    console.error('Full response:', matchesResponse);
  }

  if (!Array.isArray(tournaments)) {
    console.error('Tournaments data is not an array:', tournaments);
    console.error('Full response:', tournamentsResponse);
  }

  const createMutation = useMutation({
    mutationFn: matchesAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['matches']);
      setShowModal(false);
      showSuccess(response?.message || 'Match created successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to create match');
    }
  });

  const updateMutation = useMutation({
    mutationFn: matchesAPI.update,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['matches']);
      setShowModal(false);
      setEditingMatch(null);
      showSuccess(response?.message || 'Match updated successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to update match');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: matchesAPI.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['matches']);
      showSuccess(response?.message || 'Match deleted successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to delete match');
    }
  });

  const updateWinnerMutation = useMutation({
    mutationFn: matchesAPI.updateWinner,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['matches']);
      queryClient.invalidateQueries(['predictions']);
      showSuccess(response?.message || 'Match winner updated successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to update match winner');
    }
  });

  const filteredMatches = Array.isArray(matches) ? matches.filter(match => {
    const matchesSearch = 
      match.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teamB.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTournament = filterTournament === 'all' || match.tournamentId === filterTournament;
    const matchesStatus = filterStatus === 'all' || match.status === filterStatus;
    
    return matchesSearch && matchesTournament && matchesStatus;
  }) : [];

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'matchTime':
        aValue = new Date(a.matchTime || 0);
        bValue = new Date(b.matchTime || 0);
        break;
      case 'teams':
        aValue = `${a.teamA} vs ${a.teamB}`.toLowerCase();
        bValue = `${b.teamA} vs ${b.teamB}`.toLowerCase();
        break;
      case 'tournament':
        const tournamentA = tournaments.find(t => t.id === a.tournamentId);
        const tournamentB = tournaments.find(t => t.id === b.tournamentId);
        aValue = tournamentA ? tournamentA.name.toLowerCase() : '';
        bValue = tournamentB ? tournamentB.name.toLowerCase() : '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
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
  const totalPages = Math.ceil(sortedMatches.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMatches = sortedMatches.slice(startIndex, startIndex + pageSize);

  const isMatchReadyForEvaluation = (match) => {
    if (match.status === 'completed') return false;
    const matchTime = new Date(match.matchTime);
    const now = new Date();
    return now > matchTime;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      tournamentId: formData.get('tournamentId'),
      teamA: formData.get('teamA'),
      teamB: formData.get('teamB'),
      matchTime: formData.get('matchTime'),
      status: formData.get('status')
    };
    
    if (editingMatch) {
      updateMutation.mutate({ id: editingMatch.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleWinnerUpdate = (matchId, winner) => {
    updateWinnerMutation.mutate({ matchId, winner });
  };

  const openModal = () => {
    setEditingMatch(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMatch(null);
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
    } else if (field === 'status') {
      setFilterStatus(value);
    }
    setCurrentPage(1);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'teams',
      header: 'Teams',
      render: (match) => (
        <div className="text-sm font-medium text-gray-900">
          {displayValue(match.teamA)} vs {displayValue(match.teamB)}
        </div>
      )
    },
    {
      key: 'tournament',
      header: 'Tournament',
      render: (match) => (
        <div className="text-sm text-gray-500">
          {displayValue(tournaments.find(t => t.id === match.tournamentId)?.name)}
        </div>
      )
    },
    {
      key: 'matchTime',
      header: 'Match Time',
      render: (match) => (
        <div className="text-sm text-gray-500">
          {displayFormattedValue(match.matchTime, formatDateTime)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (match) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(match.status)}
          {!match.winner && isMatchReadyForEvaluation(match) && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              ⚠️ Ready for Evaluation
            </span>
          )}
        </div>
      )
    },
    {
      key: 'winner',
      header: 'Winner',
      render: (match) => (
        <div className="flex flex-col gap-2">
          {match.winner ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 bg-green-100 px-2 py-1 rounded">
                {displayValue(match.winner)}
              </span>
              {getResultBadge(match.winner === match.teamA ? 'teamA' : 'teamB')}
            </div>
          ) : (
            <span className="text-sm text-gray-400">--</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (match) => (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(match);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(match.id);
              }}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {/* Show winner selection for completed matches without winners OR matches ready for evaluation */}
          {((match.status === 'completed' && !match.winner) || 
            (match.status !== 'completed' && !match.winner && isMatchReadyForEvaluation(match))) && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWinnerUpdate(match.id, match.teamA);
                }}
                className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
              >
                {match.teamA}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWinnerUpdate(match.id, match.teamB);
                }}
                className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
              >
                {match.teamB}
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // Essential columns for mobile view
  const essentialColumns = [
    columns[0], // Teams
    columns[2], // Match Time
    columns[3]  // Status
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading matches: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Matches</h1>
        <button
          onClick={openModal}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Match
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
          value={filterStatus}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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
          <span className="font-medium">Showing:</span> {startIndex + 1}-{Math.min(startIndex + pageSize, sortedMatches.length)} of {sortedMatches.length} matches
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Sorting by:</span> {sortField === 'matchTime' ? 'Match Time' : 
                                                             sortField === 'teams' ? 'Teams' : 
                                                             sortField === 'tournament' ? 'Tournament' : 
                                                             sortField === 'status' ? 'Status' : 'Unknown'} 
            ({sortDirection === 'desc' ? 'Newest First' : 'Oldest First'})
          </div>
          <button
            onClick={() => {
              setSortField('matchTime');
              setSortDirection('desc');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Reset to Default (Match Time ↓)
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={paginatedMatches}
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
              if (totalPages <= 5 || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
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
              {editingMatch ? 'Edit Match' : 'Add Match'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tournament</label>
                <select
                  name="tournamentId"
                  defaultValue={editingMatch?.tournamentId || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team A</label>
                <input
                  type="text"
                  name="teamA"
                  defaultValue={editingMatch?.teamA || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team B</label>
                <input
                  type="text"
                  name="teamB"
                  defaultValue={editingMatch?.teamB || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Match Time</label>
                <input
                  type="datetime-local"
                  name="matchTime"
                  defaultValue={editingMatch?.matchTime ? new Date(editingMatch.matchTime).toISOString().slice(0, 16) : ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingMatch?.status || 'scheduled'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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

export default Matches;
