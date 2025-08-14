import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, TrendingUp, Calendar, Filter, ChevronUp, ChevronDown, Download, Target, CheckCircle, XCircle } from 'lucide-react';
import { predictionsAPI, matchesAPI, predictorsAPI, tournamentsAPI, dashboardAPI } from '../services/api';
import { displayValue } from '../utils/helpers';
import { showSuccess, showError } from '../context/AppContext';
import ResponsiveTable from '../components/ResponsiveTable';

const Leaderboard = () => {
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [sortBy, setSortBy] = useState('accuracy');
  const [sortOrder, setSortOrder] = useState('desc');
  const [limit, setLimit] = useState('50');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch leaderboard data
  const { data: leaderboardResponse, isLoading, error } = useQuery({
    queryKey: ['leaderboard-full', selectedTournament, limit],
    queryFn: () => dashboardAPI.getLeaderboard({ 
      tournamentId: selectedTournament === 'all' ? undefined : selectedTournament,
      limit: parseInt(limit)
    })
  });

  // Fetch tournaments for filter
  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments-leaderboard'],
    queryFn: () => dashboardAPI.getTournamentComparison()
  });

  // Extract data from responses
  const leaderboard = leaderboardResponse?.data || [];
  const tournaments = tournamentsResponse?.data || [];

  const handleExport = async () => {
    try {
      const response = await dashboardAPI.exportData({ 
        type: 'leaderboard',
        tournamentId: selectedTournament === 'all' ? undefined : selectedTournament
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Leaderboard exported successfully');
    } catch (error) {
      showError(`Failed to export leaderboard: ${error.message}`);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle numeric values
    if (sortBy === 'accuracy' || sortBy === 'total' || sortBy === 'correct' || sortBy === 'wrong') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedLeaderboard.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeaderboard = sortedLeaderboard.slice(startIndex, startIndex + pageSize);

  // Table columns configuration
  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (item, column, index) => {
        const rank = startIndex + index + 1;
        if (rank <= 3) {
          const colors = ['text-yellow-600', 'text-gray-400', 'text-amber-600'];
          return (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${colors[rank - 1]}`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </span>
              <span className="text-sm font-medium text-gray-900">{rank}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{rank}</span>
          </div>
        );
      }
    },
    {
      key: 'predictor',
      header: 'Predictor',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{displayValue(item.predictorName)}</div>
            <div className="text-xs text-gray-500">ID: {item.predictorId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'accuracy',
      header: 'Accuracy',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{item.accuracy}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: `${Math.min(item.accuracy, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Total Predictions',
      render: (item) => (
        <div className="text-sm text-gray-900 font-medium">{item.total}</div>
      )
    },
    {
      key: 'correct',
      header: 'Correct',
      render: (item) => (
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">{item.correct}</span>
        </div>
      )
    },
    {
      key: 'wrong',
      header: 'Wrong',
      render: (item) => (
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">{item.wrong}</span>
        </div>
      )
    }
  ];

  // Essential columns for mobile view
  const essentialColumns = [
    columns[0], // Rank
    columns[1], // Predictor
    columns[2]  // Accuracy
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading leaderboard: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Tournament prediction rankings and statistics
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="accuracy">Sort by Accuracy</option>
          <option value="total">Sort by Total Predictions</option>
          <option value="correct">Sort by Correct Predictions</option>
          <option value="wrong">Sort by Wrong Predictions</option>
        </select>
        
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
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
          <span className="font-medium">Showing:</span> {startIndex + 1}-{Math.min(startIndex + pageSize, sortedLeaderboard.length)} of {sortedLeaderboard.length} predictors
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Sorting by:</span> {sortBy === 'accuracy' ? 'Accuracy' : 
                                                           sortBy === 'total' ? 'Total Predictions' : 
                                                           sortBy === 'correct' ? 'Correct Predictions' : 
                                                           sortBy === 'wrong' ? 'Wrong Predictions' : 'Unknown'} 
          ({sortOrder === 'desc' ? 'Highest First' : 'Lowest First'})
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={paginatedLeaderboard}
        essentialColumns={essentialColumns}
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

      {/* Tournament Comparison Chart */}
      {tournaments.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Tournament Comparison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{tournament.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Matches:</span>
                    <span className="font-medium">{tournament.totalMatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{tournament.completedMatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Accuracy:</span>
                    <span className="font-medium">{tournament.averageAccuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
