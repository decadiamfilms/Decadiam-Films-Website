import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../../components/layout/UniversalNavigation';
import UniversalHeader from '../../../components/layout/UniversalHeader';
import { 
  DocumentTextIcon, PencilIcon, CheckIcon, XMarkIcon,
  CogIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

type DocumentType = 'quote' | 'order' | 'invoice' | 'purchaseOrder' | 'deliveryDocket';

interface PDFOption {
  key: string;
  label: string;
  description: string;
}

interface PDFSettings {
  companyName: string;
  documentSettings: {
    [key in DocumentType]: {
      [optionKey: string]: boolean;
    }
  };
}

const PDFSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // PDF options that can be toggled for each document type
  const pdfOptions: PDFOption[] = [
    { key: 'hideTotalPrice', label: 'Hide Total Price', description: 'Remove total pricing from document' },
    { key: 'hideItemPrice', label: 'Hide Item Price', description: 'Remove individual item pricing' },
    { key: 'hideItems', label: 'Hide Items', description: 'Remove item details from document' },
    { key: 'hideCustomProcess', label: 'Hide Custom Process', description: 'Remove custom process information' },
    { key: 'hidePaymentDetails', label: 'Hide Payment Details', description: 'Remove payment terms and methods' },
    { key: 'hideDescription', label: 'Hide Description', description: 'Remove item descriptions' },
    { key: 'insertAcceptanceSignature', label: 'Insert Acceptance Signature', description: 'Add signature field for acceptance' },
    { key: 'hideProductType', label: 'Hide Product Type', description: 'Remove product type classification' },
    { key: 'hideCustomText', label: 'Hide Custom Text', description: 'Remove custom text fields' },
    { key: 'showKitItems', label: 'Show Kit Items', description: 'Display individual kit components' }
  ];

  // Document types with their display names
  const documentTypes: { key: DocumentType; label: string; color: string }[] = [
    { key: 'quote', label: 'Quote', color: 'blue' },
    { key: 'order', label: 'Order', color: 'green' },
    { key: 'invoice', label: 'Invoice', color: 'purple' },
    { key: 'purchaseOrder', label: 'Purchase Order', color: 'orange' },
    { key: 'deliveryDocket', label: 'Delivery Docket', color: 'teal' }
  ];

  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    companyName: 'Ecco Hardware',
    documentSettings: {
      quote: {
        hideTotalPrice: false,
        hideItemPrice: false,
        hideItems: false,
        hideCustomProcess: false,
        hidePaymentDetails: true,
        hideDescription: false,
        insertAcceptanceSignature: true,
        hideProductType: false,
        hideCustomText: false,
        showKitItems: true
      },
      order: {
        hideTotalPrice: false,
        hideItemPrice: false,
        hideItems: false,
        hideCustomProcess: false,
        hidePaymentDetails: false,
        hideDescription: false,
        insertAcceptanceSignature: false,
        hideProductType: false,
        hideCustomText: false,
        showKitItems: true
      },
      invoice: {
        hideTotalPrice: false,
        hideItemPrice: false,
        hideItems: false,
        hideCustomProcess: true,
        hidePaymentDetails: false,
        hideDescription: false,
        insertAcceptanceSignature: false,
        hideProductType: true,
        hideCustomText: false,
        showKitItems: false
      },
      purchaseOrder: {
        hideTotalPrice: true,
        hideItemPrice: true,
        hideItems: false,
        hideCustomProcess: true,
        hidePaymentDetails: true,
        hideDescription: false,
        insertAcceptanceSignature: false,
        hideProductType: false,
        hideCustomText: true,
        showKitItems: false
      },
      deliveryDocket: {
        hideTotalPrice: true,
        hideItemPrice: true,
        hideItems: false,
        hideCustomProcess: true,
        hidePaymentDetails: true,
        hideDescription: true,
        insertAcceptanceSignature: true,
        hideProductType: true,
        hideCustomText: true,
        showKitItems: false
      }
    }
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pdfSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPdfSettings(parsed);
      } catch (error) {
        console.error('Failed to parse saved PDF settings:', error);
      }
    }
    setTimeout(() => setLoading(false), 500);
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings));
      
      // In production, also save to API
      console.log('Saving PDF settings:', pdfSettings);
      
      setTimeout(() => {
        setSaving(false);
        setShowSuccessMessage(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }, 1000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaving(false);
    }
  };

  const toggleSetting = (documentType: DocumentType, optionKey: string) => {
    setPdfSettings(prev => ({
      ...prev,
      documentSettings: {
        ...prev.documentSettings,
        [documentType]: {
          ...prev.documentSettings[documentType],
          [optionKey]: !prev.documentSettings[documentType][optionKey]
        }
      }
    }));
  };

  const getToggleColor = (documentType: DocumentType): string => {
    const colorMap = {
      quote: 'blue',
      order: 'green', 
      invoice: 'purple',
      purchaseOrder: 'orange',
      deliveryDocket: 'teal'
    };
    return colorMap[documentType];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="pdf-settings" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="PDF Default Settings"
        subtitle="Customize what appears on each document type"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                saving 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          
          {/* Company Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Name</h3>
                <p className="text-sm text-gray-600">Appears on all PDF documents</p>
              </div>
            </div>

            {editingCompanyName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setPdfSettings({ ...pdfSettings, companyName: tempCompanyName });
                    setEditingCompanyName(false);
                  }}
                  className="p-3 text-green-600 hover:bg-green-50 rounded-xl border border-green-200"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTempCompanyName(pdfSettings.companyName);
                    setEditingCompanyName(false);
                  }}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl border border-red-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-lg font-semibold text-gray-900">{pdfSettings.companyName}</span>
                <button
                  onClick={() => {
                    setTempCompanyName(pdfSettings.companyName);
                    setEditingCompanyName(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* PDF Customization Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <CogIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Document Customization</h3>
                <p className="text-sm text-gray-600">Control what appears on each PDF document type</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">PDF Customization</span>
              </div>
              <p className="text-sm text-blue-700">
                Toggle features on/off for each document type. These are default settings that can be overridden when creating individual documents.
              </p>
            </div>

            {/* Customization Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border border-gray-200 rounded-tl-xl">
                      Options
                    </th>
                    {documentTypes.map((docType, index) => (
                      <th 
                        key={docType.key} 
                        className={`px-4 py-3 text-center text-sm font-bold border border-gray-200 ${
                          docType.color === 'blue' ? 'text-blue-800 bg-blue-50' :
                          docType.color === 'green' ? 'text-green-800 bg-green-50' :
                          docType.color === 'purple' ? 'text-purple-800 bg-purple-50' :
                          docType.color === 'orange' ? 'text-orange-800 bg-orange-50' :
                          'text-teal-800 bg-teal-50'
                        } ${index === documentTypes.length - 1 ? 'rounded-tr-xl' : ''}`}
                      >
                        {docType.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pdfOptions.map((option, rowIndex) => (
                    <tr key={option.key} className="hover:bg-gray-25">
                      <td className={`px-4 py-4 border border-gray-200 bg-gray-50 ${
                        rowIndex === pdfOptions.length - 1 ? 'rounded-bl-xl' : ''
                      }`}>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                        </div>
                      </td>
                      {documentTypes.map((docType, colIndex) => {
                        const isEnabled = pdfSettings.documentSettings[docType.key][option.key];
                        return (
                          <td 
                            key={docType.key} 
                            className={`px-4 py-4 text-center border border-gray-200 ${
                              rowIndex === pdfOptions.length - 1 && colIndex === documentTypes.length - 1 ? 'rounded-br-xl' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleSetting(docType.key, option.key)}
                              className={`w-16 h-8 rounded-full cursor-pointer transition-all duration-200 flex items-center px-1 hover:shadow-md relative ${
                                isEnabled 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-400'
                              }`}
                            >
                              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                                isEnabled ? 'opacity-0' : 'opacity-100'
                              }`}>
                                <span className="text-xs font-bold text-white">OFF</span>
                              </div>
                              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                                isEnabled ? 'opacity-100' : 'opacity-0'
                              }`}>
                                <span className="text-xs font-bold text-white">ON</span>
                              </div>
                              <div className={`relative w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                isEnabled ? 'translate-x-8' : 'translate-x-0'
                              }`}></div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {documentTypes.map((docType) => (
                <div key={docType.key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${docType.color}-500`}></div>
                  <span className="text-xs font-medium text-gray-700">{docType.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTypes.map((docType) => {
                const enabledCount = Object.values(pdfSettings.documentSettings[docType.key]).filter(Boolean).length;
                const totalCount = pdfOptions.length;
                
                return (
                  <div key={docType.key} className={`p-4 rounded-xl border bg-${docType.color}-50 border-${docType.color}-200`}>
                    <h4 className={`font-semibold text-${docType.color}-800 mb-2`}>{docType.label}</h4>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{enabledCount}</span> of {totalCount} features enabled
                    </div>
                    <div className={`w-full bg-${docType.color}-200 rounded-full h-2 mt-2`}>
                      <div 
                        className={`bg-${docType.color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Success Message */}
        {saving && (
          <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving settings...
            </div>
          </div>
        )}

        {/* Success Notification */}
        {showSuccessMessage && (
          <div className="fixed bottom-8 right-8 transform transition-all duration-500 ease-out animate-in slide-in-from-right">
            <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium">PDF settings saved successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFSettingsPage;