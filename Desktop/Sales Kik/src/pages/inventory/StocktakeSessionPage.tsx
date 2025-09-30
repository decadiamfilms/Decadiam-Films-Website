import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import UniversalNavigation from '@/components/layout/UniversalNavigation';
import UniversalHeader from '@/components/layout/UniversalHeader';

interface StocktakeItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  binLocation: string;
  systemQuantity: number;
  countedQuantity: number | null;
  discrepancy: number;
  status: 'pending' | 'counted' | 'verified' | 'discrepancy';
  notes: string;
  countedBy: string;
  countedAt: string;
}

interface StocktakeSession {
  id: string;
  name: string;
  warehouse: string;
  type: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  startedAt: string;
  completedAt: string | null;
}

const StocktakeSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Session state
  const [session, setSession] = useState<StocktakeSession | null>(null);
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'counted' | 'discrepancy'>('all');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StocktakeItem | null>(null);
  const [showCountModal, setShowCountModal] = useState(false);
  const [countInput, setCountInput] = useState<number>(0);
  const [countNotes, setCountNotes] = useState('');

  useEffect(() => {
    if (sessionId) {
      loadStocktakeSession();
    }
  }, [sessionId]);

  const loadStocktakeSession = async () => {
    setLoading(true);
    try {
      // Mock data for stocktake session
      const mockSession: StocktakeSession = {
        id: sessionId || 'ST-001',
        name: 'Q4 2024 Full Count - Main Warehouse',
        warehouse: 'Main Warehouse',
        type: 'Full Stocktake',
        status: 'in_progress',
        totalItems: 1740,
        countedItems: 425,
        discrepancies: 12,
        startedAt: new Date().toISOString(),
        completedAt: null
      };

      const mockItems: StocktakeItem[] = [
        {
          id: '1',
          productId: 'prod-1',
          sku: 'GP-1200-800',
          name: 'Glass Panel 1200x800mm',
          category: 'Glass Panels',
          binLocation: 'A1-B2',
          systemQuantity: 245,
          countedQuantity: 243,
          discrepancy: -2,
          status: 'discrepancy',
          notes: 'Found 2 damaged panels',
          countedBy: 'John Smith',
          countedAt: new Date().toISOString()
        },
        {
          id: '2',
          productId: 'prod-2',
          sku: 'PFP-1800',
          name: 'Pool Fence Post 1800mm',
          category: 'Fence Posts',
          binLocation: 'B3-C1',
          systemQuantity: 8,
          countedQuantity: null,
          discrepancy: 0,
          status: 'pending',
          notes: '',
          countedBy: '',
          countedAt: ''
        },
        {
          id: '3',
          productId: 'prod-3',
          sku: 'SSB-M8-50',
          name: 'Stainless Steel Bolts M8x50',
          category: 'Hardware',
          binLocation: 'C2-D1',
          systemQuantity: 0,
          countedQuantity: 15,
          discrepancy: 15,
          status: 'discrepancy',
          notes: 'Found stock not in system',
          countedBy: 'Sarah Wilson',
          countedAt: new Date().toISOString()
        },
        {
          id: '4',
          productId: 'prod-4',
          sku: 'AWF-2000',
          name: 'Aluminum Window Frame',
          category: 'Frames',
          binLocation: 'D1-E2',
          systemQuantity: 56,
          countedQuantity: 56,
          discrepancy: 0,
          status: 'verified',
          notes: '',
          countedBy: 'Mike Johnson',
          countedAt: new Date().toISOString()
        }
      ];

      setSession(mockSession);
      setItems(mockItems);
    } catch (error) {
      console.error('Error loading stocktake session:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.binLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openCountModal = (item: StocktakeItem) => {
    setSelectedItem(item);
    setCountInput(item.countedQuantity || item.systemQuantity);
    setCountNotes(item.notes);
    setShowCountModal(true);
  };

  const saveCount = async () => {
    if (!selectedItem) return;
    
    const discrepancy = countInput - selectedItem.systemQuantity;
    const newStatus = discrepancy === 0 ? 'verified' : 'discrepancy';
    
    // Update item
    const updatedItems = items.map(item => 
      item.id === selectedItem.id 
        ? {
            ...item,
            countedQuantity: countInput,
            discrepancy,
            status: newStatus as any,
            notes: countNotes,
            countedBy: 'Current User',
            countedAt: new Date().toISOString()
          }
        : item
    );
    
    setItems(updatedItems);
    
    // Update session stats
    if (session) {
      const counted = updatedItems.filter(i => i.countedQuantity !== null).length;
      const discrepancies = updatedItems.filter(i => i.status === 'discrepancy').length;
      
      setSession({
        ...session,
        countedItems: counted,
        discrepancies
      });
    }
    
    setShowCountModal(false);
    setSelectedItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500 bg-gray-100';
      case 'counted': return 'text-blue-700 bg-blue-100';
      case 'verified': return 'text-green-700 bg-green-100';
      case 'discrepancy': return 'text-red-700 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="w-4 h-4" />;
      case 'discrepancy': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'counted': return <CheckIcon className="w-4 h-4" />;
      default: return <XCircleIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stocktake session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Stocktake Not Found</h2>
          <p className="text-gray-600 mb-4">The requested stocktake session could not be found.</p>
          <Button onClick={() => navigate('/inventory/stock-check')}>
            Return to Stock Check
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      <UniversalHeader 
        title={`Stocktake: ${session.name}`}
        subtitle={`${session.warehouse} • ${session.countedItems}/${session.totalItems} counted`}
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/inventory/stock-check')}
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Stock Check
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>{session.warehouse}</span>
                  <span>•</span>
                  <span className="capitalize">{session.type}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Scan Item
              </Button>
              <Button
                variant="primary"
                disabled={session.countedItems === 0}
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Complete Stocktake
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{session.countedItems} of {session.totalItems} items counted</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(session.countedItems / session.totalItems) * 100}%` }}
              ></div>
            </div>
            {session.discrepancies > 0 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ {session.discrepancies} discrepancies found - review required
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or bin location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Items', count: items.length },
                { value: 'pending', label: 'Pending', count: items.filter(i => i.status === 'pending').length },
                { value: 'counted', label: 'Counted', count: items.filter(i => i.status === 'counted' || i.status === 'verified').length },
                { value: 'discrepancy', label: 'Discrepancies', count: items.filter(i => i.status === 'discrepancy').length }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stock Items</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counted Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.sku} • {item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.binLocation}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {item.systemQuantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {item.countedQuantity !== null ? (
                        <span className="font-medium">{item.countedQuantity}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {item.countedQuantity !== null ? (
                        <span className={`font-medium ${
                          item.discrepancy === 0 ? 'text-green-600' :
                          item.discrepancy > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCountModal(item)}
                      >
                        {item.status === 'pending' ? 'Count' : 'Recount'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Count Modal */}
        {showCountModal && selectedItem && (
          <Modal
            isOpen={showCountModal}
            onClose={() => setShowCountModal(false)}
            title="Count Item"
            size="md"
          >
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{selectedItem.name}</h3>
                <p className="text-sm text-gray-600">{selectedItem.sku} • {selectedItem.category}</p>
                <p className="text-sm text-gray-600">Location: {selectedItem.binLocation}</p>
                <p className="text-sm text-gray-600">System Quantity: <strong>{selectedItem.systemQuantity}</strong></p>
              </div>

              {/* Count Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Actual Count
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCountInput(Math.max(0, countInput - 1))}
                  >
                    <MinusIcon className="w-4 h-4" />
                  </Button>
                  <input
                    type="number"
                    value={countInput}
                    onChange={(e) => setCountInput(parseInt(e.target.value) || 0)}
                    className="flex-1 text-center text-3xl font-bold h-16 border rounded-lg px-3"
                    min={0}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCountInput(countInput + 1)}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Quick Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCountInput(0)}
                  >
                    0
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCountInput(selectedItem.systemQuantity)}
                  >
                    Same as System
                  </Button>
                </div>
              </div>

              {/* Discrepancy Warning */}
              {countInput !== selectedItem.systemQuantity && (
                <div className={`p-3 rounded-lg border ${
                  countInput > selectedItem.systemQuantity 
                    ? 'bg-blue-50 border-blue-200 text-blue-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="text-sm font-medium">
                    {countInput > selectedItem.systemQuantity ? 'Surplus' : 'Shortage'}: {Math.abs(countInput - selectedItem.systemQuantity)} units
                  </p>
                  <p className="text-xs mt-1">
                    This discrepancy will be flagged for review
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={countNotes}
                  onChange={(e) => setCountNotes(e.target.value)}
                  placeholder="Add notes about this count..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCountModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveCount}
                  className="flex-1"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Count
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <Modal
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            title="Scan Product"
            size="md"
          >
            <div className="space-y-4">
              <div className="text-center py-8">
                <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Product Barcode</h3>
                <p className="text-gray-600">Point camera at barcode to find product in stocktake</p>
              </div>
              
              {/* Manual entry fallback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter SKU manually:
                </label>
                <input
                  type="text"
                  placeholder="Enter product SKU..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const sku = (e.target as HTMLInputElement).value;
                      const item = items.find(i => i.sku.toLowerCase() === sku.toLowerCase());
                      if (item) {
                        setShowBarcodeScanner(false);
                        openCountModal(item);
                      } else {
                        alert('Product not found in this stocktake');
                      }
                    }
                  }}
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default StocktakeSessionPage;