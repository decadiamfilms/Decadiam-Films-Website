import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AutoPOSettings {
  auto_po_enabled: boolean;
  auto_po_approval_required: boolean;
  auto_po_combine_suppliers: boolean;
  auto_po_minimum_items: number;
  auto_po_schedule_time: string;
  trusted_supplier_auto_send: boolean;
  max_auto_send_value: number;
}

interface ApprovalRules {
  low_value: string;
  medium_value: string;
  high_value: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AutoPOSettingsModal({ isOpen, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AutoPOSettings>({
    auto_po_enabled: false,
    auto_po_approval_required: true,
    auto_po_combine_suppliers: true,
    auto_po_minimum_items: 1,
    auto_po_schedule_time: '09:00',
    trusted_supplier_auto_send: false,
    max_auto_send_value: 500
  });

  const [approvalRules, setApprovalRules] = useState<ApprovalRules>({
    low_value: 'auto',
    medium_value: 'manager',
    high_value: 'admin'
  });

  const [testResults, setTestResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    try {
      console.log('📋 Loading current auto-PO settings...');
      
      // Mock settings load - in production would call /api/settings/inventory
      const mockSettings = {
        auto_po_enabled: true,
        auto_po_approval_required: true,
        auto_po_combine_suppliers: true,
        auto_po_minimum_items: 2,
        auto_po_schedule_time: '09:00',
        trusted_supplier_auto_send: false,
        max_auto_send_value: 500
      };
      
      setSettings({ ...settings, ...mockSettings });
      console.log('✅ Settings loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('💾 Saving auto-PO settings...');
      
      // Mock settings save - in production would call /api/auto-po/settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Auto PO settings saved successfully');
      showNotification('success', 'Auto PO settings saved successfully');
      onSaved();
      onClose();
      
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      showNotification('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testGeneration = async () => {
    setTesting(true);
    try {
      console.log('🧪 Running test auto-PO generation...');
      
      // Mock test generation - in production would call /api/auto-po/generate with dry_run: true
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockTestResults = [
        {
          supplier_id: 'hardware-direct',
          supplier_name: 'Hardware Direct',
          items_count: 3,
          total_value: 1250.50,
          products: ['Stainless Steel Bolts', 'Screws', 'Washers']
        },
        {
          supplier_id: 'ausglass-supplies', 
          supplier_name: 'AusGlass Supplies',
          items_count: 2,
          total_value: 890.00,
          products: ['Glass Sealant', 'Cleaning Solution']
        }
      ];
      
      setTestResults(mockTestResults);
      console.log('✅ Test generation completed');
      
    } catch (error) {
      console.error('❌ Failed to run test generation:', error);
      showNotification('error', 'Failed to run test generation');
    } finally {
      setTesting(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-white bg-opacity-90" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={saveSettings}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Auto Purchase Order Settings</h2>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
              
              <div className="space-y-4">
                <label className="flex items-start">
                  <input 
                    type="checkbox" 
                    checked={settings.auto_po_enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, auto_po_enabled: e.target.checked }))}
                    className="rounded mt-1" 
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Enable Automatic Purchase Order Generation</span>
                    <p className="text-sm text-gray-500">
                      System will automatically create draft purchase orders when stock is low
                    </p>
                  </div>
                </label>

                {settings.auto_po_enabled && (
                  <>
                    <label className="flex items-start">
                      <input 
                        type="checkbox" 
                        checked={settings.auto_po_approval_required}
                        onChange={(e) => setSettings(prev => ({ ...prev, auto_po_approval_required: e.target.checked }))}
                        className="rounded mt-1" 
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Require Approval Before Sending</span>
                        <p className="text-sm text-gray-500">
                          Generated POs will need manual approval before being sent to suppliers
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start">
                      <input 
                        type="checkbox" 
                        checked={settings.auto_po_combine_suppliers}
                        onChange={(e) => setSettings(prev => ({ ...prev, auto_po_combine_suppliers: e.target.checked }))}
                        className="rounded mt-1" 
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Combine Items by Supplier</span>
                        <p className="text-sm text-gray-500">
                          Create one PO per supplier instead of separate POs for each product
                        </p>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Generation Rules */}
            {settings.auto_po_enabled && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generation Rules</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Items per PO
                    </label>
                    <input 
                      type="number" 
                      value={settings.auto_po_minimum_items}
                      onChange={(e) => setSettings(prev => ({ ...prev, auto_po_minimum_items: Number(e.target.value) }))}
                      min="1" 
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Don't create POs with fewer items</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Time
                    </label>
                    <input 
                      type="time" 
                      value={settings.auto_po_schedule_time}
                      onChange={(e) => setSettings(prev => ({ ...prev, auto_po_schedule_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Daily check time for low stock</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Rules */}
            {settings.auto_po_enabled && settings.auto_po_approval_required && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Rules</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">Orders under $500</label>
                    <select 
                      value={approvalRules.low_value}
                      onChange={(e) => setApprovalRules(prev => ({ ...prev, low_value: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="auto">Auto-approve</option>
                      <option value="manager">Manager approval</option>
                      <option value="admin">Admin approval</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">Orders $500 - $2,000</label>
                    <select 
                      value={approvalRules.medium_value}
                      onChange={(e) => setApprovalRules(prev => ({ ...prev, medium_value: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="manager">Manager approval</option>
                      <option value="admin">Admin approval</option>
                      <option value="director">Director approval</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">Orders over $2,000</label>
                    <select 
                      value={approvalRules.high_value}
                      onChange={(e) => setApprovalRules(prev => ({ ...prev, high_value: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="admin">Admin approval</option>
                      <option value="director">Director approval</option>
                      <option value="multi_level">Multi-level approval</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier-Specific Rules */}
            {settings.auto_po_enabled && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Rules</h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input 
                      type="checkbox" 
                      checked={settings.trusted_supplier_auto_send}
                      onChange={(e) => setSettings(prev => ({ ...prev, trusted_supplier_auto_send: e.target.checked }))}
                      className="rounded mt-1" 
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Auto-send to highly rated suppliers (4.5+ stars)</span>
                      <p className="text-sm text-gray-500">Skip approval for small orders from trusted suppliers</p>
                    </div>
                  </label>
                  
                  {settings.trusted_supplier_auto_send && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max auto-send value
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">$</span>
                        <input 
                          type="number" 
                          value={settings.max_auto_send_value}
                          onChange={(e) => setSettings(prev => ({ ...prev, max_auto_send_value: Number(e.target.value) }))}
                          placeholder="500"
                          step="50"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Maximum order value for auto-sending</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test & Preview */}
            {settings.auto_po_enabled && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <button 
                      type="button" 
                      onClick={testGeneration}
                      disabled={testing}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {testing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        'Test Generation (Dry Run)'
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">See what POs would be generated without creating them</p>
                  </div>
                  
                  {testResults && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
                      <div className="space-y-2">
                        {testResults.map((result: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <span className="font-medium text-gray-900">{result.supplier_name}</span>
                              <div className="text-sm text-gray-500">
                                {result.items_count} items: {result.products.join(', ')}
                              </div>
                            </div>
                            <span className="font-medium text-green-600">
                              ${result.total_value.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total POs to generate:</span>
                          <span>{testResults.length}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total value:</span>
                          <span>${testResults.reduce((sum: number, r: any) => sum + r.total_value, 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}