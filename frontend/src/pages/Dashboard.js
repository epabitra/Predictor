import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Trophy, 
  Gamepad2, 
  Target, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { formatNumber, formatDate, formatTime, isWithinOneHour } from '../utils/helpers';
import StatCard from '../components/Dashboard/StatCard';
import RecentMatches from '../components/Dashboard/RecentMatches';
import RecentPredictions from '../components/Dashboard/RecentPredictions';
import UpcomingMatches from '../components/Dashboard/UpcomingMatches';
import LeaderboardPreview from '../components/Dashboard/LeaderboardPreview';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard-preview'],
    queryFn: () => dashboardAPI.getLeaderboard({ limit: 5 }),
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">Error loading dashboard</div>
        <div className="text-gray-600 mt-2">{error.message}</div>
      </div>
    );
  }

  const { stats, recentMatches, recentPredictions, upcomingMatches } = dashboardData?.data || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Overview of tournament predictions and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Predictors"
          value={formatNumber(stats?.totalPredictors || 0)}
          icon={Users}
          color="blue"
          change={stats?.totalPredictors > 0 ? "+" + stats.totalPredictors : "0"}
          changeType="positive"
        />
        <StatCard
          title="Active Tournaments"
          value={formatNumber(stats?.totalTournaments || 0)}
          icon={Trophy}
          color="green"
          change={stats?.totalTournaments > 0 ? "+" + stats.totalTournaments : "0"}
          changeType="positive"
        />
        <StatCard
          title="Total Matches"
          value={formatNumber(stats?.totalMatches || 0)}
          icon={Gamepad2}
          color="purple"
          change={`${stats?.completedMatches || 0} completed`}
          changeType="neutral"
        />
        <StatCard
          title="Prediction Accuracy"
          value={`${stats?.overallAccuracy || 0}%`}
          icon={Target}
          color="orange"
          change={`${stats?.correctPredictions || 0} correct`}
          changeType="positive"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Recent Matches */}
          <RecentMatches matches={recentMatches || []} />
          
          {/* Recent Predictions */}
          <RecentPredictions predictions={recentPredictions || []} />
        </div>

        {/* Right Column - Upcoming & Leaderboard */}
        <div className="space-y-4 sm:space-y-6">
          {/* Upcoming Matches */}
          <UpcomingMatches matches={upcomingMatches || []} />
          
          {/* Leaderboard Preview */}
          <LeaderboardPreview data={leaderboardData?.data || []} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add Match</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Add Predictor</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium">Create Tournament</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors duration-200">
            <Target className="h-5 w-5" />
            <span className="text-sm font-medium">Make Prediction</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Backend API:</span> Online
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Google Sheets:</span> Connected
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">CRON Jobs:</span> Active
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Database:</span> Synchronized
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
