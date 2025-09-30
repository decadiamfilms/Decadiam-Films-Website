import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generatePurchaseOrderTemplate } from '../../components/inventory/PurchaseOrderTemplate';
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TruckIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  customerName?: string;
  customerReference?: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  expectedDelivery: string;
  lineItemCount: number;
  createdBy: string;
  orderSummary?: string;
  lineItems?: any[];
  supplier?: any;
  customer?: any;
  specialInstructions?: string;
  notes?: string;
}

export default function PurchaseOrderPDFView() {
  const { orderId } = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [globalStyling, setGlobalStyling] = useState({
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    fontFamily: 'Inter',
    logoSize: 180,
    showLogo: true,
    showCompanyName: true
  });
  const [pdfSettings] = useState({
    hideItems: false,
    hideItemPrice: false,
    hideTotalPrice: false,
    hideDescription: false
  });

  useEffect(() => {
    // Load company profile data (same keys as quotes)
    const loadCompanyData = () => {
      try {
        const savedProfile = localStorage.getItem('companyProfile');
        const companyName = localStorage.getItem('companyName');
        const companyLogo = localStorage.getItem('companyLogo');
        
        let profile: any = {};
        
        if (savedProfile) {
          profile = JSON.parse(savedProfile);
        }
        
        // Add individual items to profile (same as quotes system)
        if (companyName) profile.name = companyName;
        if (companyLogo) profile.logo = companyLogo;
        
        setCompanyProfile(profile);

        // Load global styling
        const savedStyling = localStorage.getItem('global-styling');
        if (savedStyling) {
          const styling = JSON.parse(savedStyling);
          setGlobalStyling(prev => ({ ...prev, ...styling }));
        }
        
        console.log('Purchase Order - Loaded company data:', { profile, companyName, companyLogo });
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };

    // Load purchase order data
    const loadPurchaseOrder = () => {
      try {
        // Load from localStorage (in production this would be API call)
        const savedOrders = localStorage.getItem('saleskik-purchase-orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const order = orders.find((o: any) => o.id === orderId);
          
          if (order) {
            // Mock detailed line items for PDF view
            const mockLineItems = [
              { id: '1', description: 'Toughened Glass Panel 10mm', quantity: 5, unitPrice: 245.00, total: 1225.00 },
              { id: '2', description: 'Window Frame Assembly', quantity: 3, unitPrice: 180.00, total: 540.00 },
              { id: '3', description: 'Sealing Kit Premium', quantity: 2, unitPrice: 85.00, total: 170.00 },
              { id: '4', description: 'Installation Hardware Set', quantity: 1, unitPrice: 125.00, total: 125.00 }
            ];

            setPurchaseOrder({
              ...order,
              lineItems: mockLineItems,
              supplier: {
                name: order.supplierName,
                address: '123 Industrial Ave, Melbourne VIC 3000',
                phone: '+61 3 9555 0123',
                email: 'orders@' + order.supplierName.toLowerCase().replace(/\s+/g, '') + '.com.au',
                abn: '12 345 678 901'
              },
              customer: {
                name: order.customerName,
                address: '456 Construction St, Sydney NSW 2000',
                phone: '+61 2 9666 0456',
                email: 'procurement@customer.com.au'
              },
              // Include delivery details from the order
              deliveryDetails: order.deliveryDetails || {
                streetAddress: '456 Construction St',
                suburb: 'Sydney',
                city: 'Sydney',
                state: 'NSW',
                postcode: '2000',
                contactPerson: 'John Smith',
                contactPhone: '0412 345 678'
              },
              specialInstructions: order.specialInstructions || 'Please ensure all glass panels are individually wrapped and delivered between 7AM-3PM weekdays only. Site contact: John Smith 0412 345 678.'
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading purchase order:', error);
        setLoading(false);
      }
    };

    const generateTemplate = () => {
      if (purchaseOrder && companyProfile) {
        const htmlTemplate = generatePurchaseOrderTemplate(
          purchaseOrder,
          globalStyling,
          companyProfile,
          pdfSettings
        );
        setTemplateHtml(htmlTemplate);
      }
    };

    loadCompanyData();
    loadPurchaseOrder();
  }, [orderId]);

  // Generate template when data is loaded
  useEffect(() => {
    if (purchaseOrder && companyProfile && !loading) {
      const htmlTemplate = generatePurchaseOrderTemplate(
        purchaseOrder,
        globalStyling,
        companyProfile,
        pdfSettings,
        null // Let template function load from localStorage
      );
      setTemplateHtml(htmlTemplate);
    }
  }, [purchaseOrder, companyProfile, globalStyling, loading]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In production, this would generate and download actual PDF
    alert('PDF download functionality will be implemented with backend integration');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Not Found</h2>
          <p className="text-gray-600">The requested purchase order could not be found.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Actions - Hidden from print */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Purchase Orders
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Order PDF Content */}
      <div className="max-w-4xl mx-auto bg-white min-h-screen print:p-0 print:shadow-none">
        {templateHtml ? (
          <div dangerouslySetInnerHTML={{ __html: templateHtml }} />
        ) : (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating purchase order template...</p>
          </div>
        )}
      </div>
    </div>
  );
} 
