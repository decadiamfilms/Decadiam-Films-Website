import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../../components/layout/UniversalNavigation';
import UniversalHeader from '../../../components/layout/UniversalHeader';
import { 
  DocumentTextIcon, CreditCardIcon, BanknotesIcon, CalendarIcon,
  TruckIcon, CogIcon, CheckIcon, LinkIcon, ExclamationCircleIcon,
  PlusIcon, XMarkIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PaymentMethods {
  cash: boolean;
  cheque: boolean;
  eftpos: boolean;
  creditCard: boolean;
  creditNote: boolean;
  skCreditCard: boolean;
}

interface InvoiceSettings {
  companyName: string;
  invoicePaymentTypes: string;
  paymentMethods: PaymentMethods;
  abn: string;
  deliveryCharge: number;
  deliveryDescription: string;
  defaultOrderDueDays: number;
  defaultPaymentDueDays: number;
  accountingSoftware: 'XERO' | 'MYOB' | 'QUICKBOOKS' | null;
  accountingConnected: boolean;
}

const InvoiceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: 'Ecco Hardware',
    invoicePaymentTypes: 'Payment is due within 30 days of invoice date. We accept cash, credit card, and bank transfer. Please include invoice number as reference for all payments.',
    paymentMethods: {
      cash: true,
      cheque: false,
      eftpos: true,
      creditCard: true,
      creditNote: false,
      skCreditCard: true
    },
    abn: 'ABN 12 345 678 901',
    deliveryCharge: 50.00,
    deliveryDescription: 'Packing and Delivery Fee',
    defaultOrderDueDays: 14,
    defaultPaymentDueDays: 30,
    accountingSoftware: 'XERO',
    accountingConnected: true
  });

  useEffect(() => {
    // Load settings from storage/API
    setTimeout(() => setLoading(false), 500);
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In production, save to API
      console.log('Saving invoice settings:', invoiceSettings);
      
      setTimeout(() => {
        setSaving(false);
        alert('Invoice settings saved successfully!');
      }, 1000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaving(false);
    }
  };

  const updatePaymentMethod = (method: keyof PaymentMethods) => {
    setInvoiceSettings(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: !prev.paymentMethods[method]
      }
    }));
  };

  const connectAccountingSoftware = (software: 'XERO' | 'MYOB' | 'QUICKBOOKS') => {
    // In production, this would initiate OAuth flow
    setInvoiceSettings(prev => ({
      ...prev,
      accountingSoftware: software,
      accountingConnected: true
    }));
    alert(`${software} integration initiated! (Demo)`);
  };

  const disconnectAccounting = () => {
    setInvoiceSettings(prev => ({
      ...prev,
      accountingSoftware: null,
      accountingConnected: false
    }));
  };

  const getPaymentMethodLabel = (method: keyof PaymentMethods): string => {
    const labels = {
      cash: 'Cash',
      cheque: 'Cheque',
      eftpos: 'EFTPOS',
      creditCard: 'Credit Card',
      creditNote: 'Credit Note',
      skCreditCard: 'SK Credit Card'
    };
    return labels[method];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="invoice-settings" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Invoice & Financial Settings"
        subtitle="Configure payment methods, delivery charges, and accounting integration"
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

      <div className="p-8 max-w-5xl mx-auto">
        <div className="space-y-8">
          
          {/* Company Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Name</h3>
                <p className="text-sm text-gray-600">Appears on all invoices</p>
              </div>
            </div>
            
            <input
              type="text"
              value={invoiceSettings.companyName}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, companyName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              placeholder={invoiceSettings.companyName ? "" : "Your Company Name"}
            />
          </div>

          {/* Invoice Payment Types */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Invoice Payment Types</h3>
                <p className="text-sm text-gray-600">Payment instructions that appear on invoices</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">How this works</span>
              </div>
              <p className="text-sm text-blue-700">
                This text appears on the final page of every invoice, telling customers how to pay you. 
                Include payment terms, accepted methods, and any special instructions.
              </p>
            </div>
            
            <textarea
              value={invoiceSettings.invoicePaymentTypes}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePaymentTypes: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={invoiceSettings.invoicePaymentTypes ? "" : "Enter payment instructions for invoices..."}
            />
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-600">Select payment types you accept</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(Object.keys(invoiceSettings.paymentMethods) as Array<keyof PaymentMethods>).map((method) => (
                <label key={method} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.paymentMethods[method]}
                    onChange={() => updatePaymentMethod(method)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {getPaymentMethodLabel(method)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <CogIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                <p className="text-sm text-gray-600">Legal and regulatory information</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ABN Number</label>
              <input
                type="text"
                value={invoiceSettings.abn}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, abn: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={invoiceSettings.abn ? "" : "ABN 12 345 678 901"}
              />
            </div>

            {/* Delivery Charge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-4 h-4" />
                    Delivery Charge ($)
                  </div>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceSettings.deliveryCharge}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, deliveryCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Description</label>
                <input
                  type="text"
                  value={invoiceSettings.deliveryDescription}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, deliveryDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={invoiceSettings.deliveryDescription ? "" : "Packing and Delivery Fee"}
                />
              </div>
            </div>
          </div>

          {/* Due Date Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Due Date Settings</h3>
                <p className="text-sm text-gray-600">Default timeframes for orders and payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Default Order Due Date</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={invoiceSettings.defaultOrderDueDays}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultOrderDueDays: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold"
                    min="1"
                    max="365"
                  />
                  <span className="text-sm text-gray-600">weekday(s) after order</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Default Payment Due Date</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={invoiceSettings.defaultPaymentDueDays}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultPaymentDueDays: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold"
                    min="1"
                    max="365"
                  />
                  <span className="text-sm text-gray-600">day(s) after invoice date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accounting Software Integration */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Accounting Software</h3>
                <p className="text-sm text-gray-600">Connect your accounting system for seamless data sync</p>
              </div>
            </div>

            {invoiceSettings.accountingConnected && invoiceSettings.accountingSoftware ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={`/integrations/${invoiceSettings.accountingSoftware.toLowerCase()}-logo.png`}
                      alt={invoiceSettings.accountingSoftware}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-12 h-12 bg-green-100 rounded-lg items-center justify-center">
                      <span className="text-green-600 font-bold text-xs">{invoiceSettings.accountingSoftware}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">
                        {invoiceSettings.accountingSoftware} Connected
                      </h4>
                      <p className="text-sm text-green-600">
                        Invoices and financial data automatically sync
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={disconnectAccounting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ExclamationCircleIcon className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">No accounting software connected</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Connect your accounting software to automatically sync invoices, customers, and financial data.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['XERO', 'MYOB', 'QUICKBOOKS'].map((software) => (
                    <button
                      key={software}
                      onClick={() => connectAccountingSoftware(software as any)}
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
                        <div className="font-semibold text-gray-900">{software}</div>
                        <div className="text-xs text-gray-600">Connect now</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
      </div>
    </div>
  );
};

export default InvoiceSettingsPage;