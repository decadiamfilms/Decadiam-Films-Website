import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import GlassModuleAdminComprehensive from '../../components/admin/GlassModuleAdminComprehensive';
import { ProtectedGlassComponent } from '../../hooks/useGlassModuleAccess';
import { 
  CubeIcon, 
  TagIcon, 
  AdjustmentsHorizontalIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

function GlassAdminPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <ProtectedGlassComponent>
      <div className="min-h-screen bg-gray-50">
        <UniversalNavigation 
          currentPage="glass-admin" 
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
        />

        <UniversalHeader
          title="Glass Module Administration"
          subtitle="Manage glass types, pricing, and processing options"
          onMenuToggle={() => setShowSidebar(true)}
        />

        <div className="p-6 max-w-none mx-auto">
          
          {/* Glass Admin Info Panel - Matching Custom Glass Module Style */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <div className="text-white text-lg">🪟</div>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Glass Industry Module Administration</h3>
                  <p className="text-sm text-blue-700">
                    Configure glass types • Set base pricing • Manage processing options • $35/month module
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  🔧 Admin Mode
                </div>
                <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Header - Similar to Customer Selection Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Back Navigation */}
              <div>
                <label className="block text-base font-medium text-gray-500 mb-1">Navigation</label>
                <button
                  onClick={() => navigate('/inventory/custom-glass')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base flex items-center justify-center gap-2 h-12"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Glass Module
                </button>
              </div>

            </div>
          </div>

          {/* Main Admin Interface - Using Comprehensive Glass Module Admin */}
          <GlassModuleAdminComprehensive />

          {/* Bottom Navigation - Matching Custom Glass Page Style */}
          <div className="bg-white border-t border-gray-200 rounded-xl shadow-lg mt-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/inventory/custom-glass')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Glass Module
                  </button>
                  
                  <button
                    onClick={() => navigate('/inventory')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base flex items-center justify-center gap-2"
                  >
                    <CubeIcon className="w-4 h-4" />
                    Back to Inventory
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    💡 Tip: Use these admin tools to configure glass types, pricing, and processing options for your quotes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedGlassComponent>
  );
}

export default GlassAdminPage;