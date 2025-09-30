import React from 'react';
import { ArrowLeftIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const StockFlowComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">StockFlow Manager</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <ArchiveBoxIcon className="w-12 h-12 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            StockFlow Manager - Coming Soon
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            The comprehensive stock management system is currently being updated. 
            This feature will include advanced inventory tracking, automated purchase order generation, 
            warehouse management, and enterprise-scale stock flow operations.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8 text-left max-w-4xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Inventory Management</h3>
              <p className="text-sm text-gray-600">
                Real-time stock tracking, automated alerts, and advanced filtering for thousands of products.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Auto Purchase Orders</h3>
              <p className="text-sm text-gray-600">
                AI-powered purchase order generation with approval workflows and supplier management.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Warehouse Operations</h3>
              <p className="text-sm text-gray-600">
                Multi-warehouse support, stock transfers, and comprehensive reporting dashboards.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This feature is being rebuilt to ensure optimal performance and stability. 
              Thank you for your patience while we enhance your stock management experience.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockFlowComingSoon;