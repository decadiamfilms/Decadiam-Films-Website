import React, { useState } from 'react';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { 
  DocumentChartBarIcon, ClockIcon, EnvelopeIcon,
  SparklesIcon, CogIcon, CalendarIcon
} from '@heroicons/react/24/outline';

export default function AutomatedReportsPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="admin" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Automated Reports"
        subtitle="Scheduled purchase order reports for management visibility"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DocumentChartBarIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Purchase Order Automated Reporting</h2>
                <p className="text-gray-600">
                  Schedule monthly, quarterly, and yearly reports for stakeholders
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium transition-all shadow-sm"
            >
              <CogIcon className="w-5 h-5" />
              Manage Automated Reports
            </button>
          </div>
        </div>

        {/* Default Report Subscriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Monthly Executive Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Monthly Executive Summary</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              High-level overview of purchase order performance for C-suite executives
            </p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Key performance indicators</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Critical issues identification</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Strategic recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Automated delivery to CEO/COO</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Frequency: 1st of each month</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
              </div>
            </div>
          </div>

          {/* Weekly Procurement Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Weekly Procurement Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Detailed operational metrics and supplier performance for procurement team
            </p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Supplier performance metrics</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Process efficiency analysis</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Workflow optimization insights</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Operational recommendations</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Frequency: Every Monday</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
              </div>
            </div>
          </div>

          {/* Quarterly Financial Overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Quarterly Financial Overview</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Comprehensive financial analysis and spending insights for CFO and finance team
            </p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Spending breakdown by category</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Cost savings analysis</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Budget variance reporting</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Financial recommendations</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Frequency: Every quarter</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Overview */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-4">Automated Reporting Benefits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-indigo-900 mb-2">Management Visibility</h4>
              <div className="space-y-2 text-sm text-indigo-800">
                <div>✓ Consistent executive reporting without manual effort</div>
                <div>✓ Critical issue identification and escalation</div>
                <div>✓ Performance trend analysis and recommendations</div>
                <div>✓ Stakeholder-specific content and formatting</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-indigo-900 mb-2">Operational Excellence</h4>
              <div className="space-y-2 text-sm text-indigo-800">
                <div>✓ Automated delivery eliminates missed reports</div>
                <div>✓ Standardized metrics across all reporting periods</div>
                <div>✓ Professional branding and formatting</div>
                <div>✓ Data-driven insights for strategic decisions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Available Report Types</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                type: 'EXECUTIVE_SUMMARY',
                name: 'Executive Summary',
                description: 'High-level KPIs, critical issues, and strategic recommendations',
                audience: 'CEO, COO, Board Members',
                frequency: 'Monthly/Quarterly'
              },
              {
                type: 'OPERATIONAL_METRICS',
                name: 'Operational Metrics',
                description: 'Process efficiency, supplier performance, and workflow analysis',
                audience: 'Procurement Manager, Operations Manager',
                frequency: 'Weekly/Monthly'
              },
              {
                type: 'FINANCIAL_OVERVIEW',
                name: 'Financial Overview',
                description: 'Spending analysis, cost savings, and budget variance',
                audience: 'CFO, Finance Manager, Accounting',
                frequency: 'Monthly/Quarterly'
              },
              {
                type: 'SUPPLIER_PERFORMANCE',
                name: 'Supplier Performance',
                description: 'Supplier scorecards, response rates, and relationship insights',
                audience: 'Procurement Team, Supplier Managers',
                frequency: 'Monthly'
              },
              {
                type: 'DETAILED_ANALYSIS',
                name: 'Detailed Analysis',
                description: 'Comprehensive order breakdown and analytical insights',
                audience: 'Analysts, Department Heads',
                frequency: 'Weekly/Monthly'
              }
            ].map((reportType) => (
              <div key={reportType.type} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{reportType.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{reportType.description}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div><span className="font-medium">Audience:</span> {reportType.audience}</div>
                  <div><span className="font-medium">Typical Frequency:</span> {reportType.frequency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Automated Reporting Dashboard - Temporarily Disabled */}
      {showDashboard && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">Automated Reports</h3>
            <p className="text-gray-600 mb-4">Automated reporting system temporarily disabled during development.</p>
            <button
              onClick={() => setShowDashboard(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}