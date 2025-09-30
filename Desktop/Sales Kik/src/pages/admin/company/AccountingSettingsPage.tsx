import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../../components/layout/UniversalNavigation';
import UniversalHeader from '../../../components/layout/UniversalHeader';
import { 
  CalculatorIcon, PencilIcon, CheckIcon, XMarkIcon,
  LinkIcon, ExclamationTriangleIcon, CheckCircleIcon,
  CurrencyDollarIcon, DocumentTextIcon, CreditCardIcon,
  BanknotesIcon, ArrowPathIcon, InformationCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface AccountCode {
  name: string;
  code: string;
  imported: boolean;
}

interface AccountingSettings {
  companyName: string;
  accountingSoftware: 'XERO' | 'MYOB' | 'QUICKBOOKS' | null;
  isConnected: boolean;
  
  // Core Account Codes
  salesAccountCode: string;
  purchaseOrderAccountCode: string;
  creditAccountCode: string;
  
  // Tax Settings
  taxOnIncomeType: string;
  taxOnIncomeRate: number;
  taxOnExpensesType: string;
  taxOnExpensesRate: number;
  
  // Payment Method Account Codes (dynamic based on enabled methods)
  paymentAccountCodes: {
    cash: string;
    cheque: string;
    bankTransfer: string;
    creditCard: string;
    creditNote: string;
    skCreditCard: string;
  };
  
  // Available account codes from accounting software
  availableAccountCodes: AccountCode[];
}

interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CustomDropdown({ 
  label, 
  value, 
  placeholder, 
  options, 
  onChange, 
  disabled 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="min-w-48 px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="min-w-48 w-auto relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between whitespace-nowrap ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-200 bg-white shadow-lg'
            : 'border-gray-300 hover:border-blue-400 bg-white shadow-sm'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-fit min-w-full"
        >
          <div className="py-2">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              {placeholder}
            </button>
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 transition-colors whitespace-nowrap ${
                  index < options.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  option.value === value 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AccountingSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [settings, setSettings] = useState<AccountingSettings>({
    companyName: 'Ecco Hardware',
    accountingSoftware: 'XERO',
    isConnected: true,
    salesAccountCode: '4000',
    purchaseOrderAccountCode: '5000',
    creditAccountCode: '1200',
    taxOnIncomeType: 'GST on Income',
    taxOnIncomeRate: 10,
    taxOnExpensesType: 'GST on Expenses', 
    taxOnExpensesRate: 10,
    paymentAccountCodes: {
      cash: '1100',
      cheque: '1110',
      bankTransfer: '1120',
      creditCard: '1130',
      creditNote: '1140',
      skCreditCard: '1150'
    },
    availableAccountCodes: [
      { name: 'Sales Revenue', code: '4000', imported: true },
      { name: 'Cost of Goods Sold', code: '5000', imported: true },
      { name: 'Cash at Bank', code: '1100', imported: true },
      { name: 'Accounts Receivable', code: '1200', imported: true },
      { name: 'Cheque Account', code: '1110', imported: true },
      { name: 'Bank Transfer', code: '1120', imported: true },
      { name: 'Credit Card Receipts', code: '1130', imported: true },
      { name: 'Credit Notes', code: '1140', imported: true },
      { name: 'SalesKik Credit Account', code: '1150', imported: true }
    ]
  });

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      // In production, fetch from accounting software API
      // This would pull actual account codes from Xero/MYOB/QuickBooks
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Failed to load accounting data:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In production, save to API and sync with accounting software
      console.log('Saving accounting settings:', settings);
      
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

  const refreshAccountCodes = async () => {
    setSaving(true);
    try {
      // In production, re-fetch from accounting software
      console.log('Refreshing account codes from', settings.accountingSoftware);
      
      setTimeout(() => {
        setSaving(false);
        alert('Account codes refreshed successfully!');
      }, 1500);
    } catch (error) {
      setSaving(false);
    }
  };

  const unlinkAccountingSoftware = () => {
    if (confirm('Are you sure you want to unlink your accounting software? This will disable automatic sync.')) {
      setSettings(prev => ({
        ...prev,
        accountingSoftware: null,
        isConnected: false
      }));
    }
  };

  const linkAccountingSoftware = (software: 'XERO' | 'MYOB' | 'QUICKBOOKS') => {
    // In production, initiate OAuth flow
    setSettings(prev => ({
      ...prev,
      accountingSoftware: software,
      isConnected: true
    }));
    alert(`${software} integration initiated! (Demo)`);
  };

  const getSoftwareName = () => {
    return settings.accountingSoftware || 'Accounting Software';
  };

  const getEnabledPaymentMethods = (): Array<keyof typeof settings.paymentAccountCodes> => {
    // In production, get this from invoice settings
    return ['cash', 'cheque', 'bankTransfer', 'creditCard', 'skCreditCard'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounting settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="accounting-settings" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Accounting Settings"
        subtitle="Configure account codes and integrate with your accounting software"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            {settings.isConnected && (
              <button
                onClick={refreshAccountCodes}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh Codes
              </button>
            )}
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

      <div className="p-8 max-w-6xl mx-auto">
        <div className="space-y-8">
          
          {/* Company Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CalculatorIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Name</h3>
                <p className="text-sm text-gray-600">Used in accounting software integration</p>
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
                    setSettings({ ...settings, companyName: tempCompanyName });
                    setEditingCompanyName(false);
                  }}
                  className="p-3 text-green-600 hover:bg-green-50 rounded-xl border border-green-200"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTempCompanyName(settings.companyName);
                    setEditingCompanyName(false);
                  }}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl border border-red-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-lg font-semibold text-gray-900">{settings.companyName}</span>
                <button
                  onClick={() => {
                    setTempCompanyName(settings.companyName);
                    setEditingCompanyName(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {settings.isConnected && settings.accountingSoftware ? (
            <>
              {/* Connected State - Software Specific Settings */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={`/integrations/${settings.accountingSoftware.toLowerCase()}-logo.png`}
                      alt={settings.accountingSoftware}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-12 h-12 bg-green-100 rounded-lg items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{settings.accountingSoftware}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-green-800">
                        {getSoftwareName()} Connected
                      </h3>
                      <p className="text-sm text-green-600">
                        Account codes imported and synchronized
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={unlinkAccountingSoftware}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Unlink Account
                  </button>
                </div>
              </div>

              {/* Core Account Codes */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{getSoftwareName()} Account Codes</h3>
                    <p className="text-sm text-gray-600">Core accounts for sales, purchases, and credits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sales Acc#</label>
                    <CustomDropdown
                      label=""
                      value={settings.salesAccountCode}
                      placeholder="Select Sales Account"
                      options={settings.availableAccountCodes
                        .filter(acc => acc.name.toLowerCase().includes('sales') || acc.name.toLowerCase().includes('revenue'))
                        .map(acc => ({
                          value: acc.code,
                          label: `${acc.code} - ${acc.name}`
                        }))}
                      onChange={(value) => setSettings({ ...settings, salesAccountCode: value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Order Acc#</label>
                    <CustomDropdown
                      label=""
                      value={settings.purchaseOrderAccountCode}
                      placeholder="Select Purchase Account"
                      options={settings.availableAccountCodes
                        .filter(acc => acc.name.toLowerCase().includes('cost') || acc.name.toLowerCase().includes('purchase'))
                        .map(acc => ({
                          value: acc.code,
                          label: `${acc.code} - ${acc.name}`
                        }))}
                      onChange={(value) => setSettings({ ...settings, purchaseOrderAccountCode: value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Acc#</label>
                    <CustomDropdown
                      label=""
                      value={settings.creditAccountCode}
                      placeholder="Select Credit Account"
                      options={settings.availableAccountCodes
                        .filter(acc => acc.name.toLowerCase().includes('receivable') || acc.name.toLowerCase().includes('credit'))
                        .map(acc => ({
                          value: acc.code,
                          label: `${acc.code} - ${acc.name}`
                        }))}
                      onChange={(value) => setSettings({ ...settings, creditAccountCode: value })}
                    />
                  </div>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tax Settings</h3>
                    <p className="text-sm text-gray-600">GST and tax configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Type (Income)</label>
                      <input
                        type="text"
                        value={settings.taxOnIncomeType}
                        onChange={(e) => setSettings({ ...settings, taxOnIncomeType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GST on Income"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.taxOnIncomeRate}
                        onChange={(e) => setSettings({ ...settings, taxOnIncomeRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Type (Expenses)</label>
                      <input
                        type="text"
                        value={settings.taxOnExpensesType}
                        onChange={(e) => setSettings({ ...settings, taxOnExpensesType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GST on Expenses"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.taxOnExpensesRate}
                        onChange={(e) => setSettings({ ...settings, taxOnExpensesRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Account Codes */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                    <img 
                      src={`/integrations/${settings.accountingSoftware?.toLowerCase()}-logo.png`}
                      alt={settings.accountingSoftware}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-6 h-6 items-center justify-center">
                      <CreditCardIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{getSoftwareName()} Payment Settings</h3>
                    <p className="text-sm text-gray-600">Account codes for different payment methods</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Payment Method Mapping</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    These account codes determine where payment transactions are recorded in {getSoftwareName()}.
                    Only enabled payment methods from Invoice Settings are shown.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getEnabledPaymentMethods().map((method) => (
                    <div key={method}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {method.replace(/([A-Z])/g, ' $1').trim()} Acc#
                      </label>
                      <CustomDropdown
                        label=""
                        value={settings.paymentAccountCodes[method]}
                        placeholder="Select Account"
                        options={settings.availableAccountCodes
                          .filter(acc => 
                            acc.name.toLowerCase().includes('cash') ||
                            acc.name.toLowerCase().includes('bank') ||
                            acc.name.toLowerCase().includes('credit') ||
                            acc.name.toLowerCase().includes('cheque') ||
                            acc.name.toLowerCase().includes('transfer')
                          )
                          .map(acc => ({
                            value: acc.code,
                            label: `${acc.code} - ${acc.name}`
                          }))}
                        onChange={(value) => setSettings({
                          ...settings,
                          paymentAccountCodes: {
                            ...settings.paymentAccountCodes,
                            [method]: value
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Disconnected State */
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Accounting Software</h3>
                  <p className="text-sm text-gray-600">Connect your accounting system</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">No accounting software connected</span>
                </div>
                <p className="text-sm text-amber-700">
                  Connect Xero, MYOB, or QuickBooks to automatically sync account codes and enable seamless financial integration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['XERO', 'MYOB', 'QUICKBOOKS'].map((software) => (
                  <button
                    key={software}
                    onClick={() => linkAccountingSoftware(software as any)}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <img 
                      src={`/integrations/${software.toLowerCase()}-logo.png`}
                      alt={software}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                      <span className="text-gray-600 font-bold text-xs">{software}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Connect {software}</div>
                      <div className="text-xs text-gray-600">Link your account</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
              <span className="font-medium">Accounting settings saved successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingSettingsPage;