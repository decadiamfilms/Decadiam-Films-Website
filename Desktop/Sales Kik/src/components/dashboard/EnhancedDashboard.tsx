import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, TrendingUpIcon, CurrencyDollarIcon,
  ClockIcon, AlertTriangleIcon, CheckCircleIcon,
  ArrowRightIcon, PlusIcon, EyeIcon
} from '@heroicons/react/24/outline';
import '../../styles/enhanced-theme.css';

interface BusinessMetrics {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  quotes: {
    active: number;
    pendingApproval: number;
    conversionRate: number;
  };
  inventory: {
    lowStockItems: number;
    totalValue: number;
    reorderAlerts: number;
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'quote' | 'order' | 'stock' | 'customer';
  title: string;
  description: string;
  time: string;
  amount?: number;
  status: 'success' | 'warning' | 'info';
  urgent?: boolean;
}

export function EnhancedDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: { thisMonth: 47250, lastMonth: 42180, growth: 12 },
    quotes: { active: 23, pendingApproval: 7, conversionRate: 68 },
    inventory: { lowStockItems: 8, totalValue: 156780, reorderAlerts: 3 },
    customers: { total: 147, active: 92, newThisMonth: 12 }
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'quote',
      title: 'New quote created',
      description: 'Premium Glass Solutions - Shower screen installation',
      time: '2 hours ago',
      amount: 3400,
      status: 'info'
    },
    {
      id: '2',
      type: 'stock',
      title: 'Low stock alert',
      description: '10mm Clear Toughened Glass - Only 3 panels remaining',
      time: '4 hours ago',
      status: 'warning',
      urgent: true
    },
    {
      id: '3',
      type: 'order',
      title: 'Order confirmed',
      description: 'ABC Construction - Pool fencing project',
      time: '6 hours ago',
      amount: 7800,
      status: 'success'
    },
    {
      id: '4',
      type: 'customer',
      title: 'New customer added',
      description: 'City Heights Apartments - Commercial project',
      time: '1 day ago',
      status: 'info'
    }
  ]);

  const [quickActions] = useState([
    { 
      title: 'Create Quote', 
      description: 'Start a new customer quote',
      icon: PlusIcon,
      href: '/quotes',
      color: 'blue',
      urgent: false
    },
    { 
      title: 'Check Stock', 
      description: 'Review inventory levels',
      icon: EyeIcon,
      href: '/inventory',
      color: 'orange',
      urgent: metrics.inventory.lowStockItems > 5
    },
    { 
      title: 'Pending Approvals', 
      description: `${metrics.quotes.pendingApproval} quotes need approval`,
      icon: ClockIcon,
      href: '/quotes?filter=pending',
      color: 'amber',
      urgent: metrics.quotes.pendingApproval > 5
    },
    { 
      title: 'Recent Orders', 
      description: 'View and manage orders',
      icon: CheckCircleIcon,
      href: '/orders',
      color: 'green',
      urgent: false
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto space-business">
      {/* Business Intelligence Header */}
      <div className="card-premium p-8 border-accent">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-business-primary mb-2">Business Dashboard</h1>
            <p className="text-business-secondary">Your business performance and key metrics</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-business-muted">Last updated</div>
            <div className="text-lg font-semibold text-business-primary">Just now</div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <div className="icon-business">
                <CurrencyDollarIcon className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="metric-trend">
                +{metrics.revenue.growth}%
              </div>
            </div>
            <div className="metric-value">${metrics.revenue.thisMonth.toLocaleString()}</div>
            <div className="metric-label">Revenue This Month</div>
            <div className="text-xs text-business-muted mt-1">
              vs ${metrics.revenue.lastMonth.toLocaleString()} last month
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <div className="icon-business">
                <ChartBarIcon className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="badge-sophisticated badge-info">
                {metrics.quotes.conversionRate}%
              </div>
            </div>
            <div className="metric-value">{metrics.quotes.active}</div>
            <div className="metric-label">Active Quotes</div>
            <div className="text-xs text-business-muted mt-1">
              {metrics.quotes.pendingApproval} pending approval
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <div className="icon-business">
                <AlertTriangleIcon className="w-6 h-6 text-accent-warm" />
              </div>
              <div className="badge-sophisticated badge-warning">
                {metrics.inventory.lowStockItems} low
              </div>
            </div>
            <div className="metric-value">${metrics.inventory.totalValue.toLocaleString()}</div>
            <div className="metric-label">Inventory Value</div>
            <div className="text-xs text-business-muted mt-1">
              {metrics.inventory.reorderAlerts} items need reordering
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <div className="icon-business">
                <TrendingUpIcon className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="badge-sophisticated badge-success">
                +{metrics.customers.newThisMonth}
              </div>
            </div>
            <div className="metric-value">{metrics.customers.active}</div>
            <div className="metric-label">Active Customers</div>
            <div className="text-xs text-business-muted mt-1">
              of {metrics.customers.total} total customers
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Business Activity */}
        <div className="lg:col-span-2">
          <div className="card-business p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-business-primary">Recent Activity</h2>
              <a href="/activity" className="text-accent-primary hover:text-blue-700 font-medium text-sm">
                View All Activity
              </a>
            </div>
            
            <div className="space-compact">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`p-4 rounded-lg border hover-elevate cursor-pointer ${
                    activity.urgent 
                      ? 'border-warm bg-gradient-to-r from-orange-50 to-red-50' 
                      : 'border-sophisticated bg-gradient-to-r from-white to-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'warning' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`} />
                        <h3 className="font-medium text-business-primary">{activity.title}</h3>
                        {activity.urgent && (
                          <div className="badge-sophisticated badge-warning">Urgent</div>
                        )}
                      </div>
                      <p className="text-business-secondary text-sm mb-2">{activity.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-business-muted">{activity.time}</span>
                        {activity.amount && (
                          <span className="font-semibold text-green-600">
                            ${activity.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-business-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Business Intelligence */}
        <div className="space-business">
          {/* Urgent Actions */}
          <div className="card-business p-6 border-warning">
            <h3 className="text-lg font-semibold text-business-primary mb-4">Needs Attention</h3>
            <div className="space-compact">
              {quickActions.filter(action => action.urgent).map((action) => (
                <a
                  key={action.title}
                  href={action.href}
                  className="block p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-business-primary">{action.title}</div>
                      <div className="text-sm text-business-secondary">{action.description}</div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-orange-600" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-business p-6">
            <h3 className="text-lg font-semibold text-business-primary mb-4">Quick Actions</h3>
            <div className="space-compact">
              {quickActions.filter(action => !action.urgent).map((action) => (
                <a
                  key={action.title}
                  href={action.href}
                  className="block p-3 rounded-lg border border-sophisticated hover-elevate bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-5 h-5 ${
                      action.color === 'blue' ? 'text-accent-primary' :
                      action.color === 'orange' ? 'text-accent-warm' :
                      action.color === 'green' ? 'text-green-600' :
                      'text-amber-600'
                    }`} />
                    <div>
                      <div className="font-medium text-business-primary">{action.title}</div>
                      <div className="text-sm text-business-secondary">{action.description}</div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-business-muted" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Business Insights */}
          <div className="card-business p-6 border-accent">
            <h3 className="text-lg font-semibold text-business-primary mb-4">Business Insights</h3>
            <div className="space-compact">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-sm font-medium text-business-primary">Best Performing Product</div>
                <div className="text-business-secondary">10mm Clear Shower Doors</div>
                <div className="text-xs text-business-muted">47 sales this month</div>
              </div>
              
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="text-sm font-medium text-business-primary">Top Customer</div>
                <div className="text-business-secondary">Premium Glass Solutions</div>
                <div className="text-xs text-business-muted">$23,400 in orders this quarter</div>
              </div>
              
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="text-sm font-medium text-business-primary">Peak Sales Day</div>
                <div className="text-business-secondary">Tuesdays</div>
                <div className="text-xs text-business-muted">Schedule quotes for Mondays</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Health Overview */}
      <div className="card-business p-6 bg-pattern-subtle">
        <h2 className="text-xl font-semibold text-business-primary mb-6">Business Health Check</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="progress-sophisticated mb-3">
              <div className="progress-bar" style={{ width: '78%' }} />
            </div>
            <div className="text-lg font-semibold text-business-primary">78%</div>
            <div className="text-sm text-business-secondary">Inventory Setup Complete</div>
            <div className="text-xs text-business-muted">Add 15 more products to reach 100%</div>
          </div>
          
          <div className="text-center">
            <div className="progress-sophisticated mb-3">
              <div className="progress-bar" style={{ width: '92%' }} />
            </div>
            <div className="text-lg font-semibold text-business-primary">92%</div>
            <div className="text-sm text-business-secondary">Customer Data Quality</div>
            <div className="text-xs text-business-muted">Excellent customer information</div>
          </div>
          
          <div className="text-center">
            <div className="progress-sophisticated mb-3">
              <div className="progress-bar" style={{ width: '65%' }} />
            </div>
            <div className="text-lg font-semibold text-business-primary">65%</div>
            <div className="text-sm text-business-secondary">Quote Conversion Rate</div>
            <div className="text-xs text-business-muted">Industry average: 58%</div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="card-business p-6 border-success">
        <h2 className="text-xl font-semibold text-business-primary mb-4">Smart Recommendations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <div className="font-medium text-business-primary mb-2">Reorder Glass Panels</div>
            <div className="text-sm text-business-secondary mb-3">
              Based on your sales pattern, you typically need to reorder 10mm clear panels every 3 weeks.
            </div>
            <button className="btn-sophisticated btn-primary text-sm px-4 py-2">
              Create Purchase Order
            </button>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div className="font-medium text-business-primary mb-2">Follow Up Quotes</div>
            <div className="text-sm text-business-secondary mb-3">
              5 quotes from last week haven't received responses. Consider following up.
            </div>
            <button className="btn-sophisticated btn-secondary text-sm px-4 py-2">
              Send Follow-ups
            </button>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
            <div className="font-medium text-business-primary mb-2">Price Optimization</div>
            <div className="text-sm text-business-secondary mb-3">
              Your installation labor rate is 15% below market average for your area.
            </div>
            <button className="btn-sophisticated btn-accent text-sm px-4 py-2">
              Review Pricing
            </button>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
            <div className="font-medium text-business-primary mb-2">Customer Retention</div>
            <div className="text-sm text-business-secondary mb-3">
              3 regular customers haven't placed orders in 60+ days.
            </div>
            <button className="btn-sophisticated btn-secondary text-sm px-4 py-2">
              Check In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboard;