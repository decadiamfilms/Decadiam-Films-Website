import React, { useState, useEffect } from 'react';
import { 
  BellIcon, XMarkIcon, CheckCircleIcon, ClockIcon,
  ExclamationTriangleIcon, InformationCircleIcon,
  TruckIcon, DocumentTextIcon, BanknotesIcon,
  UserIcon, CalendarIcon, EyeIcon, CogIcon,
  TrashIcon, ArchiveBoxIcon, FunnelIcon,
  ArrowTopRightOnSquareIcon, AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { usePurchaseOrderWebSocket, WebSocketMessage } from '../../services/PurchaseOrderWebSocketService';
import NotificationCenterService from '../../services/NotificationCenterService';
import NotificationPreferencesManager from '../admin/NotificationPreferencesManager';

interface RealtimeNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedOrders?: Set<string>;
  orders?: any[];
}

export default function RealtimeNotificationCenter({ isOpen, onClose, pinnedOrders, orders }: RealtimeNotificationCenterProps) {
  const [internalNotifications, setInternalNotifications] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'APPROVALS' | 'ACTION_REQUIRED' | 'TODAY'>('ALL');
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  const { connectionStatus } = usePurchaseOrderWebSocket({
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      // Convert WebSocket messages to internal notifications
      const notificationService = NotificationCenterService.getInstance();
      notificationService.handleWebSocketMessage(message);
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadNotificationData();
    }
  }, [isOpen]);

  // Generate notifications from pinned orders
  const generatePinnedOrderNotifications = () => {
    if (!pinnedOrders || !orders) return [];
    
    return Array.from(pinnedOrders).map(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;
      
      return {
        id: `pinned-${orderId}`,
        type: 'URGENT_ALERT',
        title: 'Urgent Order Pinned',
        message: `${order.poNumber} - ${order.supplierName} (${order.customerName || 'No customer'})`,
        details: `Status: ${order.status.replace('_', ' ')} • Due: ${order.expectedDelivery} • Amount: $${order.totalAmount?.toLocaleString() || '0'}`,
        priority: 'URGENT',
        category: 'URGENT',
        actionRequired: true,
        actionUrl: `/inventory/purchase-orders`,
        actionText: 'View Order',
        createdAt: new Date(),
        readAt: null
      };
    }).filter(Boolean);
  };

  const loadNotificationData = () => {
    const notificationService = NotificationCenterService.getInstance();
    
    // Subscribe to notification updates
    notificationService.subscribe('notification-center', (notifications) => {
      setInternalNotifications(notifications);
    });

    // Load current stats
    const stats = notificationService.getNotificationStats();
    setNotificationStats(stats);

    // Load user preferences
    const prefs = notificationService.getUserPreferences();
    setUserPreferences(prefs);
  };

  useEffect(() => {
    return () => {
      // Cleanup subscription
      const notificationService = NotificationCenterService.getInstance();
      notificationService.unsubscribe('notification-center');
    };
  }, []);

  // Combine internal notifications with pinned order notifications
  const pinnedNotifications = generatePinnedOrderNotifications();
  const allNotifications = [...internalNotifications, ...pinnedNotifications];

  const filteredNotifications = allNotifications.filter(notification => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'URGENT':
        return notification.priority === 'URGENT';
      case 'APPROVALS':
        return notification.category === 'APPROVALS';
      case 'ACTION_REQUIRED':
        return notification.actionRequired && !notification.readAt;
      case 'TODAY':
        return notification.createdAt >= today;
      default:
        return true;
    }
  });

  const markAsRead = (notificationId: string) => {
    const notificationService = NotificationCenterService.getInstance();
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    const notificationService = NotificationCenterService.getInstance();
    const marked = notificationService.markAllAsRead();
    if (marked > 0) {
      loadNotificationData();
    }
  };

  const dismissNotification = (notificationId: string) => {
    const notificationService = NotificationCenterService.getInstance();
    notificationService.dismissNotification(notificationId);
  };

  const navigateToAction = (notification: any) => {
    if (notification.actionUrl) {
      // Mark as read when user takes action
      markAsRead(notification.id);
      // In a real app, would use router navigation
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE_ORDER_CREATED':
        return <DocumentTextIcon className="w-5 h-5 text-blue-600" />;
      case 'STATUS_CHANGED':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'APPROVAL_REQUIRED':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'APPROVAL_COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'SUPPLIER_CONFIRMED':
        return <TruckIcon className="w-5 h-5 text-blue-600" />;
      case 'GOODS_RECEIVED':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'INVOICE_CREATED':
        return <BanknotesIcon className="w-5 h-5 text-purple-600" />;
      case 'URGENT_ALERT':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationTitle = (message: WebSocketMessage): string => {
    switch (message.type) {
      case 'PURCHASE_ORDER_CREATED':
        return 'New Purchase Order Created';
      case 'STATUS_CHANGED':
        return `Status Updated: ${message.data.newStatus.replace('_', ' ')}`;
      case 'APPROVAL_REQUIRED':
        return 'Approval Required';
      case 'APPROVAL_COMPLETED':
        return `Order ${message.data.action === 'approve' ? 'Approved' : 'Rejected'}`;
      case 'SUPPLIER_CONFIRMED':
        return 'Supplier Confirmation Received';
      case 'GOODS_RECEIVED':
        return 'Goods Receipt Processed';
      case 'INVOICE_CREATED':
        return 'Invoice Created';
      case 'URGENT_ALERT':
        return 'URGENT ALERT';
      default:
        return message.type.replace('_', ' ');
    }
  };

  const getNotificationMessage = (message: WebSocketMessage): string => {
    switch (message.type) {
      case 'PURCHASE_ORDER_CREATED':
        return `${message.data.purchaseOrderNumber} created for ${message.data.supplierName} ($${message.data.totalAmount.toLocaleString()})`;
      case 'STATUS_CHANGED':
        return `${message.data.purchaseOrderNumber} changed from ${message.data.previousStatus} to ${message.data.newStatus}`;
      case 'APPROVAL_REQUIRED':
        return `${message.data.purchaseOrderNumber} requires approval ($${message.data.totalAmount.toLocaleString()})`;
      case 'APPROVAL_COMPLETED':
        return `${message.data.purchaseOrderNumber} ${message.data.action}d by ${message.data.approvedBy}`;
      case 'SUPPLIER_CONFIRMED':
        return `${message.data.supplierName} confirmed ${message.data.purchaseOrderNumber}`;
      case 'GOODS_RECEIVED':
        return `${message.data.purchaseOrderNumber} ${message.data.receiptType.toLowerCase()} receipt by ${message.data.receivedBy}`;
      case 'INVOICE_CREATED':
        return `${message.data.purchaseOrderNumber} invoice created - dispatch unblocked`;
      case 'URGENT_ALERT':
        return message.data.message;
      default:
        return JSON.stringify(message.data);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Real-Time Notifications</h3>
              <p className="text-gray-600">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                {notificationStats && (
                  <>
                    {' • '}
                    <span className="font-medium text-orange-600">
                      {notificationStats.actionRequiredCount} action{notificationStats.actionRequiredCount !== 1 ? 's' : ''} required
                    </span>
                    {' • '}
                    <span className={`font-medium ${
                      connectionStatus.connected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {connectionStatus.connected ? 'Live Updates' : 'Offline'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notificationStats && notificationStats.unreadNotifications > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Mark All Read ({notificationStats.unreadNotifications})
              </button>
            )}
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <CogIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { key: 'ALL', label: 'All Notifications', count: allNotifications.length },
              { key: 'URGENT', label: 'Urgent', count: allNotifications.filter(n => n.priority === 'URGENT' && !n.readAt).length },
              { key: 'APPROVALS', label: 'Approvals', count: allNotifications.filter(n => n.category === 'APPROVALS' && !n.readAt).length },
              { key: 'ACTION_REQUIRED', label: 'Action Required', count: allNotifications.filter(n => n.actionRequired && !n.readAt).length },
              { key: 'TODAY', label: 'Today', count: allNotifications.filter(n => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return n.createdAt >= today;
              }).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h4>
              <p className="text-gray-600">Real-time notifications will appear here when events occur</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 transition-colors ${
                    notification.readAt ? 'bg-white opacity-75' : 'bg-blue-50'
                  } ${
                    notification.priority === 'URGENT' ? 'border-l-4 border-red-500' :
                    notification.priority === 'HIGH' ? 'border-l-4 border-orange-500' :
                    notification.actionRequired ? 'border-l-4 border-blue-500' :
                    ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className={`font-medium truncate ${
                            notification.readAt ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h5>
                          <p className={`text-sm mt-1 ${
                            notification.readAt ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.details && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.details}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            notification.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.priority}
                          </span>
                          {!notification.readAt && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500">
                            {notification.createdAt.toLocaleString()}
                          </span>
                          {notification.category && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {notification.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {notification.actionRequired && notification.actionUrl && (
                            <button
                              onClick={() => navigateToAction(notification)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                              {notification.actionText || 'Take Action'}
                            </button>
                          )}
                          {!notification.readAt && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Mark as Read"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Dismiss"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Status Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus.connected ? 'bg-green-500' :
                connectionStatus.reconnecting ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-gray-600">
                {connectionStatus.connected ? 'Real-time updates active' :
                 connectionStatus.reconnecting ? `Reconnecting... (attempt ${connectionStatus.reconnectAttempts})` :
                 'Working offline - updates will sync when reconnected'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {notificationStats && (
                <span className="text-gray-600">
                  {notificationStats.totalNotifications} total • {notificationStats.unreadNotifications} unread
                </span>
              )}
              {connectionStatus.queuedMessages > 0 && (
                <span className="text-orange-600 font-medium">
                  {connectionStatus.queuedMessages} queued
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Notification Preferences Modal */}
      <NotificationPreferencesManager
        isOpen={showPreferences}
        onClose={() => {
          setShowPreferences(false);
          loadNotificationData(); // Refresh after preferences change
        }}
      />
    </div>
  );
}