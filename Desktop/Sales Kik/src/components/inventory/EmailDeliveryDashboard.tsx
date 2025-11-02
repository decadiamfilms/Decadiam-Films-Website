import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ClockIcon, XMarkIcon, ArrowPathIcon, PauseIcon,
  PlayIcon, EyeIcon, DocumentTextIcon, ChartBarIcon,
  InformationCircleIcon, BellIcon, CogIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import EmailDeliveryService from '../../services/EmailDeliveryService';

interface EmailDeliveryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailDeliveryDashboard({ isOpen, onClose }: EmailDeliveryDashboardProps) {
  const [deliveryStats, setDeliveryStats] = useState<any>(null);
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [showEmailDetails, setShowEmailDetails] = useState(false);
  const [emailServicePaused, setEmailServicePaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmailData();
    }
  }, [isOpen]);

  const loadEmailData = async () => {
    setRefreshing(true);
    
    try {
      const emailService = EmailDeliveryService.getInstance();
      const stats = emailService.getDeliveryStats();
      setDeliveryStats(stats);

      // Load recent emails from queue
      const emailQueue = JSON.parse(localStorage.getItem('saleskik-email-queue') || '[]');
      const recent = emailQueue
        .sort((a: any, b: any) => new Date(b.message.createdAt).getTime() - new Date(a.message.createdAt).getTime())
        .slice(0, 20);
      
      setRecentEmails(recent);
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleEmailService = () => {
    const emailService = EmailDeliveryService.getInstance();
    
    if (emailServicePaused) {
      emailService.resumeEmailDelivery();
      setEmailServicePaused(false);
    } else {
      emailService.pauseEmailDelivery();
      setEmailServicePaused(true);
    }
  };

  const retryFailedEmail = async (queueId: string) => {
    // Reset status to queued for retry
    const emailQueue = JSON.parse(localStorage.getItem('saleskik-email-queue') || '[]');
    const updatedQueue = emailQueue.map((item: any) => 
      item.id === queueId 
        ? { ...item, status: 'QUEUED', attempts: 0, nextRetryAt: undefined }
        : item
    );
    localStorage.setItem('saleskik-email-queue', JSON.stringify(updatedQueue));
    
    loadEmailData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'QUEUED': return 'bg-blue-100 text-blue-800';
      case 'SENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'QUEUED': return <ClockIcon className="w-4 h-4 text-blue-600" />;
      case 'SENDING': return <ArrowPathIcon className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'FAILED': return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      default: return <InformationCircleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Email Delivery Center</h3>
              <p className="text-gray-600">Professional email automation and monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEmailService}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                emailServicePaused 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {emailServicePaused ? (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>
            <button
              onClick={loadEmailData}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Delivery Statistics */}
          {deliveryStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{deliveryStats.queued}</div>
                <div className="text-sm text-blue-700">Queued</div>
              </div>
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{deliveryStats.sending}</div>
                <div className="text-sm text-yellow-700">Sending</div>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{deliveryStats.sent}</div>
                <div className="text-sm text-green-700">Sent</div>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{deliveryStats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{deliveryStats.totalToday}</div>
                <div className="text-sm text-purple-700">Today</div>
              </div>
              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{deliveryStats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-indigo-700">Success Rate</div>
              </div>
              <div className="bg-teal-50 rounded-lg border border-teal-200 p-4 text-center">
                <div className="text-2xl font-bold text-teal-600">{deliveryStats.averageDeliveryTime.toFixed(1)}m</div>
                <div className="text-sm text-teal-700">Avg Delivery</div>
              </div>
            </div>
          )}

          {/* Service Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  emailServicePaused ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <EnvelopeIcon className={`w-5 h-5 ${
                    emailServicePaused ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Email Delivery Service</div>
                  <div className={`text-sm ${
                    emailServicePaused ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {emailServicePaused ? 'Paused - No emails will be sent' : 'Active - Processing queue every 30 seconds'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                SendGrid Primary • Resend Backup • SMTP Fallback
              </div>
            </div>
          </div>

          {/* Recent Emails */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Recent Email Activity</h4>
                <div className="text-sm text-gray-600">Last 20 emails</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentEmails.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No emails in queue</p>
                        <p className="text-sm text-gray-500">Email activity will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    recentEmails.map((email, index) => (
                      <tr key={email.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-xs">
                              {email.message.subject}
                            </div>
                            <div className="text-sm text-gray-600">
                              Template: {email.message.templateId}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {email.message.to.slice(0, 2).join(', ')}
                              {email.message.to.length > 2 && (
                                <span className="text-gray-500"> +{email.message.to.length - 2} more</span>
                              )}
                            </div>
                            {email.message.cc && email.message.cc.length > 0 && (
                              <div className="text-gray-600">CC: {email.message.cc.length}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(email.message.priority)}`}>
                            {email.message.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(email.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                              {email.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {email.attempts || 0}/{email.maxRetries || 3}
                          </div>
                          {email.nextRetryAt && (
                            <div className="text-xs text-gray-500">
                              Retry: {new Date(email.nextRetryAt).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600">
                            {new Date(email.message.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(email.message.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedEmail(email);
                                setShowEmailDetails(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {email.status === 'FAILED' && (
                              <button
                                onClick={() => retryFailedEmail(email.id)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Retry"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provider Health Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Email Provider Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">SendGrid</div>
                  <div className="text-sm text-green-700">Primary • Active</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">Resend</div>
                  <div className="text-sm text-blue-700">Backup • Active</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">SMTP</div>
                  <div className="text-sm text-gray-700">Fallback • Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Performance Insights */}
          {deliveryStats && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3">Performance Insights</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="font-medium text-blue-900 mb-2">Delivery Performance</h6>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      {deliveryStats.successRate >= 95 ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>Success rate: {deliveryStats.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                      <span>Average delivery: {deliveryStats.averageDeliveryTime.toFixed(1)} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4 text-purple-600" />
                      <span>Daily volume: {deliveryStats.totalToday} emails</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h6 className="font-medium text-blue-900 mb-2">Recommendations</h6>
                  <div className="space-y-1 text-sm text-blue-800">
                    {deliveryStats.successRate < 95 && (
                      <div>• Review failed emails and update templates</div>
                    )}
                    {deliveryStats.averageDeliveryTime > 5 && (
                      <div>• Consider upgrading email provider plan</div>
                    )}
                    {deliveryStats.failed > 5 && (
                      <div>• Check provider configurations and API keys</div>
                    )}
                    {deliveryStats.successRate >= 99 && deliveryStats.averageDeliveryTime < 2 && (
                      <div>✅ Email system performing excellently</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Email Details Modal */}
        {showEmailDetails && selectedEmail && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Email Details</h4>
                <button
                  onClick={() => setShowEmailDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-96 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <div className="text-sm text-gray-900">{selectedEmail.message.subject}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedEmail.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmail.status)}`}>
                        {selectedEmail.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                  <div className="space-y-1">
                    {selectedEmail.message.to.map((email: string, index: number) => (
                      <div key={index} className="text-sm text-gray-900">{email}</div>
                    ))}
                  </div>
                </div>

                {selectedEmail.failureReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Failure Reason</div>
                    <div className="text-sm text-red-700">{selectedEmail.failureReason}</div>
                  </div>
                )}

                {selectedEmail.webhookEvents && selectedEmail.webhookEvents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Events</label>
                    <div className="space-y-2">
                      {selectedEmail.webhookEvents.map((event: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-900">{event.event}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}