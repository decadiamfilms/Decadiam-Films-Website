import React, { useState, useEffect } from 'react';
import { 
  BellIcon, XMarkIcon, CheckCircleIcon, CogIcon,
  EnvelopeIcon, DevicePhoneMobileIcon, ClockIcon,
  AdjustmentsHorizontalIcon, UserIcon, ShieldCheckIcon,
  InformationCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import NotificationCenterService from '../../services/NotificationCenterService';

interface NotificationPreferencesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPreferencesManager({ isOpen, onClose }: NotificationPreferencesManagerProps) {
  const [preferences, setPreferences] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = () => {
    const notificationService = NotificationCenterService.getInstance();
    const prefs = notificationService.getUserPreferences();
    setPreferences(prefs);

    const stats = notificationService.getNotificationStats();
    setNotificationStats(stats);
  };

  const updatePreference = (category: string, channel: string, value: boolean) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        [category]: {
          ...preferences.preferences[category],
          [channel]: value
        }
      }
    };

    setPreferences(updatedPreferences);
  };

  const updateQuietHours = (field: string, value: any) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [field]: value
      }
    };

    setPreferences(updatedPreferences);
  };

  const updateFrequency = (field: string, value: any) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      frequency: {
        ...preferences.frequency,
        [field]: value
      }
    };

    setPreferences(updatedPreferences);
  };

  const toggleCategory = (category: string) => {
    if (!preferences) return;

    const currentFilters = preferences.filters.categories;
    const updatedCategories = currentFilters.includes(category)
      ? currentFilters.filter((c: string) => c !== category)
      : [...currentFilters, category];

    const updatedPreferences = {
      ...preferences,
      filters: {
        ...preferences.filters,
        categories: updatedCategories
      }
    };

    setPreferences(updatedPreferences);
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    
    try {
      const notificationService = NotificationCenterService.getInstance();
      notificationService.updateNotificationPreferences(preferences);
      
      alert('Notification preferences saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !preferences) return null;

  const notificationTypes = [
    { key: 'orderCreated', label: 'Purchase Order Created', description: 'When new purchase orders are created' },
    { key: 'approvalRequired', label: 'Approval Required', description: 'When orders require your approval' },
    { key: 'supplierConfirmed', label: 'Supplier Confirmed', description: 'When suppliers confirm orders' },
    { key: 'goodsReceived', label: 'Goods Received', description: 'When items are received and processed' },
    { key: 'invoiceCreated', label: 'Invoice Created', description: 'When invoices are created and dispatch unblocked' },
    { key: 'orderCompleted', label: 'Order Completed', description: 'When purchase orders are completed' },
    { key: 'urgentAlerts', label: 'Urgent Alerts', description: 'Critical issues requiring immediate attention' },
    { key: 'supplierTimeouts', label: 'Supplier Timeouts', description: 'When suppliers are overdue on confirmations' },
    { key: 'systemAlerts', label: 'System Alerts', description: 'System notifications and updates' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
              <p className="text-gray-600">Customize your purchase order notification settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Current Stats */}
          {notificationStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Your Notification Activity</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{notificationStats.unreadNotifications}</div>
                  <div className="text-sm text-blue-700">Unread</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900">{notificationStats.actionRequiredCount}</div>
                  <div className="text-sm text-orange-700">Action Required</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{notificationStats.todaysNotifications}</div>
                  <div className="text-sm text-green-700">Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">{notificationStats.thisWeeksNotifications}</div>
                  <div className="text-sm text-purple-700">This Week</div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Type Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Notification Types</h4>
              <p className="text-sm text-gray-600">Choose how you want to receive different types of notifications</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Notification Type
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      In-App
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Push
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notificationTypes.map((type, index) => (
                    <tr key={type.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={preferences.preferences[type.key]?.inApp || false}
                          onChange={(e) => updatePreference(type.key, 'inApp', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={preferences.preferences[type.key]?.email || false}
                          onChange={(e) => updatePreference(type.key, 'email', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={preferences.preferences[type.key]?.push || false}
                          onChange={(e) => updatePreference(type.key, 'push', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Quiet Hours</h4>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable quiet hours</span>
              </label>
              
              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => updateQuietHours('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => updateQuietHours('endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frequency Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Delivery Frequency</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Digest</label>
                <select
                  value={preferences.frequency.emailDigest}
                  onChange={(e) => updateFrequency('emailDigest', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="HOURLY">Hourly Digest</option>
                  <option value="DAILY">Daily Digest</option>
                  <option value="WEEKLY">Weekly Digest</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Notifications/Hour</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={preferences.frequency.maxNotificationsPerHour}
                  onChange={(e) => updateFrequency('maxNotificationsPerHour', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Notification Categories</h4>
            <p className="text-sm text-gray-600 mb-4">Choose which categories you want to receive notifications for</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['ORDERS', 'APPROVALS', 'SUPPLIERS', 'FINANCE', 'SYSTEM'].map(category => (
                <label key={category} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category.toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Priority Levels</h4>
            <p className="text-sm text-gray-600 mb-4">Select which priority levels you want to see</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
                { key: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                { key: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
                { key: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
              ].map(priority => (
                <label key={priority.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.filters.priorities.includes(priority.key)}
                    onChange={(e) => {
                      const currentPriorities = preferences.filters.priorities;
                      const updatedPriorities = e.target.checked
                        ? [...currentPriorities, priority.key]
                        : currentPriorities.filter((p: string) => p !== priority.key);
                      
                      setPreferences({
                        ...preferences,
                        filters: {
                          ...preferences.filters,
                          priorities: updatedPriorities
                        }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Advanced Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.filters.excludeOwnActions}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    filters: {
                      ...preferences.filters,
                      excludeOwnActions: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Exclude notifications for my own actions</span>
              </label>
              
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span>In-app notifications appear in the notification center</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>Email notifications are sent to your email address</span>
                </div>
                <div className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                  <span>Push notifications appear on your device (when available)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Actions Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Changes will take effect immediately for new notifications
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}