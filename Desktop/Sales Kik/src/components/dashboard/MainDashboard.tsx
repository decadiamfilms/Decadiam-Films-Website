import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickStartWizard from '../setup/QuickStartWizard';
import { 
  HomeIcon, 
  UsersIcon, 
  CubeIcon, 
  DocumentTextIcon, 
  ShoppingCartIcon, 
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  UserCircleIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
  UserIcon,
  ChevronDownIcon,
  ListBulletIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  PlusIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export function MainDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false); // Temporarily disabled
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData.data);
      
      // Fetch company data
      const companyResponse = await fetch(`${API_URL}/api/company`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.data);
        
        // Force business dashboard to show enhanced features
        // Always show the enhanced business dashboard
        setIsFirstTime(false); // Always show enhanced dashboard
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="header-sophisticated relative">
        <div className="flex justify-between py-4">
          <div className="flex items-center w-64 px-4">
            <img src="/saleskik-logo.png" alt="SalesKik" className="h-12 w-auto" />
            {company && (
              <span className="ml-4 text-sm text-gray-500">{company.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-4 px-4">
              {user?.email !== 'adam@eccohardware.com.au' && (
                <>
                  <span className="text-sm text-gray-500 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                    14 days trial remaining
                  </span>
                  <button className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
                    Upgrade Now
                  </button>
                </>
              )}
              {user?.email === 'adam@eccohardware.com.au' && (
                <span className="text-sm text-gray-500 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  Premium Account
                </span>
              )}
              <BellIcon className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600" />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <UserIcon className="w-4 h-4 mr-3" />
                      My Profile
                    </a>
                    
                    <a
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-3" />
                      Settings
                    </a>
                    
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

      <div className="flex">
        {/* Left Navigation */}
        <nav className="w-64 nav-sophisticated min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg">
                  <HomeIcon className="w-5 h-5 mr-3" />
                  Dashboard
                </a>
              </li>
              
              {/* Plan-Specific Navigation */}
              {company?.selectedPlan === 'TRADIE' ? (
                // Tradie Navigation
                <>
                  <li className="pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tradie Tools</p>
                  </li>
                  <li>
                    <a href="/quick-quotes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      Quick Quotes
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                  <li>
                    <a href="/simple-invoicing" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <CreditCardIcon className="w-5 h-5 mr-3" />
                      Invoicing & Payments
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                  <li>
                    <a href="/job-calendar" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <CalendarIcon className="w-5 h-5 mr-3" />
                      Job Scheduling
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                  <li>
                    <a href="/materials" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <CubeIcon className="w-5 h-5 mr-3" />
                      Materials & Costs
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                  <li>
                    <a href="/simple-reports" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <ChartBarIcon className="w-5 h-5 mr-3" />
                      Simple Reports
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                </>
              ) : (
                // Small Business Navigation
                <>
                  <li className="pt-4">
                    <button
                      onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
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
                        <a href="/inventory/stock-taking" className="flex items-center px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg ml-3">
                          Stock Taking
                        </a>
                      </li>
                    </>
                  )}
                  <li className="pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Business Features</p>
                  </li>
                  <li>
                    <a href="/quotes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      Advanced Quotes
                    </a>
                  </li>
                  <li>
                    <a href="/orders" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <ShoppingCartIcon className="w-5 h-5 mr-3" />
                      Orders
                    </a>
                  </li>
                  <li>
                    <a href="/crm-sales" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <UsersIcon className="w-5 h-5 mr-3" />
                      CRM & Sales
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                  <li>
                    <a href="/analytics" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      <ChartBarIcon className="w-5 h-5 mr-3" />
                      Advanced Analytics
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Trial</span>
                    </a>
                  </li>
                </>
              )}
              
              {/* Common Core Features */}
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
                <a href="/employees" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 mr-3" />
                  Team & Employees
                </a>
              </li>
            </ul>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Account</p>
              <ul className="space-y-2">
                <li>
                  <a href="/modules" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <PuzzlePieceIcon className="w-5 h-5 mr-3" />
                    Manage Modules
                    <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded">
                      ${company?.selectedPlan === 'TRADIE' ? '39' : '89'}/mo
                    </span>
                  </a>
                </li>
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
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {isFirstTime ? (
            <WelcomeDashboard company={company} user={user} />
          ) : (
            <RegularDashboard />
          )}
        </main>
      </div>

      {/* Quick Start Wizard for Better UX */}
      {showQuickStart && (
        <QuickStartWizard 
          onComplete={() => setShowQuickStart(false)}
          onSkip={() => setShowQuickStart(false)}
        />
      )}
    </div>
  );
}

function WelcomeDashboard({ company, user }: { company: any; user: any }) {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to SalesKik{company ? `, ${company.name}` : ''}
        </h1>
        <p className="text-gray-600 mt-2">
          Your {company?.targetMarket === 'TRADIES' ? 'mobile workspace' : 'business dashboard'} is ready. 
          Let's get you started with your first quote.
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/products/new')}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <CubeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Add Your First Product</h3>
          <p className="text-gray-600 text-sm mb-4">
            {company?.targetMarket === 'TRADIES' 
              ? 'Add the services and materials you offer'
              : 'Build your product catalog with pricing and categories'
            }
          </p>
          <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
            Add Product →
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/customers/new')}>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <UsersIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Add a Customer</h3>
          <p className="text-gray-600 text-sm mb-4">
            Start building your customer database
          </p>
          <span className="text-green-600 text-sm font-medium hover:text-green-700">
            Add Customer →
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/quotes/new')}>
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Create Your First Quote</h3>
          <p className="text-gray-600 text-sm mb-4">
            {company?.targetMarket === 'TRADIES'
              ? 'Quick quotes you can send from your phone'
              : 'Professional quotes with your branding'
            }
          </p>
          <span className="text-amber-600 text-sm font-medium hover:text-amber-700">
            Create Quote →
          </span>
        </div>
      </div>

      {/* Setup Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Setup Progress</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Business profile completed</span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Onboarding completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
            <span className="text-gray-500">Add your first product</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
            <span className="text-gray-500">Create your first quote</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
            <span className="text-gray-500">Send your first invoice</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active Quotes</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Open Orders</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Revenue This Month</p>
          <p className="text-2xl font-bold text-gray-900">$0</p>
        </div>
      </div>
    </div>
  );
}

function RegularDashboard() {
  const navigate = useNavigate();
  
  const metrics = {
    totalRevenue: 47250,
    monthlyGrowth: 12,
    activeQuotes: 23,
    pendingApproval: 7,
    conversionRate: 68,
    lowStockItems: 8,
    inventoryValue: 156780,
    reorderAlerts: 3
  };

  return (
    <div className="space-y-8">
      {/* Business Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Business Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              <span className="text-sm text-green-600 font-medium">+{metrics.monthlyGrowth}%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Revenue This Month</div>
          </div>

          <div 
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/quotes')}
          >
            <div className="flex items-center justify-between mb-3">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">{metrics.conversionRate}%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeQuotes}</div>
            <div className="text-sm text-gray-600">{metrics.pendingApproval} need approval</div>
          </div>

          <div 
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/inventory')}
            title="Click to view low stock items"
          >
            <div className="flex items-center justify-between mb-3">
              <CubeIcon className="w-8 h-8 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">{metrics.lowStockItems} low</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${metrics.inventoryValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <span>Inventory Value</span>
              <ArrowRightIcon className="w-3 h-3" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <UsersIcon className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-green-600 font-medium">+12</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">92</div>
            <div className="text-sm text-gray-600">Active Customers</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/quotes" 
            className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-cyan-50"
          >
            <div className="flex items-center gap-3">
              <PlusIcon className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Create Quote</div>
                <div className="text-sm text-gray-600">Start new customer quote</div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </div>
          </a>
          
          <a 
            href="/inventory" 
            className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-r from-orange-50 to-yellow-50"
          >
            <div className="flex items-center gap-3">
              <CubeIcon className="w-6 h-6 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">Check Stock</div>
                <div className="text-sm text-gray-600">Review inventory levels</div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </div>
          </a>
          
          <a 
            href="/customers" 
            className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-pink-50"
          >
            <div className="flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Manage Customers</div>
                <div className="text-sm text-gray-600">View customer database</div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </div>
          </a>
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Needs Your Attention</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Stock Reorder Required</div>
                <div className="text-sm text-gray-600">8 items below reorder level</div>
              </div>
              <button 
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Review Stock
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Quotes Need Approval</div>
                <div className="text-sm text-gray-600">7 quotes waiting for approval</div>
              </div>
              <button 
                onClick={() => navigate('/quotes')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Review Quotes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;
