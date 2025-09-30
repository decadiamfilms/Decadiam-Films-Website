import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardDocumentCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import UniversalNavigation from '@/components/layout/UniversalNavigation';
import UniversalHeader from '@/components/layout/UniversalHeader';

interface Stocktake {
  id: string;
  name: string;
  warehouse: string;
  type: 'full' | 'partial' | 'cycle' | 'spot';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  assignedTo: string[];
  createdBy: string;
  progress: number;
}

const StocktakesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadStocktakes();
  }, []);

  const loadStocktakes = async () => {
    setLoading(true);
    try {
      // Mock stocktakes data
      const mockStocktakes: Stocktake[] = [
        {
          id: 'ST-2024-001',
          name: 'Q4 2024 Full Count - Main Warehouse',
          warehouse: 'Main Warehouse',
          type: 'full',
          status: 'in_progress',
          totalItems: 1740,
          countedItems: 425,
          discrepancies: 12,
          scheduledDate: '2024-12-15',
          startedAt: '2024-12-15T09:00:00Z',
          completedAt: null,
          assignedTo: ['John Smith', 'Sarah Wilson'],
          createdBy: 'Admin User',
          progress: 24
        },
        {
          id: 'ST-2024-002',
          name: 'Hardware Section Spot Check',
          warehouse: 'Main Warehouse',
          type: 'spot',
          status: 'completed',
          totalItems: 150,
          countedItems: 150,
          discrepancies: 3,
          scheduledDate: '2024-12-10',
          startedAt: '2024-12-10T14:00:00Z',
          completedAt: '2024-12-10T16:30:00Z',
          assignedTo: ['Mike Johnson'],
          createdBy: 'Manager User',
          progress: 100
        },
        {
          id: 'ST-2024-003',
          name: 'North Location Cycle Count',
          warehouse: 'North Location',
          type: 'cycle',
          status: 'draft',
          totalItems: 560,
          countedItems: 0,
          discrepancies: 0,
          scheduledDate: '2024-12-20',
          startedAt: null,
          completedAt: null,
          assignedTo: ['Sarah Wilson', 'Mike Johnson'],
          createdBy: 'Admin User',
          progress: 0
        },
        {
          id: 'ST-2024-004',
          name: 'Glass Panels Full Count',
          warehouse: 'South Location',
          type: 'partial',
          status: 'completed',
          totalItems: 89,
          countedItems: 89,
          discrepancies: 1,
          scheduledDate: '2024-12-05',
          startedAt: '2024-12-05T10:00:00Z',
          completedAt: '2024-12-05T14:00:00Z',
          assignedTo: ['John Smith'],
          createdBy: 'Manager User',
          progress: 100
        }
      ];

      setStocktakes(mockStocktakes);
    } catch (error) {
      console.error('Error loading stocktakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocktakes = stocktakes.filter(stocktake => {
    const matchesSearch = !searchQuery || 
      stocktake.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stocktake.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stocktake.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || stocktake.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-700 bg-gray-100';
      case 'in_progress': return 'text-blue-700 bg-blue-100';
      case 'completed': return 'text-green-700 bg-green-100';
      case 'cancelled': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'in_progress': return <PlayIcon className="w-4 h-4" />;
      case 'draft': return <PauseIcon className="w-4 h-4" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-purple-100 text-purple-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'cycle': return 'bg-green-100 text-green-800';
      case 'spot': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      <UniversalHeader 
        title="Stock Taking"
        subtitle="Manage and conduct physical stock counts"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/stock-check')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Stock Check
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Taking</h1>
              <p className="text-gray-600 mt-1">Physical inventory counts and verification</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/inventory/stocktakes/new')}
            size="lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Stocktake
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Stocktakes</p>
                <p className="text-2xl font-bold text-gray-900">{stocktakes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <PlayIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stocktakes.filter(s => s.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stocktakes.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Discrepancies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stocktakes.reduce((sum, s) => sum + s.discrepancies, 0)}
                </p>
              </div>
            </div>
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
                  placeholder="Search stocktakes by name, ID, or warehouse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'draft', label: 'Draft' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' }
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
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stocktakes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stocktakes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredStocktakes.map(stocktake => (
              <div key={stocktake.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{stocktake.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stocktake.status)}`}>
                        {getStatusIcon(stocktake.status)}
                        <span className="ml-1 capitalize">{stocktake.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(stocktake.type)}`}>
                        {stocktake.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Scheduled: {new Date(stocktake.scheduledDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {stocktake.assignedTo.join(', ')}
                      </span>
                      <span>
                        {stocktake.warehouse}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress: {stocktake.countedItems}/{stocktake.totalItems} items</span>
                        <span>{stocktake.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            stocktake.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${stocktake.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Items: <strong className="text-gray-900">{stocktake.totalItems.toLocaleString()}</strong>
                      </span>
                      {stocktake.discrepancies > 0 && (
                        <span className="text-red-600">
                          Discrepancies: <strong>{stocktake.discrepancies}</strong>
                        </span>
                      )}
                      {stocktake.completedAt && (
                        <span className="text-green-600">
                          Completed: {new Date(stocktake.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    {stocktake.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/inventory/stocktakes/${stocktake.id}`)}
                      >
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                    
                    {stocktake.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/inventory/stocktakes/${stocktake.id}`)}
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                    )}
                    
                    {stocktake.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/inventory/stocktakes/${stocktake.id}/results`)}
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Results
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Generate report
                        alert(`Generating report for ${stocktake.name}...`);
                      }}
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredStocktakes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No stocktakes found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first stocktake'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/inventory/stocktakes/new')}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create First Stocktake
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/stocktakes/new')}
              className="justify-start"
            >
              <PlusIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">New Full Stocktake</div>
                <div className="text-xs text-gray-500">Count entire warehouse</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/stocktakes/new?type=cycle')}
              className="justify-start"
            >
              <ChartBarIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Cycle Count</div>
                <div className="text-xs text-gray-500">Rotating category counts</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/stocktakes/new?type=spot')}
              className="justify-start"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Spot Check</div>
                <div className="text-xs text-gray-500">Quick verification</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StocktakesPage;