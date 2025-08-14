import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Clock, CheckCircle, AlertTriangle, Users, Mail } from 'lucide-react';
import { matchesAPI, predictionsAPI, predictorsAPI } from '../services/api';
import { showSuccess, showError } from '../context/AppContext';
import { formatDateTime, getMatchStatusBadge, displayValue, displayFormattedValue } from '../utils/helpers';

const MatchReminders = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const queryClient = useQueryClient();

  const { data: matchesResponse = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: matchesAPI.getAll
  });

  const { data: predictionsResponse = [] } = useQuery({
    queryKey: ['predictions'],
    queryFn: predictionsAPI.getAll
  });

  const { data: predictorsResponse = [] } = useQuery({
    queryKey: ['predictors'],
    queryFn: predictorsAPI.getAll
  });

  const matches = matchesResponse?.data || [];
  const predictions = predictionsResponse?.data || [];
  const predictors = predictorsResponse?.data || [];

  // Calculate match statuses and prediction counts
  const matchesWithStatus = matches.map(match => {
    const matchTime = new Date(match.matchTime);
    const now = new Date();
    const timeDiff = matchTime.getTime() - now.getTime();
    const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
    const hoursSinceMatch = -hoursUntilMatch;

    // Get predictions for this match
    const matchPredictions = predictions.filter(p => p.matchId === match.id);
    const submittedPredictions = matchPredictions.filter(p => p.predictedWinner && p.predictedWinner !== '');
    const missingPredictions = matchPredictions.filter(p => !p.predictedWinner || p.predictedWinner === '');

    let status = 'pending';
    let statusText = 'Pending';
    let statusColor = 'gray';
    let actionRequired = '';

    if (match.status === 'completed') {
      status = 'completed';
      statusText = 'Completed';
      statusColor = 'green';
      actionRequired = 'Winner already set';
    } else if (hoursUntilMatch <= 0 && hoursUntilMatch > -1) {
      // Match is happening now (0 to -1 hour)
      status = 'live';
      statusText = 'Live';
      statusColor = 'red';
      actionRequired = 'Match in progress';
    } else if (hoursUntilMatch <= 1 && hoursUntilMatch > 0) {
      // Within 1 hour of match
      status = 'urgent';
      statusText = 'Urgent';
      statusColor = 'orange';
      actionRequired = 'Send reminders now!';
    } else if (hoursUntilMatch <= 2 && hoursUntilMatch > 1) {
      // 1-2 hours before match
      status = 'warning';
      statusText = 'Warning';
      statusColor = 'yellow';
      actionRequired = 'Send reminders';
    } else if (hoursUntilMatch > 2) {
      // More than 2 hours before match
      status = 'upcoming';
      statusText = 'Upcoming';
      statusColor = 'blue';
      actionRequired = 'Schedule reminders';
    } else if (hoursSinceMatch >= 2) {
      // 2+ hours after match start
      status = 'evaluation';
      statusText = 'Evaluation';
      statusColor = 'purple';
      actionRequired = 'Set winner & evaluate';
    }

    return {
      ...match,
      status,
      statusText,
      statusColor,
      actionRequired,
      hoursUntilMatch,
      hoursSinceMatch,
      totalPredictors: predictors.length,
      submittedPredictions: submittedPredictions.length,
      missingPredictions: missingPredictions.length,
      predictionRate: predictors.length > 0 ? Math.round((submittedPredictions.length / predictors.length) * 100) : 0
    };
  });

  // Sort matches by urgency
  const sortedMatches = matchesWithStatus.sort((a, b) => {
    // Priority: urgent > warning > evaluation > live > upcoming
    const priority = { urgent: 1, warning: 2, evaluation: 3, live: 4, upcoming: 5, completed: 6 };
    return priority[a.status] - priority[b.status];
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ matchId, message }) => {
      // This would integrate with your notification system
      // For now, we'll just log it
      console.log(`Sending notification for match ${matchId}: ${message}`);
      return { success: true, message: 'Notification sent successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['matches']);
      setShowNotificationModal(false);
      setSelectedMatch(null);
      showSuccess('Reminders sent successfully!');
    },
    onError: (error) => {
      showError('Failed to send reminders');
    }
  });

  const handleSendReminders = (match) => {
    setSelectedMatch(match);
    setNotificationMessage(`Don't forget to submit your prediction for ${match.teamA} vs ${match.teamB}! Match starts at ${formatDateTime(match.matchTime)}.`);
    setShowNotificationModal(true);
  };

  const handleSendNotification = () => {
    if (!selectedMatch || !notificationMessage.trim()) return;
    
    sendNotificationMutation.mutate({
      matchId: selectedMatch.id,
      message: notificationMessage
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'urgent': return <AlertTriangle className="text-orange-500" size={20} />;
      case 'warning': return <Clock className="text-yellow-500" size={20} />;
      case 'evaluation': return <CheckCircle className="text-purple-500" size={20} />;
      case 'live': return <AlertTriangle className="text-red-500" size={20} />;
      case 'upcoming': return <Clock className="text-blue-500" size={20} />;
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      default: return <Clock className="text-gray-500" size={20} />;
    }
  };

  if (matchesLoading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="text-blue-600" size={32} />
          Match Reminders & Notifications
        </h1>
        <p className="text-gray-600 mt-2">
          Manage match reminders and track prediction submissions
        </p>
      </div>

             {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {['urgent', 'warning', 'evaluation', 'live'].map(status => {
          const count = sortedMatches.filter(m => m.status === status).length;
          const statusInfo = {
            urgent: { label: 'Urgent Reminders', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-500', icon: AlertTriangle },
            warning: { label: 'Warning Reminders', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-500', icon: Clock },
            evaluation: { label: 'Need Evaluation', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-500', icon: CheckCircle },
            live: { label: 'Live Matches', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-500', icon: AlertTriangle }
          };
          
          if (count === 0) return null;
          
          const IconComponent = statusInfo[status].icon;
          
          return (
            <div key={status} className={`${statusInfo[status].bgColor} ${statusInfo[status].borderColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{statusInfo[status].label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <IconComponent className={statusInfo[status].textColor} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predictions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Required</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMatches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {displayValue(match.teamA)} vs {displayValue(match.teamB)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {displayValue(match.tournament, '--')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      match.status === 'urgent' ? 'bg-orange-100 text-orange-800' :
                      match.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      match.status === 'evaluation' ? 'bg-purple-100 text-purple-800' :
                      match.status === 'live' ? 'bg-red-100 text-red-800' :
                      match.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      match.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {match.statusText}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {displayFormattedValue(match.matchTime, formatDateTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.hoursUntilMatch > 0 
                      ? `${Math.round(match.hoursUntilMatch * 10) / 10}h until match`
                      : `${Math.round(match.hoursSinceMatch * 10) / 10}h since match`
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {match.submittedPredictions}/{match.totalPredictors} submitted
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.predictionRate}% completion rate
                  </div>
                  {match.missingPredictions > 0 && (
                    <div className="text-xs text-red-500">
                      {match.missingPredictions} missing
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {match.actionRequired}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {(match.status === 'urgent' || match.status === 'warning') && (
                      <button
                        onClick={() => handleSendReminders(match)}
                        className="btn btn-primary btn-sm"
                      >
                        <Mail size={14} className="mr-1" />
                        Send Reminders
                      </button>
                    )}
                    {match.status === 'evaluation' && (
                      <button
                        onClick={() => {
                          // Navigate to matches page and scroll to the specific match
                          window.location.href = `/matches?highlight=${match.id}`;
                        }}
                        className="btn btn-warning btn-sm"
                      >
                        Set Winner
                      </button>
                    )}
                    {match.status === 'live' && (
                      <button
                        onClick={() => window.location.href = `/matches`}
                        className="btn btn-danger btn-sm"
                      >
                        View Match
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Send Reminders</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Sending reminders for: <strong>{selectedMatch.teamA} vs {selectedMatch.teamB}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Match starts at: <strong>{formatDateTime(selectedMatch.matchTime)}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Missing predictions: <strong>{selectedMatch.missingPredictions}</strong>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your reminder message..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendNotification}
                disabled={sendNotificationMutation.isPending}
                className="btn-primary flex-1"
              >
                {sendNotificationMutation.isPending ? 'Sending...' : 'Send Reminders'}
              </button>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchReminders;
