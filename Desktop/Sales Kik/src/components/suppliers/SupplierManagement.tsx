import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, PhoneIcon, 
  EnvelopeIcon, MapPinIcon, PencilIcon, EyeIcon,
  BuildingOfficeIcon, UserIcon, TagIcon, ClockIcon,
  ChevronDownIcon, XMarkIcon, TrashIcon, CheckIcon,
  DocumentTextIcon, ShoppingCartIcon, ArrowDownTrayIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { dataService } from '../../services/api.service';

interface Supplier {
  id: string;
  name: string;
  supplierType: string;
  accountingId: string;
  salesRepId: string;
  salesRepName: string;
  abnNumber: string;
  phone: string;
  email: string;
  primaryContact: SupplierContact;
  locations: SupplierLocation[];
  additionalContacts: SupplierContact[];
  priceLists: PriceListItem[];
  accountDetails: AccountDetails;
  status: 'active' | 'inactive';
  createdAt: Date;
  notes: string;
}

interface SupplierContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  landline?: string;
  fax?: string;
  mobile?: string;
}

interface SupplierLocation {
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
  color: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  level: number;
  sortOrder: number;
}

export function SupplierManagement() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedSupplierNotes, setSelectedSupplierNotes] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountingTerms, setAccountingTerms] = useState<string[]>([]);
  const [accountingSettings, setAccountingSettings] = useState({
    accountingSoftware: null as 'XERO' | 'MYOB' | 'QUICKBOOKS' | null,
    isConnected: false,
    availableAccountCodes: [] as { name: string; code: string; imported: boolean }[]
  });
  
  const supplierTypes = [
    'Manufacturer',
    'Wholesaler',
    'Distributor',
    'Service Provider',
    'Contractor',
    'Consultant',
    'Other'
  ];


  // Search and filter states
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState('all');

  // Form data for new/edit supplier
  const [formData, setFormData] = useState({
    supplierDetails: {
      name: '',
      mobile: '',
      email: '',
      accountingId: ''
    },
    primaryContact: {
      firstName: '',
      lastName: '',
      position: '',
      email: '',
      landline: '',
      fax: '',
      mobile: ''
    },
    locations: [] as SupplierLocation[],
    additionalContacts: [] as SupplierContact[],
    supplierTypes: {
      service: false,
      product: false,
      courier: false
    },
    selectedProducts: [] as string[]
  });

  // Additional states for the modal
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [newLocation, setNewLocation] = useState({
    type: 'Main' as const,
    isMailingAddress: true,
    isBillingAddress: true,
    isDeliveryAddress: true,
    unitNumber: '',
    streetNumber: '',
    streetName: '',
    city: '',
    state: 'NSW',
    postcode: '',
    country: 'Australia'
  });

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    landline: '',
    fax: '',
    mobile: ''
  });

  // Product selection states
  const [products, setProducts] = useState([]);
  const [productSearchKeyword, setProductSearchKeyword] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState([]);

  // Load data from database API
  const loadData = async () => {
    try {
      console.log('🏭 SupplierManagement: Loading suppliers from database...');
      
      // Load suppliers from database
      const suppliersData = await dataService.suppliers.getAll();
      console.log('✅ SupplierManagement: Loaded suppliers:', suppliersData.length);
      setSuppliers(suppliersData);
      
      // Load categories from database (same as Product Management)
      try {
        const categoriesData = await dataService.categories.getAll();
        setCategories(categoriesData);
      } catch (error) {
        console.warn('Categories API unavailable, using localStorage fallback');
        const savedCategories = localStorage.getItem('saleskik-categories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        }
      }
      
      // Load accounting settings from localStorage
      const savedAccountingSettings = localStorage.getItem('saleskik-accounting-settings');
      if (savedAccountingSettings) {
        const parsedSettings = JSON.parse(savedAccountingSettings);
        setAccountingSettings({
          accountingSoftware: parsedSettings.accountingSoftware,
          isConnected: parsedSettings.isConnected,
          availableAccountCodes: parsedSettings.availableAccountCodes || []
        });
      }
    } catch (error) {
      console.error('❌ SupplierManagement: Error loading data:', error);
      // Fallback to localStorage for suppliers if database fails
      const savedSuppliers = localStorage.getItem('saleskik-suppliers');
      if (savedSuppliers) {
        console.log('📁 SupplierManagement: Using localStorage fallback for suppliers');
        setSuppliers(JSON.parse(savedSuppliers));
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set sample employees and products (these will be replaced with API calls later)
    const sampleEmployees: Employee[] = [
      { id: '1', firstName: 'John', lastName: 'Smith', hasSalesPermission: true },
      { id: '2', firstName: 'Jane', lastName: 'Doe', hasSalesPermission: true },
      { id: '3', firstName: 'Bob', lastName: 'Wilson', hasSalesPermission: false }
    ];

    const sampleProducts = [
      {
        id: '1',
        code: '12F-100',
        name: '1175 x 100 mm - 12mm Clear Toughened Glass',
        size: '1175 x 100 mm',
        weight: 5.2,
        cost: 45.00,
        priceT1: 67.50,
        priceT2: 58.50,
        priceT3: 49.50,
        priceN: 40.50,
        categoryId: 'glass-pool',
        categoryName: 'Pool Fencing Glass',
        subcategoryPath: [{ id: 'frameless', name: 'Frameless', level: 0, color: '#3B82F6' }],
        inventory: { currentStock: 25, reorderPoint: 5, supplier: 'ABC Glass Supplies' },
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2', 
        code: '15F-150',
        name: '1500 x 150 mm - 15mm Clear Toughened Glass',
        size: '1500 x 150 mm',
        weight: 8.1,
        cost: 72.00,
        priceT1: 108.00,
        priceT2: 93.60,
        priceT3: 79.20,
        priceN: 64.80,
        categoryId: 'glass-pool',
        categoryName: 'Pool Fencing Glass',
        subcategoryPath: [{ id: 'frameless', name: 'Frameless', level: 0, color: '#3B82F6' }],
        inventory: { currentStock: 18, reorderPoint: 3, supplier: 'ABC Glass Supplies' },
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        code: 'HW-001',
        name: 'Stainless Steel Pool Gate Hinge',
        size: 'Standard',
        weight: 0.5,
        cost: 15.00,
        priceT1: 22.50,
        priceT2: 19.50,
        priceT3: 16.50,
        priceN: 13.50,
        categoryId: 'hardware',
        categoryName: 'Hardware',
        subcategoryPath: [{ id: 'hinges', name: 'Hinges', level: 0, color: '#10B981' }],
        inventory: { currentStock: 50, reorderPoint: 10, supplier: 'XYZ Hardware Distributors' },
        isActive: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '4',
        code: 'HW-002',
        name: 'Gate Latch Self-Closing',
        size: 'Standard',
        weight: 0.3,
        cost: 25.00,
        priceT1: 37.50,
        priceT2: 32.50,
        priceT3: 27.50,
        priceN: 22.50,
        categoryId: 'hardware',
        categoryName: 'Hardware',
        subcategoryPath: [{ id: 'latches', name: 'Latches', level: 0, color: '#10B981' }],
        inventory: { currentStock: 35, reorderPoint: 8, supplier: 'XYZ Hardware Distributors' },
        isActive: true,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      }
    ];

    setEmployees(sampleEmployees);
    setProducts(sampleProducts);
    setAccountingTerms(['NET', 'COD', 'CIA', 'CWO', 'EOM']);
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSalesRep = selectedSalesRep === 'all' || supplier.salesRepId === selectedSalesRep;
    const matchesKeyword = keywordSearch === '' || 
      supplier.name.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      supplier.email.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      supplier.primaryContact.firstName.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      supplier.primaryContact.lastName.toLowerCase().includes(keywordSearch.toLowerCase());
    
    return matchesSalesRep && matchesKeyword;
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearchKeyword || 
      product.name.toLowerCase().includes(productSearchKeyword.toLowerCase()) ||
      product.code.toLowerCase().includes(productSearchKeyword.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(productSearchKeyword.toLowerCase());
    
    const matchesCategory = !selectedCategoryFilter || product.categoryId === selectedCategoryFilter;
    
    // Also check subcategory matching if we have selected subcategories
    const matchesSubcategory = selectedSubcategoryPath.length === 0 || 
      product.subcategoryPath.some(subcat => 
        selectedSubcategoryPath.some(selected => selected.id === subcat.id)
      );
    
    return matchesSearch && matchesCategory && matchesSubcategory && product.isActive;
  });

  const handleToggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  const handleToggleStatus = async (supplierId: string) => {
    const updatedSuppliers = suppliers.map(supplier => 
      supplier.id === supplierId 
        ? { ...supplier, status: supplier.status === 'active' ? 'inactive' : 'active' }
        : supplier
    );
    setSuppliers(updatedSuppliers);
    
    // Save to database and localStorage
    try {
      await dataService.suppliers.save(updatedSuppliers);
      console.log('✅ Supplier status updated successfully');
    } catch (error) {
      console.error('❌ Failed to update supplier status:', error);
      // Revert on error
      setSuppliers(suppliers);
    }
  };

  const downloadSupplierList = () => {
    const csvContent = [
      ['Supplier Name', 'Supplier Type', 'Primary Contact', 'Primary Email', 'Status'],
      ...filteredSuppliers.map(supplier => [
        supplier.name,
        supplier.supplierType,
        `${supplier.primaryContact.firstName} ${supplier.primaryContact.lastName}`,
        supplier.primaryContact.email || supplier.email,
        supplier.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'suppliers.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="suppliers"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
        <UniversalHeader 
          title="Supplier Management" 
          onMenuToggle={() => setShowSidebar(true)}
        />

        <div className="p-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Supplier
              </button>
              
              <button
                onClick={downloadSupplierList}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download List
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              <select
                value={selectedSalesRep}
                onChange={(e) => setSelectedSalesRep(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sales Reps</option>
                {employees.filter(emp => emp.hasSalesPermission).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Supplier Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Supplier Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Primary Contact</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Primary Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-6 py-4 text-gray-600">{supplier.supplierType}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.primaryContact.firstName} {supplier.primaryContact.lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.primaryContact.email || supplier.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSupplierNotes(supplier.notes);
                              setShowNotesModal(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="View Notes"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setShowAddSupplierModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                            title="Edit Supplier"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(supplier.id)}
                            className={`p-1 rounded ${
                              supplier.status === 'active'
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                            title={supplier.status === 'active' ? 'Deactivate Supplier' : 'Reactivate Supplier'}
                          >
                            {supplier.status === 'active' ? (
                              <XMarkIcon className="w-4 h-4" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSuppliers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No suppliers found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Supplier Notes</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
              {selectedSupplierNotes || 'No notes available for this supplier.'}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-full w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setEditingSupplier(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8 relative">
              {/* Supplier Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supplierDetails.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierDetails: { ...prev.supplierDetails, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.supplierDetails.mobile}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierDetails: { ...prev.supplierDetails, mobile: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.supplierDetails.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierDetails: { ...prev.supplierDetails, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accounting ID
                    </label>
                    {accountingSettings.isConnected && accountingSettings.accountingSoftware ? (
                      <select
                        value={formData.supplierDetails.accountingId}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplierDetails: { ...prev.supplierDetails, accountingId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Account Code</option>
                        {accountingSettings.availableAccountCodes.map(account => (
                          <option key={account.code} value={account.code}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-between">
                        <span>No accounting software connected</span>
                        <button
                          onClick={() => window.open('/admin/company/accounting-settings', '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Connect Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Contact Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.primaryContact.position}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, position: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landline
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                  <button
                    onClick={() => setShowLocationForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Address
                  </button>
                </div>
                
                {formData.locations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {formData.locations.map((location, index) => (
                        <div key={index} className="bg-white p-3 rounded border flex justify-between items-start">
                          <div>
                            <div className="font-medium">{location.type} Address</div>
                            <div className="text-sm text-gray-600">
                              {location.unitNumber && `${location.unitNumber}/`}
                              {location.streetNumber} {location.streetName}, {location.city}, {location.state} {location.postcode}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingLocationIndex(index);
                                setNewLocation(location);
                                setShowLocationForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  locations: prev.locations.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Contacts Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Contacts</h3>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Additional Contact
                  </button>
                </div>

                {formData.additionalContacts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Position</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mobile</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.additionalContacts.map((contact, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-2">{contact.firstName} {contact.lastName}</td>
                            <td className="px-4 py-2">{contact.position || '-'}</td>
                            <td className="px-4 py-2">{contact.email || '-'}</td>
                            <td className="px-4 py-2">{contact.mobile || '-'}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingContactIndex(index);
                                    setNewContact(contact);
                                    setShowContactForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Supplier Type Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Type</h3>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supplierTypes.service}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierTypes: { ...prev.supplierTypes, service: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Service</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supplierTypes.product}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierTypes: { ...prev.supplierTypes, product: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Product</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supplierTypes.courier}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        supplierTypes: { ...prev.supplierTypes, courier: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Courier</span>
                  </label>
                </div>
              </div>

              {/* Product Selection Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Selection</h3>
                
                {/* Enhanced Product Search and Cascading Filters */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100 p-6 mb-4 shadow-lg relative overflow-visible">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        🔍 Filter Products
                      </h4>
                      <p className="text-gray-600 text-sm">Find products to associate with this supplier</p>
                    </div>
                    
                    {/* Search bar in top right */}
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearchKeyword}
                        onChange={(e) => setProductSearchKeyword(e.target.value)}
                        className="w-64 px-4 py-2 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                        placeholder="Search by name, code..."
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-6">
                    {/* Category and Subcategory Filters */}
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-h-16">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-gray-700">Category:</label>
                        <CustomDropdown
                          label=""
                          value={selectedCategoryFilter}
                          placeholder="All Categories"
                          options={[
                            { value: '', label: 'All Categories' },
                            ...categories.map(cat => ({
                              value: cat.id,
                              label: cat.name
                            }))
                          ]}
                          onChange={(value) => {
                            setSelectedCategoryFilter(value);
                            setSelectedSubcategoryPath([]);
                          }}
                          disabled={false}
                          isLast={false}
                        />
                      </div>

                      {/* Inline Subcategory Filters */}
                      {selectedCategoryFilter && (
                        <SubcategoryBreadcrumbFilter 
                          category={categories.find(c => c.id === selectedCategoryFilter)}
                          selectedPath={selectedSubcategoryPath}
                          onPathChange={setSelectedSubcategoryPath}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Products Summary */}
                {formData.selectedProducts.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      {formData.selectedProducts.length} product{formData.selectedProducts.length !== 1 ? 's' : ''} selected for this supplier
                    </p>
                  </div>
                )}

                {/* Products Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            <input
                              type="checkbox"
                              checked={filteredProducts.length > 0 && filteredProducts.every(p => formData.selectedProducts.includes(p.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedProducts: [...new Set([...prev.selectedProducts, ...filteredProducts.map(p => p.id)])]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedProducts: prev.selectedProducts.filter(id => !filteredProducts.map(p => p.id).includes(id))
                                  }));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            Product Code
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            Size
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                            Cost
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">
                            Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center">
                              <CubeIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">No products found matching your criteria</p>
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((product, index) => (
                            <tr key={product.id} className={`hover:bg-blue-25 border-b border-gray-100 transition-colors duration-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}>
                              <td className="px-4 py-3 border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedProducts.includes(product.id)}
                                  onChange={() => handleToggleProductSelection(product.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-bold border-r border-gray-200">
                                {product.code}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium border-r border-gray-200">
                                {product.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                                {product.size || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm border-r border-gray-200">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  product.categoryId === 'glass-pool' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.categoryName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium border-r border-gray-200">
                                ${product.cost.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  product.inventory.currentStock <= product.inventory.reorderPoint
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.inventory.currentStock}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setEditingSupplier(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🏭 Saving supplier:', formData.supplierDetails.name);
                    
                    // Create supplier object from form data
                    const supplierData = {
                      id: editingSupplier?.id || `supplier-${Date.now()}`,
                      name: formData.supplierDetails.name,
                      supplierType: 'Product', // Default type based on form
                      accountingId: formData.supplierDetails.accountingId,
                      salesRepId: '1', // Default sales rep
                      salesRepName: 'John Smith',
                      abnNumber: '',
                      phone: formData.supplierDetails.mobile,
                      email: formData.supplierDetails.email,
                      primaryContact: {
                        id: `contact-${Date.now()}`,
                        firstName: formData.primaryContact.firstName,
                        lastName: formData.primaryContact.lastName,
                        email: formData.primaryContact.email,
                        landline: formData.primaryContact.landline,
                        fax: formData.primaryContact.fax,
                        mobile: formData.primaryContact.mobile
                      },
                      locations: formData.locations,
                      additionalContacts: formData.additionalContacts,
                      priceLists: [],
                      accountDetails: {
                        accountingTerms: 'NET',
                        paymentTerms: 30,
                        paymentPeriod: 'days' as const,
                        creditLimit: 50000,
                        availableLimit: 50000,
                        invoiceType: 'Account' as const
                      },
                      status: 'active' as const,
                      createdAt: new Date(),
                      notes: ''
                    };

                    if (editingSupplier) {
                      // Update existing supplier
                      const updatedSuppliers = suppliers.map(s => 
                        s.id === editingSupplier.id ? { ...supplierData, id: editingSupplier.id } : s
                      );
                      setSuppliers(updatedSuppliers);
                      await dataService.suppliers.save(updatedSuppliers);
                      console.log('✅ Supplier updated successfully');
                    } else {
                      // Create new supplier
                      const createdSupplier = await dataService.suppliers.create(supplierData);
                      setSuppliers(prev => [createdSupplier, ...prev]);
                      console.log('✅ Supplier created successfully');
                    }
                    
                    // Refresh the suppliers list from database
                    await loadData();
                    
                    setShowAddSupplierModal(false);
                    setEditingSupplier(null);
                    
                    // Reset form
                    setFormData({
                      supplierDetails: { name: '', mobile: '', email: '', accountingId: '' },
                      primaryContact: { firstName: '', lastName: '', position: '', email: '', landline: '', fax: '', mobile: '' },
                      locations: [],
                      additionalContacts: [],
                      supplierTypes: { service: false, product: false, courier: false },
                      selectedProducts: []
                    });
                    
                  } catch (error) {
                    console.error('❌ Failed to save supplier:', error);
                    alert('Failed to save supplier. Please try again.');
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingLocationIndex !== null ? 'Edit Address' : 'Add Address'}
              </h3>
              <button
                onClick={() => {
                  setShowLocationForm(false);
                  setEditingLocationIndex(null);
                  setNewLocation({
                    type: 'Main',
                    isMailingAddress: true,
                    isBillingAddress: true,
                    isDeliveryAddress: true,
                    unitNumber: '',
                    streetNumber: '',
                    streetName: '',
                    city: '',
                    state: 'NSW',
                    postcode: '',
                    country: 'Australia'
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Main">Main</option>
                  <option value="Branch">Branch</option>
                  <option value="PO Box">PO Box</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                <input
                  type="text"
                  value={newLocation.unitNumber}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, unitNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Number</label>
                <input
                  type="text"
                  value={newLocation.streetNumber}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, streetNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  type="text"
                  value={newLocation.streetName}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, streetName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={newLocation.state}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="ACT">ACT</option>
                  <option value="NT">NT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  value={newLocation.postcode}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, postcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={newLocation.country}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Address Usage</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLocation.isMailingAddress}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, isMailingAddress: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mailing Address</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLocation.isBillingAddress}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, isBillingAddress: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Billing Address</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLocation.isDeliveryAddress}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, isDeliveryAddress: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Delivery Address</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowLocationForm(false);
                  setEditingLocationIndex(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingLocationIndex !== null) {
                    setFormData(prev => ({
                      ...prev,
                      locations: prev.locations.map((loc, i) => 
                        i === editingLocationIndex ? { ...newLocation, id: `location-${Date.now()}` } : loc
                      )
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      locations: [...prev.locations, { ...newLocation, id: `location-${Date.now()}` }]
                    }));
                  }
                  setShowLocationForm(false);
                  setEditingLocationIndex(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingLocationIndex !== null ? 'Update Address' : 'Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingContactIndex !== null ? 'Edit Contact' : 'Add Additional Contact'}
              </h3>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setEditingContactIndex(null);
                  setNewContact({
                    firstName: '',
                    lastName: '',
                    position: '',
                    email: '',
                    landline: '',
                    fax: '',
                    mobile: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={newContact.position}
                  onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landline</label>
                <input
                  type="tel"
                  value={newContact.landline}
                  onChange={(e) => setNewContact(prev => ({ ...prev, landline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input
                  type="tel"
                  value={newContact.fax}
                  onChange={(e) => setNewContact(prev => ({ ...prev, fax: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  value={newContact.mobile}
                  onChange={(e) => setNewContact(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setEditingContactIndex(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const contactWithId = { ...newContact, id: `contact-${Date.now()}` };
                  if (editingContactIndex !== null) {
                    setFormData(prev => ({
                      ...prev,
                      additionalContacts: prev.additionalContacts.map((contact, i) => 
                        i === editingContactIndex ? contactWithId : contact
                      )
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      additionalContacts: [...prev.additionalContacts, contactWithId]
                    }));
                  }
                  setShowContactForm(false);
                  setEditingContactIndex(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Dropdown Component (from ProductManagement)
interface CustomDropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomDropdownProps {
  label?: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isLast?: boolean;
}

function CustomDropdown({ 
  label, 
  required, 
  value, 
  placeholder, 
  options, 
  onChange, 
  disabled,
  isLast 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
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
      <div className="w-48 px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="min-w-56 w-auto relative">
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
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-[9999] min-w-full w-max max-h-60 overflow-y-auto"
        >
          <div className="py-2">
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

// Subcategory Breadcrumb Filter Component (from ProductManagement)
function SubcategoryBreadcrumbFilter({ category, selectedPath, onPathChange }: {
  category: Category | undefined;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  if (!category) return null;

  // Get available subcategories for a specific level and parent
  const getSubcategoriesForLevel = (level: number, parentId?: string) => {
    return category.subcategories
      .filter(sub => sub.level === level && sub.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Handle selection at a specific level
  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (subcategory) {
      const newPath = selectedPath.slice(0, level).concat([{
        id: subcategory.id,
        name: subcategory.name,
        level: subcategory.level || level,
        color: subcategory.color
      }]);
      onPathChange(newPath);
    }
  };

  // Get the maximum level
  const getMaxLevel = () => {
    return Math.max(0, ...category.subcategories.map(sub => sub.level || 0));
  };

  // Render breadcrumb-style navigation
  const renderBreadcrumbLevels = () => {
    const levels = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesForLevel(level, parentId);
      
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        const isEnabled = level === 0 || selectedPath[level - 1];
        
        levels.push(
          <React.Fragment key={level}>
            {level > 0 && <div className="w-px h-8 bg-gray-300 mx-2"></div>}
            <CustomDropdown
              label=""
              value={currentSelection?.id || ''}
              placeholder="All Subcategories"
              options={subcategoriesAtLevel.map(sub => ({
                value: sub.id,
                label: sub.name,
                color: sub.color
              }))}
              onChange={(value) => handleSelectionAtLevel(level, value)}
              disabled={!isEnabled}
              isLast={level === maxLevel}
            />
          </React.Fragment>
        );
      }
    }
    
    return levels;
  };

  return (
    <div className="flex items-center gap-2">
      {renderBreadcrumbLevels()}
      
      {/* Clear button */}
      {selectedPath.length > 0 && (
        <button
          onClick={() => onPathChange([])}
          className="px-2 py-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium border border-blue-200 ml-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}