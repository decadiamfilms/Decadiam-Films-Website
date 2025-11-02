import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon, XMarkIcon, CheckIcon, CalendarIcon,
  UserIcon, CurrencyDollarIcon, ShoppingCartIcon, ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  deliveryAddress: string;
  orderDate: string;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    volume?: number;
  }>;
  customerPhone?: string;
  customerEmail?: string;
}

interface OrderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrdersSelected: (orders: Order[]) => void;
  selectedOrders: Order[];
}

const OrderSelectionModal: React.FC<OrderSelectionModalProps> = ({
  isOpen,
  onClose,
  onOrdersSelected,
  selectedOrders
}) => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('CONFIRMED');

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  useEffect(() => {
    filterOrders();
  }, [availableOrders, searchTerm, dateFilter, customerFilter, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Try to fetch from database
      const response = await fetch('/api/orders');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform database orders to our interface
          const transformedOrders = data.data.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number || order.orderNumber,
            customerName: order.customer?.name || 'Unknown Customer',
            customerId: order.customer_id || order.customerId,
            deliveryAddress: order.customer?.delivery_address || order.customer?.address || 'Address needed',
            orderDate: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            total: order.total || 0,
            status: order.status || 'CONFIRMED',
            items: order.line_items || order.items || [],
            customerPhone: order.customer?.phone,
            customerEmail: order.customer?.email
          }));
          
          setAvailableOrders(transformedOrders);
          console.log('✅ Loaded', transformedOrders.length, 'orders from database');
          return;
        }
      }

      // Fallback: Use mock orders for demonstration
      const mockOrders: Order[] = [
        {
          id: 'order-001',
          orderNumber: 'ORD-20250102-001',
          customerName: 'ABC Hardware',
          customerId: 'customer-001',
          deliveryAddress: '123 Main St, Chatswood NSW 2067',
          orderDate: '2025-01-02',
          total: 2450.00,
          status: 'CONFIRMED',
          items: [
            { name: 'Glass Panel 12mm', quantity: 5, weight: 50, volume: 0.5 },
            { name: 'Steel Frame', quantity: 10, weight: 80, volume: 1.2 }
          ],
          customerPhone: '0412 345 678',
          customerEmail: 'orders@abchardware.com'
        },
        {
          id: 'order-002',
          orderNumber: 'ORD-20250102-002',
          customerName: 'XYZ Building Supplies',
          customerId: 'customer-002',
          deliveryAddress: '456 Pacific Hwy, North Sydney NSW 2060',
          orderDate: '2025-01-02',
          total: 1850.00,
          status: 'CONFIRMED',
          items: [
            { name: 'Aluminum Posts', quantity: 15, weight: 45, volume: 0.8 }
          ],
          customerPhone: '0423 456 789',
          customerEmail: 'deliveries@xyzbuild.com.au'
        },
        {
          id: 'order-003',
          orderNumber: 'ORD-20250103-001',
          customerName: 'Pro Construction Co',
          customerId: 'customer-003',
          deliveryAddress: '789 George St, Sydney NSW 2000',
          orderDate: '2025-01-03',
          total: 3200.00,
          status: 'READY',
          items: [
            { name: 'Concrete Panels', quantity: 8, weight: 120, volume: 2.0 },
            { name: 'Reinforcement Bar', quantity: 20, weight: 100, volume: 1.5 }
          ],
          customerPhone: '0434 567 890',
          customerEmail: 'logistics@proconstruction.com.au'
        }
      ];

      setAvailableOrders(mockOrders);
      console.log('ℹ️ Using mock orders for demonstration');

    } catch (error) {
      console.error('Error fetching orders:', error);
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = availableOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(order => order.orderDate === dateFilter);
    }

    // Customer filter
    if (customerFilter) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const toggleOrderSelection = (order: Order) => {
    const isSelected = selectedOrders.find(o => o.id === order.id);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedOrders.filter(o => o.id !== order.id);
    } else {
      newSelection = [...selectedOrders, order];
    }
    
    onOrdersSelected(newSelection);
  };

  const selectAllFiltered = () => {
    const newSelection = [...selectedOrders];
    filteredOrders.forEach(order => {
      if (!selectedOrders.find(o => o.id === order.id)) {
        newSelection.push(order);
      }
    });
    onOrdersSelected(newSelection);
  };

  const clearSelection = () => {
    onOrdersSelected([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Orders for Delivery</h2>
              <p className="text-gray-600 mt-1">Choose confirmed orders to include in delivery run</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order number or customer..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <input
                type="text"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Customer name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="READY">Ready for Delivery</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {filteredOrders.length} orders found • {selectedOrders.length} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllFiltered}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Select All ({filteredOrders.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {availableOrders.length === 0 
                  ? 'No confirmed orders available for delivery'
                  : 'Try adjusting your filters to see more orders'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrders.find(o => o.id === order.id);
                
                return (
                  <div
                    key={order.id}
                    onClick={() => toggleOrderSelection(order)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleOrderSelection(order)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              {order.customerName}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                              ${order.total.toFixed(2)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        {order.customerPhone && (
                          <div className="text-xs text-gray-500">{order.customerPhone}</div>
                        )}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {isSelected && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 rounded p-3">
                        <h5 className="text-xs font-medium text-blue-900 mb-2">Items for delivery:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.items.slice(0, 6).map((item, index) => (
                            <div key={index} className="text-xs text-blue-700">
                              • {item.quantity}x {item.name}
                              {item.weight && ` (${item.weight}kg)`}
                            </div>
                          ))}
                          {order.items.length > 6 && (
                            <div className="text-xs text-blue-600 font-medium">
                              + {order.items.length - 6} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{selectedOrders.length}</strong> orders selected
              {selectedOrders.length > 0 && (
                <span className="ml-2">
                  • Total value: <strong>${selectedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</strong>
                  • Total items: <strong>{selectedOrders.reduce((sum, order) => sum + order.items.length, 0)}</strong>
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedOrders.length === 0) {
                    alert('Please select at least one order');
                    return;
                  }
                  onClose();
                }}
                disabled={selectedOrders.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Use {selectedOrders.length} Order{selectedOrders.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSelectionModal;