import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, ClockIcon, BanknotesIcon, TruckIcon,
  BuildingOfficeIcon, DocumentTextIcon, ExclamationTriangleIcon,
  CheckCircleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  CalendarIcon, StarIcon, ShoppingCartIcon, EyeIcon,
  ArrowDownTrayIcon, PrinterIcon, InformationCircleIcon,
  CubeIcon, UserIcon, TagIcon
} from '@heroicons/react/24/outline';

// Analytics Interfaces
interface PurchaseOrderMetrics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  pendingApprovals: number;
  awaitingInvoices: number;
  blockedOrders: number;
  completedOrders: number;
  averageProcessingTime: number;
  supplierResponseRate: number;
  invoiceMatchingAccuracy: number;
}

interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
  averageResponseTime: number;
  onTimeDeliveryRate: number;
  performanceRating: number;
  lastOrderDate: Date;
  isGlassSupplier: boolean;
}

interface MonthlyTrend {
  month: string;
  ordersCreated: number;
  totalValue: number;
  averageOrderValue: number;
  completionRate: number;
}

interface CategoryAnalysis {
  categoryName: string;
  orderCount: number;
  totalValue: number;
  averageOrderValue: number;
  topSuppliers: string[];
  isCustomGlass: boolean;
}

interface PurchaseOrderAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseOrderAnalytics({ isOpen, onClose }: PurchaseOrderAnalyticsProps) {
  const [metrics, setMetrics] = useState<PurchaseOrderMetrics | null>(null);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      calculateAnalytics();
    }
  }, [isOpen, selectedTimeRange]);

  const calculateAnalytics = () => {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('saleskik-suppliers') || '[]');
    
    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    switch (selectedTimeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredOrders = purchaseOrders.filter((order: any) => 
      new Date(order.createdAt) >= cutoffDate
    );

    // Calculate main metrics
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    const pendingApprovals = filteredOrders.filter((order: any) => order.status === 'PENDING_APPROVAL').length;
    const awaitingInvoices = filteredOrders.filter((order: any) => order.invoiceRequired && !order.invoiceCreated).length;
    const blockedOrders = filteredOrders.filter((order: any) => order.dispatchBlocked).length;
    const completedOrders = filteredOrders.filter((order: any) => order.status === 'COMPLETED').length;

    // Calculate processing times
    const processedOrders = filteredOrders.filter((order: any) => 
      order.status !== 'DRAFT' && order.status !== 'PENDING_APPROVAL'
    );
    const averageProcessingTime = processedOrders.length > 0 
      ? processedOrders.reduce((sum: number, order: any) => {
          const created = new Date(order.createdAt);
          const processed = new Date(order.updatedAt);
          return sum + (processed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / processedOrders.length
      : 0;

    // Supplier response rate
    const sentToSupplier = filteredOrders.filter((order: any) => 
      ['SENT_TO_SUPPLIER', 'SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'INVOICED', 'COMPLETED'].includes(order.status)
    );
    const supplierConfirmed = filteredOrders.filter((order: any) => order.supplierConfirmedDate);
    const supplierResponseRate = sentToSupplier.length > 0 ? (supplierConfirmed.length / sentToSupplier.length) * 100 : 0;

    const invoiceMatchingAccuracy = 95; // Mock metric for demonstration

    const calculatedMetrics: PurchaseOrderMetrics = {
      totalOrders,
      totalValue,
      averageOrderValue,
      pendingApprovals,
      awaitingInvoices,
      blockedOrders,
      completedOrders,
      averageProcessingTime,
      supplierResponseRate,
      invoiceMatchingAccuracy
    };

    setMetrics(calculatedMetrics);

    // Calculate supplier performance
    const supplierPerformanceData: SupplierPerformance[] = suppliers.map((supplier: any) => {
      const supplierOrders = filteredOrders.filter((order: any) => order.supplier.id === supplier.id);
      const supplierValue = supplierOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
      
      return {
        supplierId: supplier.id,
        supplierName: supplier.supplierName || supplier.name,
        totalOrders: supplierOrders.length,
        totalValue: supplierValue,
        averageResponseTime: 24,
        onTimeDeliveryRate: 92,
        performanceRating: supplier.performanceRating || 5.0,
        lastOrderDate: supplier.lastOrderDate ? new Date(supplier.lastOrderDate) : new Date(),
        isGlassSupplier: supplier.isLocalGlassSupplier || false
      };
    }).filter(perf => perf.totalOrders > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    setSupplierPerformance(supplierPerformanceData);

    // Calculate monthly trends
    const monthlyData: { [key: string]: { orders: number; value: number; completed: number } } = {};
    
    filteredOrders.forEach((order: any) => {
      const monthKey = new Date(order.createdAt).toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: 0, value: 0, completed: 0 };
      }
      monthlyData[monthKey].orders++;
      monthlyData[monthKey].value += order.totalAmount;
      if (order.status === 'COMPLETED') {
        monthlyData[monthKey].completed++;
      }
    });

    const monthlyTrendsData: MonthlyTrend[] = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ordersCreated: data.orders,
        totalValue: data.value,
        averageOrderValue: data.value / data.orders,
        completionRate: (data.completed / data.orders) * 100
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyTrends(monthlyTrendsData);

    // Category analysis
    const categoryData: { [key: string]: { orders: any[]; value: number; suppliers: Set<string> } } = {};
    
    filteredOrders.forEach((order: any) => {
      order.lineItems.forEach((item: any) => {
        const category = item.product.categoryName || 'Uncategorized';
        if (!categoryData[category]) {
          categoryData[category] = { orders: [], value: 0, suppliers: new Set() };
        }
        categoryData[category].orders.push(order);
        categoryData[category].value += item.subtotal;
        categoryData[category].suppliers.add(order.supplier.supplierName);
      });
    });

    const categoryAnalysisData: CategoryAnalysis[] = Object.entries(categoryData)
      .map(([categoryName, data]) => ({
        categoryName,
        orderCount: data.orders.length,
        totalValue: data.value,
        averageOrderValue: data.value / data.orders.length,
        topSuppliers: Array.from(data.suppliers).slice(0, 3),
        isCustomGlass: categoryName.toLowerCase().includes('glass')
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    setCategoryAnalysis(categoryAnalysisData);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date(),
      timeRange: selectedTimeRange,
      metrics,
      supplierPerformance,
      monthlyTrends,
      categoryAnalysis
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `purchase-order-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Purchase Order Analytics</h3>
              <p className="text-gray-600">Performance insights and supplier analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Key Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
                <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                  <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{metrics.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-xs text-green-600 mt-1">
                  {formatCurrency(metrics.averageOrderValue)} avg
                </div>
              </div>

              <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
                <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                  <BanknotesIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-xs text-blue-600 mt-1">
                  {metrics.completedOrders} completed
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
                <div className="p-2 bg-yellow-100 rounded-lg w-fit mx-auto mb-2">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{metrics.averageProcessingTime.toFixed(1)}d</div>
                <div className="text-sm text-gray-600">Avg Processing</div>
                <div className="text-xs text-purple-600 mt-1">
                  {formatPercentage(metrics.supplierResponseRate)} response rate
                </div>
              </div>

              <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
                <div className="p-2 bg-red-100 rounded-lg w-fit mx-auto mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{metrics.blockedOrders}</div>
                <div className="text-sm text-gray-600">Blocked Orders</div>
                <div className="text-xs text-orange-600 mt-1">
                  {metrics.awaitingInvoices} awaiting invoices
                </div>
              </div>
            </div>
          )}

          {/* Supplier Performance Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Supplier Performance Leaderboard</h4>
              <p className="text-sm text-gray-600">Ranked by total order value</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Time Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierPerformance.slice(0, 10).map((supplier, index) => (
                    <tr key={supplier.supplierId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-gray-900">{supplier.supplierName}</div>
                            <div className="text-xs text-gray-600">
                              Last order: {supplier.lastOrderDate.toLocaleDateString()}
                            </div>
                          </div>
                          {supplier.isGlassSupplier && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                              Glass
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-blue-600">{supplier.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-green-600">{formatCurrency(supplier.totalValue)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{supplier.performanceRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          supplier.onTimeDeliveryRate >= 95 ? 'bg-green-100 text-green-800' :
                          supplier.onTimeDeliveryRate >= 85 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(supplier.onTimeDeliveryRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Monthly Trends</h4>
            
            {monthlyTrends.length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No data available for selected time range</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyTrends.map((trend) => {
                  const monthName = new Date(trend.month + '-01').toLocaleDateString('en-AU', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  const maxValue = Math.max(...monthlyTrends.map(t => t.totalValue));
                  const barWidth = maxValue > 0 ? (trend.totalValue / maxValue) * 100 : 0;
                  
                  return (
                    <div key={trend.month} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{monthName}</div>
                        <div className="text-sm text-gray-600">
                          {trend.ordersCreated} orders • {formatCurrency(trend.totalValue)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {formatPercentage(trend.completionRate)} completion
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Category Analysis</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAnalysis.map(category => (
                <div key={category.categoryName} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-900">{category.categoryName}</div>
                    {category.isCustomGlass && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        Glass
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-medium">{category.orderCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium text-green-600">{formatCurrency(category.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Order:</span>
                      <span className="font-medium">{formatCurrency(category.averageOrderValue)}</span>
                    </div>
                    
                    {/* Top Suppliers */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Top Suppliers:</div>
                      <div className="space-y-1">
                        {category.topSuppliers.map((supplier, index) => (
                          <div key={index} className="text-xs text-gray-700">
                            {index + 1}. {supplier}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Intelligence Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Business Intelligence Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Key Insights */}
              <div>
                <h5 className="font-medium text-blue-900 mb-2">Key Insights</h5>
                <div className="space-y-2">
                  {metrics && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        {metrics.supplierResponseRate >= 90 ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-blue-800">
                          Supplier response rate: {formatPercentage(metrics.supplierResponseRate)}
                          {metrics.supplierResponseRate >= 90 ? ' (Excellent)' : ' (Needs improvement)'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        {metrics.averageProcessingTime <= 3 ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-blue-800">
                          Processing time: {metrics.averageProcessingTime.toFixed(1)} days
                          {metrics.averageProcessingTime <= 3 ? ' (Fast)' : ' (Consider optimization)'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        {metrics.invoiceMatchingAccuracy >= 95 ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-blue-800">
                          Invoice accuracy: {formatPercentage(metrics.invoiceMatchingAccuracy)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                <div className="space-y-2">
                  {metrics && metrics.blockedOrders > 0 && (
                    <div className="flex items-start gap-2 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        Address {metrics.blockedOrders} blocked order{metrics.blockedOrders !== 1 ? 's' : ''} to improve cash flow
                      </span>
                    </div>
                  )}
                  
                  {supplierPerformance.length > 0 && (
                    <>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>
                          Top performer: {supplierPerformance[0]?.supplierName} ({supplierPerformance[0]?.performanceRating.toFixed(1)} rating)
                        </span>
                      </div>
                      
                      {supplierPerformance.filter(s => s.isGlassSupplier).length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-blue-800">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>
                            {supplierPerformance.filter(s => s.isGlassSupplier).length} glass specialist{supplierPerformance.filter(s => s.isGlassSupplier).length !== 1 ? 's' : ''} active
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {metrics && metrics.averageProcessingTime > 5 && (
                    <div className="flex items-start gap-2 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        Consider workflow optimization to reduce processing time
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Export & Reporting</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={exportReport}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Export Data</div>
                  <div className="text-xs text-gray-600">JSON format</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <PrinterIcon className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">PDF Report</div>
                  <div className="text-xs text-gray-600">Management review</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Accounting Export</div>
                  <div className="text-xs text-gray-600">QuickBooks/Xero</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}