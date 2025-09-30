import React, { useState, useEffect } from 'react';
import { 
  ShieldExclamationIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getSecurityDashboardData } from '../../services/PurchaseOrderSecurityService';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityDashboard({ isOpen, onClose }: SecurityDashboardProps) {
  const [securityData, setSecurityData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSecurityData(getSecurityDashboardData());
    }
  }, [isOpen]);

  if (!isOpen || !securityData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Security Dashboard</h3>
              <p className="text-gray-600">System security status and alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Security Score */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
              <div className={`text-2xl font-bold ${
                securityData.securityScore >= 90 ? 'text-green-600' :
                securityData.securityScore >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {securityData.securityScore}
              </div>
              <div className="text-sm text-gray-600">Security Score</div>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{securityData.recentAlerts.length}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
            <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{securityData.quarantinedFiles}</div>
              <div className="text-sm text-gray-600">Quarantined Files</div>
            </div>
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{securityData.accessViolations}</div>
              <div className="text-sm text-gray-600">Access Violations</div>
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3">Security Recommendations</h5>
            <div className="space-y-2">
              {securityData.recommendations?.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}