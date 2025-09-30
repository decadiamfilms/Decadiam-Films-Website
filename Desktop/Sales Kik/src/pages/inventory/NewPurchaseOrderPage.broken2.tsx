import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, BuildingOfficeIcon,
  ChevronDownIcon, InformationCircleIcon, CubeIcon,
  ShoppingCartIcon, DocumentTextIcon, CalendarIcon,
  TagIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, 
  EyeIcon, CheckIcon, ExclamationTriangleIcon,
  TrashIcon, MinusIcon, QuestionMarkCircleIcon,
  ClipboardDocumentListIcon, StarIcon, ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumber: string;
  paymentTerms: string;
  isLocalGlassSupplier: boolean;
  isApprovedSupplier: boolean;
  performanceRating: number;
  totalOrdersCount: number;
  status: 'active' | 'inactive';
  notes: string;
}

interface Customer {
  id: string;
  customerName: string;
  customerReference?: string;
  email: string;
  phone: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  costPrice: number;
  currentStock: number;
  categoryName: string;
  isActive: boolean;
  isCustomGlass?: boolean;
}

interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  customModuleFlag: boolean;
}

function SupplierSearch({ value, onChange }: { value: Supplier | null; onChange: (supplier: Supplier | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const mockSuppliers: Supplier[] = [
      {
        id: '1',
        supplierName: 'Sydney Glass Co',
        supplierCode: 'SYD001',
        contactPerson: 'Tony Williams',
        emailAddress: 'orders@sydneyglass.com.au',
        phoneNumber: '+61 2 9555 0123',
        paymentTerms: '30 days',
        isLocalGlassSupplier: true,
        isApprovedSupplier: true,
        performanceRating: 4.8,
        totalOrdersCount: 24,
        status: 'active',
        notes: 'Premium glass supplier'
      },
      {
        id: '2',
        supplierName: 'Hardware Direct',
        supplierCode: 'HRD001',
        contactPerson: 'Sarah Chen',
        emailAddress: 'purchasing@hardwaredirect.com.au',
        phoneNumber: '+61 2 9666 0456',
        paymentTerms: '14 days',
        isLocalGlassSupplier: false,
        isApprovedSupplier: true,
        performanceRating: 4.2,
        totalOrdersCount: 18,
        status: 'active',
        notes: 'Reliable general hardware'
      }
    ];
    
    setSuppliers(mockSuppliers);
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.supplierName : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? value.supplierName : "Search suppliers..."}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredSuppliers.length === 0 ? (
            <div className="p-4 text-gray-500 text-center text-base">
              No suppliers found. <a href="/admin/suppliers" className="text-blue-600 hover:underline">Manage suppliers</a>
            </div>
          ) : (
            filteredSuppliers.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => {
                  onChange(supplier);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-base flex items-center gap-2">
                      {supplier.supplierName}
                      {supplier.isLocalGlassSupplier && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Glass Specialist</span>
                      )}
                    </div>
                    <div className="text-base text-gray-500">{supplier.emailAddress}</div>
                    <div className="text-base text-gray-400">
                      Contact: {supplier.contactPerson} • Rating: {supplier.performanceRating}/5
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CustomerSearch({ value, onChange }: { value: Customer | null; onChange: (customer: Customer | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        customerName: 'Johnson Construction',
        customerReference: 'Site Office Glass Project',
        email: 'john@johnsonconstruction.com.au',
        phone: '+61 2 9123 4567'
      },
      {
        id: '2',
        customerName: 'Metro Building Corp',
        customerReference: 'Tower Project - Floor 15',
        email: 'projects@metrobuilding.com.au',
        phone: '+61 2 9234 5678'
      }
    ];
    
    setCustomers(mockCustomers);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customerReference?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.customerName : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? value.customerName : "Search customers..."}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              onClick={() => {
                onChange(customer);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900 text-base">{customer.customerName}</div>
              <div className="text-base text-gray-500">{customer.email}</div>
              {customer.customerReference && (
                <div className="text-sm text-gray-400">{customer.customerReference}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  
  const orderSteps = ['Customer & Supplier', 'Add Products', 'Review & Submit'];
  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [poNumber] = useState(() => `PO-2025-${String(Date.now()).slice(-5)}`);
  
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [quantities, setQuantities] = useState<{[key: string]: number | string}>({});
  const [skuSearch, setSkuSearch] = useState('');
  
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);
  
  useEffect(() => {
    if (selectedCustomer && selectedSupplier && currentStep < 2) {
      setCurrentStep(2); // Move to products when both customer and supplier are selected
    }
    if ((!selectedCustomer || !selectedSupplier) && currentStep > 1) {
      setCurrentStep(1); // Back to customer & supplier selection
    }
  }, [selectedCustomer, selectedSupplier]);

  useEffect(() => {
    const hasCustomGlass = lineItems.some(item => item.customModuleFlag);
    if (hasCustomGlass && !selectedSupplier) {
      const glassSupplier: Supplier = {
        id: '1',
        supplierName: 'Sydney Glass Co',
        supplierCode: 'SYD001',
        contactPerson: 'Tony Williams',
        emailAddress: 'orders@sydneyglass.com.au',
        phoneNumber: '+61 2 9555 0123',
        paymentTerms: '30 days',
        isLocalGlassSupplier: true,
        isApprovedSupplier: true,
        performanceRating: 4.8,
        totalOrdersCount: 24,
        status: 'active',
        notes: 'Auto-selected for custom glass'
      };
      setSelectedSupplier(glassSupplier);
    }
  }, [lineItems, selectedSupplier]);

  useEffect(() => {
    const total = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    setTotalAmount(total);
    setApprovalRequired(total > 2000);
  }, [lineItems]);

  const loadProducts = () => {
    const mockProducts: Product[] = [
      {
        id: '1',
        code: 'GLASS-10MM-TEMP',
        name: '10mm Tempered Glass Panel',
        description: 'High-quality tempered glass panel',
        costPrice: 285.00,
        currentStock: 12,
        categoryName: 'Glass Products',
        isActive: true,
        isCustomGlass: true
      },
      {
        id: '2',
        code: 'STEEL-BRKT-HD',
        name: 'Steel Bracket - Heavy Duty',
        description: 'Industrial grade steel bracket',
        costPrice: 45.00,
        currentStock: 150,
        categoryName: 'Hardware',
        isActive: true,
        isCustomGlass: false
      }
    ];
    
    setProducts(mockProducts);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(skuSearch.toLowerCase())
  );

  const addProductToOrder = (product: Product) => {
    const quantity = Number(quantities[product.id]) || 1;
    const existingItem = lineItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      setLineItems(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, totalCost: (item.quantity + quantity) * item.unitCost }
          : item
      ));
    } else {
      const newItem: PurchaseOrderLineItem = {
        id: Date.now().toString(),
        productId: product.id,
        product,
        quantity,
        unitCost: product.costPrice,
        totalCost: quantity * product.costPrice,
        customModuleFlag: product.isCustomGlass || false
      };
      setLineItems(prev => [...prev, newItem]);
    }
    
    setQuantities(prev => ({ ...prev, [product.id]: '' }));
    setSkuSearch('');
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItemQuantity = (id: string, newQuantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity, totalCost: newQuantity * item.unitCost }
        : item
    ));
  };

  const handleSubmitOrder = () => {
    const orderData = {
      poNumber,
      customer: selectedCustomer,
      supplier: selectedSupplier,
      customerReference: referenceNumber,
      projectName,
      lineItems,
      priority,
      expectedDelivery,
      specialInstructions,
      totalAmount,
      approvalRequired,
      status: approvalRequired ? 'pending_approval' : 'approved',
      createdBy: 'Sarah Peterson',
      orderDate: new Date().toISOString().split('T')[0],
      lineItemCount: lineItems.length,
      invoiceRequired: true,
      invoiceCreated: false,
      dispatchBlocked: true,
      attachmentCount: 0
    };

    alert(`Purchase Order ${poNumber} created successfully! ${approvalRequired ? 'Sent for manager approval.' : 'Ready to send to supplier.'}`);
    navigate('/inventory/purchase-orders');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Create Purchase Order"
        subtitle="New procurement order following your 8-step workflow"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 max-w-7xl mx-auto">
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">New Purchase Order</h1>
            <div className="text-lg text-gray-600">
              Order: <span className="font-semibold text-blue-600">{poNumber}</span>
            </div>
          </div>
          
          <div className="flex items-center mb-8">
            {orderSteps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  index + 1 === currentStep ? 'bg-blue-600 text-white' :
                  index + 1 < currentStep ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                <div className={`ml-3 text-sm font-medium ${
                  index + 1 <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step}
                </div>
                {index < orderSteps.length - 1 && (
                  <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
                    <div className={`h-1 rounded transition-all duration-300 ${
                      index + 1 < currentStep ? 'bg-green-600 w-full' :
                      index + 1 === currentStep ? 'bg-blue-600 w-1/2' :
                      'bg-gray-200 w-0'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            
            {/* Step 1: Customer & Supplier Selection */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Customer & Supplier Information</h2>
                <p className="text-gray-600 mb-6">Select the customer and supplier for this purchase order</p>
                
                <div className="space-y-8">
                  {/* Customer and Supplier Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">
                        Customer *
                        <span className="text-sm font-normal text-gray-500 ml-2">(Who is this order for?)</span>
                      </label>
                      <CustomerSearch
                        value={selectedCustomer}
                        onChange={setSelectedCustomer}
                      />
                      
                      {selectedCustomer && (
                        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900">{selectedCustomer.customerName}</span>
                          </div>
                          {selectedCustomer.customerReference && (
                            <div className="text-sm text-green-700 mt-1">{selectedCustomer.customerReference}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">
                        Supplier *
                        <span className="text-sm font-normal text-gray-500 ml-2">(Who will fulfill this order?)</span>
                      </label>
                      <SupplierSearch
                        value={selectedSupplier}
                        onChange={setSelectedSupplier}
                      />
                      
                      {selectedSupplier && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900">{selectedSupplier.supplierName}</span>
                            {selectedSupplier.isLocalGlassSupplier && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Glass Specialist</span>
                            )}
                          </div>
                          <div className="text-sm text-blue-700 mt-1">
                            Contact: {selectedSupplier.contactPerson} • Rating: {selectedSupplier.performanceRating}/5 ⭐
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">Project Name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., Site Office Glass Installation"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">Reference Number</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Customer job number, project code..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedCustomer || !selectedSupplier}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                    >
                      Next: Add Products
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Product Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Add Products</h2>
                  
                  <div className="mb-6">
                    <label className="block text-lg font-medium text-gray-700 mb-3">Search Products</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={skuSearch}
                        onChange={(e) => setSkuSearch(e.target.value)}
                        placeholder="Search by product name or SKU..."
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      />
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    </div>
                  </div>

                  {skuSearch && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {filteredProducts.slice(0, 6).map(product => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                {product.name}
                                {product.isCustomGlass && (
                                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Custom Glass</span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">SKU: {product.code}</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">${product.costPrice.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={quantities[product.id] || ''}
                              onChange={(e) => setQuantities(prev => ({ ...prev, [product.id]: e.target.value }))}
                              placeholder="Qty"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-base"
                            />
                            <button
                              onClick={() => addProductToOrder(product)}
                              disabled={!quantities[product.id]}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                              Add to Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {lineItems.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900">Order Line Items</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Unit Cost</th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                            <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lineItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-8 py-6">
                                <div>
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    {item.product.name}
                                    {item.customModuleFlag && (
                                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Custom Glass</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">SKU: {item.product.code}</div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-lg font-semibold text-gray-900">${item.unitCost.toFixed(2)}</span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-lg font-bold text-gray-900">${item.totalCost.toFixed(2)}</span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => removeLineItem(item.id)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-6">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">Total: ${totalAmount.toFixed(2)}</span>
                        {approvalRequired && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            <span className="font-medium">Approval Required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Back: Customer & Supplier
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={lineItems.length === 0}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Next: Review Order
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 3: Review & Submit Order</h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">Expected Delivery Date *</label>
                      <input
                        type="date"
                        value={expectedDelivery}
                        onChange={(e) => setExpectedDelivery(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">Priority Level</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'normal' | 'high' | 'urgent')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High (Customer waiting)</option>
                        <option value="urgent">Urgent (Rush order)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">Special Instructions</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Handle with extra care - customer installation..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div><strong>Customer:</strong> {selectedCustomer?.customerName}</div>
                      <div><strong>Supplier:</strong> {selectedSupplier?.supplierName}</div>
                      <div><strong>Project:</strong> {projectName || 'Not specified'}</div>
                      <div><strong>Reference:</strong> {referenceNumber || 'Not specified'}</div>
                      <div><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</div>
                      <div><strong>Line Items:</strong> {lineItems.length}</div>
                      <div><strong>Priority:</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
                      <div><strong>Expected Delivery:</strong> {expectedDelivery}</div>
                    </div>

                    {approvalRequired && (
                      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                          <div>
                            <div className="font-medium text-yellow-900">Manager Approval Required</div>
                            <div className="text-sm text-yellow-800">Order value ${totalAmount.toFixed(2)} exceeds $2,000 threshold</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-6">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Back: Add Products
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={!expectedDelivery}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {approvalRequired ? 'Submit for Approval' : 'Create Purchase Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purchase Order Number</label>
                    <p className="text-xl font-bold text-blue-600">{poNumber}</p>
                  </div>
                  
                  {selectedCustomer && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedCustomer.customerName}</p>
                      {selectedCustomer.customerReference && (
                        <p className="text-sm text-gray-600">{selectedCustomer.customerReference}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedSupplier && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Supplier</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedSupplier.supplierName}</p>
                      <p className="text-sm text-gray-600">Rating: {selectedSupplier.performanceRating}/5</p>
                    </div>
                  )}
                  
                  {lineItems.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Order Total</label>
                      <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{lineItems.length} line items</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/suppliers')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Suppliers</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/customers')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Customers</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/inventory/purchase-orders')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">View All Orders</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Purchase Order Workflow</h3>
                
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Order created {approvalRequired ? '→ Manager approval' : '→ Ready to send'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Sent to supplier → Supplier confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Goods received → Invoice required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Invoice created → Ready for dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}