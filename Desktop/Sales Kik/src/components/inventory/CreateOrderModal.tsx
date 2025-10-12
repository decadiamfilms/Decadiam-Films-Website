import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon,
  DocumentArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { dataService } from '../../services/api.service';

interface LineItem {
  id: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  unitPrice: number;
  customModuleFlag: boolean;
  total: number;
}

interface Supplier {
  id: string;
  name: string; // Database uses 'name' not 'supplierName'
  email: string;
  supplierType?: string;
  status: string;
  supplierProducts?: any[];
  primaryContact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  isLocalGlassSupplier?: boolean; // Keep for backward compatibility
  performanceRating?: number; // Keep for backward compatibility
}

interface Customer {
  id: string;
  customerName: string;
  customerReference?: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
}

export function CreateOrderModal({ isOpen, onClose, onSubmit }: CreateOrderModalProps) {
  const [step, setStep] = useState(1);
  const [orderData, setOrderData] = useState({
    customer: null as Customer | null,
    customerReference: '',
    supplier: null as Supplier | null,
    lineItems: [] as LineItem[],
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    expectedDelivery: '',
    specialInstructions: '',
    attachments: [] as File[]
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(false);
  
  // Real suppliers from database
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Mock data
  const mockCustomers: Customer[] = [
    { id: '1', customerName: 'Johnson Construction', customerReference: 'Site Office Glass' },
    { id: '2', customerName: 'Metro Building Corp', customerReference: 'Tower Project - Floor 15' },
    { id: '3', customerName: 'City Plaza Development', customerReference: 'Lobby Renovation' },
    { id: '4', customerName: 'Residential Homes Ltd' }
  ];

  // Load suppliers from database
  const loadSuppliers = async () => {
    try {
      console.log('📦 CreateOrderModal: Loading suppliers from database...');
      const suppliersData = await dataService.suppliers.getAll();
      console.log('✅ CreateOrderModal: Loaded suppliers:', suppliersData.length);
      
      // Transform suppliers to include backward compatibility fields
      const transformedSuppliers = suppliersData
        .filter(supplier => supplier.status === 'active') // Only active suppliers
        .map(supplier => ({
          ...supplier,
          isLocalGlassSupplier: supplier.supplierType === 'Manufacturer' || supplier.supplierType === 'Wholesaler',
          performanceRating: 4.5 // Default rating - could be enhanced later
        }));
      
      setSuppliers(transformedSuppliers);
      setLoadingSuppliers(false);
      console.log('✅ CreateOrderModal: Suppliers ready for selection');
    } catch (error) {
      console.error('❌ CreateOrderModal: Failed to load suppliers:', error);
      setLoadingSuppliers(false);
      // Keep empty array - user can still create orders without supplier selection
    }
  };

  const mockProducts = [
    { id: '1', name: '10mm Tempered Glass Panel', sku: 'GLASS-10MM-TEMP', price: 285.00, isCustomGlass: true },
    { id: '2', name: '12mm Tempered Glass Panel', sku: 'GLASS-12MM-TEMP', price: 380.00, isCustomGlass: true },
    { id: '3', name: 'Steel Bracket - Heavy Duty', sku: 'STEEL-BRKT-HD', price: 45.00, isCustomGlass: false },
    { id: '4', name: 'Aluminum Frame - Standard', sku: 'ALU-FRAME-STD', price: 125.00, isCustomGlass: false },
    { id: '5', name: 'Safety Glass 8mm', sku: 'GLASS-8MM-SAFE', price: 220.00, isCustomGlass: true }
  ];

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.customerReference?.toLowerCase().includes(customerSearch.toLowerCase()) || false)
  );

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalAmount = orderData.lineItems.reduce((sum, item) => sum + item.total, 0);

  // Check approval requirements
  useEffect(() => {
    setApprovalRequired(totalAmount > 2000);
  }, [totalAmount]);

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen && suppliers.length === 0 && loadingSuppliers) {
      loadSuppliers();
    }
  }, [isOpen]);

  // Auto-detect glass supplier when custom glass is added
  useEffect(() => {
    const hasCustomGlass = orderData.lineItems.some(item => item.customModuleFlag);
    if (hasCustomGlass && !orderData.supplier && suppliers.length > 0) {
      const glassSupplier = suppliers.find(s => s.isLocalGlassSupplier);
      if (glassSupplier) {
        setOrderData(prev => ({ ...prev, supplier: glassSupplier }));
      }
    }
  }, [orderData.lineItems, suppliers]);

  const addLineItem = (product: any) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      productName: product.name,
      productSku: product.sku,
      quantityOrdered: 1,
      unitPrice: product.price,
      customModuleFlag: product.isCustomGlass,
      total: product.price
    };
    
    setOrderData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
    setProductSearch('');
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setOrderData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          updated.total = updated.quantityOrdered * updated.unitPrice;
          return updated;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (id: string) => {
    setOrderData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = () => {
    const submissionData = {
      ...orderData,
      totalAmount,
      approvalRequired,
      status: approvalRequired ? 'pending_approval' : 'approved',
      poNumber: `PO-2025-${String(Date.now()).slice(-5)}`,
      createdBy: 'Sarah Peterson',
      orderDate: new Date().toISOString().split('T')[0],
      lineItemCount: orderData.lineItems.length,
      invoiceRequired: true,
      invoiceCreated: false,
      dispatchBlocked: true,
      attachmentCount: orderData.attachments.length
    };

    onSubmit(submissionData);
    onClose();
    
    // Reset form
    setOrderData({
      customer: null,
      customerReference: '',
      supplier: null,
      lineItems: [],
      priority: 'normal',
      expectedDelivery: '',
      specialInstructions: '',
      attachments: []
    });
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 4 - Follow the workflow to create your order</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step Progress */}
          <div className="flex items-center mb-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum === step ? 'bg-blue-600 text-white' :
                  stepNum < step ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum < step ? '✓' : stepNum}
                </div>
                {stepNum < 4 && <div className="w-16 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>

          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Customer & Reference Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Type customer name (e.g., Johnson Construction)..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                
                {customerSearch && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setOrderData(prev => ({ ...prev, customer }));
                          setCustomerSearch('');
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{customer.customerName}</div>
                        {customer.customerReference && (
                          <div className="text-sm text-gray-600">{customer.customerReference}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {orderData.customer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">{orderData.customer.customerName}</span>
                    </div>
                    {orderData.customer.customerReference && (
                      <div className="text-sm text-green-700 ml-7">{orderData.customer.customerReference}</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Reference</label>
                <input
                  type="text"
                  value={orderData.customerReference}
                  onChange={(e) => setOrderData(prev => ({ ...prev, customerReference: e.target.value }))}
                  placeholder="Project reference, job number, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!orderData.customer}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Add Products
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Product Line Items */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Product Line Items</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search for products (e.g., 10mm Tempered Glass Panel)..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                
                {productSearch && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addLineItem(product)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {product.name}
                              {product.isCustomGlass && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Custom Glass</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">${product.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              {orderData.lineItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderData.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-600">{item.productSku}</div>
                            {item.customModuleFlag && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Custom Glass Item</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantityOrdered}
                              onChange={(e) => updateLineItem(item.id, { quantityOrdered: parseInt(e.target.value) || 1 })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold">${item.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeLineItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total: ${totalAmount.toFixed(2)}</span>
                      {approvalRequired && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Approval Required (exceeds $2,000)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Selection */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Supplier Selection</h4>
                
                {loadingSuppliers ? (
                  <div className="text-sm text-gray-600">Loading suppliers...</div>
                ) : suppliers.length === 0 ? (
                  <div className="text-sm text-amber-600">No active suppliers found. Orders will need supplier assignment later.</div>
                ) : (
                  <div className="space-y-3">
                    {/* Current selected supplier */}
                    {orderData.supplier && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                          <div className="flex-1">
                            <div className="font-medium text-green-900">Selected: {orderData.supplier.name}</div>
                            <div className="text-sm text-green-700 mt-1">
                              {orderData.supplier.email} • {orderData.supplier.performanceRating}/5 stars
                            </div>
                            {orderData.lineItems.some(item => item.customModuleFlag) && (
                              <div className="text-xs text-blue-600 mt-1">Auto-selected for custom glass items</div>
                            )}
                          </div>
                          <button
                            onClick={() => setOrderData(prev => ({ ...prev, supplier: null }))}
                            className="text-green-600 hover:text-green-800 text-sm underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Supplier selection dropdown when none selected */}
                    {!orderData.supplier && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Choose Supplier *</label>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                          {suppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              onClick={() => setOrderData(prev => ({ ...prev, supplier }))}
                              className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                            >
                              <div className="font-medium text-gray-900">{supplier.name}</div>
                              <div className="text-sm text-gray-600">{supplier.email}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {supplier.supplierType} • {supplier.performanceRating}/5 stars
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back: Customer
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={orderData.lineItems.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Order Details
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Order Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Order Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery *</label>
                  <input
                    type="date"
                    value={orderData.expectedDelivery}
                    onChange={(e) => setOrderData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={orderData.priority}
                    onChange={(e) => setOrderData(prev => ({ ...prev, priority: e.target.value as 'normal' | 'high' | 'urgent' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High (Customer waiting)</option>
                    <option value="urgent">Urgent (Rush order)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea
                  value={orderData.specialInstructions}
                  onChange={(e) => setOrderData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Handle with extra care - customer installation..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back: Products
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!orderData.expectedDelivery}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Review & Submit
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review & Submit Order</h3>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Order Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Customer:</strong> {orderData.customer?.customerName}</div>
                  <div><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</div>
                  <div><strong>Line Items:</strong> {orderData.lineItems.length}</div>
                  <div><strong>Priority:</strong> {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)}</div>
                  <div><strong>Expected Delivery:</strong> {orderData.expectedDelivery}</div>
                  <div><strong>Supplier:</strong> {orderData.supplier?.supplierName || 'To be assigned'}</div>
                </div>

                {approvalRequired && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
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

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back: Configuration
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {approvalRequired ? 'Submit for Approval' : 'Create Purchase Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}