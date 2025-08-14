import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add loading state if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error?.message || 
                          error.response.data?.message || 
                          'An error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('No response from server'));
    } else {
      // Something else happened
      return Promise.reject(new Error('Request failed'));
    }
  }
);

// Predictors API
export const predictorsAPI = {
  getAll: () => api.get('/predictors'),
  getById: (id) => api.get(`/predictors/${id}`),
  create: (data) => api.post('/predictors', data),
  update: (id, data) => api.put(`/predictors/${id}`, data),
  delete: (id) => api.delete(`/predictors/${id}`),
  getStats: (id) => api.get(`/predictors/${id}/stats`),
  getAllWithStats: () => api.get('/predictors/stats'),
};

// Tournaments API
export const tournamentsAPI = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  getStats: (id) => api.get(`/tournaments/${id}/stats`),
  getActive: () => api.get('/tournaments/active'),
};

// Matches API
export const matchesAPI = {
  getAll: () => api.get('/matches'),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  delete: (id) => api.delete(`/matches/${id}`),
  setWinner: (id, winner) => api.put(`/matches/${id}/winner`, { winner }),
  updateWinner: (data) => api.put(`/matches/${data.matchId}/winner`, { winner: data.winner }),
  getByTournament: (tournamentId) => api.get(`/matches/tournament/${tournamentId}`),
  getByTournamentId: (tournamentId) => api.get(`/matches/tournament/${tournamentId}`),
  getUpcoming: () => api.get('/matches/upcoming'),
  getCompleted: () => api.get('/matches/completed'),
};

// Predictions API
export const predictionsAPI = {
  getAll: () => api.get('/predictions'),
  getById: (id) => api.get(`/predictions/${id}`),
  create: (data) => api.post('/predictions', data),
  update: (id, data) => api.put(`/predictions/${id}`, data),
  delete: (id) => api.delete(`/predictions/${id}`),
  getByMatch: (matchId) => api.get(`/predictions/match/${matchId}`),
  getByMatchId: (matchId) => api.get(`/predictions/match/${matchId}`),
  getByPredictor: (predictorId) => api.get(`/predictions/predictor/${predictorId}`),
  getByPredictorId: (predictorId) => api.get(`/predictions/predictor/${predictorId}`),
  getStats: () => api.get('/predictions/stats'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
  getTournamentComparison: () => api.get('/dashboard/tournament-comparison'),
  getPredictionTrends: (params) => api.get('/dashboard/trends', { params }),
  getPredictorPerformance: (predictorId, params) => 
    api.get(`/dashboard/predictor-performance/${predictorId}`, { params }),
  exportData: (params) => api.get('/dashboard/export', { 
    params, 
    responseType: 'blob' 
  }),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
