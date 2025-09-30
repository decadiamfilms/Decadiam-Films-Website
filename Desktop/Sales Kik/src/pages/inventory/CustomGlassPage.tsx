import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import AdminConnectedGlassQuote from '../../components/glass/AdminConnectedGlassQuote';
import { ProtectedGlassComponent } from '../../hooks/useGlassModuleAccess';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, UserIcon,
  ChevronDownIcon, InformationCircleIcon, CubeIcon,
  ShoppingCartIcon, DocumentTextIcon, CalendarIcon,
  TagIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon,
  MapPinIcon, EyeIcon, CheckIcon, ExclamationTriangleIcon,
  TrashIcon, MinusIcon, QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon, ClipboardDocumentListIcon,
  CommandLineIcon, PencilIcon
} from '@heroicons/react/24/outline';

// Tooltip Component (reused from NewQuotePage)
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-base text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
            position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 -ml-1' :
            'right-full top-1/2 transform -translate-y-1/2 -mr-1'
          }`}></div>
        </div>
      )}
    </div>
  );
}

// Customer interfaces (matching NewQuotePage structure)
interface CustomerContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  landline?: string;
  fax?: string;
  mobile?: string;
}

interface CustomerLocation {
  id: string;
  type: 'Main' | 'Branch' | 'PO Box' | 'Others';
  isMailingAddress: boolean;
  isBillingAddress: boolean;
  isDeliveryAddress: boolean;
  unitNumber: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface Customer {
  id: string;
  name: string;
  accountingId: string;
  salesRepId: string;
  salesRepName: string;
  abnNumber: string;
  phone: string;
  email: string;
  primaryContact: CustomerContact;
  locations: CustomerLocation[];
  additionalContacts: CustomerContact[];
  priceLists: any[];
  accountDetails: {
    paymentTerms: number;
    creditLimit: number;
    availableLimit: number;
    invoiceType: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  notes: string;
  priceTier?: 'T1' | 'T2' | 'T3' | 'Retail';
}

// Customer Search Component (matching NewQuotePage)
interface CustomerSearchProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCustomersFromManagement = () => {
      const savedCustomers = localStorage.getItem('saleskik-customers');
      if (savedCustomers) {
        try {
          const parsedCustomers = JSON.parse(savedCustomers);
          const customersWithDates = parsedCustomers.map((customer: any) => ({
            ...customer,
            createdAt: new Date(customer.createdAt),
            priceTier: customer.priceTier || (customer.accountDetails.paymentTerms <= 15 ? 'T1' : 
                      customer.accountDetails.paymentTerms <= 30 ? 'T2' : 'T3')
          }));
          setCustomers(customersWithDates);
          return;
        } catch (error) {
          console.error('Error parsing saved customers for glass module:', error);
        }
      }

      // Mock customers with glass industry focus if none exist
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'ABC Glass Solutions',
          accountingId: 'ABC001',
          salesRepId: '1',
          salesRepName: 'John Smith',
          abnNumber: '12345678901',
          phone: '+61 2 9876 5432',
          email: 'contact@abcglass.com.au',
          primaryContact: {
            id: '1',
            firstName: 'David',
            lastName: 'Wilson',
            email: 'david@abcglass.com.au',
            mobile: '+61 400 123 456'
          },
          locations: [{
            id: '1',
            type: 'Main',
            isMailingAddress: true,
            isBillingAddress: true,
            isDeliveryAddress: true,
            unitNumber: '',
            streetNumber: '123',
            streetName: 'Collins Street',
            city: 'Melbourne',
            state: 'VIC',
            postcode: '3000',
            country: 'Australia'
          }],
          additionalContacts: [],
          priceLists: [],
          accountDetails: {
            paymentTerms: 30,
            creditLimit: 50000,
            availableLimit: 45000,
            invoiceType: 'Account'
          },
          status: 'active',
          createdAt: new Date(),
          notes: 'Regular glass customer, good payment history',
          priceTier: 'T2'
        },
        {
          id: '2',
          name: 'Sydney Pool Fencing Pty Ltd',
          accountingId: 'SPF002',
          salesRepId: '2',
          salesRepName: 'Sarah Johnson',
          abnNumber: '98765432109',
          phone: '+61 2 8765 4321',
          email: 'orders@sydneypoolfencing.com',
          primaryContact: {
            id: '2',
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael@sydneypoolfencing.com',
            mobile: '+61 400 987 654'
          },
          locations: [{
            id: '2',
            type: 'Main',
            isMailingAddress: true,
            isBillingAddress: true,
            isDeliveryAddress: true,
            unitNumber: '',
            streetNumber: '456',
            streetName: 'Pacific Highway',
            city: 'Sydney',
            state: 'NSW',
            postcode: '2065',
            country: 'Australia'
          }],
          additionalContacts: [],
          priceLists: [],
          accountDetails: {
            paymentTerms: 14,
            creditLimit: 75000,
            availableLimit: 70000,
            invoiceType: 'Account'
          },
          status: 'active',
          createdAt: new Date(),
          notes: 'High-volume pool fencing specialist',
          priceTier: 'T1'
        }
      ];
      setCustomers(mockCustomers);
      localStorage.setItem('saleskik-customers', JSON.stringify(mockCustomers));
    };
    
    loadCustomersFromManagement();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="relative">
        <input
          type="text"
          value={value ? value.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Start typing customer name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-gray-500 text-center text-base">
              No customers found. <a href="/customers" className="text-blue-600 hover:underline">Add a new customer</a>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  onChange(customer);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 text-base">{customer.name}</div>
                <div className="text-base text-gray-500">{customer.email}</div>
                <div className="text-base text-gray-400">
                  Sales Rep: {customer.salesRepName} • Price Tier: {customer.priceTier || 'T2'}
                </div>
                {customer.locations[0] && (
                  <div className="text-sm text-gray-400">
                    {customer.locations[0].city}, {customer.locations[0].state} {customer.locations[0].postcode}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Generate Glass Quote ID
function generateGlassQuoteId(): string {
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `GL-${randomNum}`;
}

function CustomGlassPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [quoteId] = useState(generateGlassQuoteId());
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape: Close modals
      if (event.key === 'Escape') {
        setShowCustomerInfo(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ProtectedGlassComponent>
      <div className="min-h-screen bg-gray-50">
        <UniversalNavigation 
          currentPage="custom-glass" 
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
        />

        <UniversalHeader
          title="Glass Industry Module"
          subtitle="Professional glass quoting with real-time pricing"
          onMenuToggle={() => setShowSidebar(true)}
        />

        <div className="p-6 max-w-none mx-auto">
          
          {/* Glass Module Info Panel - Matching NewQuotePage Style */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <div className="text-white text-lg">🪟</div>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Professional Glass Quoting</h3>
                  <p className="text-sm text-blue-700">
                    Real-time pricing • Customer-specific rates • Professional processing options • $35/month module
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  🪟 Module Active
                </div>
                <Tooltip content="Glass Module Features">
                  <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Customer Selection Header - Matching NewQuotePage Structure */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Selection - Same as NewQuotePage */}
              <div>
                <label className="block text-base font-medium text-gray-500 mb-1">Customer *</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomerSearch value={selectedCustomer} onChange={setSelectedCustomer} />
                  </div>
                  {selectedCustomer && (
                    <button
                      onClick={() => setShowCustomerInfo(true)}
                      className="h-12 px-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                      title="View customer info"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Glass Quote Details - Horizontal Layout like NewQuotePage */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-500 mb-1">Glass Quote ID</label>
                    <input
                      type="text"
                      value={quoteId}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-500 mb-1">Quote Date</label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString()}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-500 mb-1">Module Status</label>
                    <div className="h-12 flex items-center">
                      <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded text-base font-medium">
                        🪟 Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedCustomer ? (
            /* Glass Quoting Interface - Using Admin Connected Module */
            <AdminConnectedGlassQuote 
              quoteId={quoteId}
              customerId={selectedCustomer.id}
              onItemsAdded={() => {
                console.log('Glass item added to quote');
              }}
            />
          ) : (
            /* Customer Selection Prompt - Matching NewQuotePage Style */
            <div className="text-center py-16">
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-12">
                <div className="text-8xl mb-6">🪟</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Customer for Glass Quoting</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  Choose a customer from the dropdown above to start creating professional glass quotes with real-time pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      const customerSearch = document.querySelector('input[placeholder*="customer"]') as HTMLInputElement;
                      if (customerSearch) customerSearch.focus();
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-5 h-5" />
                    Select Customer
                  </button>
                  <button
                    onClick={() => navigate('/customers')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add New Customer
                  </button>
                </div>
                
                {/* Glass Module Features - Showcasing Benefits */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <TagIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Real-Time Pricing</h3>
                    <p className="text-sm text-gray-600">Live price updates as you configure glass specifications and processing options</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <AdjustmentsHorizontalIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Processing Options</h3>
                    <p className="text-sm text-gray-600">Comprehensive edgework, holes, corners, services, and surface finishes</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Professional Output</h3>
                    <p className="text-sm text-gray-600">Industry-standard quotes with detailed breakdowns and professional formatting</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation - Matching NewQuotePage */}
          <div className="bg-white border-t border-gray-200 rounded-xl shadow-lg mt-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/quotes')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base flex items-center justify-center gap-2"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    View All Quotes
                  </button>
                  
                  <button
                    onClick={() => navigate('/admin/glass')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base flex items-center justify-center gap-2"
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    Glass Admin
                  </button>
                  
                  <button
                    onClick={() => navigate('/inventory')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-base flex items-center justify-center gap-2"
                  >
                    <CubeIcon className="w-4 h-4" />
                    Back to Inventory
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    💡 Tip: {selectedCustomer 
                      ? `Quoting for ${selectedCustomer.name} (${selectedCustomer.priceTier || 'T2'} pricing)`
                      : 'Select a customer above to access professional glass quoting tools'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Modal - Simple Modal */}
        {selectedCustomer && showCustomerInfo && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Customer Information</h3>
                <button
                  onClick={() => setShowCustomerInfo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-base font-medium text-gray-500">Company Name</label>
                  <p className="text-gray-900 font-medium text-lg">{selectedCustomer.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-base font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 text-base">{selectedCustomer.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-base font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 text-base">{selectedCustomer.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-base font-medium text-gray-500">Primary Contact</label>
                  <p className="text-gray-900 text-base">
                    {selectedCustomer.primaryContact.firstName} {selectedCustomer.primaryContact.lastName}
                  </p>
                  <p className="text-base text-gray-500">{selectedCustomer.primaryContact.email}</p>
                  <p className="text-base text-gray-500">{selectedCustomer.primaryContact.mobile}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-base font-medium text-gray-500">Price Tier</label>
                    <span className="inline-block px-3 py-2 bg-blue-100 text-blue-800 rounded text-base font-medium">
                      {selectedCustomer.priceTier || 'T2'}
                    </span>
                  </div>
                  <div>
                    <label className="text-base font-medium text-gray-500">Payment Terms</label>
                    <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded text-base font-medium">
                      {selectedCustomer.accountDetails.paymentTerms} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedGlassComponent>
  );
}

export default CustomGlassPage;