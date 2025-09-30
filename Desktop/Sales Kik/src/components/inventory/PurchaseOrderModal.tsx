import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePurchaseOrderTemplate, generatePONumber, calculatePurchaseOrderTotals } from './PurchaseOrderTemplate';
import { 
  XMarkIcon, DocumentTextIcon, CheckCircleIcon, 
  ExclamationTriangleIcon, PrinterIcon, ArrowDownTrayIcon,
  EyeIcon, TruckIcon, EnvelopeIcon
} from '@heroicons/react/24/outline';
import { EmailPurchaseOrderModal } from './EmailPurchaseOrderModal';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    customer: any;
    supplier: any;
    lineItems: any[];
    projectName: string;
    referenceNumber: string;
    priority: 'normal' | 'high' | 'urgent';
    expectedDelivery: string;
    specialInstructions: string;
    jobName?: string;
  };
  onOrderCreated: (orderData: any) => void;
}

export default function PurchaseOrderModal({ 
  isOpen, 
  onClose, 
  orderData, 
  onOrderCreated 
}: PurchaseOrderModalProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState({
    streetAddress: '',
    suburb: '',
    city: '',
    state: '',
    postcode: '',
    contactPerson: '',
    contactPhone: ''
  });

  // Load company settings (same as quote modal)
  const [globalStyling, setGlobalStyling] = useState({
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    fontFamily: 'Inter',
    logoSize: 180,
    showLogo: true,
    showCompanyName: true
  });

  const [companyProfile, setCompanyProfile] = useState<any>(null);

  const [pdfSettings, setPdfSettings] = useState({
    hideItems: false,
    hideItemPrice: false,
    hideTotalPrice: false,
    hideDescription: false
  });

  // Load company profile and styling on component mount
  useEffect(() => {
    const loadCompanyData = () => {
      try {
        // Load company profile (same keys as quotes)
        const savedProfile = localStorage.getItem('companyProfile');
        const companyName = localStorage.getItem('companyName');
        const companyLogo = localStorage.getItem('companyLogo');
        console.log('🔍 Purchase Order Modal - Company Profile:', savedProfile);
        console.log('🏢 Purchase Order Modal - Company Name:', companyName);
        console.log('🖼️ Purchase Order Modal - Company Logo:', companyLogo);
        
        let profile = {};
        if (savedProfile) {
          profile = JSON.parse(savedProfile);
        }
        if (companyName) profile.name = companyName;
        if (companyLogo) profile.logo = companyLogo;
        
        console.log('📋 Purchase Order Modal - Final Profile:', profile);
        setCompanyProfile(profile);

        // Load global styling
        const savedStyling = localStorage.getItem('global-styling');
        console.log('🎨 Purchase Order Modal - Global Styling:', savedStyling);
        if (savedStyling) {
          const styling = JSON.parse(savedStyling);
          setGlobalStyling(prev => ({ ...prev, ...styling }));
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };

    loadCompanyData();
  }, []);

  const totals = calculatePurchaseOrderTotals(orderData.lineItems);
  const totalAmount = totals.total;
  const approvalRequired = totalAmount > 2000;

  const handleCreatePurchaseOrder = async () => {
    setIsCreating(true);
    
    try {
      // Generate PO number with 6 random digits
      const poNumber = generatePONumber();
      
      // Create complete order data
      const completeOrderData = {
        ...orderData,
        poNumber,
        totals,
        totalAmount,
        approvalRequired,
        status: approvalRequired ? 'pending_approval' : 'approved',
        createdBy: 'Sarah Peterson', // Would come from auth
        orderDate: new Date().toISOString().split('T')[0],
        lineItemCount: orderData.lineItems.length,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        attachmentCount: 0,
        createdAt: new Date().toISOString(),
        deliveryAddress: useDefaultAddress ? companyProfile?.address : 
          `${customAddress.streetAddress}\n${customAddress.suburb}, ${customAddress.city} ${customAddress.state} ${customAddress.postcode}\n\nContact: ${customAddress.contactPerson}\nPhone: ${customAddress.contactPhone}`.trim()
      };

      // Generate the template HTML
      const htmlTemplate = generatePurchaseOrderTemplate(
        completeOrderData,
        globalStyling,
        companyProfile,
        pdfSettings
      );

      setTemplateHtml(htmlTemplate);
      setCreatedOrderData(completeOrderData);
      setIsCreated(true);
      
      // Add to purchase orders table
      onOrderCreated(completeOrderData);
      
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Error creating purchase order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewPurchaseOrder = () => {
    // Open PDF in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(templateHtml);
      newWindow.document.close();
    }
  };

  const handleDownloadPDF = () => {
    // Create downloadable HTML file
    const blob = new Blob([templateHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${createdOrderData?.poNumber || 'purchase-order'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackToOrders = () => {
    onClose();
    navigate('/inventory/purchase-orders');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        
        {!isCreated ? (
          /* Confirmation Dialog */
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
                <p className="text-sm text-gray-600 mt-1">Confirm your purchase order details</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Order Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Supplier:</strong> {orderData.supplier?.supplierName}</div>
                  <div><strong>Order Type:</strong> Supplier Purchase Order</div>
                  <div><strong>Project:</strong> {orderData.projectName || 'General procurement'}</div>
                  <div><strong>Reference:</strong> {orderData.referenceNumber || 'Not specified'}</div>
                  <div><strong>Priority:</strong> {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)}</div>
                  <div><strong>Expected Delivery:</strong> {orderData.expectedDelivery}</div>
                  <div><strong>Line Items:</strong> {orderData.lineItems.length}</div>
                  <div><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</div>
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

                {orderData.supplier?.isLocalGlassSupplier && (
                  <div className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-purple-600">🪟</div>
                      <div>
                        <div className="font-medium text-purple-900">Glass Specialist Supplier</div>
                        <div className="text-sm text-purple-800">Custom glass items will be handled by certified glass specialist</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Line Items Preview */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Order Items ({orderData.lineItems.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderData.lineItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitCost.toFixed(2)}</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">${item.totalCost.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Selection */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={useDefaultAddress}
                      onChange={(e) => setUseDefaultAddress(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ship to default company address
                      <div className="text-xs text-gray-500 mt-1">
                        {companyProfile?.address || 'Company address not set in profile'}
                      </div>
                    </span>
                  </label>
                  
                  {!useDefaultAddress && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">Custom Delivery Address</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Street Address"
                            value={customAddress.streetAddress}
                            onChange={(e) => setCustomAddress(prev => ({...prev, streetAddress: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Suburb"
                            value={customAddress.suburb}
                            onChange={(e) => setCustomAddress(prev => ({...prev, suburb: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="City"
                            value={customAddress.city}
                            onChange={(e) => setCustomAddress(prev => ({...prev, city: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <select
                            value={customAddress.state}
                            onChange={(e) => setCustomAddress(prev => ({...prev, state: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">Select State</option>
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
                          <input
                            type="text"
                            placeholder="Postcode"
                            value={customAddress.postcode}
                            onChange={(e) => setCustomAddress(prev => ({...prev, postcode: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Contact Person"
                            value={customAddress.contactPerson}
                            onChange={(e) => setCustomAddress(prev => ({...prev, contactPerson: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            placeholder="Contact Phone"
                            value={customAddress.contactPhone}
                            onChange={(e) => setCustomAddress(prev => ({...prev, contactPhone: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>✓ Purchase order will be generated with template</div>
                  <div>✓ {approvalRequired ? 'Sent to manager for approval' : 'Ready to send to supplier'}</div>
                  <div>✓ Added to Purchase Orders dashboard</div>
                  <div>✓ Supplier notification {approvalRequired ? 'after approval' : 'immediately'}</div>
                </div>
              </div>
            </div>
            
            <div className="border-t p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  No, Go Back
                </button>
                <button
                  onClick={handleCreatePurchaseOrder}
                  disabled={isCreating}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Yes, Create Purchase Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Success Dialog */
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-green-900">Purchase Order Created Successfully!</h2>
                <p className="text-sm text-green-600 mt-1">{createdOrderData?.poNumber}</p>
              </div>
              <button onClick={handleBackToOrders} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TruckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Purchase Order {createdOrderData?.poNumber}</h3>
                <p className="text-gray-600">
                  {approvalRequired 
                    ? 'Your purchase order has been submitted for manager approval. You will be notified once approved.' 
                    : 'Your purchase order has been created and is ready to send to the supplier.'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Status:</strong> {approvalRequired ? 'Pending Approval' : 'Approved'}</div>
                  <div><strong>Total:</strong> ${totalAmount.toFixed(2)}</div>
                  <div><strong>Supplier:</strong> {orderData.supplier?.supplierName}</div>
                  <div><strong>Expected Delivery:</strong> {orderData.expectedDelivery}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewPurchaseOrder}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <EyeIcon className="w-5 h-5" />
                  View Purchase Order
                </button>
                
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  Email Purchase Order
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download
                </button>
                
                <button
                  onClick={handleBackToOrders}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  View All Orders
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Email Modal */}
      <EmailPurchaseOrderModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        purchaseOrder={createdOrderData}
      />
    </div>
  );
}