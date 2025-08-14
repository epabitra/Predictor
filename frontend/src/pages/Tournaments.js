import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Search, Filter, ChevronUp, ChevronDown, Trophy, Calendar, Users } from 'lucide-react';
import { tournamentsAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDate, getStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';
import ResponsiveTable from '../components/ResponsiveTable';

const Tournaments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const queryClient = useQueryClient();

  const { data: tournamentsResponse = [], isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsAPI.getAll
  });

  // Extract the tournaments data from the response
  const tournaments = tournamentsResponse?.data || [];

  // Ensure tournaments is an array before calling filter
  if (!Array.isArray(tournaments)) {
    console.error('Tournaments data is not an array:', tournaments);
    console.error('Full response:', tournamentsResponse);
  }

  const createMutation = useMutation({
    mutationFn: tournamentsAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tournaments']);
      setShowModal(false);
      showSuccess(response?.message || 'Tournament created successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to create tournament');
    }
  });

  const updateMutation = useMutation({
    mutationFn: tournamentsAPI.update,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tournaments']);
      setShowModal(false);
      setEditingTournament(null);
      showSuccess(response?.message || 'Tournament updated successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to update tournament');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: tournamentsAPI.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tournaments']);
      showSuccess(response?.message || 'Tournament deleted successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to delete tournament');
    }
  });

  const filteredTournaments = Array.isArray(tournaments) ? tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Sort tournaments
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'startDate':
        aValue = new Date(a.startDate || 0);
        bValue = new Date(b.startDate || 0);
        break;
      case 'endDate':
        aValue = new Date(a.endDate || 0);
        bValue = new Date(b.endDate || 0);
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
  const totalPages = Math.ceil(sortedTournaments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTournaments = sortedTournaments.slice(startIndex, startIndex + pageSize);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status')
    };
    
    if (editingTournament) {
      updateMutation.mutate({ id: editingTournament.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingTournament(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTournament(null);
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
    if (field === 'search') {
      setSearchTerm(value);
    }
    setCurrentPage(1);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Tournament',
      render: (tournament) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{displayValue(tournament.name)}</div>
            <div className="text-xs text-gray-500">ID: {tournament.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (tournament) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {displayValue(tournament.description) || 'No description'}
        </div>
      )
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (tournament) => (
        <div className="text-sm text-gray-500">
          {displayFormattedValue(tournament.startDate, formatDate)}
        </div>
      )
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (tournament) => (
        <div className="text-sm text-gray-500">
          {displayFormattedValue(tournament.endDate, formatDate)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (tournament) => getStatusBadge(tournament.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tournament) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(tournament);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(tournament.id);
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
    columns[0], // Tournament
    columns[4], // Status
    columns[5]  // Actions
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading tournaments: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tournaments</h1>
        <button
          onClick={openModal}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Tournament
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
          <span className="font-medium">Showing:</span> {startIndex + 1}-{Math.min(startIndex + pageSize, sortedTournaments.length)} of {sortedTournaments.length} tournaments
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Sorting by:</span> {sortField === 'name' ? 'Name' : 
                                                           sortField === 'startDate' ? 'Start Date' : 
                                                           sortField === 'endDate' ? 'End Date' : 'Unknown'} 
          ({sortDirection === 'desc' ? 'Newest First' : 'Oldest First'})
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={paginatedTournaments}
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
              {editingTournament ? 'Edit Tournament' : 'Add Tournament'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTournament?.name || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingTournament?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={editingTournament?.startDate ? editingTournament.startDate.split('T')[0] : ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={editingTournament?.endDate ? editingTournament.endDate.split('T')[0] : ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingTournament?.status || 'active'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

export default Tournaments;
