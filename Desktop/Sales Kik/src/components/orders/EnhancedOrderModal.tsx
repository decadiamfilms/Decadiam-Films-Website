import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon, 
  DocumentArrowDownIcon, 
  PrinterIcon, 
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline';

import { generateOrderTemplate } from './OrderTemplate';

// Interfaces
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    email?: string;
    mobile?: string;
  };
  locations: {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    postcode: string;
  }[];
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  image?: string;
}

interface OrderLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface JobSection {
  id: string;
  name: string;
  items: OrderLineItem[];
}

interface DeliveryDetails {
  method: 'delivery' | 'pickup' | 'courier';
  address?: string;
  contactName?: string;
  contactPhone?: string;
  specialInstructions?: string;
}

interface PDFSettings {
  hideTotalPrice: boolean;
  hideItemPrice: boolean;
  hideItems: boolean;
  hideCustomProcess: boolean;
  hidePaymentDetail: boolean;
  hideDescription: boolean;
  insertAcceptanceSignature: boolean;
  hideProductType: boolean;
  hideCustomText: boolean;
  showKitItems: boolean;
}

interface EnhancedOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  projectName: string;
  orderId: string;
  referenceNumber: string;
  jobSections: JobSection[];
  optionGroups?: {[category: string]: {name: string, description?: string, price: number}[]}; // Add grouped options
  deliveryDetails: DeliveryDetails;
}

export default function EnhancedOrderModal({
  isOpen,
  onClose,
  customer,
  projectName,
  orderId,
  referenceNumber,
  jobSections,
  optionGroups = {},
  deliveryDetails
}: EnhancedOrderModalProps) {
  // Auto-save order to main orders list when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      const orderData = {
        id: Date.now().toString(),
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || customer.primaryContact?.email,
        customerPhone: customer.phone || customer.primaryContact?.mobile,
        orderId,
        reference: referenceNumber,
        projectName,
        jobSections,
        orderDate: new Date(),
        amount: calculateTotal(),
        status: 'active',
        isDeleted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedOrders = JSON.parse(localStorage.getItem('saleskik-orders') || '[]');
      const existingIndex = savedOrders.findIndex((q: any) => q.orderId === orderId);

      if (existingIndex >= 0) {
        savedOrders[existingIndex] = { ...savedOrders[existingIndex], ...orderData };
      } else {
        savedOrders.push(orderData);
      }

      localStorage.setItem('saleskik-orders', JSON.stringify(savedOrders));
      console.log('💾 Order auto-saved to All Orders when modal opened');
    }
  }, [isOpen]);

  // State management
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    hideTotalPrice: false,
    hideItemPrice: false,
    hideItems: false,
    hideCustomProcess: false,
    hidePaymentDetail: false,
    hideDescription: false,
    insertAcceptanceSignature: true,
    hideProductType: false,
    hideCustomText: false,
    showKitItems: true
  });

  const [showRegenerateButton, setShowRegenerateButton] = useState(false);
  const [initialPdfSettings, setInitialPdfSettings] = useState<PDFSettings>({...pdfSettings});
  
  // Order status
  const [orderSent, setOrderSent] = useState(false);
  const [orderOrdered, setOrderOrdered] = useState(false);
  const [orderDate] = useState(new Date());

  // Internal comments
  const [internalComments, setInternalComments] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Email composition
  const [emailSubject, setEmailSubject] = useState(`Order ${orderId} - ${projectName}`);
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Order delivery method for email
  const [orderDeliveryMethod, setOrderDeliveryMethod] = useState<'pdf' | 'link'>('pdf');
  
  // Email recipients
  const [recipientEmail, setRecipientEmail] = useState(customer.primaryContact.email || customer.email);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState('');
  
  // Email history
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  
  // Rich text editor state
  const [isRichTextMode, setIsRichTextMode] = useState(true);
  
  // SMS functionality
  const [smsPhoneNumber, setSmsPhoneNumber] = useState(customer.primaryContact.mobile || customer.phone || '');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Email templates and signatures
  const [emailTemplates, setEmailTemplates] = useState<{[key: string]: string}>({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [companySignature, setCompanySignature] = useState('');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  
  // AI assistance
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  
  // Email format
  const [useHTMLEmail, setUseHTMLEmail] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      loadPDFSettings();
      loadEmailTemplates();
      loadCompanyProfile();
      loadEmailHistory();
      generateDefaultEmailBody();
      generateDefaultSMSMessage();
    }
  }, [isOpen]);

  // Regenerate email when delivery method changes
  useEffect(() => {
    if (isOpen) {
      generateDefaultEmailBody();
    }
  }, [orderDeliveryMethod]);

  // Check if settings have changed
  useEffect(() => {
    const settingsChanged = JSON.stringify(pdfSettings) !== JSON.stringify(initialPdfSettings);
    setShowRegenerateButton(settingsChanged);
  }, [pdfSettings, initialPdfSettings]);

  // Handle click outside for AI dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target as Node)) {
        setShowAIDropdown(false);
      }
    }
    
    if (showAIDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAIDropdown]);

  const loadPDFSettings = () => {
    try {
      const savedSettings = localStorage.getItem('saleskik-pdf-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const orderSettings = settings.documentSettings?.order || pdfSettings;
        setPdfSettings(orderSettings);
        setInitialPdfSettings({...orderSettings});
      }
    } catch (error) {
      console.error('Error loading PDF settings:', error);
    }
  };

  const generateDefaultEmailBody = () => {
    // Always save order for public access when generating link
    const orderToken = generateOrderToken();
    const orderLink = `${window.location.origin}/order/view/${orderId}?token=${orderToken}`;
    
    // Save order data for link access
    const publicOrderData = {
      orderId,
      token: orderToken,
      customer,
      projectName,
      referenceNumber,
      jobSections,
      deliveryDetails,
      totals: {
        subtotal: calculateSubtotal(),
        gst: calculateGST(),
        total: calculateTotal()
      },
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      companyProfile,
      status: 'draft',
      createdAt: new Date(),
      sentVia: 'Link Generated'
    };

    const savedPublicOrders = JSON.parse(localStorage.getItem('saleskik-public-orders') || '[]');
    const filteredOrders = savedPublicOrders.filter((q: any) => q.orderId !== orderId);
    filteredOrders.push(publicOrderData);
    localStorage.setItem('saleskik-public-orders', JSON.stringify(filteredOrders));
    
    // Also save to main orders list for All Orders page
    const mainOrderData = {
      id: Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || customer.primaryContact?.email,
      customerPhone: customer.phone || customer.primaryContact?.mobile,
      orderId,
      reference: referenceNumber,
      projectName,
      jobSections,
      orderDate: new Date(),
      amount: calculateTotal(),
      status: 'active', // Generated but not yet sent
      isDeleted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const savedMainOrders = JSON.parse(localStorage.getItem('saleskik-orders') || '[]');
    const existingMainIndex = savedMainOrders.findIndex((q: any) => q.orderId === orderId);
    
    if (existingMainIndex >= 0) {
      savedMainOrders[existingMainIndex] = { ...savedMainOrders[existingMainIndex], ...mainOrderData };
    } else {
      savedMainOrders.push(mainOrderData);
    }
    
    localStorage.setItem('saleskik-orders', JSON.stringify(savedMainOrders));
    
    console.log('Order saved for public access:', { orderId, token: orderToken, link: orderLink });
    console.log('💾 Order also saved to main orders list for All Orders page');
    
    const defaultBody = orderDeliveryMethod === 'pdf' ? 
      `Dear ${customer.primaryContact.firstName} ${customer.primaryContact.lastName},

Please find attached your order for ${projectName}.

Order Details:
- Order ID: ${orderId}
- Reference: ${referenceNumber}
- Total Amount: $${calculateTotal().toFixed(2)} (inc GST)

${deliveryDetails.method === 'delivery' ? 'This order includes delivery to your specified address.' : ''}
${deliveryDetails.method === 'pickup' ? 'This order is for pickup from our premises.' : ''}
${deliveryDetails.method === 'courier' ? 'This order includes courier delivery.' : ''}

Please don't hesitate to contact us if you have any questions.

Best regards,
Your SalesKik Team` :
      `Dear ${customer.primaryContact.firstName} ${customer.primaryContact.lastName},

Your order for ${projectName} is ready for review! 

You can view your order online and respond directly using this secure link:
${orderLink}

Order Details:
- Order ID: ${orderId}
- Reference: ${referenceNumber}
- Total Amount: $${calculateTotal().toFixed(2)} (inc GST)

${deliveryDetails.method === 'delivery' ? 'This order includes delivery to your specified address.' : ''}
${deliveryDetails.method === 'pickup' ? 'This order is for pickup from our premises.' : ''}
${deliveryDetails.method === 'courier' ? 'This order includes courier delivery.' : ''}

On the order page, you can:
• View all order details
• Accept or decline the order
• Add comments or questions
• Contact us directly if needed

Please don't hesitate to contact us if you have any questions.

Best regards,
Your SalesKik Team`;
    
    setEmailBody(defaultBody);
  };

  // Generate default SMS message
  const generateDefaultSMSMessage = () => {
    const defaultSMS = `Hi ${customer.primaryContact.firstName}, your order ${orderId} for ${projectName} is ready! View and respond here: ${window.location.origin}/order/view/${orderId}?token=${generateOrderToken()}. Total: $${calculateTotal().toFixed(2)}. Reply ACCEPT or DECLINE, or use the link for options.`;
    setSmsMessage(defaultSMS);
  };

  // Generate secure order token for public access
  const generateOrderToken = () => {
    return btoa(`${orderId}-${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9]/g, '');
  };

  // Send SMS order
  const handleSendSMS = async () => {
    try {
      setIsSubmitting(true);

      // Save order data for public access
      const orderToken = generateOrderToken();
      const orderLink = `${window.location.origin}/order/view/${orderId}?token=${orderToken}`;
      
      const publicOrderData = {
        orderId,
        token: orderToken,
        customer,
        projectName,
        referenceNumber,
        jobSections,
        deliveryDetails,
        totals: {
          subtotal: calculateSubtotal(),
          gst: calculateGST(),
          total: calculateTotal()
        },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        companyProfile,
        status: 'sent',
        createdAt: new Date(),
        sentVia: 'SMS',
        phoneNumber: smsPhoneNumber
      };

      // Save to localStorage for public access
      const savedPublicOrders = JSON.parse(localStorage.getItem('saleskik-public-orders') || '[]');
      savedPublicOrders.push(publicOrderData);
      localStorage.setItem('saleskik-public-orders', JSON.stringify(savedPublicOrders));

      // Call SMS API
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          phoneNumber: smsPhoneNumber,
          orderId: orderId,
          customerName: `${customer.primaryContact.firstName} ${customer.primaryContact.lastName}`,
          projectName: projectName,
          total: calculateTotal(),
          orderLink: orderLink,
          customMessage: smsMessage
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ SMS sent successfully to ${smsPhoneNumber}!\n\nOrder link: ${orderLink}\n\nThe customer can now view and respond to the order.`);
        setOrderSent(true);
        setShowSmsModal(false);
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }

    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS. The order link has been generated and saved. You can manually share the link: ' + `${window.location.origin}/order/view/${orderId}?token=${generateOrderToken()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return jobSections.reduce((total, section) =>
      total + section.items.reduce((sectionTotal, item) => sectionTotal + item.totalPrice, 0), 0
    );
  };

  const updatePDFSetting = (key: keyof PDFSettings, value: boolean) => {
    setPdfSettings(prev => ({...prev, [key]: value}));
  };

  const handleRegenerateOrder = async () => {
    // Save new settings to localStorage
    const savedSettings = JSON.parse(localStorage.getItem('saleskik-pdf-settings') || '{}');
    savedSettings.documentSettings = savedSettings.documentSettings || {};
    savedSettings.documentSettings.order = pdfSettings;
    localStorage.setItem('saleskik-pdf-settings', JSON.stringify(savedSettings));
    
    setInitialPdfSettings({...pdfSettings});
    setShowRegenerateButton(false);
    
    // Regenerate order with new settings
    try {
      await generateOrder('view');
    } catch (error) {
      console.error('Failed to regenerate order:', error);
      alert('Failed to regenerate order. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateOrder('download');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrintOrder = async () => {
    try {
      await generateOrder('print');
    } catch (error) {
      console.error('Failed to print order:', error);
      alert('Failed to generate order for printing. Please try again.');
    }
  };

  const handlePrintDeliveryDocket = () => {
    // Generate and print professional delivery docket
    generateDeliveryDocket();
  };

  // Generate professional delivery docket
  const generateDeliveryDocket = () => {
    const deliveryDate = new Date();
    const docketNumber = `DD-${orderId}-${deliveryDate.getFullYear()}${(deliveryDate.getMonth() + 1).toString().padStart(2, '0')}${deliveryDate.getDate().toString().padStart(2, '0')}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Docket ${docketNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .docket-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #000;
        }
        
        .header {
            background: #f8f9fa;
            border-bottom: 2px solid #000;
            padding: 15px;
        }
        
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .company-info h1 {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .company-info p {
            font-size: 11px;
            color: #333;
            margin: 1px 0;
        }
        
        .docket-title {
            text-align: center;
            background: #000;
            color: white;
            padding: 10px;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .docket-number {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            color: #000;
        }
        
        .info-section {
            padding: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .info-block {
            border: 1px solid #ccc;
            padding: 10px;
            background: #f9f9f9;
        }
        
        .info-block h3 {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: #000;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        
        .info-block p {
            font-size: 11px;
            margin: 2px 0;
            color: #333;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .items-table th {
            background: #000;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #000;
        }
        
        .items-table td {
            padding: 8px;
            border: 1px solid #333;
            font-size: 11px;
            vertical-align: top;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .qty-cell {
            text-align: center;
            font-weight: bold;
            width: 60px;
        }
        
        .signature-section {
            margin-top: 20px;
            padding: 15px;
            border-top: 2px solid #000;
        }
        
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 15px;
        }
        
        .signature-box {
            border: 1px solid #000;
            padding: 15px;
            min-height: 80px;
            background: #f9f9f9;
        }
        
        .signature-box h4 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 30px;
            margin: 10px 0;
        }
        
        .footer-notes {
            padding: 10px 15px;
            background: #f0f0f0;
            border-top: 1px solid #ccc;
            font-size: 10px;
            color: #666;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 1cm;
            }
            
            body {
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                font-size: 11px !important;
            }
            
            .docket-container {
                border: 2px solid #000 !important;
                max-width: 100% !important;
                margin: 0 !important;
                page-break-inside: avoid;
            }
            
            .header {
                padding: 10px !important;
            }
            
            .info-section {
                padding: 10px !important;
            }
            
            .footer-notes {
                padding: 8px 10px !important;
                font-size: 9px !important;
            }
            
            /* Ensure content fits on A4 */
            .signature-grid {
                gap: 20px !important;
            }
            
            .signature-box {
                min-height: 60px !important;
                padding: 10px !important;
            }
        }
    </style>
</head>
<body>
    <div class="docket-container">
        <!-- Header -->
        <div class="header">
            <div class="header-row">
                <div class="company-info">
                    <h1>${companyProfile?.name || 'Your Company Name'}</h1>
                    <p>${companyProfile?.address || 'Company Address'}</p>
                    <p>Phone: ${companyProfile?.phone || '(000) 000-000'} | Email: ${companyProfile?.email || 'info@company.com'}</p>
                    <p>ABN: ${companyProfile?.abn || '00 000 000 000'}</p>
                </div>
                <div>
                    ${companyProfile?.logo ? `<img src="${companyProfile.logo}" alt="Company Logo" style="max-width: 80px; max-height: 60px; object-fit: contain;" />` : ''}
                </div>
            </div>
        </div>
        
        <div class="docket-title">DELIVERY DOCKET</div>
        
        <!-- Docket Information -->
        <div class="info-section">
            <div class="info-grid">
                <div class="info-block">
                    <h3>Delivery Details</h3>
                    <p><strong>Docket No:</strong> ${docketNumber}</p>
                    <p><strong>Order Ref:</strong> ${orderId}</p>
                    <p><strong>Date:</strong> ${deliveryDate.toLocaleDateString('en-AU')}</p>
                    <p><strong>Time:</strong> ${deliveryDate.toLocaleTimeString('en-AU')}</p>
                    <p><strong>Method:</strong> ${deliveryDetails.method.toUpperCase()}</p>
                </div>
                
                <div class="info-block">
                    <h3>Customer Information</h3>
                    <p><strong>Customer:</strong> ${customer.name}</p>
                    <p><strong>Contact:</strong> ${customer.primaryContact.firstName} ${customer.primaryContact.lastName}</p>
                    <p><strong>Phone:</strong> ${customer.primaryContact.mobile || customer.phone}</p>
                    <p><strong>Email:</strong> ${customer.primaryContact.email || customer.email}</p>
                    ${referenceNumber ? `<p><strong>Reference:</strong> ${referenceNumber}</p>` : ''}
                </div>
            </div>
            
            <div class="info-grid" style="margin-top: 15px;">
                <div class="info-block">
                    <h3>Delivery Address</h3>
                    ${deliveryDetails.method === 'delivery' && deliveryDetails.address ? `
                        <p>${deliveryDetails.address}</p>
                    ` : deliveryDetails.method === 'pickup' ? `
                        <p><strong>CUSTOMER PICKUP</strong></p>
                        <p>Please collect from our premises</p>
                    ` : deliveryDetails.method === 'courier' ? `
                        <p><strong>COURIER DELIVERY</strong></p>
                        <p>${deliveryDetails.address || 'Address as per order'}</p>
                    ` : `
                        <p>Delivery method: ${deliveryDetails.method}</p>
                    `}
                    ${deliveryDetails.contactName ? `<p><strong>Contact:</strong> ${deliveryDetails.contactName}</p>` : ''}
                    ${deliveryDetails.contactPhone ? `<p><strong>Phone:</strong> ${deliveryDetails.contactPhone}</p>` : ''}
                </div>
                
                <div class="info-block">
                    <h3>Project Information</h3>
                    <p><strong>Project:</strong> ${projectName}</p>
                    ${deliveryDetails.specialInstructions ? `<p><strong>Special Instructions:</strong> ${deliveryDetails.specialInstructions}</p>` : ''}
                    <p><strong>Driver/Courier:</strong> _________________</p>
                    <p><strong>Vehicle/Registration:</strong> _________________</p>
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <div class="info-section">
            <h3 style="margin-bottom: 10px; font-size: 14px; font-weight: bold;">ITEMS FOR DELIVERY</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 15%">SKU/Code</th>
                        <th style="width: 45%">Description</th>
                        <th style="width: 10%">Qty Ordered</th>
                        <th style="width: 10%">Qty Delivered</th>
                        <th style="width: 20%">Condition/Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobSections.map(section => 
                        section.items.map(item => `
                            <tr>
                                <td>${item.product.code}</td>
                                <td>
                                    <strong>${item.product.name}</strong>
                                    ${item.product.description ? `<br><em style="font-size: 10px; color: #666;">${item.product.description}</em>` : ''}
                                    ${section.name !== 'Main Project' ? `<br><strong>Job:</strong> ${section.name}` : ''}
                                </td>
                                <td class="qty-cell">${item.quantity}</td>
                                <td class="qty-cell">_____</td>
                                <td style="background: #f9f9f9;">_________________</td>
                            </tr>
                        `).join('')
                    ).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Delivery Confirmation -->
        <div class="signature-section">
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">DELIVERY CONFIRMATION</h3>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc;">
                <p style="font-weight: bold;">DELIVERY STATUS:</p>
                <label style="margin-right: 20px;"><input type="checkbox" style="margin-right: 5px;"> Complete Delivery</label>
                <label style="margin-right: 20px;"><input type="checkbox" style="margin-right: 5px;"> Partial Delivery</label>
                <label><input type="checkbox" style="margin-right: 5px;"> Delivery Issues</label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="font-weight: bold; margin-bottom: 5px;">DELIVERY NOTES/ISSUES:</p>
                <div style="border: 1px solid #000; height: 60px; background: #f9f9f9;"></div>
            </div>
            
            <div class="signature-grid">
                <div class="signature-box">
                    <h4>Delivered By</h4>
                    <p style="font-size: 10px; margin-bottom: 10px;">Driver/Delivery Person</p>
                    <div class="signature-line"></div>
                    <p style="font-size: 10px;">Name: _________________________</p>
                    <p style="font-size: 10px;">Date: _________ Time: __________</p>
                </div>
                
                <div class="signature-box">
                    <h4>Received By</h4>
                    <p style="font-size: 10px; margin-bottom: 10px;">Customer/Authorized Person</p>
                    <div class="signature-line"></div>
                    <p style="font-size: 10px;">Name: _________________________</p>
                    <p style="font-size: 10px;">Date: _________ Time: __________</p>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-notes">
            <p><strong>IMPORTANT:</strong> This docket must be signed by the recipient upon delivery. Any damage or discrepancies must be noted above before signing.</p>
            <p>For any delivery issues or questions, please contact us immediately at ${companyProfile?.phone || '(000) 000-000'} or ${companyProfile?.email || 'info@company.com'}</p>
            <p style="text-align: right; margin-top: 5px;">Generated from SalesKik Order System - ${new Date().toLocaleString('en-AU')}</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>`;

    // Open in new window for printing
    const newWindow = window.open('', '_blank', 'width=800,height=1000');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // Generate order using active template
  const generateOrder = async (action: 'download' | 'print' | 'view') => {
    try {
      // Load active template
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      
      if (!savedTemplates || !activeTemplateId) {
        alert('No active template found. Please set up a template in Admin Settings > Form Templates.');
        return;
      }
      
      const templates = JSON.parse(savedTemplates);
      const activeTemplate = templates.find((t: any) => t.id === activeTemplateId);
      
      if (!activeTemplate) {
        alert('Active template not found. Please select a template in Admin Settings.');
        return;
      }

      // Prepare delivery address based on method
      let deliveryAddress = null;
      
      if (deliveryDetails.method === 'delivery' || deliveryDetails.method === 'courier') {
        // Use customer's address for delivery/courier
        const customerLocation = customer.locations && customer.locations[0];
        if (customerLocation) {
          deliveryAddress = {
            streetNumber: customerLocation.streetNumber,
            streetName: customerLocation.streetName,
            suburb: customerLocation.city,
            state: customerLocation.state,
            postcode: customerLocation.postcode
          };
        }
      } else if (deliveryDetails.method === 'pickup') {
        // Use company address for pickup (load from company profile)
        deliveryAddress = {
          streetNumber: '',
          streetName: companyProfile?.address || 'Company Address',
          suburb: 'Company Location',
          state: 'State',
          postcode: '0000'
        };
      }

      // Prepare order data for template
      const orderData = {
        customer: {
          ...customer,
          // Add structured customer address for billing
          address: customer.locations && customer.locations[0] ? {
            streetNumber: customer.locations[0].streetNumber,
            streetName: customer.locations[0].streetName,
            suburb: customer.locations[0].city,
            state: customer.locations[0].state,
            postcode: customer.locations[0].postcode
          } : null
        },
        projectName,
        orderId,
        referenceNumber,
        jobSections,
        optionGroups, // Add grouped options to order data
        delivery: {
          method: deliveryDetails.method,
          address: deliveryAddress,
          contactName: deliveryDetails.contactName,
          contactPhone: deliveryDetails.contactPhone,
          isAddressConfirmed: true
        },
        totals: {
          subtotal: calculateSubtotal(),
          gst: calculateGST(),
          total: calculateTotal()
        },
        date: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        comments: internalComments,
        standardText: 'Order is valid for 30 days from the date issued. 50% deposit required to commence work. Final payment due within 30 days of project completion. All work is guaranteed for 12 months from completion.'
      };

      // Generate HTML using template
      const htmlContent = generateOrderHTML(orderData, activeTemplate.globalStyling, companyProfile, pdfSettings);
      
      if (action === 'view') {
        // Open in new window for viewing
        const newWindow = window.open('', '_blank', 'width=800,height=1000');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      } else if (action === 'print') {
        // Open in new window for printing
        const newWindow = window.open('', '_blank', 'width=800,height=1000');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Wait for content to load, then print
          newWindow.onload = () => {
            setTimeout(() => {
              newWindow.print();
            }, 500);
          };
        }
      } else if (action === 'download') {
        // For download, we'd need to convert HTML to PDF
        // For now, open in new window with download hint
        const newWindow = window.open('', '_blank', 'width=800,height=1000');
        if (newWindow) {
          const downloadHtml = htmlContent + `
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              }
            </script>
          `;
          newWindow.document.write(downloadHtml);
          newWindow.document.close();
        }
      }
      
    } catch (error) {
      console.error('Failed to generate order:', error);
      throw error;
    }
  };

  // Helper functions for calculations
  const calculateSubtotal = () => {
    return jobSections.reduce((total, section) =>
      total + section.items.reduce((sectionTotal, item) => sectionTotal + item.totalPrice, 0), 0
    );
  };

  const calculateGST = () => {
    return calculateSubtotal() * 0.1; // 10% GST
  };

  // Generate HTML content using the active template
  const generateOrderHTML = (orderData: any, globalStyling: any, companyProfile: any, pdfSettings: any) => {
    // Import the template generation function
    return generateOrderTemplate(orderData, globalStyling, companyProfile, pdfSettings);
  };

  // Generate PDF order for email attachment using browser print
  const generateOrderPDF = async () => {
    try {
      // Load active template
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      
      if (!savedTemplates || !activeTemplateId) {
        throw new Error('No active template found');
      }
      
      const templates = JSON.parse(savedTemplates);
      const activeTemplate = templates.find((t: any) => t.id === activeTemplateId);
      
      if (!activeTemplate) {
        throw new Error('Active template not found');
      }

      // Prepare delivery address based on method
      let deliveryAddress = null;
      
      if (deliveryDetails.method === 'delivery' || deliveryDetails.method === 'courier') {
        // Use customer's address for delivery/courier
        const customerLocation = customer.locations && customer.locations[0];
        if (customerLocation) {
          deliveryAddress = {
            streetNumber: customerLocation.streetNumber,
            streetName: customerLocation.streetName,
            suburb: customerLocation.city,
            state: customerLocation.state,
            postcode: customerLocation.postcode
          };
        } else if (deliveryDetails.address) {
          // Parse the address string if no structured address
          const parts = deliveryDetails.address.split(',');
          deliveryAddress = {
            streetNumber: '',
            streetName: parts[0]?.trim() || '',
            suburb: parts[1]?.trim() || '',
            state: parts[2]?.trim() || '',
            postcode: parts[3]?.trim() || ''
          };
        }
      } else if (deliveryDetails.method === 'pickup') {
        // Use company address for pickup
        deliveryAddress = {
          streetNumber: '',
          streetName: companyProfile?.address || 'Company Address',
          suburb: 'Company Location',
          state: 'State',
          postcode: '0000'
        };
      }

      // Prepare order data for template
      const orderData = {
        customer: {
          ...customer,
          // Add structured customer address
          address: customer.locations && customer.locations[0] ? {
            streetNumber: customer.locations[0].streetNumber,
            streetName: customer.locations[0].streetName,
            suburb: customer.locations[0].city,
            state: customer.locations[0].state,
            postcode: customer.locations[0].postcode
          } : null
        },
        projectName,
        orderId,
        referenceNumber,
        jobSections,
        optionGroups, // Add grouped options to order data
        delivery: {
          method: deliveryDetails.method,
          address: deliveryAddress,
          contactName: deliveryDetails.contactName,
          contactPhone: deliveryDetails.contactPhone,
          isAddressConfirmed: true
        },
        totals: {
          subtotal: calculateSubtotal(),
          gst: calculateGST(),
          total: calculateTotal()
        },
        date: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        comments: internalComments,
        standardText: 'Order is valid for 30 days from the date issued. 50% deposit required to commence work. Final payment due within 30 days of project completion.'
      };

      // Generate HTML using template
      const htmlContent = generateOrderHTML(orderData, activeTemplate.globalStyling, companyProfile, pdfSettings);
      
      // Create a hidden iframe to generate PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-10000px';
      iframe.style.top = '-10000px';
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      document.body.appendChild(iframe);

      // Set the HTML content
      iframe.contentDocument!.open();
      iframe.contentDocument!.write(htmlContent);
      iframe.contentDocument!.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, return HTML content since browser PDF generation requires user interaction
      // The server will need to handle PDF conversion
      return {
        content: htmlContent,
        filename: `Order_${orderId}.pdf`,
        type: 'text/html' // Server will convert to PDF
      };
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setEmailAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    // Initialize variables at function scope
    let orderPDF = null;
    let embedOrderInEmail = false;
    const attachmentsList = [...emailAttachments.map(f => f.name)];
    
    try {
      setIsSubmitting(true);

      // Format email with signature and embedded order if needed
      console.log('Email composition debug:', {
        hasCompanyProfile: !!companyProfile,
        companyName: companyProfile?.name,
        hasLogo: !!companyProfile?.logo,
        signatureLength: companySignature.length,
        useHTML: useHTMLEmail,
        embedOrder: embedOrderInEmail
      });
      
      let emailContent = '';
      
      if (embedOrderInEmail && orderPDF) {
        // Include the order directly in the email body
        emailContent = useHTMLEmail 
          ? `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="white-space: pre-line;">${emailBody}</div>
              <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
              <div style="margin-top: 30px;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Order Details</h2>
                ${orderPDF.content}
              </div>
              ${companySignature}
             </div>`
          : emailBody + '\n\n' + '--- QUOTE DETAILS ---\n\n' + orderPDF.content.replace(/<[^>]*>/g, '') + '\n\n' + companySignature.replace(/<[^>]*>/g, '');
      } else {
        // Regular email without embedded order
        emailContent = useHTMLEmail 
          ? `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="white-space: pre-line;">${emailBody}</div>
              ${companySignature}
             </div>`
          : emailBody + '\n\n' + companySignature.replace(/<[^>]*>/g, ''); // Strip HTML for plain text
      }
      
      // Prepare order content for email
      if (orderDeliveryMethod === 'pdf') {
        try {
          // Generate the order HTML
          orderPDF = await generateOrderPDF();
          console.log('Order HTML generated for email:', {
            filename: orderPDF.filename,
            contentLength: orderPDF.content.length,
            type: orderPDF.type
          });
          
          // Embed the order in the email body since PDF generation is having issues
          embedOrderInEmail = true;
          console.log('📧 Will embed order content directly in email body');
          
        } catch (pdfError) {
          console.error('Failed to generate order content:', pdfError);
          embedOrderInEmail = false;
        }
      }

      // If using link method, ensure order is saved for public access
      if (orderDeliveryMethod === 'link') {
        const orderToken = generateOrderToken();
        const publicOrderData = {
          orderId,
          token: orderToken,
          customer,
          projectName,
          referenceNumber,
          jobSections,
          deliveryDetails,
          totals: {
            subtotal: calculateSubtotal(),
            gst: calculateGST(),
            total: calculateTotal()
          },
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          companyProfile,
          status: 'sent',
          createdAt: new Date(),
          sentVia: 'Email Link'
        };

        const savedPublicOrders = JSON.parse(localStorage.getItem('saleskik-public-orders') || '[]');
        const filteredOrders = savedPublicOrders.filter((q: any) => q.orderId !== orderId);
        filteredOrders.push(publicOrderData);
        localStorage.setItem('saleskik-public-orders', JSON.stringify(filteredOrders));
      }

      // Call Email API  
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please refresh the page and try again.');
      }

      const response = await fetch('/api/orders/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipientEmail,
          cc: ccEmails,
          subject: emailSubject,
          body: emailContent,
          isHTML: useHTMLEmail,
          deliveryMethod: orderDeliveryMethod,
          orderId: orderId,
          customerName: customer.name,
          orderPDF: orderPDF, // Include the generated PDF data
          companyProfile: companyProfile, // Include company profile for signature
          fromName: companyProfile?.name || 'SalesKik Business'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Session expired. Please refresh the page and log in again.');
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      // Create email record for history
      const emailRecord = {
        id: Date.now().toString(),
        date: new Date(),
        to: recipientEmail,
        cc: ccEmails,
        subject: emailSubject,
        body: emailContent,
        attachments: attachmentsList,
        orderId: orderId,
        customerName: customer.name,
        deliveryMethod: orderDeliveryMethod,
        service: result.service,
        status: 'sent'
      };
      
      // Add to email history
      const updatedHistory = [emailRecord, ...emailHistory];
      setEmailHistory(updatedHistory);
      localStorage.setItem('saleskik-email-history', JSON.stringify(updatedHistory));

      // Update order status to 'sent' in main orders list
      const savedOrders = JSON.parse(localStorage.getItem('saleskik-orders') || '[]');
      let orderExists = false;
      const updatedOrders = savedOrders.map((q: any) => {
        if (q.orderId === orderId) {
          orderExists = true;
          return { ...q, status: 'sent', lastEmailedAt: new Date() };
        }
        return q;
      });
      
      // If order doesn't exist, create it as 'sent'
      if (!orderExists) {
        const newOrder = {
          id: Date.now().toString(),
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email || customer.primaryContact?.email,
          customerPhone: customer.phone || customer.primaryContact?.mobile,
          orderId,
          reference: referenceNumber || '',
          projectName: projectName || '',
          jobSections,
          orderDate: new Date(),
          amount: calculateTotal(),
          status: 'sent',
          isDeleted: false,
          isArchived: false,
          createdAt: new Date(),
          lastEmailedAt: new Date()
        };
        updatedOrders.push(newOrder);
      }
      
      localStorage.setItem('saleskik-orders', JSON.stringify(updatedOrders));
      
      setOrderSent(true);
      
      if (orderDeliveryMethod === 'pdf') {
        alert('✅ Email sent successfully with PDF order attached!');
      } else {
        alert(`✅ Email sent successfully with order link!\n\nCustomer can view and respond at:\n${window.location.origin}/order/view/${orderId}?token=${generateOrderToken()}`);
      }

    } catch (error) {
      console.error('Failed to send email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to send email: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load email history - filtered by current customer
  const loadEmailHistory = () => {
    try {
      const saved = localStorage.getItem('saleskik-email-history');
      if (saved) {
        const allHistory = JSON.parse(saved).map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }));
        
        // Filter history by current customer name
        const customerHistory = allHistory.filter((item: any) => 
          item.customerName === customer.name
        );
        
        setEmailHistory(customerHistory);
      }
    } catch (error) {
      console.error('Error loading email history:', error);
    }
  };

  // CC email management
  const addCcEmail = () => {
    if (newCcEmail.trim() && !ccEmails.includes(newCcEmail.trim())) {
      setCcEmails([...ccEmails, newCcEmail.trim()]);
      setNewCcEmail('');
    }
  };

  const removeCcEmail = (index: number) => {
    setCcEmails(ccEmails.filter((_, i) => i !== index));
  };

  // Rich text formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEmailBody(editorRef.current.innerHTML);
    }
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // Load email templates from localStorage
  const loadEmailTemplates = () => {
    try {
      const saved = localStorage.getItem('saleskik-email-templates');
      if (saved) {
        const templates = JSON.parse(saved);
        setEmailTemplates(templates);
      } else {
        // Simple default templates - with placeholder variables for customization
        const defaultTemplates = {
          'builders': `Hi {contactName},

Thanks for reaching out! I've put together a order for your {projectName} project and I think you'll find our pricing very competitive.

Order {orderId} totals {totalAmount} and all our materials are top quality. We can deliver right to your site.

Let me know if you have any questions or if you'd like to discuss anything further.

Looking forward to working with you!`,

          'general': `Dear {contactName},

Please find your order for {projectName} attached. I've included everything we discussed and the pricing is valid for 30 days.

Order Details:
- Order ID: {orderId}
- Reference: {referenceNumber}
- Total Amount: {totalAmount} (inc GST)

Feel free to call if you need any clarification on the items or have any questions about delivery.

Thanks for considering us for your project!`
        };
        setEmailTemplates(defaultTemplates);
        localStorage.setItem('saleskik-email-templates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  // Load company profile and generate signature
  const loadCompanyProfile = () => {
    try {
      const savedProfile = localStorage.getItem('companyProfile');
      const companyName = localStorage.getItem('companyName');
      const companyLogo = localStorage.getItem('companyLogo');
      
      let profile: any = {};
      
      if (savedProfile) {
        profile = JSON.parse(savedProfile);
      }
      
      if (companyName) profile.name = companyName;
      if (companyLogo) profile.logo = companyLogo;
      
      setCompanyProfile(profile);
      generateCompanySignature(profile);
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  // Generate clean company signature without logo for better email delivery
  const generateCompanySignature = (profile: any) => {
    if (!profile) return;
    
    // Clean professional signature without logo
    const htmlSignature = `
<div style="margin-top: 30px; padding-top: 20px; border-top: 3px solid #3b82f6;">
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 16px;">
      <div style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">
        {{CompanyName}}
      </div>
      ${profile.address ? `<div style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">${profile.address}</div>` : ''}
    </div>
    
    <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 8px; color: #374151;">
        <span style="font-size: 16px;">📞</span>
        <span style="font-weight: 500;">{{Phone}}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; color: #374151;">
        <span style="font-size: 16px;">✉️</span>
        <a href="mailto:{{Email}}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">{{Email}}</a>
      </div>
      ${profile.website ? `
      <div style="display: flex; align-items: center; gap: 8px; color: #374151;">
        <span style="font-size: 16px;">🌐</span>
        <a href="{{Website}}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">{{Website}}</a>
      </div>` : ''}
    </div>
    
    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #d1d5db; text-align: center; color: #9ca3af; font-size: 12px;">
      Professional Business Quoting
    </div>
  </div>
</div>`;

    setCompanySignature(htmlSignature);
  };

  // Apply email template - replace placeholders with actual values
  const applyTemplate = (templateKey: string) => {
    if (!emailTemplates[templateKey]) return;
    
    let template = emailTemplates[templateKey];
    
    // Replace placeholders with actual values
    template = template.replace(/\{contactName\}/g, `${customer.primaryContact.firstName} ${customer.primaryContact.lastName}`);
    template = template.replace(/\{projectName\}/g, projectName);
    template = template.replace(/\{orderId\}/g, orderId);
    template = template.replace(/\{referenceNumber\}/g, referenceNumber || 'N/A');
    template = template.replace(/\{companyName\}/g, customer.name);
    template = template.replace(/\{totalAmount\}/g, `$${calculateTotal().toFixed(2)}`);
    
    // Add delivery method info
    const deliveryInfo = deliveryDetails.method === 'delivery' ? '\n\nThis order includes delivery to your specified address.' : 
                        deliveryDetails.method === 'pickup' ? '\n\nThis order is for pickup from our premises.' : 
                        deliveryDetails.method === 'courier' ? '\n\nThis order includes courier delivery.' : '';
    
    template += deliveryInfo;
    
    setEmailBody(template);
    setSelectedTemplate(templateKey);
  };

  // Save new email template
  const saveNewTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      alert('Please provide both template name and content.');
      return;
    }
    
    const updatedTemplates = {
      ...emailTemplates,
      [newTemplateName.toLowerCase().replace(/\s+/g, '_')]: newTemplateContent
    };
    
    setEmailTemplates(updatedTemplates);
    localStorage.setItem('saleskik-email-templates', JSON.stringify(updatedTemplates));
    
    setNewTemplateName('');
    setNewTemplateContent('');
    setShowTemplateManager(false);
    
    alert('Template saved successfully!');
  };

  // AI Functions for email enhancement
  const handleAIAction = async (action: string) => {
    if (!emailBody.trim() && action !== 'generate') {
      alert('Please enter some text first for AI to work with.');
      return;
    }

    setIsAIProcessing(true);
    setShowAIDropdown(false);

    try {
      let prompt = '';
      const currentText = emailBody;

      switch (action) {
        case 'fix':
          prompt = `Please fix the grammar, spelling, and formatting of this business email: "${currentText}"`;
          break;
        case 'elaborate':
          prompt = `Please elaborate and expand on this business email while keeping it professional: "${currentText}"`;
          break;
        case 'generate':
          const templateType = selectedTemplate || 'general';
          prompt = `Generate a professional business email for a ${templateType} customer about a order for ${projectName}. Include order ID ${orderId}, reference ${referenceNumber}, customer name ${customer.name}, and contact ${customer.primaryContact.firstName} ${customer.primaryContact.lastName}. Keep it professional but warm.`;
          break;
        case 'simplify':
          prompt = `Please simplify this business email while keeping all important information: "${currentText}"`;
          break;
        case 'formalize':
          prompt = `Please rewrite this email in a more formal, professional business tone: "${currentText}"`;
          break;
        case 'friendly':
          prompt = `Please rewrite this email in a more friendly, approachable tone while maintaining professionalism: "${currentText}"`;
          break;
      }

      // Call Claude API (placeholder - you'll need to implement the actual API call)
      // For now, I'll simulate the response
      setTimeout(() => {
        let enhancedText = '';
        switch (action) {
          case 'generate':
            enhancedText = `Dear ${customer.primaryContact.firstName} ${customer.primaryContact.lastName},

Thank you for your interest in our services. Please find attached your comprehensive order for ${projectName}.

Order Details:
• Order ID: ${orderId}
• Reference: ${referenceNumber}
• Total Amount: $${calculateTotal().toFixed(2)} (inc GST)

We've carefully prepared this order to meet your specific requirements and are confident in our ability to deliver exceptional results for your project.

${deliveryDetails.method === 'delivery' ? 'This order includes delivery to your specified address.' : ''}
${deliveryDetails.method === 'pickup' ? 'This order is for pickup from our premises.' : ''}
${deliveryDetails.method === 'courier' ? 'This order includes courier delivery.' : ''}

Should you have any questions or require clarification on any items, please don't hesitate to contact us. We look forward to the opportunity to work with you.`;
            break;
          default:
            enhancedText = currentText; // Fallback for now
        }
        
        setEmailBody(enhancedText);
        setIsAIProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('AI enhancement failed:', error);
      alert('Failed to enhance email. Please try again.');
      setIsAIProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Order Details</h2>
              <p className="text-gray-600 mt-1">Review and manage your order</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-none mx-auto">
            {/* Top Row - Key Information */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Order ID - Centered */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center h-full">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{orderId}</div>
                  <p className="text-gray-600">Order ID</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Company:</span> {customer.name}</div>
                    <div><span className="font-medium">Reference:</span> {referenceNumber || 'N/A'}</div>
                    <div><span className="font-medium">Primary Contact:</span> {customer.primaryContact.firstName} {customer.primaryContact.lastName}</div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-500" />
                      {customer.primaryContact.mobile || customer.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                      {customer.primaryContact.email || customer.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      {orderDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      {orderSent ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XCircleIcon className="w-4 h-4 text-red-500" />}
                      <span className={orderSent ? 'text-green-600' : 'text-red-600'}>
                        {orderSent ? 'Sent' : 'Not Sent'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {orderOrdered ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XCircleIcon className="w-4 h-4 text-red-500" />}
                      <span className={orderOrdered ? 'text-green-600' : 'text-red-600'}>
                        {orderOrdered ? 'Ordered' : 'Not Ordered'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row - Delivery and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Section - Delivery Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5" />
                  Delivery Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Method:</span>
                    <span className="capitalize px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {deliveryDetails.method}
                    </span>
                  </div>
                  {deliveryDetails.address && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-4 h-4 mt-1 text-gray-500" />
                      <span>{deliveryDetails.address}</span>
                    </div>
                  )}
                  {deliveryDetails.contactName && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Contact:</span>
                      <span>{deliveryDetails.contactName}</span>
                    </div>
                  )}
                  {deliveryDetails.contactPhone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-500" />
                      <span>{deliveryDetails.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Section - Action Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => generateOrder('view')}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                    View Order Preview
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download Order to PDF
                  </button>
                  <button
                    onClick={handlePrintOrder}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    Print Order
                  </button>
                  <button
                    onClick={handlePrintDeliveryDocket}
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Print Delivery Docket
                  </button>
                  <button
                    onClick={() => {
                      // Generate and test order link
                      const orderToken = generateOrderToken();
                      const orderLink = `${window.location.origin}/order/view/${orderId}?token=${orderToken}`;
                      
                      // Save order for public access
                      const publicOrderData = {
                        orderId,
                        token: orderToken,
                        customer,
                        projectName,
                        referenceNumber,
                        jobSections,
                        deliveryDetails,
                        totals: {
                          subtotal: calculateSubtotal(),
                          gst: calculateGST(),
                          total: calculateTotal()
                        },
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        companyProfile,
                        status: 'draft',
                        createdAt: new Date(),
                        sentVia: 'Test Link'
                      };

                      const savedPublicOrders = JSON.parse(localStorage.getItem('saleskik-public-orders') || '[]');
                      const filteredOrders = savedPublicOrders.filter((q: any) => q.orderId !== orderId);
                      filteredOrders.push(publicOrderData);
                      localStorage.setItem('saleskik-public-orders', JSON.stringify(filteredOrders));
                      
                      // Open the link in new tab
                      window.open(orderLink, '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                    Test Order Link
                  </button>
                </div>
              </div>
            </div>

            {/* Third Row - Settings and Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* PDF Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CogIcon className="w-5 h-5" />
                    PDF Settings
                  </h3>
                  {showRegenerateButton && (
                    <button
                      onClick={handleRegenerateOrder}
                      className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Regenerate Order
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(pdfSettings).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updatePDFSetting(key as keyof PDFSettings, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments and Email */}
              <div className="space-y-6">
                {/* Internal Comments */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Add Internal Comments
                  </button>
                  {showComments && (
                    <div className="mt-4">
                      <textarea
                        value={internalComments}
                        onChange={(e) => setInternalComments(e.target.value)}
                        placeholder="Add internal comments about this order..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fourth Row - Enhanced Email Composer */}
            <div className="mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5" />
                    Compose Email
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRichTextMode(!isRichTextMode)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isRichTextMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isRichTextMode ? '📝 Rich Text' : '📄 Plain Text'}
                    </button>
                    <button
                      onClick={() => setShowTemplateManager(!showTemplateManager)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Templates
                    </button>
                  </div>
                </div>

                {/* Email Recipients Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To (Recipient)</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CC (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCcEmail()}
                        placeholder="Add CC email..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addCcEmail}
                        className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {ccEmails.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ccEmails.map((email, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {email}
                            <button
                              onClick={() => removeCcEmail(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Templates and Options Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saved Email Templates</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => applyTemplate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select saved wording...</option>
                      {Object.keys(emailTemplates).map(key => (
                        <option key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Delivery Method</label>
                    <select
                      value={orderDeliveryMethod}
                      onChange={(e) => {
                        setOrderDeliveryMethod(e.target.value as 'pdf' | 'link');
                        // Save to public orders when switching to link
                        if (e.target.value === 'link') {
                          const orderToken = generateOrderToken();
                          const publicOrderData = {
                            orderId,
                            token: orderToken,
                            customer,
                            projectName,
                            referenceNumber,
                            jobSections,
                            deliveryDetails,
                            totals: {
                              subtotal: calculateSubtotal(),
                              gst: calculateGST(),
                              total: calculateTotal()
                            },
                            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            companyProfile,
                            status: 'draft',
                            createdAt: new Date(),
                            sentVia: 'Email Link'
                          };

                          const savedPublicOrders = JSON.parse(localStorage.getItem('saleskik-public-orders') || '[]');
                          // Remove existing entries for this order to avoid duplicates
                          const filteredOrders = savedPublicOrders.filter((q: any) => q.orderId !== orderId);
                          filteredOrders.push(publicOrderData);
                          localStorage.setItem('saleskik-public-orders', JSON.stringify(filteredOrders));
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pdf">📄 Attach PDF Order</option>
                      <option value="link">🔗 Send Order Link</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {orderDeliveryMethod === 'pdf' ? 'Order PDF will be attached to email' : 'Customer can view and respond online'}
                    </p>
                    {orderDeliveryMethod === 'link' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <strong>Link:</strong> {window.location.origin}/order/view/{orderId}?token=...
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Additional Files</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                      Upload Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileAttachment}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Show uploaded attachments */}
                {emailAttachments.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Files:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {emailAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Message Editor with Rich Text and AI */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowAIDropdown(!showAIDropdown)}
                          disabled={isAIProcessing}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            isAIProcessing 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {isAIProcessing ? 'AI Working...' : '🤖 AI Assist'}
                        </button>
                        
                        {showAIDropdown && !isAIProcessing && (
                          <div ref={aiDropdownRef} className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                            <div className="py-2">
                              <button onClick={() => handleAIAction('generate')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                ✨ Generate Email
                              </button>
                              <button onClick={() => handleAIAction('fix')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                🔧 Fix Grammar & Spelling
                              </button>
                              <button onClick={() => handleAIAction('elaborate')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                📝 Elaborate & Expand
                              </button>
                              <button onClick={() => handleAIAction('simplify')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                ⚡ Simplify
                              </button>
                              <button onClick={() => handleAIAction('formalize')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                🎩 Make Formal
                              </button>
                              <button onClick={() => handleAIAction('friendly')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                😊 Make Friendly
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rich Text Toolbar */}
                  {isRichTextMode && (
                    <div className="bg-gray-50 border border-gray-300 rounded-t-lg p-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => formatText('bold')}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          isCommandActive('bold') ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        onClick={() => formatText('italic')}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          isCommandActive('italic') ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        onClick={() => formatText('underline')}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          isCommandActive('underline') ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                        title="Underline"
                      >
                        <u>U</u>
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        onClick={() => formatText('insertUnorderedList')}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Bullet List"
                      >
                        • List
                      </button>
                      <button
                        onClick={() => formatText('insertOrderedList')}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Numbered List"
                      >
                        1. List
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <select
                        onChange={(e) => formatText('fontSize', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="">Font Size</option>
                        <option value="1">Small</option>
                        <option value="3">Normal</option>
                        <option value="5">Large</option>
                        <option value="7">Huge</option>
                      </select>
                    </div>
                  )}
                  
                  {isRichTextMode ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={() => {
                        if (editorRef.current) {
                          setEmailBody(editorRef.current.innerHTML);
                        }
                      }}
                      className="w-full p-4 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[250px] bg-white"
                      style={{ outline: 'none' }}
                      dangerouslySetInnerHTML={{ __html: emailBody }}
                    />
                  ) : (
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                      rows={10}
                    />
                  )}
                </div>

                {/* Company Signature Preview */}
                {companySignature && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Signature Preview</label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div dangerouslySetInnerHTML={{ __html: companySignature }} />
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handleSendEmail}
                    disabled={isSubmitting || !recipientEmail.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending Email...' : 'Send Order via Email'}
                  </button>
                  
                  {emailBody.trim() && (
                    <button
                      onClick={() => {
                        const templateName = prompt('Enter a name for this email template:');
                        if (templateName) {
                          const updatedTemplates = {
                            ...emailTemplates,
                            [templateName.toLowerCase().replace(/\s+/g, '_')]: emailBody
                          };
                          setEmailTemplates(updatedTemplates);
                          localStorage.setItem('saleskik-email-templates', JSON.stringify(updatedTemplates));
                          alert('Email template saved successfully!');
                        }
                      }}
                      className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      💾 Save as Template
                    </button>
                  )}
                  
                  <button
                    onClick={() => setEmailBody('')}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Message
                  </button>
                </div>
              </div>

              {/* Template Manager Modal */}
              {showTemplateManager && (
                <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900">Manage Email Templates</h3>
                      <button
                        onClick={() => setShowTemplateManager(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      {/* Create New Template */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Save Email Template</h4>
                        <p className="text-sm text-gray-600 mb-4">Save email content to reuse for similar customers with the same vibe/tone.</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                            <input
                              type="text"
                              value={newTemplateName}
                              onChange={(e) => setNewTemplateName(e.target.value)}
                              placeholder="e.g., Friendly Builders, Professional Contractors..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                            <textarea
                              value={newTemplateContent}
                              onChange={(e) => setNewTemplateContent(e.target.value)}
                              placeholder="Write your email message here - this exact wording will be saved and can be reused for similar customers..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                              rows={8}
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                // Save current email as template
                                if (emailBody.trim()) {
                                  setNewTemplateContent(emailBody);
                                }
                              }}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              Use Current Email
                            </button>
                          </div>
                          
                          <button
                            onClick={saveNewTemplate}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Save Template
                          </button>
                        </div>
                      </div>
                      
                      {/* Existing Templates */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Existing Templates</h4>
                        <div className="space-y-4">
                          {Object.entries(emailTemplates).map(([key, content]) => (
                            <div key={key} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                                </h5>
                                <button
                                  onClick={() => {
                                    const updatedTemplates = {...emailTemplates};
                                    delete updatedTemplates[key];
                                    setEmailTemplates(updatedTemplates);
                                    localStorage.setItem('saleskik-email-templates', JSON.stringify(updatedTemplates));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                                {content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SMS Modal */}
            {showSmsModal && (
              <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-orange-600" />
                      Send Order via SMS
                    </h3>
                    <button
                      onClick={() => setShowSmsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={smsPhoneNumber}
                          onChange={(e) => setSmsPhoneNumber(e.target.value)}
                          placeholder="Enter mobile number..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SMS Message</label>
                        <textarea
                          value={smsMessage}
                          onChange={(e) => setSmsMessage(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Character count: {smsMessage.length}/160 (SMS limit)
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">What happens next:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Customer receives SMS with secure order link</li>
                          <li>• They can view order details and accept/decline</li>
                          <li>• You'll be notified of their decision</li>
                          <li>• Order status updates automatically in your system</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowSmsModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendSMS}
                        disabled={!smsPhoneNumber.trim() || isSubmitting}
                        className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending...' : 'Send SMS Order'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Width Products Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6" />
                Products & Services
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Image</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">SKU</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Name/Description</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Quantity</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Un-ordered</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Unit Price</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobSections.map(section => 
                      section.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <EyeIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-sm font-medium text-blue-600">{item.product.code}</td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-semibold text-gray-900 text-base">{item.product.name}</div>
                              {item.product.description && (
                                <div className="text-gray-500 text-sm mt-1">{item.product.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-gray-900">{item.quantity}</td>
                          <td className="py-4 px-4 text-center text-gray-500">0</td>
                          <td className="py-4 px-4 text-right font-medium text-gray-900">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-bold text-lg text-green-600">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td colSpan={6} className="py-4 px-4 text-right font-bold text-lg text-gray-900">Total:</td>
                      <td className="py-4 px-4 text-right font-bold text-xl text-green-600">${calculateTotal().toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Email History */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <button
                onClick={() => setShowEmailHistory(!showEmailHistory)}
                className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                  Email History - {customer.name}
                  {emailHistory.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {emailHistory.length} sent
                    </span>
                  )}
                </div>
                <div className={`transform transition-transform ${showEmailHistory ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>
              {showEmailHistory && (
                <p className="text-sm text-gray-600 mb-4">
                  Showing email history for this customer only
                </p>
              )}
              
              {showEmailHistory && emailHistory.length === 0 ? (
                <div className="text-center py-8">
                  <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No emails sent to {customer.name} yet</p>
                  <p className="text-sm text-gray-400">Email history for this customer will appear here after you send orders</p>
                </div>
              ) : showEmailHistory ? (
                <div className="space-y-4">
                  {emailHistory.slice(0, 10).map((email, index) => {
                    const isExpanded = expandedEmailId === email.id;
                    return (
                      <div key={email.id} className="border border-gray-200 rounded-lg hover:bg-gray-50">
                        {/* Email Header - Always Visible */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{email.subject}</div>
                                <div className="text-sm text-gray-500">
                                  To: {email.to} 
                                  {email.cc.length > 0 && ` | CC: ${email.cc.join(', ')}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {email.attachments.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <PaperClipIcon className="w-3 h-3" />
                                  {email.attachments.length} files
                                </div>
                              )}
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {email.date.toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {email.date.toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="text-gray-400">
                                {isExpanded ? '▼' : '▶'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Brief Preview When Collapsed */}
                          {!isExpanded && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <div dangerouslySetInnerHTML={{ 
                                __html: email.body.length > 150 ? 
                                  email.body.substring(0, 150).replace(/<[^>]*>/g, '') + '...' : 
                                  email.body.replace(/<[^>]*>/g, '') 
                              }} />
                            </div>
                          )}
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-4">
                              {/* Full Email Content */}
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Email Content:</h4>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                                  <div dangerouslySetInnerHTML={{ __html: email.body }} />
                                </div>
                              </div>
                              
                              {/* Attachments */}
                              {email.attachments.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-medium text-gray-900 mb-2">Attachments Sent:</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {email.attachments.map((attachment: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                        <PaperClipIcon className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">{attachment}</span>
                                        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                          {attachment.includes('order') ? 'Order PDF' : 'Attachment'}
                                        </span>
                                      </div>
                                    ))}
                                    {/* Always show order attachment */}
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-700">Order_{email.orderId}.pdf</span>
                                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                        Auto-attached
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Email Metadata */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Order ID:</span> {email.orderId}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Customer:</span> {email.customerName}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Status:</span> 
                                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    {email.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Sent:</span> {email.date.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {emailHistory.length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        Showing latest 10 emails to {customer.name} • {emailHistory.length} total emails sent to this customer
                      </p>
                      <button className="mt-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        View All Emails for {customer.name}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}