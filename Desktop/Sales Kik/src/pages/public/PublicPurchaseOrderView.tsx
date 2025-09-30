import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function PublicPurchaseOrderView() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supplierResponse, setSupplierResponse] = useState<'pending' | 'confirmed' | 'declined'>('pending');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPurchaseOrderData();
  }, [orderId, token]);

  const loadPurchaseOrderData = () => {
    try {
      // Validate token (basic validation - in production would be more secure)
      if (!token) {
        setError('Invalid or missing access token');
        setLoading(false);
        return;
      }

      // Load purchase order data (mock data for demo)
      const mockPurchaseOrder = {
        id: orderId,
        poNumber: 'PO-2025-00147',
        customerName: 'Johnson Construction',
        customerReference: 'Site Office Glass Project',
        supplierName: 'Sydney Glass Co',
        totalAmount: 2565.00,
        status: 'sent_to_supplier',
        orderDate: '2025-09-14',
        expectedDelivery: '2025-09-19',
        lineItemCount: 4,
        createdBy: 'Sarah Peterson',
        orderSummary: '5x 10mm Tempered Glass Panels, 3x 12mm Tempered Glass, Window frames, Sealing kit',
        lineItems: [
          { id: '1', description: '10mm Tempered Glass Panel 1200x800mm', quantity: 5, unitPrice: 245.00, total: 1225.00 },
          { id: '2', description: '12mm Tempered Glass Panel 1000x600mm', quantity: 3, unitPrice: 180.00, total: 540.00 },
          { id: '3', description: 'Aluminum Window Frame Set', quantity: 2, unitPrice: 280.00, total: 560.00 },
          { id: '4', description: 'Premium Sealing Kit', quantity: 1, unitPrice: 240.00, total: 240.00 }
        ],
        specialInstructions: 'All glass panels must be individually wrapped. Delivery required between 7AM-3PM weekdays only. Site contact: John Smith 0412 345 678.',
        companyInfo: {
          name: 'Ecco Hardware',
          address: '123 Business Street, Melbourne VIC 3000',
          phone: '+61 3 9555 0123',
          email: 'orders@eccohardware.com.au',
          abn: '12 345 678 901'
        }
      };

      setPurchaseOrder(mockPurchaseOrder);
      setLoading(false);

    } catch (error) {
      console.error('Error loading purchase order:', error);
      setError('Failed to load purchase order');
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResponse = async () => {
    setIsSubmitting(true);
    
    try {
      const response = {
        orderId: purchaseOrder.id,
        supplierResponse,
        deliveryDate,
        supplierNotes,
        uploadedFiles: uploadedFiles.map(f => f.name),
        responseDate: new Date().toISOString(),
        supplierName: purchaseOrder.supplierName
      };

      // TODO: Call API to save supplier response
      console.log('Supplier response:', response);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Your response has been submitted successfully. Thank you!');
      
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600">{error || 'Invalid purchase order or access token'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Order</h1>
              <div className="text-xl font-semibold text-blue-600 mt-2">{purchaseOrder.poNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Order Date</div>
              <div className="font-semibold">{purchaseOrder.orderDate}</div>
              <div className="text-sm text-gray-600 mt-2">Expected Delivery</div>
              <div className="font-semibold">{purchaseOrder.expectedDelivery}</div>
            </div>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                From: {purchaseOrder.companyInfo.name}
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div>{purchaseOrder.companyInfo.address}</div>
                <div>Phone: {purchaseOrder.companyInfo.phone}</div>
                <div>Email: {purchaseOrder.companyInfo.email}</div>
                <div>ABN: {purchaseOrder.companyInfo.abn}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TruckIcon className="w-5 h-5 mr-2" />
                To: {purchaseOrder.supplierName}
              </h3>
              <div className="text-sm text-gray-700">
                <div>Supplier confirmation requested</div>
                <div className="mt-2 text-blue-600 font-medium">
                  Please review and confirm this order below
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">Item Description</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-r border-gray-300">Unit Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.lineItems?.map((item: any, index: number) => (
                  <tr key={index} className="border-t border-gray-300">
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-300">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-900 bg-gray-50">
                  <td colSpan={3} className="px-4 py-4 text-right text-lg font-semibold text-gray-900">Total Amount:</td>
                  <td className="px-4 py-4 text-right text-xl font-bold text-gray-900">${purchaseOrder.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Special Instructions */}
          {purchaseOrder.specialInstructions && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Special Instructions
              </h4>
              <p className="text-sm text-yellow-700">{purchaseOrder.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Supplier Response Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Supplier Response Required</h3>
          
          {/* Response Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Order Confirmation</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="confirmed"
                  checked={supplierResponse === 'confirmed'}
                  onChange={(e) => setSupplierResponse(e.target.value as any)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <CheckCircleIcon className="w-5 h-5 text-green-600 ml-2 mr-2" />
                <span className="text-sm text-gray-900">Confirm Order - Can fulfill as requested</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="declined"
                  checked={supplierResponse === 'declined'}
                  onChange={(e) => setSupplierResponse(e.target.value as any)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <XCircleIcon className="w-5 h-5 text-red-600 ml-2 mr-2" />
                <span className="text-sm text-gray-900">Decline Order - Cannot fulfill</span>
              </label>
            </div>
          </div>

          {/* Delivery Date */}
          {supplierResponse === 'confirmed' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmed Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Supplier Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Comments
            </label>
            <textarea
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about availability, delivery requirements, substitutions, etc..."
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Documentation (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm text-gray-600 mb-2">
                  Upload confirmation documents, delivery receipts, or other files
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Response */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmitResponse}
              disabled={isSubmitting || supplierResponse === 'pending'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Response'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This is a secure purchase order confirmation system.</p>
          <p>Questions? Contact {purchaseOrder.companyInfo.email} or {purchaseOrder.companyInfo.phone}</p>
        </div>
      </div>
    </div>
  );
}