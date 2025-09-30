import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { 
  PlusIcon, MagnifyingGlassIcon, CubeIcon, 
  DocumentTextIcon, ChartBarIcon,
  ClipboardDocumentCheckIcon, CheckCircleIcon, 
  ExclamationTriangleIcon, CalendarIcon, XMarkIcon, HomeIcon, ArchiveBoxIcon, ChevronDownIcon,
  UsersIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ShoppingCartIcon, CreditCardIcon,
  UserGroupIcon, PuzzlePieceIcon, ListBulletIcon, Bars3Icon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface StockTakingSession {
  id: string;
  sessionName: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: 'In Progress' | 'Completed' | 'Draft' | 'Cancelled';
  itemsScanned: number;
  totalItems: number;
  discrepancies: number;
  createdBy: string;
  completedBy?: string;
}

interface StockTakingItem {
  id: string;
  sessionId: string;
  productCode: string;
  productName: string;
  location: string;
  systemQuantity: number;
  countedQuantity?: number;
  discrepancy: number;
  status: 'Pending' | 'Counted' | 'Verified' | 'Discrepancy';
  countedBy?: string;
  countedDate?: string;
  notes?: string;
}

export function StockTaking() {
  const navigate = useNavigate();
  const [stockSessions, setStockSessions] = useState<StockTakingSession[]>([]);
  const [stockItems, setStockItems] = useState<StockTakingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'sessions' | 'items'>('sessions');
  
  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Filters
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    fetchStockTakingSessions();
    fetchStockTakingItems();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    }
    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar]);

  const fetchStockTakingSessions = async () => {
    try {
      // Mock data for stock taking sessions
      const mockSessions: StockTakingSession[] = [
        {
          id: '1',
          sessionName: 'Q3 2025 Stock Count',
          location: 'Main Warehouse',
          startDate: '2025-08-01',
          endDate: '2025-08-05',
          status: 'Completed',
          itemsScanned: 156,
          totalItems: 156,
          discrepancies: 3,
          createdBy: 'John Smith',
          completedBy: 'John Smith'
        },
        {
          id: '2',
          sessionName: 'Workshop A Audit',
          location: 'Workshop A',
          startDate: '2025-08-10',
          status: 'In Progress',
          itemsScanned: 45,
          totalItems: 78,
          discrepancies: 2,
          createdBy: 'Sarah Johnson'
        },
        {
          id: '3',
          sessionName: 'Storage B Count',
          location: 'Storage B',
          startDate: '2025-08-15',
          status: 'Draft',
          itemsScanned: 0,
          totalItems: 89,
          discrepancies: 0,
          createdBy: 'Mike Wilson'
        }
      ];
      setStockSessions(mockSessions);
    } catch (error) {
      console.error('Failed to fetch stock taking sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockTakingItems = async () => {
    try {
      // Mock data for stock taking items
      const mockItems: StockTakingItem[] = [
        {
          id: '1',
          sessionId: '1',
          productCode: 'DD700',
          productName: '10mm Clear Toughened Door Panel',
          location: 'Main Warehouse',
          systemQuantity: 15,
          countedQuantity: 14,
          discrepancy: -1,
          status: 'Discrepancy',
          countedBy: 'John Smith',
          countedDate: '2025-08-03',
          notes: 'One panel has minor damage'
        },
        {
          id: '2',
          sessionId: '2',
          productCode: 'GH300',
          productName: 'Glass Hinge Hardware Set',
          location: 'Workshop A',
          systemQuantity: 25,
          countedQuantity: 25,
          discrepancy: 0,
          status: 'Verified',
          countedBy: 'Sarah Johnson',
          countedDate: '2025-08-11'
        }
      ];
      setStockItems(mockItems);
    } catch (error) {
      console.error('Failed to fetch stock taking items:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Counted': return 'bg-blue-100 text-blue-800';
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Discrepancy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSessions = stockSessions.filter(session => {
    const locationMatch = !selectedLocation || session.location === selectedLocation;
    const statusMatch = !selectedStatus || session.status === selectedStatus;
    const keywordMatch = !keywords || 
      session.sessionName.toLowerCase().includes(keywords.toLowerCase()) ||
      session.location.toLowerCase().includes(keywords.toLowerCase());
    
    return locationMatch && statusMatch && keywordMatch;
  });

  const filteredItems = stockItems.filter(item => {
    const sessionMatch = !selectedSession || item.sessionId === selectedSession;
    const locationMatch = !selectedLocation || item.location === selectedLocation;
    const statusMatch = !selectedStatus || item.status === selectedStatus;
    const keywordMatch = !keywords || 
      item.productName.toLowerCase().includes(keywords.toLowerCase()) ||
      item.productCode.toLowerCase().includes(keywords.toLowerCase());
    
    return sessionMatch && locationMatch && statusMatch && keywordMatch;
  });

  if (loading) {
    return <div className="p-8">Loading stock taking...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`} ref={sidebarRef}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <img src="/saleskik-logo.png" alt="SalesKik" className="h-8" />
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <nav>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <HomeIcon className="w-5 h-5 mr-3" />
                  Dashboard
                </a>
              </li>
              
              {/* Inventory Dropdown */}
              <li className="pt-4">
                <button
                  onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                    Inventory
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showInventoryDropdown ? 'rotate-180' : ''}`} />
                </button>
              </li>
              {showInventoryDropdown && (
                <>
                  <li>
                    <a href="/inventory" className="flex items-center px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg ml-3">
                      Stock Management
                    </a>
                  </li>
                  <li>
                    <a href="/inventory/custom" className="flex items-center px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg ml-3">
                      Custom Stock
                    </a>
                  </li>
                  <li>
                    <a href="/inventory/purchase-orders" className="flex items-center px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg ml-3">
                      Purchase Orders
                    </a>
                  </li>
                  <li>
                    <a href="/inventory/po-items" className="flex items-center px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg ml-3">
                      PO Items
                    </a>
                  </li>
                  <li>
                    <a href="/inventory/stock-taking" className="flex items-center px-6 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg ml-3">
                      Stock Taking
                    </a>
                  </li>
                </>
              )}
              
              {/* Core Features */}
              <li className="pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Core Features</p>
              </li>
              <li>
                <a href="/customers" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <UsersIcon className="w-5 h-5 mr-3" />
                  Customer Management
                </a>
              </li>
              <li>
                <a href="/quotes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 mr-3" />
                  Quotes
                </a>
              </li>
              <li>
                <a href="/orders" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <ShoppingCartIcon className="w-5 h-5 mr-3" />
                  Orders
                </a>
              </li>
            </ul>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <ul className="space-y-2">
                <li>
                  <a href="/settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Cog6ToothIcon className="w-5 h-5 mr-3" />
                    Settings
                  </a>
                </li>
                <li>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* Overlay - only on mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Clean Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  <Bars3Icon className="w-5 h-5 text-gray-600" />
                </button>
                <img src="/saleskik-logo.png" alt="SalesKik" className="h-12 w-auto" />
                <div className="border-l border-gray-200 pl-4">
                  <h1 className="text-2xl font-bold text-gray-900">Stock Taking</h1>
                  <p className="text-gray-600 mt-1">Perform physical inventory counts and audits</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  New Stock Count
                </button>
                <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-600 text-sm font-medium">Active Sessions</p>
                    <p className="text-2xl font-bold text-teal-900">
                      {stockSessions.filter(s => s.status === 'In Progress').length}
                    </p>
                  </div>
                  <ClipboardDocumentCheckIcon className="w-8 h-8 text-teal-500" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {stockSessions.filter(s => s.status === 'Completed').length}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Discrepancies</p>
                    <p className="text-2xl font-bold text-red-900">
                      {stockSessions.reduce((sum, s) => sum + s.discrepancies, 0)}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Items Counted</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stockSessions.reduce((sum, s) => sum + s.itemsScanned, 0)}
                    </p>
                  </div>
                  <CubeIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* View Tabs */}
            <div className="mt-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveView('sessions')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'sessions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Stock Taking Sessions
                  </button>
                  <button
                    onClick={() => setActiveView('items')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'items'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Item Details
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-8 py-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {activeView === 'items' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Sessions</option>
                      {stockSessions.map(session => (
                        <option key={session.id} value={session.id}>{session.sessionName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Workshop A">Workshop A</option>
                    <option value="Workshop B">Workshop B</option>
                    <option value="Storage A">Storage A</option>
                    <option value="Storage B">Storage B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    {activeView === 'sessions' ? (
                      <>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Draft">Draft</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Counted">Counted</option>
                        <option value="Verified">Verified</option>
                        <option value="Discrepancy">Discrepancy</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={activeView === 'sessions' ? 'Search sessions...' : 'Search items...'}
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {activeView === 'sessions' ? `${filteredSessions.length} sessions` : `${filteredItems.length} items`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Based on Active View */}
        {activeView === 'sessions' ? (
          /* Stock Taking Sessions Table */
          <div className="px-8 pb-8">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Stock Taking Sessions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discrepancies
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <ClipboardDocumentCheckIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock taking sessions</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                              Create a stock taking session to start counting inventory
                            </p>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                              <PlusIcon className="w-5 h-5" />
                              Start Stock Count
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{session.sessionName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{session.location}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{session.startDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(session.itemsScanned / session.totalItems) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {session.itemsScanned}/{session.totalItems}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${
                              session.discrepancies > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {session.discrepancies}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{session.createdBy}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors border border-gray-200"
                                title="View Session"
                              >
                                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors border border-gray-200"
                                title="Edit Session"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Stock Taking Items Table */
          <div className="px-8 pb-8">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Stock Taking Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counted Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discrepancy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <CubeIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No items to count</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                              Start a stock taking session to begin counting items
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">{item.productCode}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.location}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.systemQuantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.countedQuantity !== undefined ? item.countedQuantity : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${
                              item.discrepancy > 0 ? 'text-green-600' :
                              item.discrepancy < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {item.discrepancy !== 0 ? (item.discrepancy > 0 ? '+' : '') + item.discrepancy : '0'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.countedBy || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors border border-gray-200"
                                title="Count Item"
                              >
                                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors border border-gray-200"
                                title="Verify Count"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockTaking;