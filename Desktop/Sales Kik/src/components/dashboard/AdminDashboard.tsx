import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import {
  ChartBarIcon, CurrencyDollarIcon, UserGroupIcon, 
  BriefcaseIcon, ExclamationTriangleIcon, CheckCircleIcon,
  ArrowUpIcon, ArrowDownIcon, ClockIcon, BanknotesIcon,
  BuildingOfficeIcon, TruckIcon, UserIcon, StarIcon,
  BellIcon, CalendarIcon, CogIcon, ChartPieIcon,
  DocumentTextIcon, ShoppingCartIcon, ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

interface BusinessMetric {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  target?: number;
  progress?: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  value?: string;
  action?: string;
  actionColor?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'on-site' | 'office' | 'training' | 'break';
  location: string;
  sales: number;
  efficiency: number;
  rating: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);

  // Business KPI data
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([
    {
      title: 'Monthly Revenue',
      value: '$89,420',
      change: 12.5,
      trend: 'up',
      target: 100000,
      progress: 89.4,
      icon: CurrencyDollarIcon,
      color: 'emerald'
    },
    {
      title: 'Active Quotes',
      value: '47',
      change: -8.2,
      trend: 'down', 
      icon: DocumentTextIcon,
      color: 'blue'
    },
    {
      title: 'Jobs Running',
      value: '23',
      change: 15.7,
      trend: 'up',
      icon: BriefcaseIcon,
      color: 'purple'
    },
    {
      title: 'Team Size',
      value: '12',
      change: 0,
      trend: 'up',
      icon: UserGroupIcon,
      color: 'orange'
    }
  ]);

  // Critical alerts
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Overdue Invoices',
      description: '3 invoices totaling $12,450 are past due',
      value: '$12,450',
      action: 'Send Reminders',
      actionColor: 'red'
    },
    {
      id: '2', 
      type: 'warning',
      title: 'Quotes Pending Approval',
      description: '8 quotes worth $45,200 awaiting approval',
      value: '$45,200',
      action: 'Review Quotes',
      actionColor: 'orange'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Inventory Alert',
      description: '5 glass panels below reorder point',
      action: 'Reorder Stock',
      actionColor: 'yellow'
    },
    {
      id: '4',
      type: 'info',
      title: 'Employee Training',
      description: '2 team members have upcoming safety training',
      action: 'View Schedule',
      actionColor: 'blue'
    }
  ]);

  // Revenue chart data
  const revenueData = [
    { month: 'Jan', revenue: 65000, costs: 35000, profit: 30000 },
    { month: 'Feb', revenue: 59000, costs: 32000, profit: 27000 },
    { month: 'Mar', revenue: 80000, costs: 45000, profit: 35000 },
    { month: 'Apr', revenue: 81000, costs: 42000, profit: 39000 },
    { month: 'May', revenue: 56000, costs: 28000, profit: 28000 },
    { month: 'Jun', revenue: 55000, costs: 30000, profit: 25000 },
    { month: 'Jul', revenue: 89000, costs: 48000, profit: 41000 },
    { month: 'Aug', revenue: 89420, costs: 45200, profit: 44220 },
  ];

  // Team performance data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Installer',
      status: 'on-site',
      location: 'Bondi Beach Project',
      sales: 125000,
      efficiency: 94,
      rating: 4.8
    },
    {
      id: '2', 
      name: 'Mike Chen',
      role: 'Sales Manager',
      status: 'office',
      location: 'Head Office',
      sales: 89000,
      efficiency: 87,
      rating: 4.6
    },
    {
      id: '3',
      name: 'Emma Wilson',
      role: 'Project Manager', 
      status: 'on-site',
      location: 'Manly Installation',
      sales: 67000,
      efficiency: 91,
      rating: 4.9
    }
  ]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-site': return 'text-green-600 bg-green-100';
      case 'office': return 'text-blue-600 bg-blue-100';
      case 'training': return 'text-purple-600 bg-purple-100';
      case 'break': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="dashboard" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Business Intelligence Dashboard"
        subtitle="Executive overview and operational control"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-4">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        }
      />

      <div className="p-8 max-w-full mx-auto">
        {/* Dashboard Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
              <p className="text-gray-600 text-lg">Real-time business performance overview</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Viewing Period</div>
              <div className="text-lg font-bold text-gray-900 capitalize">{timePeriod}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content - Left 8 columns */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* 1. Top Hero Section - Business KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {businessMetrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gray-100">
                      <metric.icon className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      metric.trend === 'up' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {metric.trend === 'up' ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                      <span className="text-sm font-bold">{Math.abs(metric.change)}%</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                    <p className="text-gray-600 font-medium">{metric.title}</p>
                  </div>

                  {metric.progress && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Target Progress</span>
                        <span className="text-sm font-bold text-gray-900">{metric.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metric.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 2. Critical Business Alerts Panel */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-2xl">
                    <BellIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Business Alerts</h2>
                    <p className="text-gray-600">Items requiring management attention</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {alerts.filter(a => a.type === 'critical').length} critical, {alerts.filter(a => a.type === 'warning').length} warnings
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-2xl border-2 p-4 ${getAlertColor(alert.type)} hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {alert.type === 'critical' && <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
                          {alert.type === 'warning' && <ClockIcon className="w-5 h-5 text-orange-600" />}
                          {alert.type === 'info' && <CheckCircleIcon className="w-5 h-5 text-blue-600" />}
                          <h3 className="font-bold text-gray-900">{alert.title}</h3>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{alert.description}</p>
                        {alert.value && (
                          <p className="text-2xl font-bold text-gray-900">{alert.value}</p>
                        )}
                      </div>
                      {alert.action && (
                        <button className={`px-4 py-2 bg-${alert.actionColor}-500 text-white rounded-lg hover:bg-${alert.actionColor}-600 transition-colors text-sm font-medium`}>
                          {alert.action}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Revenue Analytics Chart */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
                  <p className="text-gray-600">Monthly performance over 12 months</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">Costs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">Profit</span>
                  </div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">52.3%</div>
                  <div className="text-sm text-gray-600">Gross Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$44,220</div>
                  <div className="text-sm text-gray-600">Net Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">+18.5%</div>
                  <div className="text-sm text-gray-600">Cash Flow</div>
                </div>
              </div>
            </div>

            {/* 4. Team Performance Table */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Team Performance</h2>
                  <p className="text-gray-600">Real-time team status and performance metrics</p>
                </div>
                <button 
                  onClick={() => navigate('/employees')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Full Report
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Team Member</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Sales</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Efficiency</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-25">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
                              {member.status.replace('-', ' ')}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">{member.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">${member.sales.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${member.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{member.efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(member.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm font-bold text-gray-900 ml-2">{member.rating}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Business Intelligence Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Performance Trends</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Glass Fencing Sales</span>
                    <span className="text-gray-900 font-bold">+34%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Quote Response Time</span>
                    <span className="text-gray-900 font-bold">2.4 hrs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Repeat Customers</span>
                    <span className="text-gray-900 font-bold">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Average Job Value</span>
                    <span className="text-gray-900 font-bold">$3,890</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sales Pipeline Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Pipeline Value</span>
                    <span className="text-gray-900 font-bold">$124K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Conversion Rate</span>
                    <span className="text-gray-900 font-bold">73%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Avg. Close Time</span>
                    <span className="text-gray-900 font-bold">12 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Win Rate</span>
                    <span className="text-gray-900 font-bold">68%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* 6. Financial Summary Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Bank Balance</span>
                  <span className="text-2xl font-bold text-gray-900">$45,230</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Outstanding</span>
                  <span className="text-gray-900 font-bold">$12,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Monthly Expenses</span>
                  <span className="text-gray-900 font-bold">$28,900</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-bold">Net Cash Flow</span>
                    <span className="text-2xl font-bold text-gray-900">+$16,330</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/quotes')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <DocumentTextIcon className="w-6 h-6 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">New Quote</div>
                </button>
                <button 
                  onClick={() => navigate('/inventory')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <ChartBarIcon className="w-6 h-6 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">Check Stock</div>
                </button>
                <button 
                  onClick={() => navigate('/customers')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <UserGroupIcon className="w-6 h-6 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">Add Customer</div>
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <CogIcon className="w-6 h-6 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">Settings</div>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Team Meeting</div>
                    <div className="text-sm text-gray-600">9:00 AM - Safety Review</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <BriefcaseIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Client Meeting</div>
                    <div className="text-sm text-gray-600">2:00 PM - Pool Project Review</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TruckIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Glass Delivery</div>
                    <div className="text-sm text-gray-600">4:00 PM - Premium Glass Co</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Goals Tracking */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Goals</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Q4 Revenue Goal</span>
                    <span className="text-gray-900 font-bold">89.4%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gray-600 h-3 rounded-full" style={{ width: '89.4%' }}></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">$89,420 of $100,000</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Annual Profit Target</span>
                    <span className="text-gray-900 font-bold">76.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gray-600 h-3 rounded-full" style={{ width: '76.2%' }}></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">$458K of $600K</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Team Productivity</span>
                    <span className="text-gray-900 font-bold">91%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gray-600 h-3 rounded-full" style={{ width: '91%' }}></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Exceeding target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}