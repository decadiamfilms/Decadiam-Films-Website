import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { 
  DocumentTextIcon, CubeIcon, UsersIcon, CalendarIcon,
  PlusIcon, ClockIcon, CheckCircleIcon, ChartBarIcon,
  CurrencyDollarIcon, ShoppingCartIcon, PhoneIcon,
  MapPinIcon, BellIcon, UserCircleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  position: string;
  permissions: {
    canCreateQuotes: boolean;
    canViewPricing: boolean;
    canAccessInventory: boolean;
    canViewReports: boolean;
    canManageCustomers: boolean;
  };
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      // Load from employee session (actual logged-in employee)
      const employeeSession = localStorage.getItem('employee-session');
      if (employeeSession) {
        const employeeData = JSON.parse(employeeSession);
        setEmployee({
          id: employeeData.id,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          role: employeeData.role,
          department: employeeData.department,
          position: employeeData.position,
          permissions: employeeData.permissions
        });
      } else {
        // No employee session - redirect to login
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Failed to load employee data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Employee metrics (work-focused)
  const employeeMetrics = [
    { label: 'My Quotes Today', value: '3', trend: '2 pending approval', color: 'blue', icon: DocumentTextIcon },
    { label: 'Tasks Completed', value: '8', trend: 'This week', color: 'green', icon: CheckCircleIcon },
    { label: 'Customer Calls', value: '5', trend: 'Today', color: 'purple', icon: PhoneIcon },
    { label: 'Active Projects', value: '2', trend: 'In progress', color: 'orange', icon: CalendarIcon },
  ];

  // Quick actions for employees
  const quickActions = [
    { 
      title: 'Create Quote', 
      desc: 'Generate customer quote', 
      href: '/quotes', 
      icon: DocumentTextIcon, 
      color: 'blue',
      available: employee?.permissions.canCreateQuotes 
    },
    { 
      title: 'Check Stock', 
      desc: 'View product availability', 
      href: '/inventory', 
      icon: CubeIcon, 
      color: 'green',
      available: employee?.permissions.canAccessInventory 
    },
    { 
      title: 'Customer Lookup', 
      desc: 'Find customer info', 
      href: '/customers', 
      icon: UsersIcon, 
      color: 'purple',
      available: employee?.permissions.canManageCustomers 
    },
    { 
      title: 'My Schedule', 
      desc: 'View appointments', 
      href: '/schedule', 
      icon: CalendarIcon, 
      color: 'orange',
      available: true 
    },
  ];

  // Today's tasks/schedule
  const todaysTasks = [
    { time: '09:00', task: 'Quote follow-up: Luxury Pools', status: 'pending' },
    { time: '11:30', task: 'Customer site visit: Pool Paradise', status: 'completed' },
    { time: '14:00', task: 'Team meeting: Weekly sales review', status: 'upcoming' },
    { time: '16:00', task: 'Quote preparation: Aqua Designs', status: 'upcoming' },
  ];

  if (loading) {
    return <div className="p-8">Loading your dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="dashboard" 
        userRole="EMPLOYEE"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title={`Welcome back, ${employee?.firstName || 'Employee'}`}
        subtitle="Your workspace for daily tasks and customer service"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              EMPLOYEE
            </span>
            
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
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
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{employee?.firstName} {employee?.lastName}</p>
                    <p className="text-xs text-gray-600">{employee?.position}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    My Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Time Tracking
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

      <div className="p-6 max-w-7xl mx-auto">
        {/* Employee Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {employeeMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{metric.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${
                  metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'green' ? 'bg-green-100' :
                  metric.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <metric.icon className={`w-6 h-6 ${
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions
                  .filter(action => action.available)
                  .map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.href)}
                      className="group text-left p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-xl ${
                          action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                          action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                          action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' : 
                          'bg-orange-100 group-hover:bg-orange-200'
                        } transition-colors`}>
                          <action.icon className={`w-6 h-6 ${
                            action.color === 'blue' ? 'text-blue-600' :
                            action.color === 'green' ? 'text-green-600' :
                            action.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{action.title}</h4>
                          <p className="text-sm text-gray-600">{action.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quote #Q-2024-156 sent</p>
                    <p className="text-xs text-gray-600">Pool fencing quote for $8,900 • 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer follow-up completed</p>
                    <p className="text-xs text-gray-600">Called Luxury Pools Brisbane • 4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <UsersIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">New customer added</p>
                    <p className="text-xs text-gray-600">Elite Glass Co - Commercial client • 6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Today's Schedule & Tasks */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Calendar
                </button>
              </div>
              
              <div className="space-y-3">
                {todaysTasks.map((task, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                    task.status === 'completed' ? 'bg-green-50' :
                    task.status === 'pending' ? 'bg-orange-50' : 'bg-gray-50'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'pending' ? 'bg-orange-500' : 'bg-gray-400'
                    }`}></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-600">{task.time}</span>
                        {task.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-900">{task.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Performance</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Weekly Quote Target</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">9 of 12 quotes completed</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Customer Satisfaction</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on recent feedback</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/products')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">Product Catalog</span>
                </button>
                {employee?.permissions.canViewPricing && (
                  <button 
                    onClick={() => navigate('/pricing')}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">Pricing Guide</span>
                  </button>
                )}
                <button 
                  onClick={() => navigate('/customers')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">Customer Directory</span>
                </button>
                <button 
                  onClick={() => navigate('/help')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">Help & Training</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}