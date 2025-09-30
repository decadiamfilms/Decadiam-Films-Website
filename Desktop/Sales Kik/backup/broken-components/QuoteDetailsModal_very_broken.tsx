import React, { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, PencilIcon, PlusIcon, ChevronDownIcon,
  TruckIcon, MapPinIcon, PhoneIcon, UserIcon,
  CheckIcon, ExclamationTriangleIcon, InformationCircleIcon,
  BuildingOfficeIcon, CreditCardIcon, CalculatorIcon
} from '@heroicons/react/24/outline';
import FinalQuoteModal from './FinalQuoteModal';

// Interfaces
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    email?: string;
    mobile?: string;
  };
  locations: CustomerLocation[];
  priceTier: 'T1' | 'T2' | 'T3' | 'Retail';
}

interface CustomerLocation {
  id?: string;
  type: string;
  streetNumber: string;
  streetName: string;
  suburb: string;
  state: string;
  postcode: string;
  isDeliveryAddress?: boolean;
}

interface Product {
  id: string;
  code: string;
  name: string;
  image?: string;
  weight?: number;
}

interface QuoteLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  jobName?: string;
}

interface JobSection {
  id: string;
  name: string;
  description?: string;
  items: QuoteLineItem[];
}

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateQuote: (finalQuoteData: FinalQuoteData) => void;
  onSaveDraft: () => void;
  onQuoteCompleted: () => void;
  customer: Customer;
  projectName: string;
  quoteId: string;
  referenceNumber: string;
  jobSections: JobSection[];
}

interface FinalQuoteData {
  customer: Customer;
  projectName: string;
  quoteId: string;
  referenceNumber: string;
  jobSections: JobSection[];
  accounting: {
    accountNumber: string;
    gstRate: string;
    gstAmount: number;
  };
  delivery: {
    method: 'delivery' | 'pickup' | 'courier';
    address: CustomerLocation;
    isAddressConfirmed: boolean;
    contactName: string;
    contactPhone: string;
  };
  totals: {
    subtotal: number;
    gst: number;
    total: number;
    weight: number;
    area?: number;
  };
}

// GST Options
const GST_OPTIONS = [
  { value: '0-bas-excluded', label: '0% - BAS Excluded', rate: 0 },
  { value: '0-gst-free-capital', label: '0% - GST Free Capital', rate: 0 },
  { value: '0-gst-free-expenses', label: '0% - GST Free Expenses', rate: 0 },
  { value: '0-gst-free-exports', label: '0% - GST Free Exports', rate: 0 },
  { value: '0-gst-free-income', label: '0% - GST Free Income', rate: 0 },
  { value: '10-gst-on-expenses', label: '10% - GST on Expenses', rate: 0.1 },
  { value: '0-gst-on-imports', label: '0% - GST on Imports', rate: 0 },
  { value: '10-gst-on-income', label: '10% - GST on Income', rate: 0.1 },
  { value: '0-input-taxed', label: '0% - Input Taxed', rate: 0 }
];

// Account Numbers (sample data - would come from settings)
const ACCOUNT_NUMBERS = [
  { value: '41000', label: 'Sales - 41000 (Xero)', software: 'xero' },
  { value: '42000', label: 'Service Income - 42000 (Xero)', software: 'xero' },
  { value: '4-1000', label: 'Sales - 4-1000 (MYOB)', software: 'myob' },
  { value: '4000', label: 'Income - 4000 (QuickBooks)', software: 'quickbooks' }
];

// Custom Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  rate?: number;
  software?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder: string;
}

function CustomDropdown({ label, value, options, onChange, placeholder }: CustomDropdownProps) {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.software && (
                <div className="text-xs text-gray-500 mt-1">For {option.software.toUpperCase()}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuoteDetailsModal({
  isOpen,
  onClose,
  onGenerateQuote,
  onSaveDraft,
  onQuoteCompleted,
  customer,
  projectName,
  quoteId,
  referenceNumber,
  jobSections
}: QuoteDetailsModalProps) {
  // State for editable job names
  const [editableJobSections, setEditableJobSections] = useState(jobSections);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  
  // Final quote modal state
  const [showFinalQuote, setShowFinalQuote] = useState(false);
  const [finalQuoteData, setFinalQuoteData] = useState<FinalQuoteData | null>(null);

  // Accounting details
  const [selectedAccount, setSelectedAccount] = useState('41000');
  const [selectedGST, setSelectedGST] = useState('10-gst-on-income');

  // Delivery details
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | 'courier'>('delivery');
  const [selectedAddress, setSelectedAddress] = useState<CustomerLocation>(customer.locations[0] || {} as CustomerLocation);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<CustomerLocation>({
    type: 'Delivery',
    streetNumber: '',
    streetName: '',
    suburb: '',
    state: '',
    postcode: ''
  });

  // Contact details
  const [contactName, setContactName] = useState(`${customer.primaryContact.firstName} ${customer.primaryContact.lastName}`);
  const [contactPhone, setContactPhone] = useState(customer.primaryContact.mobile || '');

  // Initialize editable job sections
  useEffect(() => {
    setEditableJobSections(jobSections);
  }, [jobSections]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = editableJobSections.reduce((total, section) =>
      total + section.items.reduce((sectionTotal, item) => sectionTotal + item.totalPrice, 0), 0
    );
    
    const gstOption = GST_OPTIONS.find(opt => opt.value === selectedGST);
    const gstRate = gstOption?.rate || 0;
    const gst = subtotal * gstRate;
    const total = subtotal + gst;
    
    const weight = editableJobSections.reduce((totalWeight, section) =>
      totalWeight + section.items.reduce((sectionWeight, item) => 
        sectionWeight + (item.product.weight || 0) * item.quantity, 0), 0
    );

    return { subtotal, gst, total, weight, area: 0 }; // Area calculation can be added later
  };

  const totals = calculateTotals();

  // Edit job name
  const editJobName = (jobId: string, newName: string) => {
    setEditableJobSections(sections =>
      sections.map(section =>
        section.id === jobId ? { ...section, name: newName } : section
      )
    );
    setEditingJobId(null);
  };

  // Handle generate quote
  const handleGenerateQuote = () => {
    const quoteData: FinalQuoteData = {
      customer,
      projectName,
      quoteId,
      referenceNumber,
      jobSections: editableJobSections,
      accounting: {
        accountNumber: selectedAccount,
        gstRate: selectedGST,
        gstAmount: totals.gst
      },
      delivery: {
        method: deliveryMethod,
        address: showNewAddress ? newAddress : selectedAddress,
        isAddressConfirmed,
        contactName,
        contactPhone
      },
      totals
    };

    setFinalQuoteData(quoteData);
    setShowFinalQuote(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full h-full overflow-y-auto">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <CalculatorIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Quote Configuration</h1>
                    <p className="text-blue-100 text-lg">Fine-tune your quote before generation</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      <h3 className="font-bold text-white">Customer</h3>
                    </div>
                    <p className="text-blue-100 text-lg">{customer.name}</p>
                    <p className="text-blue-200 text-sm">{customer.priceTier} Pricing Tier</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <InformationCircleIcon className="w-6 h-6 text-white" />
                      <h3 className="font-bold text-white">Project</h3>
                    </div>
                    <p className="text-blue-100 text-lg">{projectName || 'Untitled Project'}</p>
                    <p className="text-blue-200 text-sm">Quote ID: {quoteId}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCardIcon className="w-6 h-6 text-white" />
                      <h3 className="font-bold text-white">Total Value</h3>
                    </div>
                    <p className="text-white text-2xl font-bold">${totals.total.toFixed(2)}</p>
                    <p className="text-blue-200 text-sm">Inc. GST ${totals.gst.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-4 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/30"
              >
                <XMarkIcon className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
            
            {/* Quote Items - Enhanced Layout */}
            <div className="space-y-6">
            {editableJobSections.map((section, index) => {
              const colors = [
                'from-pink-500 to-rose-500',
                'from-blue-500 to-cyan-500', 
                'from-green-500 to-emerald-500',
                'from-purple-500 to-violet-500',
                'from-orange-500 to-amber-500'
              ];
              const bgColor = colors[index % colors.length];
              
              return (
                <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Vibrant Job Header */}
                  <div className={`bg-gradient-to-r ${bgColor} px-6 py-4 text-white`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        {editingJobId === section.id ? (
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setEditableJobSections(sections =>
                                sections.map(s => s.id === section.id ? { ...s, name: newName } : s)
                              );
                            }}
                            onBlur={() => setEditingJobId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingJobId(null);
                              }
                            }}
                            autoFocus
                            className="font-bold text-lg bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 backdrop-blur-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-white">{section.name}</h3>
                            <button
                              onClick={() => setEditingJobId(section.id)}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                              title="Edit job name"
                            >
                              <PencilIcon className="w-5 h-5 text-white/80" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                          <span className="text-white font-bold text-lg">
                            {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                          </span>
                          <div className="text-white/80 text-sm">
                            ${section.items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>

                  {/* Job Description */}
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50">
                    <textarea
                      placeholder="Add job description..."
                      value={section.description || ''}
                      onChange={(e) => {
                        setEditableJobSections(sections =>
                          sections.map(s => s.id === section.id ? { ...s, description: e.target.value } : s)
                        );
                      }}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-400 bg-white shadow-sm"
                    />
                  </div>

                  {/* Enhanced Items List */}
                  <div className="px-6 py-4 space-y-4">
                    {section.items.map(item => (
                      <div key={item.id} className="flex items-center gap-6 p-5 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-sm">
                          <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{item.product.name}</p>
                          <p className="text-gray-600 font-medium">SKU: {item.product.code}</p>
                        </div>
                        <div className="text-center">
                          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-lg">
                            Qty: {item.quantity}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                            <p className="font-bold text-xl">${item.totalPrice.toFixed(2)}</p>
                            <p className="text-green-100 text-sm">Total</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Add More Products Button - Enhanced */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <button className="w-full text-white hover:text-green-100 transition-colors">
                <PlusIcon className="w-12 h-12 mx-auto mb-4 bg-white/20 p-3 rounded-full" />
                <span className="block text-xl font-bold mb-2">Add More Products</span>
                <span className="block text-green-100">Expand your quote with additional items</span>
              </button>
            </div>
            
            {/* Accounting Section - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Accounting & Settings</h3>
                <p className="text-indigo-100">Configure financial details</p>
              </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ACCOUNT_NUMBERS.map(account => (
                      <option key={account.value} value={account.value}>{account.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Treatment</label>
                  <select
                    value={selectedGST}
                    onChange={(e) => setSelectedGST(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {GST_OPTIONS.map(gst => (
                      <option key={gst.value} value={gst.value}>{gst.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Totals Row */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Nett</p>
                    <p className="font-bold text-gray-900">${totals.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">GST</p>
                    <p className="font-bold text-gray-900">${totals.gst.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Weight (kg)</p>
                    <p className="font-bold text-gray-900">{totals.weight.toFixed(1)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Delivery Options - Enhanced */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Delivery Options</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Delivery Method Radio Buttons */}
              <div className="flex gap-6">
                {[
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'courier', label: 'Courier' }
                ].map(method => (
                  <label key={method.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={method.value}
                      checked={deliveryMethod === method.value}
                      onChange={(e) => setDeliveryMethod(e.target.value as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>

              {/* Address and Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="address-confirmed"
                    checked={isAddressConfirmed}
                    onChange={(e) => setIsAddressConfirmed(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="address-confirmed" className="text-sm font-medium text-gray-700">
                    Address to be confirmed
                  </label>
                </div>

                {customer.locations[0] && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">Delivery Address</p>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.streetNumber} {selectedAddress.streetName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.suburb}, {selectedAddress.state} {selectedAddress.postcode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end gap-4">
            <button
              onClick={onSaveDraft}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Save as Draft
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateQuote}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Generate Quote
            </button>
          </div>
        </div>
      </div>

      {/* Final Quote Modal */}
      {finalQuoteData && (
        <FinalQuoteModal
          isOpen={showFinalQuote}
          onClose={() => {
            setShowFinalQuote(false);
            setFinalQuoteData(null);
          }}
          onQuoteGenerated={() => {
            setShowFinalQuote(false);
            setFinalQuoteData(null);
            onClose();
            onQuoteCompleted();
          }}
          quoteData={finalQuoteData}
        />
      )}
    </div>
  );
}