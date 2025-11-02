import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import ComprehensiveAdminDashboard from './AdminDashboard';
import { SimpleTourButton, useAutoStartSimpleTour } from '../tour/SimpleTour';
import { 
  CubeIcon, DocumentTextIcon, ChartBarIcon, UsersIcon,
  ShoppingCartIcon, CreditCardIcon, Cog6ToothIcon,
  ClipboardDocumentCheckIcon, ArchiveBoxIcon, UserGroupIcon,
  BellIcon, CalendarIcon, PlusIcon, ArrowRightIcon,
  CheckCircleIcon, UserCircleIcon, ChevronDownIcon,
  BuildingOfficeIcon, ServerIcon, ShieldCheckIcon,
  AdjustmentsHorizontalIcon, EyeIcon, FireIcon,
  BanknotesIcon, ChartPieIcon, CloudIcon, KeyIcon,
  DocumentMagnifyingGlassIcon, GlobeAltIcon, CpuChipIcon,
  ShieldExclamationIcon, TrophyIcon, RocketLaunchIcon,
  ExclamationTriangleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  name: string;
}

interface Company {
  name: string;
  selectedPlan: string;
}

export function RoleBasedDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Simple tour system for first-time users  
  useAutoStartSimpleTour();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('RoleBasedDashboard: Starting fetchUserData');
      
      // Check if this is an employee session
      const employeeSession = localStorage.getItem('employee-session');
      const employeePreview = localStorage.getItem('employee-preview');
      
      if (employeeSession || employeePreview) {
        console.log('RoleBasedDashboard: Found employee session');
        const employee = JSON.parse(employeeSession || employeePreview || '{}');
        setUser({
          id: employee.id,
          email: employee.email,
          role: employee.role,
          name: `${employee.firstName} ${employee.lastName}`
        });
        setCompany({ name: 'Your Company', selectedPlan: 'Small Business' });
        setLoading(false);
        return;
      }

      // Regular admin/manager login
      console.log('RoleBasedDashboard: Fetching user and company data');
      const token = localStorage.getItem('accessToken');
      console.log('RoleBasedDashboard: Token exists:', !!token);
      
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('RoleBasedDashboard: /api/auth/me response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('RoleBasedDashboard: User data:', data.data);
        setUser({
          ...data.data,
          role: 'ADMIN', // Default to ADMIN for now
          name: `${data.data.firstName || 'Admin'} ${data.data.lastName || 'User'}`
        });
      }

      const companyResponse = await fetch('/api/company', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('RoleBasedDashboard: /api/company response:', companyResponse.status);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        console.log('RoleBasedDashboard: Company data:', companyData.data);
        setCompany(companyData.data);
      }
    } catch (error) {
      console.error('RoleBasedDashboard: Failed to fetch user data:', error);
    } finally {
      console.log('RoleBasedDashboard: Setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  // Render different dashboards based on user role
  switch (user?.role) {
    case 'ADMIN':
      return <ComprehensiveAdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard user={user} company={company} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />;
    case 'EMPLOYEE':
      // Check if this is employee session, redirect to employee dashboard
      if (localStorage.getItem('employee-session') || localStorage.getItem('employee-preview')) {
        window.location.href = '/employee-dashboard';
        return <div>Redirecting to employee dashboard...</div>;
      }
      return <EmployeeDashboard user={user} company={company} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />;
    default:
      return <ComprehensiveAdminDashboard />;
  }
}

// Advanced Admin Dashboard - Full System Access
function AdminDashboard({ user, company, showSidebar, setShowSidebar }: {
  user: User | null;
  company: Company | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const adminMetrics = [
    { label: 'Total Revenue', value: '$284,532', trend: '+18.2%', change: 'This month', color: 'emerald', icon: BanknotesIcon, bg: 'from-emerald-500 to-green-600' },
    { label: 'Profit Margin', value: '34.7%', trend: '+2.3%', change: 'Above target', color: 'blue', icon: ChartPieIcon, bg: 'from-blue-500 to-indigo-600' },
    { label: 'System Uptime', value: '99.9%', trend: 'Optimal', change: 'All systems green', color: 'purple', icon: ShieldCheckIcon, bg: 'from-purple-500 to-violet-600' },
    { label: 'Growth Rate', value: '+47%', trend: 'YoY', change: 'Accelerating', color: 'orange', icon: TrophyIcon, bg: 'from-orange-500 to-red-600' },
  ];

  // Business Management Section
  const businessManagement = [
    { title: 'Company Settings', desc: 'Business info, branding, integrations', href: '/settings', icon: BuildingOfficeIcon, features: ['Business Details', 'Branding Assets', 'Third-party Apps'] },
    { title: 'Employee Accounts', desc: 'Create employee logins and permissions', href: '/admin/employees', icon: UsersIcon, features: ['Login Credentials', 'Role Permissions', 'Access Control'] },
    { title: 'Location Setup', desc: 'Manage warehouses and facilities', href: '/admin/locations', icon: ArchiveBoxIcon, features: ['Warehouses', 'Workshops', 'Storage Areas'] },
    { title: 'System Settings', desc: 'Configure business rules and preferences', href: '/settings', icon: CreditCardIcon, features: ['Business Rules', 'Preferences', 'Integrations'] },
  ];

  // Advanced Features Section  
  const advancedFeatures = [
    { title: 'Product Category Setup', desc: 'Configure category structure and hierarchy', href: '/inventory/builder', icon: AdjustmentsHorizontalIcon, features: ['Category Builder', 'Nested Subcategories', 'Product Classification'] },
    { title: 'Customer Analytics', desc: 'Lifetime value, segmentation, trends', href: '/analytics/customers', icon: ChartBarIcon, features: ['Customer LTV', 'Segmentation', 'Behavior Analysis'] },
    { title: 'Reporting Suite', desc: 'Custom reports, exports, scheduling', href: '/reports', icon: DocumentMagnifyingGlassIcon, features: ['Custom Reports', 'Automated Exports', 'Scheduled Reports'] },
    { title: 'System Config', desc: 'Workflows, automations, integrations', href: '/settings/system', icon: CpuChipIcon, features: ['Workflow Builder', 'Automations', 'API Management'] },
  ];

  // Strategic Tools Section
  const strategicTools = [
    { title: 'Business Intelligence', desc: 'Growth metrics, forecasting', href: '/intelligence', icon: RocketLaunchIcon, features: ['Growth Analytics', 'Forecasting', 'Strategic Insights'] },
    { title: 'Multi-location', desc: 'Manage multiple business locations', href: '/locations', icon: GlobeAltIcon, features: ['Location Management', 'Cross-site Analytics', 'Unified Reporting'] },
    { title: 'API & Webhooks', desc: 'Advanced integrations & automation', href: '/integrations', icon: CloudIcon, features: ['API Access', 'Webhook Management', 'Custom Integrations'] },
    { title: 'Audit & Security', desc: 'User activity, system changes', href: '/audit', icon: ShieldExclamationIcon, features: ['Activity Logs', 'Security Reports', 'Compliance'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="dashboard" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Administrator'} • ${company?.name || 'Your Business'}`}
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Admin
              </span>
              <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                {company?.selectedPlan || 'Premium'}
              </span>
            </div>
            
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <UserCircleIcon className="w-6 h-6" />
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile Settings
                  </button>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    System Settings
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={() => {
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, {user?.name || 'Administrator'}</h1>
            <p className="text-gray-600 text-lg">Here's what's happening with {company?.name || 'your business'} today</p>
          </div>

          {/* Clean Professional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {adminMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{metric.trend} • {metric.change}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <metric.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Business Management */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Management</h2>
              <p className="text-gray-600">Essential tools for running your business</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessManagement.map((item, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(item.href)}
                >
                  <div className="text-center">
                    <div className="p-4 bg-blue-50 rounded-xl mx-auto w-fit mb-4 group-hover:bg-blue-100 transition-colors">
                      <item.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{item.desc}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {item.features.map((feature, i) => (
                        <div key={i}>• {feature}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Features */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Features</h2>
              <p className="text-gray-600">Powerful tools for business growth</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {advancedFeatures.map((item, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer p-8"
                  onClick={() => navigate(item.href)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                      <item.icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                  
                  <div className="space-y-2">
                    {item.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Tools */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Strategic Tools</h2>
              <p className="text-gray-600">Enterprise capabilities for scaling your business</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {strategicTools.map((item, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer p-8"
                  onClick={() => navigate(item.href)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <item.icon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                  
                  <div className="space-y-2">
                    {item.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Operations (Manager Features) */}
          <div className="border-t-2 border-gray-200 pt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Operations</h2>
              <p className="text-gray-600">Daily operational insights and team management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Operational Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="p-3 bg-red-50 rounded-xl mx-auto w-fit mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Urgent Items</h4>
                <p className="text-2xl font-bold text-red-600">4</p>
                <p className="text-sm text-gray-600">Need attention</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="p-3 bg-blue-50 rounded-xl mx-auto w-fit mb-4">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Team Efficiency</h4>
                <p className="text-2xl font-bold text-blue-600">87.8%</p>
                <p className="text-sm text-gray-600">Average</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl mx-auto w-fit mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Active Quotes</h4>
                <p className="text-2xl font-bold text-emerald-600">45</p>
                <p className="text-sm text-gray-600">In pipeline</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="p-3 bg-purple-50 rounded-xl mx-auto w-fit mb-4">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Monthly Goal</h4>
                <p className="text-2xl font-bold text-purple-600">85%</p>
                <p className="text-sm text-gray-600">Progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sophisticated Manager Dashboard - Business Performance Focus
function ManagerDashboard({ user, company, showSidebar, setShowSidebar }: {
  user: User | null;
  company: Company | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Hero Metrics - Business Performance Overview
  const performanceMetrics = [
    { label: 'Revenue', value: '$127,500', trend: '+29.8%', change: 'vs last month', color: 'emerald', icon: BanknotesIcon, up: true },
    { label: 'Active Quotes', value: '45', trend: '+18%', change: 'vs last month', color: 'blue', icon: DocumentTextIcon, up: true },
    { label: 'Jobs Running', value: '23', trend: '-21%', change: 'vs last month', color: 'orange', icon: CalendarIcon, up: false },
    { label: 'Team', value: '8', trend: '+1 new', change: 'this month', color: 'purple', icon: UserGroupIcon, up: true },
  ];

  // Urgent Items Requiring Attention
  const urgentItems = [
    { type: 'overdue', title: 'Invoice #2847 overdue 15 days', amount: '$8,900', action: 'Follow Up', color: 'red', priority: 'high' },
    { type: 'approval', title: '3 quotes awaiting manager approval', amount: '$24,600', action: 'Review', color: 'orange', priority: 'high' },
    { type: 'stock', title: 'Low stock: 12mm Glass Panels', amount: '8 remaining', action: 'Reorder', color: 'yellow', priority: 'medium' },
    { type: 'schedule', title: 'Installation team overbooked Thursday', amount: '6 conflicts', action: 'Reschedule', color: 'blue', priority: 'medium' },
  ];

  // Team Performance Data
  const teamPerformance = [
    { name: 'Sarah Chen', role: 'Senior Est.', quotes: 12, revenue: '$45,200', efficiency: 92, status: 'excellent' },
    { name: 'Mike Torres', role: 'Project Mgr', quotes: 8, revenue: '$32,100', efficiency: 88, status: 'excellent' },
    { name: 'Emma Wilson', role: 'Sales Rep', quotes: 15, revenue: '$28,900', efficiency: 76, status: 'warning' },
    { name: 'David Kim', role: 'Field Super', quotes: 6, revenue: '$21,300', efficiency: 95, status: 'excellent' },
  ];

  // Recent Business Activity
  const recentActivity = [
    { type: 'quote', title: 'Quote sent to Luxury Pools Brisbane', amount: '$8,900', time: '2hrs ago', color: 'blue' },
    { type: 'completion', title: 'Job completed: Backyard Solutions', amount: '$12,400', time: '4hrs ago', color: 'green' },
    { type: 'payment', title: 'Payment received: Pool Paradise', amount: '$6,700', time: '6hrs ago', color: 'emerald' },
    { type: 'approval', title: 'Quote approved: Aqua Designs', amount: '$15,200', time: '1 day ago', color: 'purple' },
  ];

  // Quick Actions Sidebar
  const quickActions = [
    { title: 'Create New Quote', icon: PlusIcon, href: '/quotes', color: 'blue' },
    { title: 'Add Customer', icon: UsersIcon, href: '/customers', color: 'green' },
    { title: 'Schedule Job', icon: CalendarIcon, href: '/schedule', color: 'purple' },
    { title: 'Record Payment', icon: CreditCardIcon, href: '/payments', color: 'emerald' },
    { title: 'Check Inventory', icon: CubeIcon, href: '/inventory', color: 'orange' },
    { title: 'Generate Report', icon: DocumentTextIcon, href: '/reports', color: 'indigo' },
  ];

  // Today's Schedule
  const todaySchedule = [
    { time: '9:00', task: 'Site visit - Pool Co', type: 'visit' },
    { time: '11:30', task: 'Quote review - Big Jobs', type: 'review' },
    { time: '2:00', task: 'Team meeting', type: 'meeting' },
    { time: '4:00', task: 'Customer call - Aqua', type: 'call' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="dashboard" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Business Performance - This Month"
        subtitle={`${company?.name || 'Business'} Operations Center • ${user?.name || 'Manager'}`}
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Manager
              </span>
              <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full font-semibold shadow-sm">
                {company?.selectedPlan || 'Premium'}
              </span>
            </div>
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Filter
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Clean Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {metric.up ? '↗️' : '↙️'} {metric.trend} • {metric.change}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <metric.icon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (70% width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Clean Urgent Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Items Requiring Attention</h3>
              
              <div className="space-y-4">
                {urgentItems.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-3 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.amount}</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        {item.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clean Team Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  View Full Report
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-semibold text-gray-600">Employee</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-600">Role</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-600">Quotes</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-600">Revenue</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-600">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.map((member, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4">
                          <div className="font-semibold text-gray-900">{member.name}</div>
                        </td>
                        <td className="py-4 text-gray-600">{member.role}</td>
                        <td className="py-4 font-medium text-gray-900">{member.quotes}</td>
                        <td className="py-4 font-semibold text-emerald-600">{member.revenue}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{member.efficiency}%</span>
                            <span>{member.status === 'excellent' ? '⭐' : '⚠️'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Business Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Business Activity</h3>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  View All Activity
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.color === 'blue' ? 'bg-blue-500' :
                        activity.color === 'green' ? 'bg-green-500' :
                        activity.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.amount}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (30% width) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.href)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left"
                  >
                    <action.icon className={`w-5 h-5 ${
                      action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'purple' ? 'text-purple-600' :
                      action.color === 'emerald' ? 'text-emerald-600' :
                      action.color === 'orange' ? 'text-orange-600' : 'text-indigo-600'
                    }`} />
                    <span className="font-medium text-gray-900">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📞 Today's Schedule</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Calendar
                </button>
              </div>
              
              <div className="space-y-3">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm font-semibold text-gray-600 w-12">{item.time}</span>
                    <span className="text-sm text-gray-900">{item.task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* This Month's Targets */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 This Month's Targets</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Revenue Goal: $150K</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Quote Target: 50</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Conversion Rate: 65%</span>
                    <span className="text-emerald-600 font-bold">71% ✅</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📊 Key Insights</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Analytics
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-800">🔥 Glass fencing quotes up 34%</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800">⚠️ Quote response time slow</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-800">💡 Pool season starting early</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-800">📈 Repeat customers +12%</p>
                </div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Quick Settings</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/employees')} className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-900">👥 Manage Team</span>
                </button>
                <button onClick={() => navigate('/inventory')} className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-900">📦 Product Catalog</span>
                </button>
                <button onClick={() => navigate('/settings')} className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-900">💳 Billing & Plans</span>
                </button>
                <button onClick={() => navigate('/settings')} className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-900">🔧 System Settings</span>
                </button>
                <button onClick={() => navigate('/reports')} className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-900">📋 Reports & Exports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Employee Dashboard - Task-Focused
function EmployeeDashboard({ user, company, showSidebar, setShowSidebar }: {
  user: User | null;
  company: Company | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}) {
  const navigate = useNavigate();

  const employeeMetrics = [
    { label: 'My Quotes Today', value: '8', trend: '2 pending', color: 'blue', icon: DocumentTextIcon },
    { label: 'Tasks Completed', value: '12', trend: 'This week', color: 'green', icon: CheckCircleIcon },
    { label: 'Customer Calls', value: '6', trend: 'Today', color: 'purple', icon: UsersIcon },
    { label: 'Schedule', value: '3', trend: 'Appointments', color: 'orange', icon: CalendarIcon },
  ];

  const employeeActions = [
    { title: 'Create Quote', desc: 'Generate customer quotes', href: '/quotes', icon: DocumentTextIcon, color: 'blue' },
    { title: 'View Inventory', desc: 'Check product availability', href: '/inventory', icon: CubeIcon, color: 'green' },
    { title: 'Customer Lookup', desc: 'Find customer information', href: '/customers', icon: UsersIcon, color: 'purple' },
    { title: 'My Schedule', desc: 'View appointments', href: '/calendar', icon: CalendarIcon, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="dashboard" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Employee Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Team Member'} • Your daily workspace`}
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              EMPLOYEE
            </span>
            <button 
              onClick={() => navigate('/quotes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4 mr-1 inline" />
              New Quote
            </button>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Employee Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {employeeMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className={`text-sm mt-1 font-medium ${
                    metric.color === 'green' ? 'text-green-600' : 
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`}>
                    {metric.trend}
                  </p>
                </div>
                <metric.icon className={`w-8 h-8 ${
                  metric.color === 'green' ? 'text-green-500' : 
                  metric.color === 'blue' ? 'text-blue-500' :
                  metric.color === 'purple' ? 'text-purple-500' : 'text-orange-500'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Employee Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employeeActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.href)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className={`p-3 rounded-xl mb-4 ${
                  action.color === 'blue' ? 'bg-blue-100' :
                  action.color === 'green' ? 'bg-green-100' :
                  action.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <action.icon className={`w-6 h-6 ${
                    action.color === 'blue' ? 'text-blue-600' :
                    action.color === 'green' ? 'text-green-600' :
                    action.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`} />
                </div>
                <h4 className="font-semibold text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Quote #Q-2024-156 created</p>
                <p className="text-xs text-gray-600">Glass pool fencing for residential client</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simple Tour Button */}
      <SimpleTourButton />
      
      {/* Simple Test Element */}
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg">
        Test Element - Tour Integration
      </div>
    </div>
  );
}

export default RoleBasedDashboard;