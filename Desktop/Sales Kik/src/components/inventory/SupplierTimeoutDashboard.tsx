import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon,
  BuildingOfficeIcon, BellIcon, ArrowPathIcon, EyeIcon,
  PhoneIcon, EnvelopeIcon, CalendarIcon, ChartBarIcon,
  ShieldExclamationIcon, CogIcon, PauseIcon, PlayIcon,
  DocumentTextIcon, UserIcon
} from '@heroicons/react/24/outline';
import SupplierTimeoutMonitoringService from '../../services/SupplierTimeoutMonitoringService';

interface SupplierTimeoutDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplierTimeoutDashboard({ isOpen, onClose }: SupplierTimeoutDashboardProps) {
  const [timeoutEvents, setTimeoutEvents] = useState<any[]>([]);
  const [overdueAlerts, setOverdueAlerts] = useState<any[]>([]);
  const [timeoutStats, setTimeoutStats] = useState<any>(null);
  const [timeoutRules, setTimeoutRules] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [monitoringPaused, setMonitoringPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTimeoutData();
    }
  }, [isOpen]);

  const loadTimeoutData = async () => {
    setRefreshing(true);
    
    try {
      const timeoutService = SupplierTimeoutMonitoringService.getInstance();
      
      // Load active timeout events
      const activeEvents = timeoutService.getActiveTimeoutEvents();
      setTimeoutEvents(activeEvents);
      
      // Load overdue supplier alerts
      const alerts = timeoutService.getOverdueSupplierAlerts();
      setOverdueAlerts(alerts);
      
      // Load statistics
      const stats = timeoutService.getTimeoutStatistics();
      setTimeoutStats(stats);
      
      // Load timeout rules
      const rules = timeoutService.getTimeoutRules();
      setTimeoutRules(rules);
      
    } catch (error) {
      console.error('Error loading timeout data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const forceTimeoutCheck = async () => {
    setRefreshing(true);
    
    try {
      const timeoutService = SupplierTimeoutMonitoringService.getInstance();
      await timeoutService.forceTimeoutCheck();
      await loadTimeoutData();
    } catch (error) {
      console.error('Error forcing timeout check:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMonitoring = () => {
    const timeoutService = SupplierTimeoutMonitoringService.getInstance();
    
    if (monitoringPaused) {
      timeoutService.resumeTimeoutMonitoring();
      setMonitoringPaused(false);
    } else {
      timeoutService.pauseTimeoutMonitoring();
      setMonitoringPaused(true);
    }
  };

  const resolveTimeoutEvent = async (eventId: string, method: string) => {
    try {
      const timeoutService = SupplierTimeoutMonitoringService.getInstance();
      const resolved = await timeoutService.manuallyResolveTimeout(eventId, method);
      
      if (resolved) {
        loadTimeoutData();
        setShowEventDetails(false);
        alert('Timeout event resolved successfully');
      } else {
        alert('Failed to resolve timeout event');
      }
    } catch (error) {
      console.error('Error resolving timeout event:', error);
      alert('Error resolving timeout event');
    }
  };

  const getEscalationColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEscalationIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <ShieldExclamationIcon className="w-5 h-5 text-red-600" />;
      case 'HIGH': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM': return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'LOW': return <BellIcon className="w-5 h-5 text-blue-600" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-lg">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Supplier Timeout Monitoring</h3>
              <p className="text-gray-600">
                {timeoutEvents.length} active timeout{timeoutEvents.length !== 1 ? 's' : ''} • 
                {overdueAlerts.length} overdue supplier{overdueAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMonitoring}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                monitoringPaused 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {monitoringPaused ? (
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
              onClick={forceTimeoutCheck}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Force Check Now"
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
          
          {/* Timeout Statistics */}
          {timeoutStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{timeoutStats.activeTimeouts}</div>
                <div className="text-sm text-orange-700">Active Timeouts</div>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {timeoutStats.timeoutsByEscalationLevel['CRITICAL'] || 0}
                </div>
                <div className="text-sm text-red-700">Critical</div>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{timeoutStats.resolvedTimeouts}</div>
                <div className="text-sm text-green-700">Resolved</div>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{timeoutStats.averageResolutionTime.toFixed(1)}h</div>
                <div className="text-sm text-blue-700">Avg Resolution</div>
              </div>
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 text-center">
                <div className="text-lg font-bold text-purple-600 truncate">
                  {timeoutStats.mostProblematicSupplier || 'None'}
                </div>
                <div className="text-sm text-purple-700">Most Timeouts</div>
              </div>
            </div>
          )}

          {/* Critical Overdue Suppliers */}
          {overdueAlerts.filter(alert => alert.escalationRequired).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
                <div>
                  <h4 className="font-bold text-red-900">Critical Supplier Delays</h4>
                  <p className="text-sm text-red-700">
                    {overdueAlerts.filter(alert => alert.escalationRequired).length} supplier{overdueAlerts.filter(alert => alert.escalationRequired).length !== 1 ? 's' : ''} require immediate attention
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {overdueAlerts.filter(alert => alert.escalationRequired).map(alert => (
                  <div key={alert.supplierId} className="bg-white border border-red-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{alert.supplierName}</div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">
                          {alert.totalOverdueOrders} order{alert.totalOverdueOrders !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-red-500">
                          ${alert.totalOverdueValue.toLocaleString('en-AU')}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Response Rate:</span> 
                        <span className={`ml-1 font-medium ${
                          alert.responseRate >= 90 ? 'text-green-600' :
                          alert.responseRate >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {alert.responseRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Response:</span> 
                        <span className="ml-1 font-medium text-gray-900">
                          {alert.averageResponseTime.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                        Contact Supplier
                      </button>
                      <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors">
                        Override Confirmation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Timeout Events */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Active Timeout Events</h4>
                <div className="text-sm text-gray-600">Monitoring every 10 minutes</div>
              </div>
            </div>
            
            {timeoutEvents.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h5 className="font-medium text-gray-900 mb-2">No Active Timeouts</h5>
                <p className="text-gray-600">All suppliers are responding within expected timeframes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {timeoutEvents.map(event => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg border ${getEscalationColor(event.escalationLevel)}`}>
                          {getEscalationIcon(event.escalationLevel)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{event.purchaseOrderNumber}</div>
                          <div className="text-sm text-gray-600">{event.supplierName}</div>
                          <div className="text-sm text-gray-500">
                            Sent {event.sentToSupplierAt.toLocaleDateString()} • 
                            {Math.floor(event.hoursWithoutConfirmation)}h overdue
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEscalationColor(event.escalationLevel)}`}>
                          {event.escalationLevel}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {event.escalationHistory.length} escalation{event.escalationHistory.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDetails(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => resolveTimeoutEvent(event.id, 'MANUAL_OVERRIDE')}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Resolve"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeout Rules Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Timeout Rules</h4>
                <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                  <CogIcon className="w-4 h-4" />
                  Configure Rules
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {timeoutRules.map(rule => (
                <div key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-600">
                        Triggers after {rule.triggerAfterHours}h • Action: {rule.action} • 
                        Level: {rule.escalationLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Performance Summary */}
          {overdueAlerts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Supplier Performance Issues</h4>
              </div>
              
              <div className="divide-y divide-gray-200">
                {overdueAlerts.map(alert => (
                  <div key={alert.supplierId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">{alert.supplierName}</div>
                          <div className="text-sm text-gray-600">{alert.supplierEmail}</div>
                        </div>
                      </div>
                      {alert.escalationRequired && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Escalation Required
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-red-600">{alert.totalOverdueOrders}</div>
                        <div className="text-gray-600">Overdue Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">
                          ${alert.totalOverdueValue.toLocaleString('en-AU')}
                        </div>
                        <div className="text-gray-600">Overdue Value</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${
                          alert.responseRate >= 90 ? 'text-green-600' :
                          alert.responseRate >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {alert.responseRate.toFixed(1)}%
                        </div>
                        <div className="text-gray-600">Response Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{alert.averageResponseTime.toFixed(1)}h</div>
                        <div className="text-gray-600">Avg Response</div>
                      </div>
                    </div>

                    {/* Overdue Orders List */}
                    <div className="mt-3 space-y-2">
                      {alert.overdueOrders.slice(0, 3).map(order => (
                        <div key={order.purchaseOrderId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-900">{order.purchaseOrderNumber}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-600">{order.hoursOverdue}h overdue</div>
                            <div className="text-xs text-gray-500">${order.totalAmount.toLocaleString('en-AU')}</div>
                          </div>
                        </div>
                      ))}
                      {alert.overdueOrders.length > 3 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{alert.overdueOrders.length - 3} more overdue orders
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3">Monitoring System Status</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-blue-900 mb-2">Current Status</h6>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    {monitoringPaused ? (
                      <PauseIcon className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                    <span>{monitoringPaused ? 'Monitoring Paused' : 'Monitoring Active'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-600" />
                    <span>Checks every 10 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-purple-600" />
                    <span>{timeoutRules.filter(r => r.isActive).length} active rules</span>
                  </div>
                </div>
              </div>
              <div>
                <h6 className="font-medium text-blue-900 mb-2">Escalation Timeline</h6>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>24h → Supplier reminder email</div>
                  <div>48h → Manager escalation notification</div>
                  <div>72h → Automatic overdue status</div>
                  <div className="text-red-700 font-medium">6h → Urgent order critical alert</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900">Timeout Event Details</h4>
                  <button
                    onClick={() => setShowEventDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchase Order</label>
                      <div className="text-sm text-gray-900">{selectedEvent.purchaseOrderNumber}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <div className="text-sm text-gray-900">{selectedEvent.supplierName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hours Overdue</label>
                      <div className="text-sm font-bold text-red-600">{Math.floor(selectedEvent.hoursWithoutConfirmation)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Escalation Level</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEscalationColor(selectedEvent.escalationLevel)}`}>
                        {selectedEvent.escalationLevel}
                      </span>
                    </div>
                  </div>

                  {/* Escalation History */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Escalation History</label>
                    <div className="space-y-2">
                      {selectedEvent.escalationHistory.map((escalation: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{escalation.level} Escalation</span>
                            <div className="text-xs text-gray-500">
                              {escalation.sentAt.toLocaleString()} • {escalation.emailsSent} email{escalation.emailsSent !== 1 ? 's' : ''} sent
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => resolveTimeoutEvent(selectedEvent.id, 'SUPPLIER_CONFIRMED')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Confirmed
                    </button>
                    <button
                      onClick={() => resolveTimeoutEvent(selectedEvent.id, 'MANUAL_OVERRIDE')}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Manual Override
                    </button>
                    <button
                      onClick={() => resolveTimeoutEvent(selectedEvent.id, 'ORDER_CANCELLED')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}