import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import QuoteDetailsModal from '../../components/quotes/QuoteDetailsModal';
import EnhancedQuoteModal from '../../components/quotes/EnhancedQuoteModal';
import { useCategoryStructure } from '../../hooks/useCategoryStructure';
import { usePricingResolution } from '../../hooks/usePricingResolution';
import AdminConnectedGlassQuote from '../../components/glass/AdminConnectedGlassQuote';
import { dataService } from '../../services/api.service';
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

// Tooltip Component
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

// Step Progress Indicator
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

function StepProgress({ currentStep, totalSteps, steps }: StepProgressProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <div key={index} className="flex items-center">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? <CheckIcon className="w-5 h-5" /> : stepNumber}
                </div>
                <span className={`ml-3 text-base font-medium ${
                  isActive ? 'text-blue-600' :
                  isCompleted ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interfaces - Updated to match CustomerManagement structure
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
  priceTier?: 'T1' | 'T2' | 'T3' | 'Retail'; // For backward compatibility
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  image?: string;
  priceT1: number;
  priceT2: number;
  priceT3: number;
  priceRetail: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  subcategoryPath: { name: string; color: string }[];
  weight?: number;
  isActive: boolean;
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
  items: QuoteLineItem[];
}

// Customer Search Component
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
    // Load customers from localStorage (same as CustomerManagement saves)
    const loadCustomersFromManagement = async () => {
      try {
        console.log('🔍 NewQuote: Loading customers from database...');
        
        // Use direct API call to our customers endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
        const data = await response.json();
        
        console.log('📡 NewQuote: Customers API response:', data);
        
        if (data.success && data.data) {
          const customersData = data.data;
          console.log('📂 NewQuote: Found', customersData.length, 'customers in database');
          
          if (Array.isArray(customersData) && customersData.length > 0) {
            // Transform database customers to frontend format
            const transformedCustomers = customersData.map((customer: any) => ({
              id: customer.id,
              name: customer.name,
              accountingId: customer.accounting_id || '',
              salesRepId: customer.sales_rep_id || '',
              salesRepName: customer.sales_rep_name || '',
              abnNumber: customer.abn_number || '',
              phone: customer.phone || '',
              email: customer.email || '',
              primaryContact: {
                id: customer.id + '_contact',
                firstName: customer.primary_contact_first_name || '',
                lastName: customer.primary_contact_last_name || '',
                email: customer.primary_contact_email || customer.email || '',
                landline: customer.primary_contact_landline || '',
                fax: customer.primary_contact_fax || '',
                mobile: customer.primary_contact_mobile || customer.phone || ''
              },
              accountDetails: {
                accountingTerms: customer.accounting_terms || '',
                paymentTerms: customer.payment_due_days || 30,
                paymentPeriod: 'days' as const,
                creditLimit: customer.credit_limit || 0,
                availableLimit: customer.available_limit || 0,
                invoiceType: customer.invoice_type || 'Account' as const
              },
              locations: [],
              additionalContacts: [],
              priceLists: [],
              status: customer.status || 'active' as const,
              createdAt: new Date(customer.created_at || new Date()),
              notes: customer.notes || '',
              priceTier: customer.payment_due_days <= 15 ? 'T1' : customer.payment_due_days <= 30 ? 'T2' : 'T3'
            }));
            
            setCustomers(transformedCustomers);
            console.log('✅ NewQuote: Loaded database customers:', transformedCustomers.length);
            console.log('📂 NewQuote: Customer names:', transformedCustomers.map(c => c.name));
            return;
          }
        }
        
        console.warn('⚠️ NewQuote: No customers found in database');
        setCustomers([]);
      } catch (error) {
        console.error('❌ NewQuote: Error loading database customers:', error);
      }

      // If no saved customers, use initial sample data
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'ABC Construction',
          accountingId: 'ABC001',
          salesRepId: '1',
          salesRepName: 'John Smith',
          abnNumber: '12345678901',
          phone: '+61 2 9876 5432',
          email: 'contact@abcconstruction.com.au',
          primaryContact: {
            id: '1',
            firstName: 'David',
            lastName: 'Wilson',
            email: 'david@abcconstruction.com.au',
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
          notes: 'Regular customer, good payment history',
          priceTier: 'T2' // Add for backward compatibility
        },
        {
          id: '2',
          name: 'XYZ Manufacturing Ltd',
          accountingId: 'XYZ002',
          salesRepId: '2',
          salesRepName: 'Sarah Johnson',
          abnNumber: '98765432109',
          phone: '+61 3 8765 4321',
          email: 'procurement@xyzmanufacturing.com',
          primaryContact: {
            id: '2',
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael@xyzmanufacturing.com',
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
            streetName: 'Spencer Street',
            city: 'Melbourne',
            state: 'VIC',
            postcode: '3001',
            country: 'Australia'
          }],
          additionalContacts: [],
          priceLists: [],
          accountDetails: {
            paymentTerms: 45,
            creditLimit: 75000,
            availableLimit: 70000,
            invoiceType: 'Account'
          },
          status: 'active',
          createdAt: new Date(),
          notes: 'Manufacturing client with regular orders',
          priceTier: 'T1' // Add for backward compatibility
        },
        {
          id: '3',
          name: 'Coastal Homes NSW',
          accountingId: 'CHN003',
          salesRepId: '1',
          salesRepName: 'John Smith',
          abnNumber: '11122233344',
          phone: '+61 2 9555 1234',
          email: 'orders@coastalhomes.com.au',
          primaryContact: {
            id: '3',
            firstName: 'Emma',
            lastName: 'Davis',
            email: 'emma@coastalhomes.com.au',
            mobile: '+61 411 222 333'
          },
          locations: [{
            id: '3',
            type: 'Main',
            isMailingAddress: true,
            isBillingAddress: true,
            isDeliveryAddress: true,
            unitNumber: '',
            streetNumber: '789',
            streetName: 'George Street',
            city: 'Sydney',
            state: 'NSW',
            postcode: '2000',
            country: 'Australia'
          }],
          additionalContacts: [],
          priceLists: [],
          accountDetails: {
            paymentTerms: 30,
            creditLimit: 40000,
            availableLimit: 35000,
            invoiceType: 'Account'
          },
          status: 'active',
          createdAt: new Date(),
          notes: 'NSW residential construction specialist',
          priceTier: 'T2'
        }
      ];
      setCustomers(mockCustomers);
      // Save initial sample data to localStorage for CustomerManagement consistency
      localStorage.setItem('saleskik-customers', JSON.stringify(mockCustomers));
      console.log('Quote page: Saved initial customer data to localStorage');
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

// Customer Info Modal
interface CustomerInfoModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

function CustomerInfoModal({ customer, isOpen, onClose }: CustomerInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Customer Information</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-base font-medium text-gray-500">Company Name</label>
            <p className="text-gray-900 font-medium text-lg">{customer.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-base font-medium text-gray-500">Email</label>
              <p className="text-gray-900 text-base">{customer.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-base font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 text-base">{customer.phone || 'Not provided'}</p>
            </div>
          </div>

          <div>
            <label className="text-base font-medium text-gray-500">Primary Contact</label>
            <p className="text-gray-900 text-base">
              {customer.primaryContact.firstName} {customer.primaryContact.lastName}
            </p>
            <p className="text-base text-gray-500">{customer.primaryContact.email}</p>
            <p className="text-base text-gray-500">{customer.primaryContact.mobile}</p>
          </div>

          <div>
            <label className="text-base font-medium text-gray-500">Sales Representative</label>
            <p className="text-gray-900 text-base">{customer.salesRepName}</p>
          </div>

          {customer.locations[0] && (
            <div>
              <label className="text-base font-medium text-gray-500">Address</label>
              <p className="text-gray-900 text-base">
                {customer.locations[0].streetNumber} {customer.locations[0].streetName}
              </p>
              <p className="text-gray-900 text-base">
                {customer.locations[0].city}, {customer.locations[0].state} {customer.locations[0].postcode}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-base font-medium text-gray-500">Price Tier</label>
              <span className="inline-block px-3 py-2 bg-blue-100 text-blue-800 rounded text-base font-medium">
                {customer.priceTier || 'T2'}
              </span>
            </div>
            <div>
              <label className="text-base font-medium text-gray-500">Payment Terms</label>
              <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded text-base font-medium">
                {customer.accountDetails.paymentTerms} days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Dropdown Component (matching site standards)
interface CustomDropdownOption {
  value: string;
  label: string;
  color?: string;
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
  disabled = false 
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (disabled) {
    return (
      <div>
        <label className="block text-base font-medium text-gray-700 mb-2">{label}</label>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
          {placeholder}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-base font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className={selectedOption ? 'text-gray-900 font-medium text-base' : 'text-gray-500 text-base'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl">
          <div className="py-2">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200 text-base"
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 text-base">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Generate Quote ID
function generateQuoteId(): string {
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `QU-${randomNum}`;
}

export default function NewQuotePage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  
  // Step management
  const quoteSteps = ['Select Customer', 'Add Products', 'Review & Generate'];
  const [currentStep, setCurrentStep] = useState(1);
  
  // Keyboard shortcuts state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Enhanced search state
  const [smartSearch, setSmartSearch] = useState('');
  
  // Custom pricing integration
  const { 
    getPriceForCustomer: getResolvedPrice, 
    bulkResolvePricing, 
    getPricingInfo, 
    invalidateCache,
    savePriceToCustomerList,
    loading: pricingLoading 
  } = usePricingResolution();

  // Quote form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [jobName, setJobName] = useState('Main Project');
  const [quoteId] = useState(generateQuoteId());
  
  // Delivery details (for the enhanced modal)
  const [deliveryDetails, setDeliveryDetails] = useState({
    method: 'delivery' as 'delivery' | 'pickup' | 'courier',
    address: '',
    contactName: '',
    contactPhone: '',
    specialInstructions: ''
  });

  // Product filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPath, setSelectedPath] = useState<any[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

  // Products and quote items
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [jobSections, setJobSections] = useState<JobSection[]>([
    { id: '1', name: 'Main Project', items: [] }
  ]);
  const [quantities, setQuantities] = useState<{[key: string]: number | string}>({});
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProducts, setEditedProducts] = useState<{[key: string]: Partial<Product>}>({});

  // Categories (real data from localStorage like ProductManagement)
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);
  
  // Step management logic
  useEffect(() => {
    if (selectedCustomer && currentStep < 2) {
      setCurrentStep(2); // Move to "Add Products" when customer is selected
    }
    if (!selectedCustomer && currentStep > 1) {
      setCurrentStep(1); // Back to "Select Customer" if customer is removed
    }
  }, [selectedCustomer]);
  
  // Update delivery details when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setDeliveryDetails({
        method: 'delivery',
        address: selectedCustomer.locations[0] ? 
          `${selectedCustomer.locations[0].streetNumber} ${selectedCustomer.locations[0].streetName}, ${selectedCustomer.locations[0].city}, ${selectedCustomer.locations[0].state} ${selectedCustomer.locations[0].postcode}` : '',
        contactName: `${selectedCustomer.primaryContact.firstName} ${selectedCustomer.primaryContact.lastName}`,
        contactPhone: selectedCustomer.primaryContact.mobile || selectedCustomer.phone || '',
        specialInstructions: ''
      });
    }
  }, [selectedCustomer]);
  
  useEffect(() => {
    const totalItems = jobSections.reduce((count, section) => count + section.items.length, 0);
    if (totalItems > 0 && selectedCustomer && currentStep < 3) {
      setCurrentStep(3); // Move to "Review & Generate" when products are added
    }
    if (totalItems === 0 && currentStep === 3) {
      setCurrentStep(selectedCustomer ? 2 : 1); // Back to previous step if no items
    }
  }, [jobSections, selectedCustomer]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save as draft
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveAsDraft();
      }
      
      // Ctrl/Cmd + Enter: Generate quote (if ready)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        const totalItems = jobSections.reduce((count, section) => count + section.items.length, 0);
        if (selectedCustomer && totalItems > 0) {
          setShowQuoteDetails(true);
        }
      }
      
      // Ctrl/Cmd + /: Show keyboard shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      
      // Escape: Close modals
      if (event.key === 'Escape') {
        setShowCustomerInfo(false);
        setShowQuoteDetails(false);
        setShowKeyboardShortcuts(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer, jobSections]);

  const loadCategories = async () => {
    try {
      console.log('🔍 Quote: Loading categories from database...');
      
      // Use direct API call like other pages
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      console.log('📡 Quote: API response:', data);
      
      if (data.success && data.data) {
        const categoriesData = data.data;
        console.log('📂 Quote: Categories data:', categoriesData);
        console.log('📊 Quote: Categories count:', categoriesData.length);
      
      if (categoriesData.length > 0) {
        // Parse categories exactly like InventoryBuilder does
        const parsedCategories = categoriesData.map((cat: any) => ({
          ...cat,
          createdAt: new Date(cat.createdAt),
          updatedAt: new Date(cat.updatedAt)
        }));
        
        // Add custom glass category if user has access to glass module
        const categoriesWithGlass = [...parsedCategories];
        
        // Check if custom-glass category already exists
        const hasGlassCategory = categoriesWithGlass.some(cat => cat.id === 'custom-glass');
        
        // Add glass category if not present (user has glass module access)
        if (!hasGlassCategory) {
          categoriesWithGlass.push({
            id: 'custom-glass',
            name: 'Custom Glass',
            description: 'Custom glass products and configurations',
            color: '#3b82f6',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            subcategories: []
          });
        }
        
        setCategories(categoriesWithGlass);
        console.log('Quote page: Loaded categories from API (same as InventoryBuilder):', categoriesWithGlass.length, 'categories (including glass)');
      } else {
        // If no API categories, still add glass category if user has module access
        const glassCategory = {
          id: 'custom-glass',
          name: 'Custom Glass',
          description: 'Custom glass products and configurations',
          color: '#3b82f6',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          subcategories: []
        };
        
        setCategories([glassCategory]);
        console.log('Quote page: No API categories found - added glass category for module access');
      }
    } else {
      console.warn('Quote: API call failed or returned no success');
      setCategories([]);
    }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProducts = async () => {
    // Load products from localStorage (matching ProductManagement structure)
    // Load products with API-first approach
    const productsData = await dataService.products.getAll();
    if (productsData.length > 0) {
      const parsedProducts = productsData;
      // Convert to our interface format
      const convertedProducts: Product[] = parsedProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.productType || p.description,
        priceT1: p.priceT1,
        priceT2: p.priceT2,
        priceT3: p.priceT3,
        priceRetail: p.priceN,
        currentStock: p.inventory?.currentStock || 0,
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        subcategoryPath: p.subcategoryPath || [],
        weight: p.weight,
        isActive: p.isActive
      }));
      setProducts(convertedProducts);
      setFilteredProducts(convertedProducts);
      // Trigger initial filtering to show all active products
      handleSmartSearch('');
    } else {
      // Create sample data if no products exist
      const sampleProducts: Product[] = [
        {
          id: 'test-product-1',
          code: 'TEST-001',
          name: 'Test Product for Demo',
          description: 'Sample product for testing quotes and orders',
          priceT1: 10.00,
          priceT2: 15.00,
          priceT3: 20.00,
          priceRetail: 25.00,
          currentStock: 25,
          categoryId: 'glass',
          categoryName: 'Glass Products',
          subcategoryPath: [{ name: 'Pool Fencing', color: '#3b82f6' }, { name: 'Clear Glass', color: '#10b981' }],
          weight: 15.5,
          isActive: true
        },
        {
          id: '2',
          code: 'HW-SS304-20',
          name: 'Stainless Steel Spigot 50mm',
          description: 'Premium grade 304 stainless steel',
          priceT1: 45.00,
          priceT2: 52.00,
          priceT3: 58.00,
          priceRetail: 75.00,
          currentStock: 150,
          categoryId: 'hardware',
          categoryName: 'Hardware',
          subcategoryPath: [{ name: 'Spigots', color: '#f59e0b' }, { name: 'Stainless Steel', color: '#ef4444' }],
          weight: 0.8,
          isActive: true
        }
      ];
      setProducts(sampleProducts);
      setFilteredProducts(sampleProducts);
      // Trigger initial filtering to show all active products
      handleSmartSearch('');
    }
  };

  // Get subcategories for a specific level and parent (like ProductManagement)
  const getSubcategoriesAtLevel = (level: number, parentId?: string) => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return [];
    
    return category.subcategories?.filter((sub: any) => 
      sub.level === level && sub.parentId === parentId
    ) || [];
  };

  // Handle selection at specific level (like ProductManagement)
  const handleSubcategorySelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      // Clear from this level onwards
      setSelectedPath(selectedPath.slice(0, level));
      return;
    }

    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return;

    const subcategory = category.subcategories?.find((sub: any) => sub.id === subcategoryId);
    if (subcategory) {
      const newPath = selectedPath.slice(0, level).concat([{
        id: subcategory.id,
        name: subcategory.name,
        level: subcategory.level || level,
        color: subcategory.color
      }]);
      setSelectedPath(newPath);
    }
  };

  // Get maximum subcategory level for selected category
  const getMaxLevel = () => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category?.subcategories) return -1;
    return Math.max(-1, ...category.subcategories.map((sub: any) => sub.level || 0));
  };

  // Filter products - require complete category drill-down before showing products
  useEffect(() => {
    // Don't show any products if search is being used
    if (smartSearch) {
      let filtered = products.filter(p => p.isActive);
      filtered = filtered.filter(p => 
        p.code?.toLowerCase().includes(smartSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(smartSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(smartSearch.toLowerCase()))
      );
      setFilteredProducts(filtered);
      return;
    }

    // Check if user has drilled down to the deepest level of categories
    if (!selectedCategory) {
      setFilteredProducts([]);
      return;
    }

    // Get the maximum subcategory level for the selected category
    const maxLevel = getMaxLevel();
    console.log('Max subcategory level for category:', maxLevel);
    console.log('Current selected path length:', selectedPath.length);
    
    // Require user to select all levels if subcategories exist
    if (maxLevel >= 0 && selectedPath.length <= maxLevel) {
      setFilteredProducts([]);
      return;
    }

    // If we reach here, user has selected the complete path
    let filtered = products.filter(p => p.isActive && p.categoryId === selectedCategory);

    // Filter by the complete category path
    if (selectedPath.length > 0) {
      filtered = filtered.filter(product => {
        // Check if product's subcategory path matches ALL selected path items
        return selectedPath.every(pathItem => 
          product.subcategoryPath.some(subPath => subPath.id === pathItem.id)
        );
      });
    }

    // Filter by SKU/name search
    if (skuSearch) {
      filtered = filtered.filter(p => 
        p.code?.toLowerCase().includes(skuSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(skuSearch.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [selectedPath, skuSearch, products, selectedCategory, smartSearch]);

  // Initialize quantities for filtered products - DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   const newQuantities: {[key: string]: number} = {};
  //   filteredProducts.forEach(product => {
  //     if (!quantities[product.id]) {
  //       newQuantities[product.id] = 1;
  //     }
  //   });
  //   if (Object.keys(newQuantities).length > 0) {
  //     setQuantities(prev => ({ ...prev, ...newQuantities }));
  //   }
  // }, [filteredProducts]);

  // Enhanced pricing with custom price resolution
  const [resolvedPrices, setResolvedPrices] = useState<Record<string, number>>({});
  const [pricingPreloaded, setPricingPreloaded] = useState(false);
  
  // Preload pricing when customer or products change
  useEffect(() => {
    const preloadPricing = async () => {
      if (selectedCustomer && filteredProducts.length > 0) {
        setPricingPreloaded(false);
        try {
          const pricing = await bulkResolvePricing(selectedCustomer.id, filteredProducts);
          
          // Update resolved prices cache
          const newResolvedPrices: Record<string, number> = {};
          Object.entries(pricing).forEach(([productId, pricingResult]) => {
            const cacheKey = `${selectedCustomer.id}-${productId}`;
            newResolvedPrices[cacheKey] = pricingResult.price;
          });
          
          setResolvedPrices(prev => ({ ...prev, ...newResolvedPrices }));
        } catch (error) {
          console.error('Error preloading pricing:', error);
        } finally {
          setPricingPreloaded(true);
        }
      }
    };
    
    preloadPricing();
  }, [selectedCustomer, filteredProducts.length, bulkResolvePricing]);
  
  const getPriceForCustomer = async (product: Product, customer: Customer | null): Promise<number> => {
    if (!customer) return product.priceRetail;
    
    const cacheKey = `${customer.id}-${product.id}`;
    
    // Check if we already have this price resolved
    if (resolvedPrices[cacheKey]) {
      return resolvedPrices[cacheKey];
    }
    
    try {
      const price = await getResolvedPrice(product, customer);
      
      // Cache the resolved price
      setResolvedPrices(prev => ({
        ...prev,
        [cacheKey]: price
      }));
      
      return price;
    } catch (error) {
      console.error('Error resolving price:', error);
      
      // Fallback to tier pricing
      const tier = customer.priceTier || 
                  (customer.accountDetails.paymentTerms <= 15 ? 'T1' : 
                   customer.accountDetails.paymentTerms <= 30 ? 'T2' : 'T3');
      
      switch (tier) {
        case 'T1': return product.priceT1;
        case 'T2': return product.priceT2;
        case 'T3': return product.priceT3;
        default: return product.priceRetail;
      }
    }
  };
  
  // Synchronous version for existing code that expects immediate response
  const getPriceForCustomerSync = (product: Product, customer: Customer | null): number => {
    if (!customer) return product.priceRetail;
    
    const cacheKey = `${customer.id}-${product.id}`;
    
    // Check resolved prices cache first
    if (resolvedPrices[cacheKey]) {
      return resolvedPrices[cacheKey];
    }
    
    // Check pricing info from the hook
    const pricingInfo = getPricingInfo(product.id, customer.id);
    if (pricingInfo && pricingInfo.type !== 'error') {
      return pricingInfo.price;
    }
    
    // Fallback to tier pricing
    const tier = customer.priceTier || 
                (customer.accountDetails.paymentTerms <= 15 ? 'T1' : 
                 customer.accountDetails.paymentTerms <= 30 ? 'T2' : 'T3');
    
    switch (tier) {
      case 'T1': return product.priceT1;
      case 'T2': return product.priceT2;
      case 'T3': return product.priceT3;
      default: return product.priceRetail;
    }
  };

  // Price save to custom pricelist functionality
  const handlePriceSaveModal = async (productId: string, newPrice: number, productName: string) => {
    if (!selectedCustomer) return false;

    return new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Save to Custom Pricelist?</h3>
          <p class="text-gray-600 mb-4">
            Would you like to save this price ($${newPrice.toFixed(2)}) for "${productName}" 
            to ${selectedCustomer.name}'s custom pricelist for future use?
          </p>
          <div class="flex justify-end space-x-3">
            <button id="cancel-save" class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
              No, just for this quote
            </button>
            <button id="confirm-save" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Yes, save to pricelist
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      modal.querySelector('#cancel-save')?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      modal.querySelector('#confirm-save')?.addEventListener('click', async () => {
        cleanup();
        const saved = await savePriceToCustomerList(selectedCustomer.id, productId, newPrice, 'Price updated during quote creation');
        if (saved) {
          // Invalidate cache so new price will be loaded
          invalidateCache(selectedCustomer.id, productId);
        }
        resolve(saved);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      });
    });
  };

  // Add product to quote
  const addToQuote = (product: Product, quantity: number = 1) => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    const unitPrice = getPriceForCustomer(product, selectedCustomer);
    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      productId: product.id,
      product,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      jobName: jobName
    };

    // Find or create job section
    const existingJobIndex = jobSections.findIndex(js => js.name === jobName);
    if (existingJobIndex >= 0) {
      const updatedSections = [...jobSections];
      updatedSections[existingJobIndex].items.push(newItem);
      setJobSections(updatedSections);
    } else {
      const newJobSection: JobSection = {
        id: Date.now().toString(),
        name: jobName,
        items: [newItem]
      };
      setJobSections([...jobSections, newJobSection]);
    }
  };

  // Add glass item to quote (special handler for glass module)
  const addGlassToQuote = (glassItem: {
    glassType: any;
    thickness: any;
    quantity: number;
    heightMm: string;
    widthMm: string;
    itemCode?: string;
    processing: any;
    priceBreakdown: any;
  }) => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    // Build processing description for quote display
    const processingDetails = [];
    if (glassItem.processing.edgework?.length) {
      processingDetails.push(...glassItem.processing.edgework.map((p: any) => `${p.name} (Edgework)`));
    }
    if (glassItem.processing.corner?.length) {
      processingDetails.push(...glassItem.processing.corner.map((p: any) => 
        `${p.name}${p.selectedValue ? ` - ${p.selectedValue}mm` : ''} (Corner)`
      ));
    }
    if (glassItem.processing.holes?.length) {
      processingDetails.push(...glassItem.processing.holes.map((p: any) => `${p.name} (Holes)`));
    }
    if (glassItem.processing.services?.length) {
      processingDetails.push(...glassItem.processing.services.map((p: any) => `${p.name} (Service)`));
    }
    if (glassItem.processing.surface?.length) {
      processingDetails.push(...glassItem.processing.surface.map((p: any) => `${p.name} (Surface)`));
    }
    
    const processingText = processingDetails.length > 0 ? ` • Processing: ${processingDetails.join(', ')}` : '';

    // Create a pseudo-product for glass item to fit the QuoteLineItem structure
    const glassProduct: Product = {
      id: `glass-${Date.now()}`,
      name: `${glassItem.glassType.name} - ${glassItem.thickness.thickness}mm`,
      description: `${glassItem.heightMm} × ${glassItem.widthMm}mm ${glassItem.glassType.name}${glassItem.itemCode ? ` (${glassItem.itemCode})` : ''}${processingText}`,
      categoryId: 'custom-glass',
      sku: glassItem.thickness.sku,
      unitPrice: glassItem.priceBreakdown.total / glassItem.quantity,
      costPrice: glassItem.priceBreakdown.baseGlass / glassItem.quantity,
      markup: 0,
      profitMargin: 0,
      isActive: true,
      inventory: {
        currentStock: 999,
        reorderPoint: 0,
        supplier: 'Glass Supplier'
      },
      createdAt: new Date(),
      priceLists: [],
      bulkPricing: []
    };

    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      productId: glassProduct.id,
      product: glassProduct,
      quantity: glassItem.quantity,
      unitPrice: glassProduct.unitPrice,
      totalPrice: glassItem.priceBreakdown.total,
      jobName: jobName
    };

    // Add to job sections like regular products
    const existingJobIndex = jobSections.findIndex(js => js.name === jobName);
    if (existingJobIndex >= 0) {
      const updatedSections = [...jobSections];
      updatedSections[existingJobIndex].items.push(newItem);
      setJobSections(updatedSections);
    } else {
      const newJobSection: JobSection = {
        id: Date.now().toString(),
        name: jobName,
        items: [newItem]
      };
      setJobSections([...jobSections, newJobSection]);
    }

  };

  // Remove item from quote
  const removeFromQuote = (itemId: string, jobSectionId: string) => {
    setJobSections(sections =>
      sections.map(section =>
        section.id === jobSectionId
          ? { ...section, items: section.items.filter(item => item.id !== itemId) }
          : section
      ).filter(section => section.items.length > 0)
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = jobSections.reduce((total, section) =>
      total + section.items.reduce((sectionTotal, item) => sectionTotal + item.totalPrice, 0), 0
    );
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    
    return { subtotal, gst, total };
  };

  const totals = calculateTotals();
  const totalItems = jobSections.reduce((count, section) => count + section.items.length, 0);

  // Save as draft
  const saveAsDraft = () => {
    if (!selectedCustomer || totalItems === 0) {
      alert('Please select a customer and add products to the quote');
      return;
    }

    const quoteData = {
      id: Date.now().toString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      quoteId,
      reference: referenceNumber,
      projectName,
      jobSections,
      quoteDate: new Date(),
      amount: totals.total,
      status: 'draft',
      isDeleted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage (integrate with your quote system later)
    const existingQuotes = JSON.parse(localStorage.getItem('saleskik-quotes') || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem('saleskik-quotes', JSON.stringify(existingQuotes));

    alert('Quote saved as draft successfully!');
    navigate('/quotes');
  };

  // Save quote (finalized)
  const saveQuote = () => {
    if (!selectedCustomer || totalItems === 0) {
      alert('Please select a customer and add products to the quote');
      return;
    }

    const quoteData = {
      id: Date.now().toString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      quoteId,
      reference: referenceNumber,
      projectName,
      jobSections,
      quoteDate: new Date(),
      amount: totals.total,
      status: 'active',
      isDeleted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage (integrate with your quote system later)
    const existingQuotes = JSON.parse(localStorage.getItem('saleskik-quotes') || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem('saleskik-quotes', JSON.stringify(existingQuotes));

    alert('Quote saved successfully!');
    navigate('/quotes');
  };

  // Product editing functions
  const startEditing = (productId: string, product: Product) => {
    setEditingProduct(productId);
    setEditedProducts(prev => ({
      ...prev,
      [productId]: { ...product }
    }));
  };

  const saveProductEdit = (productId: string) => {
    const editedProduct = editedProducts[productId];
    if (editedProduct) {
      // Update the product in the products array
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...editedProduct } : p
      ));
      
      // Update filtered products
      setFilteredProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...editedProduct } : p
      ));
    }
    setEditingProduct(null);
  };

  const cancelProductEdit = () => {
    setEditingProduct(null);
    setEditedProducts(prev => {
      const newEdited = { ...prev };
      if (editingProduct) {
        delete newEdited[editingProduct];
      }
      return newEdited;
    });
  };

  const updateEditedProduct = (productId: string, field: keyof Product, value: any) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };
  
  
  // Smart search with AI-like natural language processing
  const handleSmartSearch = (searchTerm: string) => {
    setSmartSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredProducts(products.filter(p => p.isActive));
      return;
    }
    
    // Enhanced search with synonyms and natural language
    const searchWords = searchTerm.toLowerCase().split(' ');
    const synonyms: {[key: string]: string[]} = {
      'glass': ['panel', 'sheet', 'glazing', 'transparent'],
      'steel': ['metal', 'iron', 'stainless'],
      'hardware': ['fixture', 'fitting', 'component'],
      'clear': ['transparent', 'see-through'],
      'pool': ['swimming', 'water', 'aquatic'],
      'fence': ['fencing', 'barrier', 'enclosure']
    };
    
    const filtered = products.filter(product => {
      const searchableText = `${product.name} ${product.code} ${product.description || ''} ${product.categoryName}`.toLowerCase();
      
      return searchWords.some(word => {
        // Direct match
        if (searchableText.includes(word)) return true;
        
        // Synonym match
        for (const [key, values] of Object.entries(synonyms)) {
          if (word === key && values.some(synonym => searchableText.includes(synonym))) return true;
          if (values.includes(word) && searchableText.includes(key)) return true;
        }
        
        return false;
      });
    }).filter(p => p.isActive);
    
    setFilteredProducts(filtered);
  };
  
  // Auto-complete project name based on customer
  const getProjectNameSuggestions = (): string[] => {
    if (!selectedCustomer) return [];
    
    const customerName = selectedCustomer.name.toLowerCase();
    const suggestions = [];
    
    if (customerName.includes('construction')) {
      suggestions.push('New Building Project', 'Renovation Works', 'Site Development');
    } else if (customerName.includes('manufacturing')) {
      suggestions.push('Production Upgrade', 'Equipment Installation', 'Facility Enhancement');
    } else {
      suggestions.push('General Project', 'Service Delivery', 'Custom Solution');
    }
    
    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="quotes" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Add New Quote"
        subtitle="Create a new quote for your customer"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Quick Help Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <InformationCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Quick Tips</h3>
                <p className="text-sm text-blue-700">
                  {selectedCustomer 
                    ? `Creating quote for ${selectedCustomer.name} (${selectedCustomer.priceTier || 'T2'} pricing) • Sales Rep: ${selectedCustomer.salesRepName}` 
                    : 'Select a customer to get started with your quote'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip content="Keyboard shortcuts (Ctrl+/)">
                <button
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Header Section - Compact */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Selection - More Prominent */}
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

            {/* Quote Details - Horizontal Layout */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-base font-medium text-gray-500 mb-1">Reference</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Reference..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
                  />
                </div>

                <div className="relative">
                  <label className="block text-base font-medium text-gray-500 mb-1 flex items-center gap-1">
                    Project Name
                    <Tooltip content="AI will suggest project names based on your customer">
                      <InformationCircleIcon className="w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={selectedCustomer ? 'Type or select from suggestions...' : 'Select customer first'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
                    list="project-suggestions"
                  />
                  {selectedCustomer && (
                    <datalist id="project-suggestions">
                      {getProjectNameSuggestions().map((suggestion, idx) => (
                        <option key={idx} value={suggestion} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-base font-medium text-gray-500 mb-1 flex items-center gap-1">
                    Job Name
                    <Tooltip content="Job sections help organize products by area/phase (e.g., 'Bathroom', 'Kitchen', 'Phase 1')">
                      <QuestionMarkCircleIcon className="w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      onFocus={(e) => {
                        if (e.target.value === 'Main Project') {
                          setJobName('');
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim() === '') {
                          setJobName('Main Project');
                        }
                      }}
                      placeholder="e.g., Phase 1, Bathroom, Kitchen..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-500 mb-1">Quote ID</label>
                  <input
                    type="text"
                    value={quoteId}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedCustomer ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Product Selection - Takes most of the space */}
            <div className="lg:col-span-3 space-y-6">

            {/* Product Search & Filters - Minimalistic */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
              {/* Compact Filters */}
              <div className="p-4">
                {/* Reordered Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter First */}
                  <div>
                    {categoriesLoading ? (
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                          Loading categories...
                        </div>
                      </div>
                    ) : categories.length > 0 ? (
                      <CustomDropdown
                        label="Category"
                        value={selectedCategory}
                        placeholder="All Categories"
                        options={categories.map(cat => ({
                          value: cat.id,
                          label: cat.name,
                          color: cat.color
                        }))}
                        onChange={(value) => {
                          setSelectedCategory(value);
                          setSelectedPath([]);
                        }}
                      />
                    ) : (
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                          No categories available
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Subcategory Dropdown */}
                  {selectedCategory && !categoriesLoading && (() => {
                    const subcategoriesAtLevel = getSubcategoriesAtLevel(0);
                    
                    if (subcategoriesAtLevel.length > 0) {
                      return (
                        <CustomDropdown
                          label="Subcategory"
                          value={selectedPath[0]?.id || ''}
                          placeholder="All Subcategories"
                          options={subcategoriesAtLevel.map((sub: any) => ({
                            value: sub.id,
                            label: sub.name + (sub.isShared ? ' (Shared)' : ''),
                            color: sub.color
                          }))}
                          onChange={(value) => handleSubcategorySelectionAtLevel(0, value)}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Level 1 Dropdown */}
                  {selectedPath[0] && (() => {
                    const level1Options = getSubcategoriesAtLevel(1, selectedPath[0]?.id);
                    
                    if (level1Options.length > 0) {
                      return (
                        <CustomDropdown
                          label="Type"
                          value={selectedPath[1]?.id || ''}
                          placeholder="Select type..."
                          options={level1Options.map((sub: any) => ({
                            value: sub.id,
                            label: sub.name,
                            color: sub.color
                          }))}
                          onChange={(value) => handleSubcategorySelectionAtLevel(1, value)}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Level 2 Dropdown */}
                  {selectedPath[1] && (() => {
                    const level2Options = getSubcategoriesAtLevel(2, selectedPath[1]?.id);
                    
                    if (level2Options.length > 0) {
                      return (
                        <CustomDropdown
                          label="Specification"
                          value={selectedPath[2]?.id || ''}
                          placeholder="Select specification..."
                          options={level2Options.map((sub: any) => ({
                            value: sub.id,
                            label: sub.name,
                            color: sub.color
                          }))}
                          onChange={(value) => handleSubcategorySelectionAtLevel(2, value)}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Level 3 Dropdown */}
                  {selectedPath[2] && (() => {
                    const level3Options = getSubcategoriesAtLevel(3, selectedPath[2]?.id);
                    
                    if (level3Options.length > 0) {
                      return (
                        <CustomDropdown
                          label="Option"
                          value={selectedPath[3]?.id || ''}
                          placeholder="Select option..."
                          options={level3Options.map((sub: any) => ({
                            value: sub.id,
                            label: sub.name,
                            color: sub.color
                          }))}
                          onChange={(value) => handleSubcategorySelectionAtLevel(3, value)}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Enhanced Product Search */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-1">
                      Product Search
                      <Tooltip content="Search by name, SKU, or description">
                        <MagnifyingGlassIcon className="w-3 h-3 text-gray-400" />
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={smartSearch}
                        onChange={(e) => handleSmartSearch(e.target.value)}
                        placeholder="Search products by name, SKU, or description..."
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      />
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                      {smartSearch && (
                        <button
                          onClick={() => handleSmartSearch('')}
                          className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-full"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Product Count & Results */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CubeIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-base font-medium text-gray-700">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </span>
                  {smartSearch && (
                    <span className="text-base text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Search active
                    </span>
                  )}
                </div>
                <div className="text-base text-gray-500">
                  {selectedCustomer ? `Showing ${selectedCustomer.priceTier} tier pricing` : 'Select customer for pricing'}
                </div>
              </div>
              
              {/* Products Table or Glass Module - Enhanced */}
              {selectedCategory === 'custom-glass' ? (
                /* Custom Glass Module */
                <div className="p-6">
                  <AdminConnectedGlassQuote 
                    quoteId={quoteId || 'temp-quote'}
                    customerId={selectedCustomer?.id || ''}
                    onItemsAdded={() => {
                      // Refresh the quote when glass items are added
                      console.log('Glass item added to quote');
                      // You can add logic here to refresh quote totals
                    }}
                    onAddGlassToQuote={addGlassToQuote}
                  />
                </div>
              ) : (
                /* Regular Products Table */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-4 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">Details</th>
                        <th className="px-4 py-4 text-right text-base font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-end gap-1">
                            <TagIcon className="w-4 h-4" />
                            Price
                          </div>
                        </th>
                        <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-1">
                            <CubeIcon className="w-4 h-4" />
                            Stock
                          </div>
                        </th>
                        <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">Add</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            {false && !selectedCategory && !smartSearch ? (
                              <>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a category to view products</h3>
                                <p className="text-base text-gray-600 mb-4">Choose a category from the filter above to browse available products</p>
                                <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
                                  💡 Try selecting <span className="font-medium">Custom Glass 🪟</span> for professional glass quoting!
                                </div>
                              </>
                            ) : selectedCategory && !smartSearch ? (
                              <>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Select all subcategories to view products</h3>
                                <p className="text-base text-gray-600 mb-4">Complete the category drill-down by selecting all subcategory levels</p>
                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
                                  💡 You've selected: <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name}</span>
                                  {selectedPath.length > 0 && (
                                    <span> → {selectedPath.map(p => p.name).join(' → ')}</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                                <p className="text-base text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                              </>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product, index) => {
                          const customerPrice = getPriceForCustomerSync(product, selectedCustomer);
                          const isLowStock = product.currentStock <= 5;
                          const isOutOfStock = product.currentStock === 0;
                          
                          // Get pricing info for this product
                          const pricingInfo = selectedCustomer ? getPricingInfo(product.id, selectedCustomer.id) : null;
                          const hasCustomPricing = pricingInfo?.type === 'custom';
                          const isLoadingPrice = pricingLoading && !pricingPreloaded;
                          
                          return (
                            <tr key={product.id} className={`hover:bg-blue-50 hover:shadow-sm transition-all duration-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            }`}>
                              <td className="px-4 py-5">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                                  <CubeIcon className="w-8 h-8 text-gray-500" />
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                <div className="relative group">
                                  {editingProduct === product.id ? (
                                    // Editing mode
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={editedProducts[product.id]?.name || product.name}
                                        onChange={(e) => updateEditedProduct(product.id, 'name', e.target.value)}
                                        className="font-bold text-gray-900 text-lg leading-tight w-full border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Product name"
                                      />
                                      <input
                                        type="text"
                                        value={editedProducts[product.id]?.code || product.code}
                                        onChange={(e) => updateEditedProduct(product.id, 'code', e.target.value)}
                                        className="text-base text-gray-600 font-mono w-full border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                        placeholder="SKU"
                                      />
                                      <textarea
                                        value={editedProducts[product.id]?.description || product.description || ''}
                                        onChange={(e) => updateEditedProduct(product.id, 'description', e.target.value)}
                                        className="text-base text-gray-500 w-full border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Description"
                                        rows={2}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => saveProductEdit(product.id)}
                                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                        >
                                          <CheckIcon className="w-3 h-3" />
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelProductEdit}
                                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-1"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Display mode
                                    <div onClick={() => startEditing(product.id, product)} className="cursor-pointer hover:bg-blue-50 rounded p-2 -m-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
                                          <p className="text-base text-gray-600 mt-1 font-mono">SKU: {product.code}</p>
                                          {product.description && (
                                            <p className="text-base text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                          )}
                                        </div>
                                        <PencilIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                                      </div>
                                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-blue-600">Click to edit product details</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-5 text-right">
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${hasCustomPricing ? 'text-blue-600' : 'text-green-600'}`}>
                                    {isLoadingPrice ? (
                                      <div className="inline-flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                                        Loading...
                                      </div>
                                    ) : (
                                      `$${customerPrice?.toFixed(2) || '0.00'}`
                                    )}
                                  </div>
                                  {selectedCustomer && !isLoadingPrice && (
                                    <div className={`text-base px-3 py-2 rounded-full inline-block mt-1 ${
                                      hasCustomPricing 
                                        ? 'text-blue-800 bg-blue-100' 
                                        : 'text-gray-500 bg-gray-100'
                                    }`}>
                                      {hasCustomPricing ? 'Custom Price' : `Tier ${selectedCustomer.priceTier || 'T2'}`}
                                    </div>
                                  )}
                                  {!selectedCustomer && (
                                    <div className="text-base text-orange-600 font-medium">Select customer for pricing</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-5 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`px-3 py-2 rounded-full text-base font-bold shadow-sm ${
                                    isOutOfStock ? 'bg-red-100 text-red-800 border border-red-200' :
                                    isLowStock ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-green-100 text-green-800 border border-green-200'
                                  }`}>
                                    {product.currentStock}
                                  </span>
                                  {isLowStock && !isOutOfStock && (
                                    <span className="text-base text-orange-600 font-medium">Low Stock</span>
                                  )}
                                  {isOutOfStock && (
                                    <span className="text-base text-red-600 font-medium">Out of Stock</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={product.currentStock || 999}
                                  defaultValue="1"
                                  className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base"
                                  id={`qty-${product.id}`}
                                  disabled={isOutOfStock}
                                />
                              </td>
                              <td className="px-4 py-5 text-center">
                                <button
                                  onClick={() => {
                                    const qty = quantities[product.id];
                                    const quantity = typeof qty === 'string' ? parseInt(qty) || 1 : qty || 1;
                                    addToQuote(product, quantity);
                                  }}
                                  disabled={!selectedCustomer || isOutOfStock}
                                  className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-sm ${
                                    !selectedCustomer || isOutOfStock
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <PlusIcon className="w-4 h-4" />
                                    Add
                                  </div>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quote Summary Sidebar - Optimized */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg sticky top-6">
              {/* Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <ShoppingCartIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quote Summary</h3>
                    <p className="text-base text-gray-500">{totalItems} items</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {totalItems === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCartIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-base text-gray-500">No items yet</p>
                    <p className="text-base text-gray-400">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Items List - More Compact */}
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {jobSections.map(section => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 text-base mb-2">{section.name}</h4>
                          <div className="space-y-2">
                            {section.items.map(item => (
                              <div key={item.id} className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-medium text-gray-900 truncate">{item.product.name}</p>
                                  {/* Show processing details for glass items */}
                                  {item.product.categoryId === 'custom-glass' && item.product.description.includes('Processing:') && (
                                    <p className="text-sm text-blue-600 mt-1 truncate">
                                      {item.product.description.split('Processing:')[1]?.trim()}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-base text-gray-600">Qty: {item.quantity}</span>
                                    <span className="text-base font-bold text-green-600">
                                      ${item.totalPrice.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFromQuote(item.id, section.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals - More Prominent */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">GST:</span>
                        <span className="font-medium">${totals.gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${totals.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons - More Prominent */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => {
                          if (!selectedCustomer || totalItems === 0) {
                            alert('Please select a customer and add products to the quote');
                            return;
                          }
                          setShowQuoteDetails(true);
                        }}
                        disabled={!selectedCustomer || totalItems === 0}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base"
                      >
                        Generate Quote
                      </button>
                      <button
                        onClick={saveAsDraft}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-base"
                      >
                        Save as Draft
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                            navigate('/quotes');
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-12">
              <UserIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Customer First</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Choose a customer from the dropdown above to start building your quote and access the product catalog.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // Focus on customer search
                    const customerSearch = document.querySelector('input[placeholder*="customer"]') as HTMLInputElement;
                    if (customerSearch) customerSearch.focus();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-5 h-5" />
                  Select Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="bg-white border-t border-gray-200 rounded-xl shadow-lg mt-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                    navigate('/quotes');
                  }
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
              
              <button
                onClick={saveAsDraft}
                disabled={!selectedCustomer || totalItems === 0}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center justify-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Save as Draft
              </button>
              
              <button
                onClick={saveQuote}
                disabled={!selectedCustomer || totalItems === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save Quote
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                💡 Tip: Use <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+S</kbd> to save as draft or <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Enter</kbd> to generate quote
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Modal */}
      {selectedCustomer && (
        <CustomerInfoModal
          customer={selectedCustomer}
          isOpen={showCustomerInfo}
          onClose={() => setShowCustomerInfo(false)}
        />
      )}

      {/* Quote Details Modal */}
      {selectedCustomer && totalItems > 0 && (
        <QuoteDetailsModal
          isOpen={showQuoteDetails}
          onClose={() => setShowQuoteDetails(false)}
          onGenerateQuote={(finalQuoteData) => {
            // This is now handled by the FinalQuoteModal
            console.log('Quote details prepared:', finalQuoteData);
          }}
          onSaveDraft={() => {
            saveAsDraft();
            setShowQuoteDetails(false);
          }}
          onQuoteCompleted={() => {
            // Save the quote to main quotes list when completed
            if (selectedCustomer) {
              const completedQuote = {
                id: Date.now().toString(),
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                customerEmail: selectedCustomer.email,
                customerPhone: selectedCustomer.phone,
                quoteId,
                reference: referenceNumber,
                projectName,
                jobSections,
                quoteDate: new Date(),
                amount: totals.total,
                status: 'active', // Generated but not yet sent
                isDeleted: false,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              const savedQuotes = JSON.parse(localStorage.getItem('saleskik-quotes') || '[]');
              // Check if quote already exists
              const existingIndex = savedQuotes.findIndex((q: any) => q.quoteId === quoteId);
              
              if (existingIndex >= 0) {
                // Update existing quote
                savedQuotes[existingIndex] = { ...savedQuotes[existingIndex], ...completedQuote };
              } else {
                // Add new quote
                savedQuotes.push(completedQuote);
              }
              
              localStorage.setItem('saleskik-quotes', JSON.stringify(savedQuotes));
              
              console.log('💾 Quote saved to main quotes list:', {
                quoteId,
                customerName: selectedCustomer.name,
                amount: totals.total,
                status: 'active',
                totalQuotes: savedQuotes.length
              });
            }
            
            alert('Quote generated successfully! Redirecting to quotes page...');
            navigate('/quotes');
          }}
          customer={selectedCustomer}
          projectName={projectName}
          quoteId={quoteId}
          referenceNumber={referenceNumber}
          jobSections={jobSections}
        />
      )}
      
      
      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600">Save as Draft</span>
                <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-base font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600">Generate Quote</span>
                <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-base font-mono">Ctrl+Enter</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600">Show Shortcuts</span>
                <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-base font-mono">Ctrl+/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600">Close Modals</span>
                <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-base font-mono">Escape</kbd>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-base text-gray-500 text-center">
                  💡 Tip: Use the enhanced search to quickly find products by name, SKU, or description!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}