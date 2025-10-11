import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, PhoneIcon, 
  EnvelopeIcon, MapPinIcon, PencilIcon, EyeIcon,
  BuildingOfficeIcon, UserIcon, TagIcon, ClockIcon,
  ChevronDownIcon, XMarkIcon, TrashIcon, CheckIcon,
  DocumentTextIcon, ShoppingCartIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { useCategoryStructure } from '../../hooks/useCategoryStructure';
import { dataService } from '../../services/api.service';

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
  locationDetails: {
    locationType: string;
    mailingAddress: CustomerAddress;
    billingAddress: CustomerAddress;
    deliveryAddress: CustomerAddress;
  };
  locations: CustomerLocation[];
  additionalContacts: CustomerContact[];
  priceLists: PriceListItem[];
  accountDetails: AccountDetails;
  status: 'active' | 'inactive';
  createdAt: Date;
  notes: string;
}

interface CustomerContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  landline?: string;
  fax?: string;
  mobile?: string;
}

interface CustomerAddress {
  unit: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface CustomerLocation {
  id: string;
  type: 'Main' | 'Branch' | 'PO Box' | 'Others';
  isMailingAddress: boolean;
  isBillingAddress: boolean;
  isDeliveryAddress: boolean;
  unitNumber: string; // Unit/Apt/Level
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface PriceListItem {
  id: string;
  category: string;
  selectedTier: 'trade1' | 'trade2' | 'trade3' | 'retail' | null;
  markupDiscount: number;
  isSelected: boolean;
}

interface AccountDetails {
  accountingTerms: string;
  paymentTerms: number;
  paymentPeriod: 'days' | 'months';
  creditLimit: number;
  availableLimit: number;
  invoiceType: 'Not Applicable' | 'Cash on Delivery' | 'Upfront Payment' | 'Account' | '1st of Month';
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hasSalesPermission: boolean;
}

interface Category {
  id: string;
  name: string;
}

export function CustomerManagement() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCustomerNotes, setSelectedCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get real category structure
  const { categoryStructure, loading: categoriesLoading } = useCategoryStructure();
  const [realCategories, setRealCategories] = useState<Category[]>([]);
  const [accountingTerms, setAccountingTerms] = useState<string[]>([]);
  
  // Filters
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  
  // Form data for new customer
  const [formData, setFormData] = useState({
    customerDetails: {
      name: '',
      accountingId: '',
      salesRepId: '',
      abnNumber: '',
      phone: '',
      email: ''
    },
    primaryContact: {
      firstName: '',
      lastName: '',
      email: '',
      landline: '',
      fax: '',
      mobile: ''
    },
    locationDetails: {
      locationType: 'Main',
      mailingAddress: {
        unit: '',
        streetNumber: '',
        streetName: '',
        city: '',
        state: '',
        postcode: '',
        country: 'Australia'
      },
      billingAddress: {
        unit: '',
        streetNumber: '',
        streetName: '',
        city: '',
        state: '',
        postcode: '',
        country: 'Australia'
      },
      deliveryAddress: {
        unit: '',
        streetNumber: '',
        streetName: '',
        city: '',
        state: '',
        postcode: '',
        country: 'Australia'
      }
    },
    locations: [] as any[],
    additionalContacts: [] as any[],
    priceLists: [] as PriceListItem[],
    accountDetails: {
      accountingTerms: '',
      paymentTerms: 30,
      paymentPeriod: 'days' as const,
      creditLimit: 0,
      availableLimit: 0,
      invoiceType: 'Account' as const
    },
    notes: '',
    newLocation: {} as any,
    newContact: {} as any
  });

  // Modal states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSalesRepDropdown, setShowSalesRepDropdown] = useState(false);
  const [showInvoiceTypeDropdown, setShowInvoiceTypeDropdown] = useState(false);
  const [showAccountingTermsDropdown, setShowAccountingTermsDropdown] = useState(false);
  const [showPaymentPeriodDropdown, setShowPaymentPeriodDropdown] = useState(false);
  const [showLocationTypeDropdown, setShowLocationTypeDropdown] = useState(false);
  const [showMarkupDropdowns, setShowMarkupDropdowns] = useState<{[key: string]: boolean}>({});
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  
  // Address autocomplete states
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');

  useEffect(() => {
    // Load mock data
    loadEmployees();
    loadCustomers();
    loadDatabaseCategories(); // Load from database instead of localStorage
    
    // Load accounting terms (mock for now - replace with real API call)
    setAccountingTerms([
      'Net 30',
      'Net 15', 
      'Net 60',
      'Due on Receipt',
      'End of Month',
      'Custom Terms'
    ]);
  }, []);

  // Auto-update price lists when categories change
  useEffect(() => {
    if (!categoriesLoading && categoryStructure) {
      const mainCategories = getMainCategories();
      
      // Update form data price lists if modal is open
      if (showAddCustomerModal) {
        setFormData(prev => {
          const existingPriceLists = prev.priceLists || [];
          
          // Create new price lists for any new categories
          const newPriceLists = mainCategories.map(category => {
            const existingPriceList = existingPriceLists.find(pl => pl.id === category.id);
            
            return existingPriceList || {
              id: category.id,
              category: category.name,
              selectedTier: null as ('trade1' | 'trade2' | 'trade3' | 'retail' | null),
              markupDiscount: 0,
              isSelected: false
            };
          });
          
          return {
            ...prev,
            priceLists: newPriceLists
          };
        });
      }
    }
  }, [categoryStructure, categoriesLoading, showAddCustomerModal]);

  // Australian address autocomplete with proper parsing
  const searchAddresses = async (query: string) => {
    if (query.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      // Search for street names and areas, not specific house numbers
      const searchQuery = query.includes(' ') ? query : `${query} street, Australia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=au&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        const formattedSuggestions = data.map((item: any) => {
          const road = item.address?.road || '';
          const suburb = item.address?.suburb || item.address?.city || item.address?.town || item.address?.village || '';
          const state = item.address?.state || '';
          const postcode = item.address?.postcode || '';
          
          // Clean up the street name - don't include house numbers in suggestions
          let streetName = road;
          if (!streetName && item.display_name) {
            // Extract street name from display name
            const parts = item.display_name.split(',');
            streetName = parts.find(part => 
              part.includes('Street') || 
              part.includes('Road') || 
              part.includes('Avenue') || 
              part.includes('Drive') || 
              part.includes('Lane') || 
              part.includes('Way') ||
              part.includes('Circuit') ||
              part.includes('Place') ||
              part.includes('Close')
            )?.trim() || parts[0]?.trim() || '';
          }

          return {
            display_name: `${streetName}, ${suburb}, ${state} ${postcode}`,
            streetName: streetName.trim(),
            city: suburb.trim(),
            state: state.trim(),
            postcode: postcode.trim(),
            country: 'Australia'
          };
        }).filter((suggestion: any) => 
          suggestion.streetName && 
          suggestion.streetName.length > 0 &&
          suggestion.city &&
          !suggestion.streetName.includes('undefined')
        );
        
        // Remove duplicates based on street name and suburb
        const uniqueSuggestions = formattedSuggestions.filter((suggestion, index, self) =>
          index === self.findIndex(s => 
            s.streetName === suggestion.streetName && 
            s.city === suggestion.city &&
            s.state === suggestion.state
          )
        );
        
        setAddressSuggestions(uniqueSuggestions);
        setShowAddressSuggestions(uniqueSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Faster debounced search (reduced from 300ms to 150ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addressSearchQuery && addressSearchQuery.length >= 3) {
        searchAddresses(addressSearchQuery);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [addressSearchQuery]);

  const selectAddress = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      newLocation: {
        ...prev.newLocation,
        streetName: suggestion.streetName,
        city: suggestion.city,
        state: suggestion.state,
        postcode: suggestion.postcode,
        country: suggestion.country
      }
    }));
    setAddressSearchQuery(suggestion.streetName);
    setShowAddressSuggestions(false);
  };

  const loadEmployees = () => {
    // Mock sales employees data
    setEmployees([
      { id: '1', firstName: 'John', lastName: 'Smith', hasSalesPermission: true },
      { id: '2', firstName: 'Sarah', lastName: 'Johnson', hasSalesPermission: true },
      { id: '3', firstName: 'Mike', lastName: 'Chen', hasSalesPermission: true },
    ]);
  };

  // Load categories from database for price lists
  const loadDatabaseCategories = async () => {
    try {
      console.log('🔍 Customer: Loading categories from database for price lists...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      console.log('📡 Customer: API response:', data);
      
      if (data.success && data.data) {
        const categoriesData = data.data;
        console.log('📂 Customer: Categories for price lists:', categoriesData.length);
        
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setRealCategories(categoriesData);
          console.log('✅ Customer: Loaded database categories for price lists:', categoriesData.map(c => c.name));
        } else {
          console.warn('⚠️ Customer: No categories found in database');
          setRealCategories([]);
        }
      } else {
        console.warn('⚠️ Customer: API call failed or returned no success');
        setRealCategories([]);
      }
    } catch (error) {
      console.error('❌ Customer: Error loading database categories:', error);
      setRealCategories([]);
    }
  };

  // Get main categories - use database categories for price lists
  const getMainCategories = () => {
    // Use database categories from realCategories state
    if (realCategories && realCategories.length > 0) {
      console.log('🎯 Customer: Using database categories for price lists:', realCategories.length);
      return realCategories.map(category => ({
        id: category.id,
        name: category.name
      }));
    }
    
    console.log('⚠️ Customer: No database categories found for price lists');
    return [];
  };

  const loadCustomers = async () => {
    try {
      // Try API first for multi-user support, fallback to localStorage (NON-DISRUPTIVE)
      const customersData = await dataService.customers.getAll();
      const parsedCustomers = customersData.map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt)
      }));
      setCustomers(parsedCustomers);
      
      // Sync successful API data to localStorage for offline capability
      if (parsedCustomers.length > 0) {
        localStorage.setItem('saleskik-customers', JSON.stringify(parsedCustomers));
      }
    } catch (error) {
      // If API fails, use localStorage (preserves existing behavior)
      console.warn('API unavailable, using localStorage fallback');
      const savedCustomers = localStorage.getItem('saleskik-customers');
      if (savedCustomers) {
        try {
          const parsedCustomers = JSON.parse(savedCustomers);
          const customersWithDates = parsedCustomers.map((customer: any) => ({
            ...customer,
            createdAt: new Date(customer.createdAt)
          }));
          setCustomers(customersWithDates);
          console.log('Loaded customers from localStorage:', customersWithDates.length, 'customers');
          return;
        } catch (error) {
          console.error('Error parsing saved customers:', error);
        }
      } else {

    // If no saved customers, create initial mock data
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
        notes: 'Regular customer, good payment history'
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
        notes: 'Manufacturing client with regular orders'
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
        notes: 'NSW residential construction specialist'
      }
    ];
    setCustomers(mockCustomers);
    // Save the initial data to localStorage
    await dataService.customers.save(mockCustomers);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save customers with hybrid approach (API + localStorage)
  const saveCustomersToStorage = async (customersToSave: Customer[]) => {
    try {
      await dataService.customers.save(customersToSave);
      console.log('Saved customers to localStorage:', customersToSave.length, 'customers');
    } catch (error) {
      console.error('Error saving customers to localStorage:', error);
    }
  };

  const salesEmployees = employees.filter(emp => emp.hasSalesPermission);

  const handleAddCustomer = () => {
    // Always get the latest categories when opening the modal
    const mainCategories = getMainCategories();
    
    if (mainCategories.length === 0) {
      console.warn('No categories found. Make sure categories are set up in Product Category Setup.');
    }
    
    const initialPriceLists = mainCategories.map(category => ({
      id: category.id,
      category: category.name,
      selectedTier: null as ('trade1' | 'trade2' | 'trade3' | 'retail' | null),
      markupDiscount: 0,
      isSelected: false
    }));
    
    setEditingCustomer(null);
    setFormData(prev => ({
      ...prev,
      priceLists: initialPriceLists
    }));
    
    setShowAddCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    
    // Pre-fill form with existing customer data
    setFormData({
      customerDetails: {
        name: customer.name,
        accountingId: customer.accountingId,
        salesRepId: customer.salesRepId,
        abnNumber: customer.abnNumber,
        phone: customer.phone,
        email: customer.email
      },
      primaryContact: customer.primaryContact,
      locations: customer.locations,
      additionalContacts: customer.additionalContacts,
      priceLists: customer.priceLists,
      accountDetails: customer.accountDetails,
      notes: customer.notes,
      newLocation: {},
      newContact: {}
    });
    
    setShowAddCustomerModal(true);
  };

  const handleCloseModal = () => {
    const hasData = Object.values(formData.customerDetails).some(value => value !== '') ||
                   Object.values(formData.primaryContact).some(value => value !== '');
    
    if (hasData) {
      setShowConfirmCancel(true);
    } else {
      setShowAddCustomerModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      customerDetails: {
        name: '',
        accountingId: '',
        salesRepId: '',
        abnNumber: '',
        phone: '',
        email: ''
      },
      primaryContact: {
        firstName: '',
        lastName: '',
        email: '',
        landline: '',
        fax: '',
        mobile: ''
      },
      locations: [],
      additionalContacts: [],
      priceLists: [],
      accountDetails: {
        accountingTerms: '',
        paymentTerms: 30,
        paymentPeriod: 'days',
        creditLimit: 0,
        availableLimit: 0,
        invoiceType: 'Account'
      },
      notes: '',
      newLocation: {},
      newContact: {}
    });
  };

  const handleSaveCustomer = async () => {
    // Validate required fields
    if (!formData.customerDetails.name || !formData.primaryContact.firstName || !formData.primaryContact.lastName) {
      alert('Please fill in all required fields');
      return;
    }

    const customerData: Customer = {
      id: editingCustomer?.id || Date.now().toString(),
      name: formData.customerDetails.name,
      accountingId: formData.customerDetails.accountingId,
      salesRepId: formData.customerDetails.salesRepId,
      salesRepName: employees.find(e => e.id === formData.customerDetails.salesRepId)?.firstName + ' ' + 
                    employees.find(e => e.id === formData.customerDetails.salesRepId)?.lastName || '',
      abnNumber: formData.customerDetails.abnNumber,
      phone: formData.customerDetails.phone,
      email: formData.customerDetails.email,
      primaryContact: {
        id: formData.primaryContact.id || Date.now().toString(),
        firstName: formData.primaryContact.firstName,
        lastName: formData.primaryContact.lastName,
        email: formData.primaryContact.email,
        landline: formData.primaryContact.landline,
        fax: formData.primaryContact.fax,
        mobile: formData.primaryContact.mobile
      },
      locationDetails: formData.locationDetails,
      locations: formData.locations,
      additionalContacts: formData.additionalContacts,
      priceLists: formData.priceLists,
      accountDetails: formData.accountDetails,
      status: editingCustomer?.status || 'active',
      createdAt: editingCustomer?.createdAt || new Date(),
      notes: formData.notes
    };

    if (editingCustomer) {
      // Update existing customer
      const updatedCustomers = customers.map(customer => 
        customer.id === editingCustomer.id ? customerData : customer
      );
      setCustomers(updatedCustomers);
      await saveCustomersToStorage(updatedCustomers);
    } else {
      // Add new customer
      const updatedCustomers = [...customers, customerData];
      setCustomers(updatedCustomers);
      await saveCustomersToStorage(updatedCustomers);
    }

    setShowAddCustomerModal(false);
    setEditingCustomer(null);
    resetForm();
    
    // Show success message
    alert(editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!');
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSalesRep = !selectedSalesRep || customer.salesRepId === selectedSalesRep;
    const matchesKeyword = !keywordSearch || 
      customer.name.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      customer.primaryContact?.firstName?.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      customer.primaryContact?.lastName?.toLowerCase().includes(keywordSearch.toLowerCase());
    
    return matchesSalesRep && matchesKeyword;
  });

  const handleToggleStatus = async (customerId: string) => {
    const updatedCustomers = customers.map(customer => 
      customer.id === customerId 
        ? { ...customer, status: customer.status === 'active' ? 'inactive' : 'active' }
        : customer
    );
    setCustomers(updatedCustomers);
    await saveCustomersToStorage(updatedCustomers);
  };

  const downloadCustomerList = () => {
    // Create CSV content
    const csvContent = [
      ['Customer Name', 'Sales Rep', 'Primary Contact', 'Primary Email', 'Status'],
      ...filteredCustomers.map(customer => [
        customer.name,
        customer.salesRepName,
        `${customer.primaryContact?.firstName || ''} ${customer.primaryContact?.lastName || ''}`,
        customer.primaryContact.email || customer.email,
        customer.status
      ])
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateOrder = (customer: Customer) => {
    // Navigate to create order page with customer pre-selected
    console.log('Creating order for customer:', customer.name);
    // TODO: Navigate to orders page with customer ID
    alert(`Creating order for ${customer.name} - This will navigate to the orders page`);
  };

  const handleCreateQuote = (customer: Customer) => {
    // Navigate to create quote page with customer pre-selected
    console.log('Creating quote for customer:', customer.name);
    // TODO: Navigate to quotes page with customer ID
    alert(`Creating quote for ${customer.name} - This will navigate to the quotes page`);
  };

  const handleViewNotes = (customer: Customer) => {
    setSelectedCustomerNotes(customer.notes);
    setShowNotesModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="customers"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Customer List"
        subtitle="Manage your customer database and relationships"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sales Representative Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Representative</label>
              <div className="relative">
                <button
                  onClick={() => setShowSalesRepDropdown(!showSalesRepDropdown)}
                  className="w-48 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                >
                  <span className={selectedSalesRep ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedSalesRep 
                      ? employees.find(e => e.id === selectedSalesRep)?.firstName + ' ' + employees.find(e => e.id === selectedSalesRep)?.lastName
                      : 'All Representatives'
                    }
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSalesRepDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSalesRepDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <button
                      onClick={() => {
                        setSelectedSalesRep('');
                        setShowSalesRepDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                    >
                      All Representatives
                    </button>
                    {salesEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => {
                          setSelectedSalesRep(employee.id);
                          setShowSalesRepDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                      >
                        {employee.firstName} {employee.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keywords Search */}
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Add New Button */}
            <div className="pt-6">
              <button
                onClick={handleAddCustomer}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customers ({filteredCustomers.length})</h3>
            </div>
            <button
              onClick={downloadCustomerList}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sales Rep</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Primary Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Primary Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.salesRepName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {customer.primaryContact?.firstName || ''} {customer.primaryContact?.lastName || ''}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {customer.primaryContact?.email || customer.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit Customer"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(customer.id)}
                          className={`p-1 rounded ${
                            customer.status === 'active'
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={customer.status === 'active' ? 'Deactivate Customer' : 'Reactivate Customer'}
                        >
                          {customer.status === 'active' ? (
                            <XMarkIcon className="w-4 h-4" />
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCreateOrder(customer)}
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                          title="Create Order"
                        >
                          <ShoppingCartIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCreateQuote(customer)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Create Quote"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                        {customer.notes && (
                          <button
                            onClick={() => handleViewNotes(customer)}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                            title="View Notes"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {keywordSearch || selectedSalesRep ? 'Try adjusting your filters' : 'Get started by adding your first customer'}
              </p>
              <button
                onClick={handleAddCustomer}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal - Full Page */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-full w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Customer Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customerDetails.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accounting ID</label>
                    <input
                      type="text"
                      value={formData.customerDetails.accountingId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, accountingId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Sales Representative</label>
                    <button
                      onClick={() => setShowSalesRepDropdown(!showSalesRepDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                    >
                      <span className={formData.customerDetails.salesRepId ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.customerDetails.salesRepId 
                          ? employees.find(e => e.id === formData.customerDetails.salesRepId)?.firstName + ' ' + 
                            employees.find(e => e.id === formData.customerDetails.salesRepId)?.lastName
                          : 'Select Sales Rep'
                        }
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSalesRepDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showSalesRepDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, salesRepId: '' }
                            }));
                            setShowSalesRepDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg text-gray-500"
                        >
                          Select Sales Rep
                        </button>
                        {salesEmployees.map(employee => (
                          <button
                            key={employee.id}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                customerDetails: { ...prev.customerDetails, salesRepId: employee.id }
                              }));
                              setShowSalesRepDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                          >
                            {employee.firstName} {employee.lastName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ABN Number</label>
                    <input
                      type="text"
                      value={formData.customerDetails.abnNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, abnNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.customerDetails.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.customerDetails.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Contact Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.primaryContact.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, firstName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.primaryContact.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, lastName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.primaryContact.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landline</label>
                    <input
                      type="tel"
                      value={formData.primaryContact.landline}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, landline: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                    <input
                      type="tel"
                      value={formData.primaryContact.fax}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, fax: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={formData.primaryContact.mobile}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, mobile: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location Details Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                  <button
                    onClick={() => setShowAddLocationModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                
                {formData.locations.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <MapPinIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No locations added yet</p>
                    <p className="text-sm text-gray-400">Click "Add Location" to add customer addresses</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.locations.map((location: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{location.type} Address</span>
                          <button
                            onClick={() => {
                              const newLocations = formData.locations.filter((_: any, i: number) => i !== index);
                              setFormData(prev => ({ ...prev, locations: newLocations }));
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>
                            {location.unitNumber && `${location.unitNumber}, `}
                            {location.streetNumber} {location.streetName}
                          </div>
                          <div>{location.city}, {location.state} {location.postcode}</div>
                          <div>{location.country}</div>
                          <div className="flex gap-4 mt-2">
                            {location.isMailingAddress && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Mailing</span>}
                            {location.isBillingAddress && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Billing</span>}
                            {location.isDeliveryAddress && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Delivery</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Contacts Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Contacts</h3>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Contact
                  </button>
                </div>
                
                {formData.additionalContacts.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UserIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No additional contacts added yet</p>
                    <p className="text-sm text-gray-400">Click "Add Contact" to add more customer contacts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.additionalContacts.map((contact: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</span>
                          <button
                            onClick={() => {
                              const newContacts = formData.additionalContacts.filter((_: any, i: number) => i !== index);
                              setFormData(prev => ({ ...prev, additionalContacts: newContacts }));
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {contact.email && <div>Email: {contact.email}</div>}
                          {contact.landline && <div>Landline: {contact.landline}</div>}
                          {contact.mobile && <div>Mobile: {contact.mobile}</div>}
                          {contact.fax && <div>Fax: {contact.fax}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Lists Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Price Lists</h3>
                  {categoriesLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading categories...
                    </div>
                  )}
                  {!categoriesLoading && formData.priceLists.length === 0 && (
                    <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      No categories found - Set up categories first
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Trade 1</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Trade 2</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Trade 3</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Retail</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Markup/Discount</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.priceLists.map((priceList, index) => (
                        <tr key={priceList.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">{priceList.category}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name={`tier-${priceList.id}`}
                              checked={priceList.selectedTier === 'trade1'}
                              onChange={() => {
                                const newPriceLists = [...formData.priceLists];
                                newPriceLists[index].selectedTier = 'trade1';
                                setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                              }}
                              className="w-5 h-5 text-blue-600 border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name={`tier-${priceList.id}`}
                              checked={priceList.selectedTier === 'trade2'}
                              onChange={() => {
                                const newPriceLists = [...formData.priceLists];
                                newPriceLists[index].selectedTier = 'trade2';
                                setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                              }}
                              className="w-5 h-5 text-blue-600 border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name={`tier-${priceList.id}`}
                              checked={priceList.selectedTier === 'trade3'}
                              onChange={() => {
                                const newPriceLists = [...formData.priceLists];
                                newPriceLists[index].selectedTier = 'trade3';
                                setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                              }}
                              className="w-5 h-5 text-blue-600 border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name={`tier-${priceList.id}`}
                              checked={priceList.selectedTier === 'retail'}
                              onChange={() => {
                                const newPriceLists = [...formData.priceLists];
                                newPriceLists[index].selectedTier = 'retail';
                                setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                              }}
                              className="w-5 h-5 text-blue-600 border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    const dropdownKey = `markup-${priceList.id}`;
                                    setShowMarkupDropdowns(prev => ({
                                      ...prev,
                                      [dropdownKey]: !prev[dropdownKey]
                                    }));
                                  }}
                                  className="flex items-center justify-between px-2 py-1 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 w-12"
                                >
                                  <span className="text-gray-900">{priceList.markupDiscount >= 0 ? '+' : '-'}</span>
                                  <ChevronDownIcon className={`w-3 h-3 transition-transform ${showMarkupDropdowns[`markup-${priceList.id}`] ? 'rotate-180' : ''}`} />
                                </button>
                                {showMarkupDropdowns[`markup-${priceList.id}`] && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <button
                                      onClick={() => {
                                        const newPriceLists = [...formData.priceLists];
                                        const currentValue = Math.abs(newPriceLists[index].markupDiscount);
                                        newPriceLists[index].markupDiscount = currentValue;
                                        setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                                        setShowMarkupDropdowns(prev => ({ ...prev, [`markup-${priceList.id}`]: false }));
                                      }}
                                      className="w-full px-2 py-1 text-center hover:bg-gray-50 first:rounded-t-lg text-green-600 font-medium"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newPriceLists = [...formData.priceLists];
                                        const currentValue = Math.abs(newPriceLists[index].markupDiscount);
                                        newPriceLists[index].markupDiscount = -currentValue;
                                        setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                                        setShowMarkupDropdowns(prev => ({ ...prev, [`markup-${priceList.id}`]: false }));
                                      }}
                                      className="w-full px-2 py-1 text-center hover:bg-gray-50 last:rounded-b-lg text-red-600 font-medium"
                                    >
                                      -
                                    </button>
                                  </div>
                                )}
                              </div>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={Math.abs(priceList.markupDiscount)}
                                onChange={(e) => {
                                  const newPriceLists = [...formData.priceLists];
                                  const value = parseFloat(e.target.value) || 0;
                                  const isPositive = newPriceLists[index].markupDiscount >= 0;
                                  newPriceLists[index].markupDiscount = isPositive ? value : -value;
                                  setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                                }}
                                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                const newPriceLists = formData.priceLists.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, priceLists: newPriceLists }));
                              }}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Account Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accounting Terms</label>
                    <button
                      onClick={() => setShowAccountingTermsDropdown(!showAccountingTermsDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                    >
                      <span className={formData.accountDetails.accountingTerms ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.accountDetails.accountingTerms || 'Select Accounting Terms'}
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAccountingTermsDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showAccountingTermsDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              accountDetails: { ...prev.accountDetails, accountingTerms: '' }
                            }));
                            setShowAccountingTermsDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg text-gray-500"
                        >
                          Select Accounting Terms
                        </button>
                        {accountingTerms.map(term => (
                          <button
                            key={term}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                accountDetails: { ...prev.accountDetails, accountingTerms: term }
                              }));
                              setShowAccountingTermsDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Due</span>
                      <input
                        type="number"
                        value={formData.accountDetails.paymentTerms}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          accountDetails: { ...prev.accountDetails, paymentTerms: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="relative">
                        <button
                          onClick={() => setShowPaymentPeriodDropdown(!showPaymentPeriodDropdown)}
                          className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                        >
                          <span className="text-gray-900">
                            {formData.accountDetails.paymentPeriod === 'days' 
                              ? 'day(s) after the invoice date' 
                              : 'month(s) after the invoice date'
                            }
                          </span>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showPaymentPeriodDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showPaymentPeriodDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  accountDetails: { ...prev.accountDetails, paymentPeriod: 'days' }
                                }));
                                setShowPaymentPeriodDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                            >
                              day(s) after the invoice date
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  accountDetails: { ...prev.accountDetails, paymentPeriod: 'months' }
                                }));
                                setShowPaymentPeriodDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                            >
                              month(s) after the invoice date
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.accountDetails.creditLimit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        accountDetails: { ...prev.accountDetails, creditLimit: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.accountDetails.availableLimit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        accountDetails: { ...prev.accountDetails, availableLimit: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
                    <button
                      onClick={() => setShowInvoiceTypeDropdown(!showInvoiceTypeDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-gray-900">{formData.accountDetails.invoiceType}</span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showInvoiceTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showInvoiceTypeDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['Not Applicable', 'Cash on Delivery', 'Upfront Payment', 'Account', '1st of Month'].map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                accountDetails: { ...prev.accountDetails, invoiceType: type as any }
                              }));
                              setShowInvoiceTypeDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this customer..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomer}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-white z-60 overflow-y-auto">
          <div className="min-h-full w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Location</h3>
              <button
                onClick={() => setShowAddLocationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                <button
                  onClick={() => setShowLocationTypeDropdown(!showLocationTypeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-gray-900">{formData.newLocation?.type || 'Main'}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLocationTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showLocationTypeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {['Main', 'Branch', 'PO Box', 'Others'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            newLocation: { ...prev.newLocation, type: type as any }
                          }));
                          setShowLocationTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Address Types</h4>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.newLocation?.isMailingAddress || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, isMailingAddress: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mailing Address</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.newLocation?.isBillingAddress || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, isBillingAddress: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Billing Address</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.newLocation?.isDeliveryAddress || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, isDeliveryAddress: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Delivery Address</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Level/Apt</label>
                    <input
                      type="text"
                      value={formData.newLocation?.unitNumber || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, unitNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Unit 5, Level 3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Number</label>
                    <input
                      type="text"
                      value={formData.newLocation?.streetNumber || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, streetNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 567"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                    <input
                      type="text"
                      value={addressSearchQuery || formData.newLocation?.streetName || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAddressSearchQuery(value);
                        setFormData(prev => ({
                          ...prev,
                          newLocation: { ...prev.newLocation, streetName: value }
                        }));
                      }}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowAddressSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAddressSuggestions(false), 200);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Collins Street, King Road"
                    />
                    
                    {/* Street Name Suggestions Dropdown */}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectAddress(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                          >
                            <div className="font-medium text-gray-900">{suggestion.streetName}</div>
                            <div className="text-sm text-gray-600">
                              {suggestion.city}, {suggestion.state} {suggestion.postcode}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.newLocation?.city || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.newLocation?.state || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, state: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={formData.newLocation?.postcode || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, postcode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.newLocation?.country || 'Australia'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLocation: { ...prev.newLocation, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddLocationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newLocation = {
                    id: Date.now().toString(),
                    type: formData.newLocation?.type || 'Main',
                    isMailingAddress: formData.newLocation?.isMailingAddress || false,
                    isBillingAddress: formData.newLocation?.isBillingAddress || false,
                    isDeliveryAddress: formData.newLocation?.isDeliveryAddress || false,
                    unitNumber: formData.newLocation?.unitNumber || '',
                    streetNumber: formData.newLocation?.streetNumber || '',
                    streetName: formData.newLocation?.streetName || '',
                    city: formData.newLocation?.city || '',
                    state: formData.newLocation?.state || '',
                    postcode: formData.newLocation?.postcode || '',
                    country: formData.newLocation?.country || 'Australia'
                  };
                  setFormData(prev => ({
                    ...prev,
                    locations: [...prev.locations, newLocation],
                    newLocation: {}
                  }));
                  setShowAddLocationModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Additional Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-white z-60 overflow-y-auto">
          <div className="min-h-full w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Additional Contact</h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.newContact?.firstName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, firstName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.newContact?.lastName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, lastName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.newContact?.email || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landline</label>
                <input
                  type="tel"
                  value={formData.newContact?.landline || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, landline: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input
                  type="tel"
                  value={formData.newContact?.fax || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, fax: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  value={formData.newContact?.mobile || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newContact: { ...prev.newContact, mobile: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!formData.newContact?.firstName || !formData.newContact?.lastName) {
                    alert('Please fill in first name and last name');
                    return;
                  }
                  
                  const newContact = {
                    id: Date.now().toString(),
                    firstName: formData.newContact.firstName,
                    lastName: formData.newContact.lastName,
                    email: formData.newContact.email || '',
                    landline: formData.newContact.landline || '',
                    fax: formData.newContact.fax || '',
                    mobile: formData.newContact.mobile || ''
                  };
                  setFormData(prev => ({
                    ...prev,
                    additionalContacts: [...prev.additionalContacts, newContact],
                    newContact: {}
                  }));
                  setShowAddContactModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-white z-60 overflow-y-auto">
          <div className="min-h-full w-full p-6 flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Customer Notes</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedCustomerNotes || 'No notes available for this customer.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {showConfirmCancel && (
        <div className="fixed inset-0 bg-white z-70 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Cancel</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel? All unsaved changes will be lost.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowConfirmCancel(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                No, Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowConfirmCancel(false);
                  setShowAddCustomerModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerManagement;