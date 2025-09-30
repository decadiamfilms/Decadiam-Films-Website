import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';

interface ReceiptItem {
  id: string;
  productName: string;
  productType: string;
  category: string;
  orderedQuantity: number;
  receivedQuantity: number;
  status: 'pending' | 'partial' | 'received' | 'missing' | 'damaged';
  notes?: string;
  photos?: string[];
  damageDescription?: string;
  expectedDate?: string;
  damagedQuantity?: number;
  missingQuantity?: number;
  damageDetails?: {
    quantity: number;
    reason: string;
    reportedBy: string;
    timestamp: string;
  }[];
}

interface HistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  action: 'received' | 'approved' | 'damaged' | 'missing';
  quantity: number;
  timestamp: string;
  employeeName: string;
  notes?: string;
}

interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  customerName?: string;
  customerReference?: string;
  expectedDelivery: string;
  actualDelivery?: string;
  deliveryStatus: 'pending' | 'partial' | 'complete' | 'overdue';
  receivedBy?: string;
  items: ReceiptItem[];
  approvedItems: ReceiptItem[];
  totalItems: number;
  receivedItems: number;
  missingItems: number;
  damagedItems: number;
  notes?: string;
  signatureRequired: boolean;
  signatureReceived: boolean;
  deliveryPhotos?: string[];
  history: HistoryEntry[];
}

export default function GoodsReceiptPage() {
  const navigate = useNavigate();
  const { receiptId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'receive' | 'missing' | 'damaged' | 'summary' | 'history'>('receive');

  useEffect(() => {
    // Try to load saved receipt state first
    try {
      const savedState = localStorage.getItem(`saleskik-goods-receipt-${receiptId || 'receipt-1'}`);
      if (savedState) {
        setReceipt(JSON.parse(savedState));
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error loading saved receipt state:', error);
    }

    // Mock goods receipt data - in production this would come from API
    const mockReceipt: GoodsReceipt = {
      id: receiptId || 'receipt-1',
      purchaseOrderId: 'po-1',
      poNumber: 'PO-2025-00147',
      supplierName: 'Sydney Glass Co',
      customerName: 'Johnson Construction',
      customerReference: 'Site Office Glass Project',
      expectedDelivery: '2025-09-19',
      actualDelivery: new Date().toISOString().split('T')[0],
      deliveryStatus: 'partial',
      totalItems: 4,
      receivedItems: 2,
      missingItems: 1,
      damagedItems: 1,
      signatureRequired: true,
      signatureReceived: false,
      approvedItems: [
        {
          id: 'approved-1',
          productName: '8mm Clear Glass Panel 1000x600mm',
          productType: 'Glass Panel',
          category: 'Clear Glass',
          orderedQuantity: 2,
          receivedQuantity: 2,
          status: 'received'
        }
      ],
      history: [
        {
          id: 'hist-1',
          itemId: 'approved-1',
          itemName: '8mm Clear Glass Panel 1000x600mm',
          action: 'received',
          quantity: 2,
          timestamp: '2025-09-21 09:30:00',
          employeeName: 'Sarah Johnson'
        },
        {
          id: 'hist-2',
          itemId: 'approved-1',
          itemName: '8mm Clear Glass Panel 1000x600mm',
          action: 'approved',
          quantity: 2,
          timestamp: '2025-09-21 09:35:00',
          employeeName: 'Sarah Johnson',
          notes: 'Quality checked - good condition'
        }
      ],
      items: [
        {
          id: '1',
          productName: '10mm Tempered Glass Panel 1200x800mm',
          productType: 'Glass Panel',
          category: 'Tempered Glass',
          orderedQuantity: 5,
          receivedQuantity: 4,
          status: 'partial',
          notes: '1 panel had minor chip on corner'
        },
        {
          id: '2',
          productName: '12mm Tempered Glass Panel 1000x600mm',
          productType: 'Glass Panel',
          category: 'Tempered Glass',
          orderedQuantity: 3,
          receivedQuantity: 3,
          status: 'received'
        },
        {
          id: '3',
          productName: 'Aluminum Window Frame Set',
          productType: 'Hardware',
          category: 'Window Frames',
          orderedQuantity: 2,
          receivedQuantity: 0,
          status: 'missing',
          notes: 'Expected in next delivery',
          expectedDate: '2025-09-22'
        },
        {
          id: '4',
          productName: 'Premium Sealing Kit',
          productType: 'Hardware',
          category: 'Sealing',
          orderedQuantity: 1,
          receivedQuantity: 1,
          status: 'damaged',
          damageDescription: 'Box was crushed, contents spilled',
          notes: 'Replacement needed urgently'
        }
      ]
    };

    setReceipt(mockReceipt);
    setLoading(false);
  }, [receiptId]);

  const createUrgentAction = (type: 'missing' | 'damaged', item: ReceiptItem, description: string) => {
    // Create urgent action for purchase orders dashboard
    const urgentAction = {
      id: `urgent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchaseOrderId: receipt?.purchaseOrderId,
      poNumber: receipt?.poNumber,
      type: type,
      itemName: item.productName,
      itemType: item.productType,
      description: description,
      quantity: type === 'missing' ? (item.orderedQuantity - item.receivedQuantity) : item.receivedQuantity,
      createdDate: new Date().toISOString().split('T')[0],
      priority: type === 'damaged' ? 'urgent' : 'high',
      status: 'pending',
      supplierName: receipt?.supplierName
    };

    // Save to localStorage for urgent actions
    try {
      const existingActions = JSON.parse(localStorage.getItem('saleskik-urgent-actions') || '[]');
      existingActions.push(urgentAction);
      localStorage.setItem('saleskik-urgent-actions', JSON.stringify(existingActions));
      
      console.log(`🚨 Created urgent action for ${type} item: ${item.productName}`);
    } catch (error) {
      console.error('Error saving urgent action:', error);
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (!receipt) return;
    
    setReceipt(prev => {
      if (!prev) return prev;
      
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          let newStatus: ReceiptItem['status'] = 'pending';
          const oldStatus = item.status;
          
          if (newQuantity === 0) {
            newStatus = 'missing';
            // Create urgent action if this is newly marked as missing
            if (oldStatus !== 'missing') {
              createUrgentAction('missing', item, `${item.orderedQuantity} items not received from ${prev.supplierName}`);
            }
          } else if (newQuantity === item.orderedQuantity) {
            newStatus = 'received';
          } else if (newQuantity > 0 && newQuantity < item.orderedQuantity) {
            newStatus = 'partial';
            // Create urgent action for partial delivery
            if (oldStatus !== 'partial' && oldStatus !== 'missing') {
              createUrgentAction('missing', item, `${item.orderedQuantity - newQuantity} items missing from delivery`);
            }
          }
          
          return { ...item, receivedQuantity: newQuantity, status: newStatus };
        }
        return item;
      });

      const totalReceived = updatedItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
      const totalMissing = updatedItems.filter(item => item.status === 'missing').length;
      const totalDamaged = updatedItems.filter(item => item.status === 'damaged').length;

      return {
        ...prev,
        items: updatedItems,
        receivedItems: totalReceived,
        missingItems: totalMissing,
        damagedItems: totalDamaged
      };
    });
  };

  const markItemDamaged = (itemId: string, damageDescription: string, damagedQuantity?: number) => {
    if (!receipt || !damageDescription) return;
    
    setReceipt(prev => {
      if (!prev) return prev;
      
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const actualDamagedQty = damagedQuantity || item.receivedQuantity;
          
          // Create urgent action for damaged item
          createUrgentAction('damaged', item, `${actualDamagedQty} of ${item.receivedQuantity} items received damaged: ${damageDescription}`);
          
          // Add to history
          const historyEntry: HistoryEntry = {
            id: `hist-${Date.now()}`,
            itemId: item.id,
            itemName: item.productName,
            action: 'damaged',
            quantity: actualDamagedQty,
            timestamp: new Date().toLocaleString(),
            employeeName: getCurrentEmployee(),
            notes: `${actualDamagedQty} damaged: ${damageDescription}`
          };
          
          // Create damage detail record
          const damageDetail = {
            quantity: actualDamagedQty,
            reason: damageDescription,
            reportedBy: getCurrentEmployee(),
            timestamp: new Date().toISOString()
          };

          return { 
            ...item, 
            status: actualDamagedQty === item.receivedQuantity ? 'damaged' as const : 'partial' as const,
            damageDescription: `${actualDamagedQty} damaged: ${damageDescription}`,
            damagedQuantity: (item.damagedQuantity || 0) + actualDamagedQty,
            damageDetails: [...(item.damageDetails || []), damageDetail],
            notes: item.notes ? `${item.notes}; ${actualDamagedQty} damaged` : `${actualDamagedQty} damaged`
          };
        }
        return item;
      });

      const totalDamaged = updatedItems.filter(item => item.status === 'damaged').length;

      // Save damaged items data to localStorage
      try {
        const damagedItemsData = JSON.parse(localStorage.getItem('saleskik-damaged-items') || '[]');
        const newDamageRecord = {
          id: `damage-${Date.now()}`,
          purchaseOrderId: prev.purchaseOrderId,
          poNumber: prev.poNumber,
          itemId: itemId,
          itemName: updatedItems.find(i => i.id === itemId)?.productName || '',
          damagedQuantity: actualDamagedQty,
          totalOrdered: updatedItems.find(i => i.id === itemId)?.orderedQuantity || 0,
          damageReason: damageDescription,
          reportedBy: getCurrentEmployee(),
          timestamp: new Date().toISOString(),
          supplierName: prev.supplierName
        };
        damagedItemsData.push(newDamageRecord);
        localStorage.setItem('saleskik-damaged-items', JSON.stringify(damagedItemsData));
      } catch (error) {
        console.error('Error saving damaged item data:', error);
      }

      const newState = { 
        ...prev, 
        items: updatedItems, 
        damagedItems: totalDamaged,
        history: [...prev.history, {
          id: `hist-${Date.now()}`,
          itemId: itemId,
          itemName: updatedItems.find(i => i.id === itemId)?.productName || '',
          action: 'damaged',
          quantity: actualDamagedQty,
          timestamp: new Date().toLocaleString(),
          employeeName: getCurrentEmployee(),
          notes: `${actualDamagedQty} damaged: ${damageDescription}`
        }]
      };

      // Save state to localStorage
      try {
        localStorage.setItem(`saleskik-goods-receipt-${prev.id}`, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving damaged item state:', error);
      }

      return newState;
    });
  };

  const markItemMissing = (itemId: string, reason: string, missingQuantity?: number) => {
    if (!receipt || !reason) return;
    
    setReceipt(prev => {
      if (!prev) return prev;
      
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const actualMissingQty = missingQuantity || (item.orderedQuantity - item.receivedQuantity);
          const newReceivedQty = Math.max(0, item.orderedQuantity - actualMissingQty);
          
          // Create urgent action for missing item
          createUrgentAction('missing', item, `${actualMissingQty} of ${item.orderedQuantity} items missing: ${reason}`);
          
          // Add to history
          const historyEntry: HistoryEntry = {
            id: `hist-${Date.now()}`,
            itemId: item.id,
            itemName: item.productName,
            action: 'missing',
            quantity: actualMissingQty,
            timestamp: new Date().toLocaleString(),
            employeeName: getCurrentEmployee(),
            notes: `${actualMissingQty} missing: ${reason}`
          };
          
          const newStatus = newReceivedQty === 0 ? 'missing' as const : 
                          newReceivedQty === item.orderedQuantity ? 'received' as const : 
                          'partial' as const;
          
          return { 
            ...item, 
            status: newStatus,
            receivedQuantity: newReceivedQty,
            missingQuantity: (item.missingQuantity || 0) + actualMissingQty,
            notes: item.notes ? `${item.notes}; ${actualMissingQty} missing` : `${actualMissingQty} missing: ${reason}`
          };
        }
        return item;
      });

      const totalMissing = updatedItems.filter(item => item.status === 'missing').length;

      // Save missing items data to localStorage
      try {
        const missingItemsData = JSON.parse(localStorage.getItem('saleskik-missing-items') || '[]');
        const newMissingRecord = {
          id: `missing-${Date.now()}`,
          purchaseOrderId: prev.purchaseOrderId,
          poNumber: prev.poNumber,
          itemId: itemId,
          itemName: updatedItems.find(i => i.id === itemId)?.productName || '',
          missingQuantity: actualMissingQty,
          totalOrdered: updatedItems.find(i => i.id === itemId)?.orderedQuantity || 0,
          missingReason: reason,
          reportedBy: getCurrentEmployee(),
          timestamp: new Date().toISOString(),
          supplierName: prev.supplierName
        };
        missingItemsData.push(newMissingRecord);
        localStorage.setItem('saleskik-missing-items', JSON.stringify(missingItemsData));
      } catch (error) {
        console.error('Error saving missing item data:', error);
      }

      const newState = { 
        ...prev, 
        items: updatedItems, 
        missingItems: totalMissing,
        history: [...prev.history, {
          id: `hist-${Date.now()}`,
          itemId: itemId,
          itemName: updatedItems.find(i => i.id === itemId)?.productName || '',
          action: 'missing',
          quantity: actualMissingQty,
          timestamp: new Date().toLocaleString(),
          employeeName: getCurrentEmployee(),
          notes: `${actualMissingQty} missing: ${reason}`
        }]
      };

      // Save state to localStorage
      try {
        localStorage.setItem(`saleskik-goods-receipt-${prev.id}`, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving missing item state:', error);
      }

      return newState;
    });
  };

  const getCurrentEmployee = () => {
    try {
      const employeeSession = localStorage.getItem('employee-session');
      if (employeeSession) {
        const employee = JSON.parse(employeeSession);
        return employee.name || 'Employee';
      }
      return 'Admin User';
    } catch {
      return 'System User';
    }
  };

  const approveItem = (itemId: string) => {
    if (!receipt) return;
    
    setReceipt(prev => {
      if (!prev) return prev;
      
      const itemToApprove = prev.items.find(item => item.id === itemId);
      if (!itemToApprove || itemToApprove.receivedQuantity === 0) return prev;
      
      // Move item to approved list
      const updatedItems = prev.items.filter(item => item.id !== itemId);
      const approvedItem = { ...itemToApprove, status: 'received' as const };
      
      // Add to history
      const historyEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        itemId: itemToApprove.id,
        itemName: itemToApprove.productName,
        action: 'approved',
        quantity: itemToApprove.receivedQuantity,
        timestamp: new Date().toLocaleString(),
        employeeName: getCurrentEmployee(),
        notes: 'Item approved and moved to stock'
      };
      
      const newState = {
        ...prev,
        items: updatedItems,
        approvedItems: [...prev.approvedItems, approvedItem],
        history: [...prev.history, historyEntry]
      };

      // Save approved items to localStorage  
      try {
        localStorage.setItem(`saleskik-goods-receipt-${prev.id}`, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving goods receipt state:', error);
      }

      return newState;
    });
  };

  const redoItem = (historyId: string) => {
    if (!receipt) return;
    
    setReceipt(prev => {
      if (!prev) return prev;
      
      const historyEntry = prev.history.find(h => h.id === historyId);
      if (!historyEntry) return prev;
      
      // Find the approved item
      const approvedItem = prev.approvedItems.find(item => item.id === historyEntry.itemId);
      if (!approvedItem) return prev;
      
      // Move back to items list
      const updatedApprovedItems = prev.approvedItems.filter(item => item.id !== historyEntry.itemId);
      const itemToRedo = { ...approvedItem, status: 'received' as const };
      
      return {
        ...prev,
        items: [...prev.items, itemToRedo],
        approvedItems: updatedApprovedItems
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'received': return 'bg-green-100 text-green-700';
      case 'missing': return 'bg-red-100 text-red-700';
      case 'damaged': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'missing': return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'damaged': return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      case 'partial': return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      default: return <CubeIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderReceiveTab = () => (
    <div className="space-y-6">
      {/* Delivery Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <div className="text-sm text-gray-900">{receipt?.expectedDelivery}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Delivery</label>
            <input
              type="date"
              value={receipt?.actualDelivery || ''}
              onChange={(e) => setReceipt(prev => prev ? { ...prev, actualDelivery: e.target.value } : prev)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
            <input
              type="text"
              value={receipt?.receivedBy || ''}
              onChange={(e) => setReceipt(prev => prev ? { ...prev, receivedBy: e.target.value } : prev)}
              placeholder="Your name"
              className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
            <select
              value={receipt?.deliveryStatus || 'pending'}
              onChange={(e) => setReceipt(prev => prev ? { ...prev, deliveryStatus: e.target.value as any } : prev)}
              className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial Delivery</option>
              <option value="complete">Complete</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Receiving */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Receive Items</h3>
          <p className="text-sm text-gray-600 mt-1">Mark quantities received for each item</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type/Category</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Ordered</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Received</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipt?.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{item.productName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{item.productType}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-bold text-gray-900">{item.orderedQuantity}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(item.id, Math.max(0, item.receivedQuantity - 1))}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={item.orderedQuantity}
                        value={item.receivedQuantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => updateItemQuantity(item.id, Math.min(item.orderedQuantity, item.receivedQuantity + 1))}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {item.receivedQuantity > 0 && item.status === 'received' && (
                        <button
                          onClick={() => approveItem(item.id)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const damagedQty = parseInt(prompt(`Damaged quantity for ${item.productName}? (Max: ${item.receivedQuantity})`) || '0');
                          if (damagedQty > 0 && damagedQty <= item.receivedQuantity) {
                            const description = prompt('Damage reason (e.g. corner chipped, destroyed, scratches):') || '';
                            if (description) {
                              markItemDamaged(item.id, description, damagedQty);
                            }
                          }
                        }}
                        className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 font-medium"
                      >
                        Mark Damaged
                      </button>
                      <button
                        onClick={() => {
                          const missingQty = parseInt(prompt(`Missing quantity for ${item.productName}?`) || '0');
                          if (missingQty > 0) {
                            markItemMissing(item.id, 'Items not delivered', missingQty);
                          }
                        }}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                      >
                        Mark Missing
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMissingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Missing Items</h3>
          <p className="text-sm text-gray-600 mt-1">Items not received in this delivery</p>
        </div>
        <div className="p-6">
          {receipt?.items.filter(item => item.status === 'missing' || item.receivedQuantity < item.orderedQuantity).map(item => (
            <div key={item.id} className="border border-red-200 rounded-lg p-4 mb-4 bg-red-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-600">{item.productType} - {item.category}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-red-600 font-medium">
                      Missing: {item.orderedQuantity - item.receivedQuantity} of {item.orderedQuantity}
                    </span>
                  </div>
                  {item.expectedDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expected: {item.expectedDate}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const expectedDate = prompt('When do you expect this item? (YYYY-MM-DD):');
                      if (expectedDate) {
                        setReceipt(prev => {
                          if (!prev) return prev;
                          const updatedItems = prev.items.map(i => 
                            i.id === item.id ? { ...i, expectedDate } : i
                          );
                          return { ...prev, items: updatedItems };
                        });
                      }
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Set Expected Date
                  </button>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.orderedQuantity)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Received
                  </button>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Missing Items</h3>
              <p className="text-gray-600">All ordered items have been received!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDamagedTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Damaged Items</h3>
          <p className="text-sm text-gray-600 mt-1">Items received with damage or defects</p>
        </div>
        <div className="p-6">
          {receipt?.items.filter(item => item.status === 'damaged').map(item => (
            <div key={item.id} className="border border-orange-200 rounded-lg p-4 mb-4 bg-orange-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-600">{item.productType} - {item.category}</p>
                  <div className="mt-2">
                    <div className="text-sm text-orange-600 font-medium">
                      Quantity Affected: {item.receivedQuantity} of {item.orderedQuantity}
                    </div>
                    {item.damageDescription && (
                      <div className="text-sm text-gray-700 mt-1">
                        Damage: {item.damageDescription}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Photos
                  </button>
                  <button
                    onClick={() => {
                      // Create reorder for damaged items
                      alert('Reorder functionality will create new PO for replacement items');
                    }}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Request Replacement
                  </button>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Damaged Items</h3>
              <p className="text-gray-600">All received items are in good condition!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Receipt History</h3>
          <p className="text-sm text-gray-600 mt-1">Complete log of all receiving activities</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date & Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipt?.history.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{entry.timestamp}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      entry.action === 'received' ? 'bg-blue-100 text-blue-800' :
                      entry.action === 'approved' ? 'bg-green-100 text-green-800' :
                      entry.action === 'damaged' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{entry.itemName}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{entry.quantity}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{entry.employeeName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">{entry.notes || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {entry.action === 'approved' && (
                      <button
                        onClick={() => redoItem(entry.id)}
                        className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        title="Redo - Move back to receive items"
                      >
                        Redo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {receipt?.history.length === 0 && (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No History Yet</h3>
            <p className="text-gray-600">Activity history will appear here as you receive items</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSummaryTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Items Received</div>
              <div className="text-2xl font-bold text-gray-900">{receipt?.receivedItems}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Missing Items</div>
              <div className="text-2xl font-bold text-gray-900">{receipt?.missingItems}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Damaged Items</div>
              <div className="text-2xl font-bold text-gray-900">{receipt?.damagedItems}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Completion</div>
              <div className="text-2xl font-bold text-gray-900">
                {receipt ? Math.round((receipt.receivedItems / receipt.totalItems) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Receipt</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Notes</label>
            <textarea
              value={receipt?.notes || ''}
              onChange={(e) => setReceipt(prev => prev ? { ...prev, notes: e.target.value } : prev)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Add any general notes about this delivery..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={receipt?.signatureReceived || false}
                onChange={(e) => setReceipt(prev => prev ? { ...prev, signatureReceived: e.target.checked } : prev)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-900">
                Delivery signature received
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Save receipt and return to PO
                  alert('Receipt saved successfully!');
                  navigate('/inventory/purchase-orders');
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Complete Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TruckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
          <p className="text-gray-600">The requested goods receipt could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <UniversalHeader
          title="Goods Receipt"
          subtitle={`${receipt.poNumber} - ${receipt.supplierName}`}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/inventory/purchase-orders')}
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Purchase Orders
            </button>
          </div>

          {/* Header Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{receipt.poNumber}</h1>
                <p className="text-gray-600">{receipt.supplierName}</p>
                {receipt.customerName && (
                  <p className="text-sm text-gray-500">Customer: {receipt.customerName}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  receipt.deliveryStatus === 'complete' ? 'bg-green-100 text-green-800' :
                  receipt.deliveryStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  receipt.deliveryStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {receipt.deliveryStatus}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Expected: {receipt.expectedDelivery}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'receive', name: 'Receive Items', icon: TruckIcon },
                  { id: 'missing', name: 'Missing Items', icon: XCircleIcon },
                  { id: 'damaged', name: 'Damaged Items', icon: ExclamationTriangleIcon },
                  { id: 'summary', name: 'Summary', icon: ClipboardDocumentCheckIcon },
                  { id: 'history', name: 'History', icon: ClockIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {selectedTab === 'receive' && renderReceiveTab()}
          {selectedTab === 'missing' && renderMissingTab()}
          {selectedTab === 'damaged' && renderDamagedTab()}
          {selectedTab === 'summary' && renderSummaryTab()}
          {selectedTab === 'history' && renderHistoryTab()}
        </main>
      </div>
    </div>
  );
}