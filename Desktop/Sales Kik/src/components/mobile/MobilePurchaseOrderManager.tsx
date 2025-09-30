import React, { useState, useEffect } from 'react';
import { 
  CameraIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon,
  TruckIcon, PhoneIcon, ExclamationTriangleIcon, InformationCircleIcon,
  BellIcon, UserIcon, BuildingOfficeIcon, CubeIcon,
  QrCodeIcon, DevicePhoneMobileIcon, WifiIcon, SignalIcon
} from '@heroicons/react/24/outline';

// Mobile-specific interfaces
interface MobileOrderStatus {
  orderId: string;
  purchaseOrderNumber: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  lastUpdate: Date;
  priority: string;
  nextAction?: string;
  offlineStatus?: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

interface MobileNotification {
  id: string;
  type: 'ORDER_UPDATE' | 'APPROVAL_REQUIRED' | 'DELIVERY_ALERT' | 'URGENT_ACTION';
  title: string;
  message: string;
  purchaseOrderId?: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
}

interface MobilePurchaseOrderManagerProps {
  isMobile: boolean;
}

export default function MobilePurchaseOrderManager({ isMobile }: MobilePurchaseOrderManagerProps) {
  const [orders, setOrders] = useState<MobileOrderStatus[]>([]);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isMobile) {
      loadMobileData();
      setupOfflineSupport();
      setupPushNotifications();
      startSyncProcess();
    }
  }, [isMobile]);

  const loadMobileData = () => {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    
    const mobileOrders: MobileOrderStatus[] = purchaseOrders.map((order: any) => ({
      orderId: order.id,
      purchaseOrderNumber: order.purchaseOrderNumber,
      supplierName: order.supplier.supplierName,
      status: order.status,
      totalAmount: order.totalAmount,
      lastUpdate: new Date(order.updatedAt),
      priority: order.priorityLevel,
      nextAction: getNextAction(order),
      offlineStatus: 'SYNCED'
    }));

    setOrders(mobileOrders);
    loadNotifications();
  };

  const getNextAction = (order: any): string | undefined => {
    switch (order.status) {
      case 'PENDING_APPROVAL':
        return 'Awaiting manager approval';
      case 'APPROVED':
        return 'Ready to send to supplier';
      case 'SENT_TO_SUPPLIER':
        return 'Awaiting supplier confirmation';
      case 'SUPPLIER_CONFIRMED':
        return 'Awaiting delivery';
      case 'FULLY_RECEIVED':
        return 'Invoice creation required';
      default:
        return undefined;
    }
  };

  const loadNotifications = () => {
    const savedNotifications = localStorage.getItem('saleskik-mobile-notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('Error loading mobile notifications:', error);
      }
    } else {
      // Create sample notifications
      const sampleNotifications: MobileNotification[] = [
        {
          id: '1',
          type: 'APPROVAL_REQUIRED',
          title: 'Approval Required',
          message: 'PO-2024-001 requires manager approval ($15,750)',
          purchaseOrderId: '1',
          timestamp: new Date(),
          read: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'DELIVERY_ALERT',
          title: 'Delivery Confirmed',
          message: 'Premium Glass Solutions confirmed delivery for tomorrow',
          purchaseOrderId: '2',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
          actionRequired: false
        }
      ];
      
      setNotifications(sampleNotifications);
      localStorage.setItem('saleskik-mobile-notifications', JSON.stringify(sampleNotifications));
    }
  };

  // Offline support
  const setupOfflineSupport = () => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log('Syncing offline queue:', offlineQueue.length, 'items');
    
    // Process offline actions
    for (const queueItem of offlineQueue) {
      try {
        await processOfflineAction(queueItem);
      } catch (error) {
        console.error('Error processing offline action:', error);
      }
    }

    setOfflineQueue([]);
    localStorage.removeItem('saleskik-offline-queue');
  };

  const processOfflineAction = async (queueItem: any) => {
    switch (queueItem.type) {
      case 'STATUS_UPDATE':
        // Sync status updates
        break;
      case 'RECEIPT_PHOTO':
        // Upload receipt photos
        break;
      case 'NOTIFICATION_READ':
        // Mark notifications as read
        break;
    }
  };

  // Push notifications setup
  const setupPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered for push notifications');
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Push notifications enabled');
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Camera integration for receipt documentation
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      });
      setShowCamera(true);
      
      // In production, this would show camera interface
      console.log('Camera started for receipt documentation');
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied or not available');
    }
  };

  const captureReceiptPhoto = async (orderId: string) => {
    // In production, this would capture photo and associate with order
    const photoData = {
      id: Date.now().toString(),
      orderId,
      timestamp: new Date(),
      type: 'RECEIPT_DOCUMENTATION'
    };

    if (!isOnline) {
      // Queue for offline sync
      const queueItem = {
        type: 'RECEIPT_PHOTO',
        data: photoData,
        timestamp: new Date()
      };
      setOfflineQueue(prev => [...prev, queueItem]);
      localStorage.setItem('saleskik-offline-queue', JSON.stringify([...offlineQueue, queueItem]));
    }

    console.log('Receipt photo captured:', photoData);
  };

  // Start periodic sync process
  const startSyncProcess = () => {
    setInterval(() => {
      if (isOnline) {
        loadMobileData(); // Refresh data every 30 seconds when online
      }
    }, 30000);
  };

  const markNotificationRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('saleskik-mobile-notifications', JSON.stringify(updatedNotifications));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'SENT_TO_SUPPLIER': 'bg-blue-100 text-blue-800',
      'SUPPLIER_CONFIRMED': 'bg-indigo-100 text-indigo-800',
      'FULLY_RECEIVED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'NORMAL': 'bg-green-100 text-green-800',
      'HIGH': 'bg-yellow-100 text-yellow-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (!isMobile) return null;

  return (
    <div className="mobile-purchase-order-manager">
      
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Purchase Orders</h1>
            <div className="flex items-center gap-3">
              
              {/* Connection Status */}
              <div className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? (
                  <WifiIcon className="w-4 h-4" />
                ) : (
                  <SignalIcon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Camera for receipts */}
              <button
                onClick={startCamera}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Document Receipt"
              >
                <CameraIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Notifications Panel */}
      {showNotifications && (
        <div className="bg-white border-b border-gray-200 max-h-64 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'URGENT_ACTION' ? 'bg-red-100 text-red-600' :
                        notification.type === 'APPROVAL_REQUIRED' ? 'bg-yellow-100 text-yellow-600' :
                        notification.type === 'DELIVERY_ALERT' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'URGENT_ACTION' && <ExclamationTriangleIcon className="w-4 h-4" />}
                        {notification.type === 'APPROVAL_REQUIRED' && <ClockIcon className="w-4 h-4" />}
                        {notification.type === 'DELIVERY_ALERT' && <TruckIcon className="w-4 h-4" />}
                        {notification.type === 'ORDER_UPDATE' && <InformationCircleIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{notification.title}</div>
                        <div className="text-sm text-gray-600">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleString()}
                        </div>
                      </div>
                      {notification.actionRequired && (
                        <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Action Required
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Order List */}
      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
            <p className="text-gray-600">Orders will appear here when created</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.orderId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{order.purchaseOrderNumber}</h3>
                  <p className="text-sm text-gray-600">{order.supplierName}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${order.totalAmount.toLocaleString('en-AU')}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
                <div className={`flex items-center gap-1 ${
                  order.offlineStatus === 'SYNCED' ? 'text-green-600' :
                  order.offlineStatus === 'PENDING' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    order.offlineStatus === 'SYNCED' ? 'bg-green-500' :
                    order.offlineStatus === 'PENDING' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-xs">{order.offlineStatus}</span>
                </div>
              </div>

              {/* Next Action */}
              {order.nextAction && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">{order.nextAction}</span>
                  </div>
                </div>
              )}

              {/* Mobile Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  View Details
                </button>
                {order.status === 'SUPPLIER_CONFIRMED' && (
                  <button
                    onClick={() => captureReceiptPhoto(order.orderId)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <CameraIcon className="w-4 h-4" />
                    Receipt
                  </button>
                )}
                {order.status === 'PENDING_APPROVAL' && (
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium">
                    Approve
                  </button>
                )}
              </div>

              {/* Last Update */}
              <div className="text-xs text-gray-500 mt-2 text-right">
                Updated: {order.lastUpdate.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800">Working Offline</div>
              <div className="text-sm text-yellow-700">
                Changes will sync when connection is restored
                {offlineQueue.length > 0 && ` (${offlineQueue.length} pending)`}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Progressive Web App features
export class PWAManager {
  private static instance: PWAManager;

  private constructor() {}

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Install PWA prompt
  public async promptInstall(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA service worker registered');
        
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          // Show custom install prompt
          this.showInstallPrompt(e);
        });

        return true;
      } catch (error) {
        console.error('PWA registration failed:', error);
        return false;
      }
    }
    return false;
  }

  private showInstallPrompt(event: any) {
    const installBanner = document.createElement('div');
    installBanner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
    installBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">Install SalesKik App</div>
          <div class="text-sm opacity-90">Get faster access and offline support</div>
        </div>
        <div class="flex gap-2">
          <button id="install-dismiss" class="px-3 py-1 bg-blue-700 rounded text-sm">
            Not Now
          </button>
          <button id="install-accept" class="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium">
            Install
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    document.getElementById('install-accept')?.addEventListener('click', () => {
      event.prompt();
      document.body.removeChild(installBanner);
    });

    document.getElementById('install-dismiss')?.addEventListener('click', () => {
      document.body.removeChild(installBanner);
    });
  }

  // Background sync for offline actions
  public registerBackgroundSync(tag: string, data: any): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Store sync data
        localStorage.setItem(`sync-${tag}`, JSON.stringify(data));
        
        // Register background sync
        return (registration as any).sync.register(tag);
      }).catch(error => {
        console.error('Background sync registration failed:', error);
      });
    }
  }

  // Push notification helpers
  public async sendPushNotification(notification: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // In production, this would send via push service
        console.log('Push notification would be sent:', notification);
      }
    }
  }
}

// Service Worker Content (to be saved as public/sw.js)
export const serviceWorkerContent = `
self.addEventListener('install', event => {
  console.log('Purchase Order SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Purchase Order SW activated');
  clients.claim();
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'purchase-order-sync') {
    event.waitUntil(syncPurchaseOrderData());
  }
});

async function syncPurchaseOrderData() {
  try {
    // Sync offline purchase order data
    console.log('Background sync: Purchase order data');
    
    // In production, this would sync with server
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const notification = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: notification.data,
        actions: notification.actions || [
          { action: 'view', title: 'View Order' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' && event.notification.data?.orderId) {
    event.waitUntil(
      clients.openWindow(\`/inventory/purchase-orders/\${event.notification.data.orderId}\`)
    );
  }
});
`;