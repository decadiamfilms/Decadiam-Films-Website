import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SessionManager from '../../utils/sessionManager';
import { usePermissions } from '../../context/PermissionContext';
import { 
  HomeIcon, UsersIcon, CubeIcon, DocumentTextIcon, 
  ShoppingCartIcon, CreditCardIcon, ChartBarIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, QuestionMarkCircleIcon,
  CalendarIcon, ArchiveBoxIcon, UserGroupIcon, 
  PuzzlePieceIcon, ListBulletIcon, ClipboardDocumentCheckIcon,
  ChevronDownIcon, Bars3Icon, XMarkIcon, RectangleStackIcon,
  TruckIcon, MapIcon, ClockIcon
} from '@heroicons/react/24/outline';

interface UniversalNavigationProps {
  currentPage?: string;
  userPlan?: 'TRADIE' | 'SMALL_BUSINESS' | 'ENTERPRISE';
  userRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export function UniversalNavigation({ currentPage, userPlan = 'SMALL_BUSINESS', userRole = 'ADMIN', isOpen, onClose, onOpen }: UniversalNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessMenu, isAdmin } = usePermissions();
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [showCompanySettingsDropdown, setShowCompanySettingsDropdown] = useState(false);
  const [showQuotesOrdersDropdown, setShowQuotesOrdersDropdown] = useState(false);
  const [showLogisticsDropdown, setShowLogisticsDropdown] = useState(false);
  const [showContactsDropdown, setShowContactsDropdown] = useState(false);
  const [showAdminToolsDropdown, setShowAdminToolsDropdown] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // CONSISTENT role detection - same logic everywhere
  const getActualUserRole = () => {
    try {
      const employeeSession = localStorage.getItem('employee-session');
      if (employeeSession) {
        const employee = JSON.parse(employeeSession);
        return employee.role || 'EMPLOYEE';
      }
      
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && !accessToken.startsWith('employee-token-')) {
        return 'ADMIN'; // Regular admin login
      }
      
      return 'EMPLOYEE'; // Default to employee if unclear
    } catch (error) {
      console.error('Role detection error:', error);
      return 'ADMIN'; // Safe fallback
    }
  };

  const finalUserRole = getActualUserRole();
  const finalUserPlan = 'SMALL_BUSINESS'; // Force consistent plan
  
  // Debug: Log role detection
  console.log(`Page: ${location.pathname} | Role: ${finalUserRole} | Employee Session: ${!!localStorage.getItem('employee-session')}`);
  const [company, setCompany] = useState<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  // Auto-expand dropdowns when on relevant pages
  useEffect(() => {
    if (isCurrentPage('/orders/new') || isCurrentPage('/quotes/new')) {
      setShowQuotesOrdersDropdown(true);
    }
  }, [location.pathname]);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/company', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCompany(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleHoverAreaEnter = () => {
    if (!isOpen && onOpen) {
      const timeout = setTimeout(() => {
        // Only open if we're still not open (user hasn't clicked to open in the meantime)
        if (!isOpen) {
          onOpen();
        }
      }, 500); // 500ms delay (half a second)
      setHoverTimeout(timeout);
    }
  };

  const handleHoverAreaLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleLogout = () => {
    // Clear employee session if exists
    localStorage.removeItem('employee-session');
    localStorage.removeItem('employee-preview');
    
    // Clear regular session
    SessionManager.getInstance().logout();
  };

  const isCurrentPage = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Hover Area for Opening Sidebar */}
      {!isOpen && (
        <div 
          className="fixed inset-y-0 left-0 z-40 w-4 bg-transparent"
          onMouseEnter={handleHoverAreaEnter}
          onMouseLeave={handleHoverAreaLeave}
        />
      )}

      {/* Mobile/Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } overflow-y-auto`} ref={sidebarRef}>
        <div className="p-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <img 
              src={company?.logoUrl || "/saleskik-logo.png"} 
              alt={company?.name || "SalesKik"} 
              className="h-32 w-auto" 
            />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <nav>
            <ul className="space-y-2">
              <li>
                <a 
                  href={finalUserRole === 'EMPLOYEE' ? '/employee-dashboard' : '/dashboard'}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    (finalUserRole === 'EMPLOYEE' ? isCurrentPage('/employee-dashboard') : isCurrentPage('/dashboard'))
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <HomeIcon className="w-5 h-5 mr-3" />
                  Dashboard
                </a>
              </li>
              
              {/* Plan-Specific Navigation */}
              {finalUserPlan === 'TRADIE' ? (
                // Tradie Navigation
                <>
                  <li className="pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tradie Tools</p>
                  </li>
                  <li>
                    <a 
                      href="/quick-quotes" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/quick-quotes')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      Quick Quotes
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/simple-invoicing" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/simple-invoicing')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCardIcon className="w-5 h-5 mr-3" />
                      Invoicing & Payments
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/job-calendar" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/job-calendar')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CalendarIcon className="w-5 h-5 mr-3" />
                      Job Scheduling
                    </a>
                  </li>
                </>
              ) : (
                // Small Business Navigation - New Structure
                <>
                  <li className="pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Business Features</p>
                  </li>
                  
                  {/* Inventory Dropdown */}
                  <li>
                    <button
                      onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                      data-tour="inventory-link"
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/inventory')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
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
                        <a 
                          href="/inventory/stock-check" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/inventory/stock-check')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Stock Check & Management
                        </a>
                      </li>
                      {canAccessMenu('purchase') && (
                        <li>
                          <a 
                            href="/inventory/purchase-orders" 
                            className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                              isCurrentPage('/inventory/purchase-orders')
                                ? 'text-amber-600 bg-amber-50'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Purchase Orders
                          </a>
                        </li>
                      )}
                      <li>
                        <a 
                          href="/inventory/stocktakes" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/inventory/stocktakes')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Stocktakes
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/inventory/custom-glass" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/inventory/custom-glass')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <RectangleStackIcon className="w-4 h-4 mr-2" />
                          Custom Glass
                          <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            $35/mo
                          </span>
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/inventory/job-scheduling" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/inventory/job-scheduling')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Job Scheduling
                          <span className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded">
                            NEW
                          </span>
                        </a>
                      </li>
                    </>
                  )}
                  
                  {/* Quotes and Orders Dropdown */}
                  <li>
                    <button
                      onClick={() => setShowQuotesOrdersDropdown(!showQuotesOrdersDropdown)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/quotes') || isCurrentPage('/orders')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 mr-3" />
                        Quotes & Orders
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showQuotesOrdersDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </li>
                  {showQuotesOrdersDropdown && (
                    <>
                      <li>
                        <a 
                          href="/quotes" 
                          data-tour="quotes-link"
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            location.pathname === '/quotes'
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Quotes
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/quotes/new" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/quotes/new')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          New Quote
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/orders" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            location.pathname === '/orders'
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Orders
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/orders/new" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/orders/new')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          New Order
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/invoices" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            location.pathname === '/invoices'
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Invoices
                        </a>
                      </li>
                    </>
                  )}
                  
                  {/* Logistics & Delivery - Temporary Simple Link */}
                  {canAccessMenu('logistics') && (
                    <li>
                      <a 
                        href="/logistics/delivery-scheduling" 
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isCurrentPage('/logistics')
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <TruckIcon className="w-5 h-5 mr-3" />
                        Logistics
                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded">
                          NEW
                        </span>
                      </a>
                    </li>
                  )}

                </>
              )}
              
              {/* Account Section */}
              <li className="pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {finalUserRole === 'EMPLOYEE' ? 'My Account' : 'Account'}
                </p>
              </li>
              
              {/* Admin and Manager only - Module Management - HIDDEN FOR NOW */}
              {false && finalUserRole !== 'EMPLOYEE' && (
                <li>
                  <a 
                    href="/modules" 
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isCurrentPage('/modules')
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <PuzzlePieceIcon className="w-5 h-5 mr-3" />
                    Manage Modules
                    <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded">
                      ${company?.selectedPlan === 'TRADIE' ? '39' : '89'}/mo
                    </span>
                  </a>
                </li>
              )}
              
              {/* Glass Module Admin - Prominent placement */}
              {finalUserRole === 'ADMIN' && (
                <li>
                  <a 
                    href="/admin/glass" 
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isCurrentPage('/admin/glass')
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <RectangleStackIcon className="w-5 h-5 mr-3" />
                    Glass Module Admin
                    <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      $35/mo
                    </span>
                  </a>
                </li>
              )}
              
              {/* Settings - Admin and Manager only get full settings, Employees get limited */}
              <li>
                <a 
                  href={finalUserRole === 'EMPLOYEE' ? '/profile' : '/settings'}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    (finalUserRole === 'EMPLOYEE' ? isCurrentPage('/profile') : isCurrentPage('/settings'))
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-3" />
                  {finalUserRole === 'EMPLOYEE' ? 'My Profile' : 'Settings'}
                </a>
              </li>

              <li>
                <a 
                  href="/help"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isCurrentPage('/help')
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 mr-3" />
                  Help & Support
                </a>
              </li>
              
              <li>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </li>
              
              {/* Admin Tools Dropdown */}
              {finalUserRole === 'ADMIN' && (
                <>
                  <li>
                    <button
                      onClick={() => setShowAdminToolsDropdown(!showAdminToolsDropdown)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/inventory/builder') || isCurrentPage('/products') || isCurrentPage('/customers') || isCurrentPage('/admin') || isCurrentPage('/suppliers')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 mr-3" />
                        Admin Tools
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdminToolsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </li>
                  {showAdminToolsDropdown && (
                    <>
                      {/* Product Category Setup */}
                      <li>
                        <a 
                          href="/inventory/builder" 
                          data-tour="categories-link"
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/inventory/builder')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Product Category Setup
                        </a>
                      </li>
                      
                      {/* Product Management */}
                      {canAccessMenu('products') && (
                        <li>
                          <a 
                            href="/products" 
                            data-tour="products-link"
                            className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                              isCurrentPage('/products')
                                ? 'text-amber-600 bg-amber-50'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Product Management
                          </a>
                        </li>
                      )}
                      
                      {/* Contacts/Customers */}
                      <li>
                        <a 
                          href="/customers" 
                          data-tour="customers-link"
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            location.pathname === '/customers'
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Customer Management
                        </a>
                      </li>
                      
                      {/* Supplier Management */}
                      <li>
                        <a 
                          href="/suppliers" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            location.pathname === '/suppliers'
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Supplier Management
                        </a>
                      </li>
                      
                      {/* Custom Price Lists */}
                      <li>
                        <a 
                          href="/admin/custom-pricelists" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/custom-pricelists')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Custom Price Lists
                        </a>
                      </li>
                      
                      {/* StockFlow Manager */}
                      <li>
                        <a 
                          href="/stockflow" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/stockflow')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          StockFlow Manager
                        </a>
                      </li>
                      
                      {/* Location Setup */}
                      <li>
                        <a 
                          href="/admin/locations" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/locations')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Location Setup
                        </a>
                      </li>
                      
                      {/* Team and Employees */}
                      <li>
                        <a 
                          href="/admin/employees" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/employees')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Team and Employees
                        </a>
                      </li>
                      
                      {/* Analytics */}
                      <li>
                        <a 
                          href="/analytics" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/analytics')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Analytics
                        </a>
                      </li>
                    </>
                  )}

                  {/* Company Settings Dropdown */}
                  <li>
                    <button
                      onClick={() => setShowCompanySettingsDropdown(!showCompanySettingsDropdown)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/admin/company')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Cog6ToothIcon className="w-5 h-5 mr-3" />
                        Company Settings
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCompanySettingsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </li>
                  {showCompanySettingsDropdown && (
                    <>
                      <li>
                        <a 
                          href="/admin/company/profile" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/company/profile')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Company Profile
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/company/invoice-settings" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/company/invoice-settings')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Invoice & Financial Settings
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/company/accounting-settings" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/company/accounting-settings')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Accounting Settings
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/company/pdf-settings" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/company/pdf-settings')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          PDF Default Settings
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/user-groups" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/user-groups')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          User Groups
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/users" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/users')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Company Users
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/custom-text" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/custom-text')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Custom Text
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/email-customization" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/email-customization')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Email Customization
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/email-branding" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/email-branding')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Email Branding
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/automated-reports" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/automated-reports')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Automated Reports
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/custom-status" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/custom-status')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Custom Status
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/form-templates" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/form-templates')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Form Templates
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/admin/glass" 
                          className={`flex items-center px-6 py-2 text-sm font-medium rounded-lg ml-3 transition-colors ${
                            isCurrentPage('/admin/glass')
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <RectangleStackIcon className="w-4 h-4 mr-2" />
                          Glass Module Admin
                          <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            $35/mo
                          </span>
                        </a>
                      </li>
                    </>
                  )}
                </>
              )}
              
              {/* Non-Admin Role Navigation */}
              {finalUserRole !== 'ADMIN' && (
                <>
                  <li className="pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {finalUserRole === 'MANAGER' ? 'Management' : 'My Tools'}
                    </p>
                  </li>
                  {canAccessMenu('products') && (
                    <li>
                      <a 
                        href="/products" 
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isCurrentPage('/products')
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <CubeIcon className="w-5 h-5 mr-3" />
                        Product Management
                      </a>
                    </li>
                  )}
                  <li>
                    <a 
                      href="/stockflow" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/stockflow')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                      StockFlow Manager
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/customers" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        location.pathname === '/customers'
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <UsersIcon className="w-5 h-5 mr-3" />
                      Customers
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/employees" 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPage('/employees')
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UserGroupIcon className="w-5 h-5 mr-3" />
                      Team & Employees
                    </a>
                  </li>
                  
                  {/* Analytics for managers */}
                  {finalUserRole === 'MANAGER' && (
                    <li>
                      <a 
                        href="/analytics" 
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isCurrentPage('/analytics')
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <ChartBarIcon className="w-5 h-5 mr-3" />
                        Analytics
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay - only on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

    </>
  );
}

export default UniversalNavigation;