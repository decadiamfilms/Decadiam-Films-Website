import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

interface PerformanceMetrics {
  jobCompletion: {
    total: number;
    completed: number;
    onTime: number;
    overdue: number;
    cancelled: number;
    completionRate: number;
    onTimeRate: number;
  };
  crewUtilization: {
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
    averageHoursPerDay: number;
    overtimeHours: number;
  };
  customerSatisfaction: {
    averageRating: number;
    totalRatings: number;
    responseRate: number;
    repeatCustomers: number;
  };
  financial: {
    totalRevenue: number;
    averageJobValue: number;
    costPerHour: number;
    profitMargin: number;
  };
  efficiency: {
    averageJobDuration: number;
    estimateAccuracy: number;
    firstTimeFixRate: number;
    reworkJobs: number;
  };
}

interface CrewPerformance {
  id: string;
  name: string;
  jobsCompleted: number;
  totalHours: number;
  utilizationRate: number;
  qualityRating: number;
  customerRating: number;
  productivityRate: number;
  onTimeRate: number;
  skills: string[];
}

interface TrendData {
  date: string;
  jobsCompleted: number;
  hoursWorked: number;
  revenue: number;
  utilizationRate: number;
}

export function PerformanceAnalytics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [crewPerformance, setCrewPerformance] = useState<CrewPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCrewMember, setSelectedCrewMember] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would come from API
    const mockMetrics: PerformanceMetrics = {
      jobCompletion: {
        total: 156,
        completed: 142,
        onTime: 128,
        overdue: 8,
        cancelled: 6,
        completionRate: 91.0,
        onTimeRate: 90.1
      },
      crewUtilization: {
        totalHours: 1280,
        billableHours: 1152,
        utilizationRate: 90.0,
        averageHoursPerDay: 7.8,
        overtimeHours: 48
      },
      customerSatisfaction: {
        averageRating: 4.7,
        totalRatings: 89,
        responseRate: 62.7,
        repeatCustomers: 34
      },
      financial: {
        totalRevenue: 485000,
        averageJobValue: 3109,
        costPerHour: 85,
        profitMargin: 34.5
      },
      efficiency: {
        averageJobDuration: 6.2,
        estimateAccuracy: 87.3,
        firstTimeFixRate: 94.2,
        reworkJobs: 8
      }
    };

    const mockCrewPerformance: CrewPerformance[] = [
      {
        id: 'crew1',
        name: 'Mike Johnson',
        jobsCompleted: 45,
        totalHours: 360,
        utilizationRate: 92.3,
        qualityRating: 4.8,
        customerRating: 4.9,
        productivityRate: 1.2,
        onTimeRate: 95.6,
        skills: ['plumbing', 'electrical']
      },
      {
        id: 'crew2',
        name: 'Tom Wilson',
        jobsCompleted: 38,
        totalHours: 304,
        utilizationRate: 88.7,
        qualityRating: 4.6,
        customerRating: 4.7,
        productivityRate: 1.1,
        onTimeRate: 89.5,
        skills: ['carpentry', 'general']
      },
      {
        id: 'crew3',
        name: 'Dave Brown',
        jobsCompleted: 42,
        totalHours: 336,
        utilizationRate: 90.0,
        qualityRating: 4.9,
        customerRating: 4.8,
        productivityRate: 0.9,
        onTimeRate: 92.9,
        skills: ['plumbing', 'tiling']
      }
    ];

    const mockTrendData: TrendData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      mockTrendData.push({
        date: format(date, 'yyyy-MM-dd'),
        jobsCompleted: Math.floor(Math.random() * 8) + 2,
        hoursWorked: Math.floor(Math.random() * 20) + 40,
        revenue: Math.floor(Math.random() * 5000) + 8000,
        utilizationRate: Math.floor(Math.random() * 20) + 75
      });
    }

    setMetrics(mockMetrics);
    setCrewPerformance(mockCrewPerformance);
    setTrendData(mockTrendData);
    setLoading(false);
  }, [selectedPeriod]);

  const getMetricTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      isNeutral: Math.abs(change) < 1
    };
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    trend?: { value: number; isPositive: boolean; isNeutral: boolean },
    icon?: React.ElementType,
    color: string = 'blue'
  ) => {
    const Icon = icon || ChartBarIcon;
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
          {trend && !trend.isNeutral && (
            <div className={`flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {trend.value.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </div>
      </div>
    );
  };

  const renderCrewPerformanceTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Crew Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crew Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jobs Completed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours Worked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quality Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                On-Time Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {crewPerformance.map((crew) => (
              <tr key={crew.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{crew.name}</div>
                    <div className="text-xs text-gray-500">
                      {crew.skills.join(', ')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {crew.jobsCompleted}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {crew.totalHours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 w-16">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${crew.utilizationRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{crew.utilizationRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-900">{crew.qualityRating.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-900">{crew.customerRating.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {crew.onTimeRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600">Comprehensive insights into your field operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Job Completion Rate',
          `${metrics.jobCompletion.completionRate.toFixed(1)}%`,
          `${metrics.jobCompletion.completed} of ${metrics.jobCompletion.total} jobs completed`,
          getMetricTrend(91.0, 87.2),
          CheckCircleIcon,
          'green'
        )}
        
        {renderMetricCard(
          'Crew Utilization',
          `${metrics.crewUtilization.utilizationRate.toFixed(1)}%`,
          `${metrics.crewUtilization.billableHours}h of ${metrics.crewUtilization.totalHours}h billable`,
          getMetricTrend(90.0, 85.4),
          UserGroupIcon,
          'blue'
        )}
        
        {renderMetricCard(
          'Customer Satisfaction',
          `${metrics.customerSatisfaction.averageRating.toFixed(1)}/5.0`,
          `${metrics.customerSatisfaction.totalRatings} ratings received`,
          getMetricTrend(4.7, 4.5),
          StarIcon,
          'yellow'
        )}
        
        {renderMetricCard(
          'Total Revenue',
          `$${(metrics.financial.totalRevenue / 1000).toFixed(0)}k`,
          `$${metrics.financial.averageJobValue.toFixed(0)} average per job`,
          getMetricTrend(485, 420),
          CurrencyDollarIcon,
          'green'
        )}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderMetricCard(
          'On-Time Performance',
          `${metrics.jobCompletion.onTimeRate.toFixed(1)}%`,
          `${metrics.jobCompletion.onTime} jobs completed on schedule`,
          getMetricTrend(90.1, 88.7),
          ClockIcon,
          'blue'
        )}
        
        {renderMetricCard(
          'First-Time Fix Rate',
          `${metrics.efficiency.firstTimeFixRate.toFixed(1)}%`,
          `${metrics.efficiency.reworkJobs} jobs required rework`,
          getMetricTrend(94.2, 91.8),
          CheckCircleIcon,
          'green'
        )}
        
        {renderMetricCard(
          'Estimate Accuracy',
          `${metrics.efficiency.estimateAccuracy.toFixed(1)}%`,
          `${metrics.efficiency.averageJobDuration.toFixed(1)}h average duration`,
          getMetricTrend(87.3, 83.9),
          DocumentChartBarIcon,
          'purple'
        )}
      </div>

      {/* Crew Performance Table */}
      {renderCrewPerformanceTable()}

      {/* Trends and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Jobs Completed Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {trendData.slice(-14).map((day, index) => (
              <div key={day.date} className="flex flex-col items-center">
                <div
                  className="bg-blue-600 rounded-t w-4"
                  style={{ height: `${(day.jobsCompleted / 10) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                  {format(new Date(day.date), 'M/d')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utilization Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Crew Utilization Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {trendData.slice(-14).map((day, index) => (
              <div key={day.date} className="flex flex-col items-center">
                <div
                  className="bg-green-600 rounded-t w-4"
                  style={{ height: `${(day.utilizationRate / 100) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                  {format(new Date(day.date), 'M/d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issues and Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
            Areas for Improvement
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 rounded-md">
              <div className="text-sm font-medium text-orange-800">
                Estimate Accuracy Below Target
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Current: 87.3% | Target: 90% | Gap: -2.7%
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-md">
              <div className="text-sm font-medium text-yellow-800">
                Customer Survey Response Rate Low
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                Current: 62.7% | Target: 75% | Gap: -12.3%
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-md">
              <div className="text-sm font-medium text-red-800">
                Overtime Hours Increasing
              </div>
              <div className="text-xs text-red-600 mt-1">
                48 hours this period | 25% increase from last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
            Success Highlights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-sm font-medium text-green-800">
                Excellent First-Time Fix Rate
              </div>
              <div className="text-xs text-green-600 mt-1">
                94.2% success rate | 3.1% above industry average
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-sm font-medium text-blue-800">
                High Customer Satisfaction
              </div>
              <div className="text-xs text-blue-600 mt-1">
                4.7/5.0 average rating | 34 repeat customers this period
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-md">
              <div className="text-sm font-medium text-purple-800">
                Strong Team Productivity
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Mike Johnson: 1.2x productivity rate | Top performer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600">Download detailed analytics for external analysis</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export CSV
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export PDF Report
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}