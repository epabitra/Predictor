import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Layout from './components/Layout/Layout';
import Sidebar from './components/Layout/Sidebar';

// Page Components
import Dashboard from './pages/Dashboard';
import Predictors from './pages/Predictors';
import Tournaments from './pages/Tournaments';
import Matches from './pages/Matches';
import Predictions from './pages/Predictions';
import MatchReminders from './pages/MatchReminders';
import PredictorDetail from './pages/PredictorDetail';
import TournamentDetail from './pages/TournamentDetail';
import MatchDetail from './pages/MatchDetail';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';

// Context
import { AppProvider } from './context/AppContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/predictors" element={<Predictors />} />
                  <Route path="/predictors/:id" element={<PredictorDetail />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/tournaments/:id" element={<TournamentDetail />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/matches/:id" element={<MatchDetail />} />
                  <Route path="/predictions" element={<Predictions />} />
                  <Route path="/match-reminders" element={<MatchReminders />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                </Routes>
              </Layout>
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
