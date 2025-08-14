import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Search, Filter, ChevronUp, ChevronDown, Users, Calendar } from 'lucide-react';
import { predictorsAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDate, displayValue, displayFormattedValue } from '../utils/helpers';
import ResponsiveTable from '../components/ResponsiveTable';

const Predictors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPredictor, setEditingPredictor] = useState(null);
  const [filterParent, setFilterParent] = useState('all');
  const [sortField, setSortField] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const queryClient = useQueryClient();

  const { data: predictorsResponse = [], isLoading, error } = useQuery({
    queryKey: ['predictors'],
    queryFn: predictorsAPI.getAll
  });

  const { data: parentPredictorsResponse = [] } = useQuery({
    queryKey: ['parent-predictors'],
    queryFn: () => predictorsAPI.getAll().then(response => response.data?.filter(p => !p.parentPredictorId) || [])
  });

  // Extract the predictors data from the response
  const predictors = predictorsResponse?.data || [];
  const parentPredictors = parentPredictorsResponse || [];

  // Ensure predictors is an array before calling filter
  if (!Array.isArray(predictors)) {
    console.error('Predictors data is not an array:', predictors);
    console.error('Full response:', predictorsResponse);
  }

  const filteredPredictors = Array.isArray(predictors) ? predictors.filter(predictor => {
    const matchesSearch = predictor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = filterParent === 'all' || 
      (filterParent === 'parent' && !predictor.parentPredictorId) ||
      (filterParent === 'child' && predictor.parentPredictorId);
    return matchesSearch && matchesParent;
  }) : [];

  // Sort predictors
  const sortedPredictors = [...filteredPredictors].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'parent':
        const parentA = parentPredictors.find(p => p.id === a.parentPredictorId)?.name || '';
        const parentB = parentPredictors.find(p => p.id === b.parentPredictorId)?.name || '';
        aValue = parentA.toLowerCase();
        bValue = parentB.toLowerCase();
        break;
      case 'createdDate':
        aValue = new Date(a.createdDate || 0);
        bValue = new Date(b.createdDate || 0);
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
  const totalPages = Math.ceil(sortedPredictors.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPredictors = sortedPredictors.slice(startIndex, startIndex + pageSize);

  const createMutation = useMutation({
    mutationFn: predictorsAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictors']);
      setShowModal(false);
      showSuccess(response?.message || 'Predictor created successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to create predictor');
    }
  });

  const updateMutation = useMutation({
    mutationFn: predictorsAPI.update,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictors']);
      setShowModal(false);
      setEditingPredictor(null);
      showSuccess(response?.message || 'Predictor updated successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to update predictor');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: predictorsAPI.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['predictors']);
      showSuccess(response?.message || 'Predictor deleted successfully');
    },
    onError: (error) => {
      showError(error.response?.data?.error?.message || 'Failed to delete predictor');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      parentPredictorId: formData.get('parentPredictorId') || null
    };
    
    if (editingPredictor) {
      updateMutation.mutate({ id: editingPredictor.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (predictor) => {
    setEditingPredictor(predictor);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this predictor?')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingPredictor(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPredictor(null);
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
    if (field === 'parent') {
      setFilterParent(value);
    } else if (field === 'search') {
      setSearchTerm(value);
    }
    setCurrentPage(1);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (predictor) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{displayValue(predictor.name)}</div>
            <div className="text-xs text-gray-500">ID: {predictor.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'parent',
      header: 'Parent Predictor',
      render: (predictor) => {
        if (predictor.parentPredictorId) {
          const parent = parentPredictors.find(p => p.id === predictor.parentPredictorId);
          return (
            <div className="text-sm text-gray-900">
              {parent ? displayValue(parent.name) : 'Unknown Parent'}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-blue-600">Parent</span>
            <span className="text-xs text-gray-500">(No parent)</span>
          </div>
        );
      }
    },
    {
      key: 'createdDate',
      header: 'Created Date',
      render: (predictor) => (
        <div className="text-sm text-gray-500">
          {displayFormattedValue(predictor.createdDate, formatDate)}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (predictor) => (
        <div className="flex items-center gap-1">
          {predictor.parentPredictorId ? (
            <>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Child</span>
              <span className="text-xs text-gray-500">of {parentPredictors.find(p => p.id === predictor.parentPredictorId)?.name || 'Unknown'}</span>
            </>
          ) : (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Parent</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (predictor) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(predictor);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(predictor.id);
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
    columns[0], // Name
    columns[3], // Type
    columns[4]  // Actions
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error loading predictors: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Predictors</h1>
        <button
          onClick={openModal}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Predictor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search predictors..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterParent}
          onChange={(e) => handleFilterChange('parent', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="parent">Parent Only</option>
          <option value="child">Child Only</option>
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
          <span className="font-medium">Showing:</span> {startIndex + 1}-{Math.min(startIndex + pageSize, sortedPredictors.length)} of {sortedPredictors.length} predictors
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Sorting by:</span> {sortField === 'name' ? 'Name' : 
                                                           sortField === 'parent' ? 'Parent' : 
                                                           sortField === 'createdDate' ? 'Created Date' : 'Unknown'} 
          ({sortDirection === 'desc' ? 'Newest First' : 'Oldest First'})
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={paginatedPredictors}
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
              {editingPredictor ? 'Edit Predictor' : 'Add Predictor'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingPredictor?.name || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Predictor (Optional)</label>
                <select
                  name="parentPredictorId"
                  defaultValue={editingPredictor?.parentPredictorId || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Parent (Independent Predictor)</option>
                  {parentPredictors.map(predictor => (
                    <option key={predictor.id} value={predictor.id}>
                      {predictor.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create a parent predictor, or select a parent to create a child predictor
                </p>
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

export default Predictors;
