import React, { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, DocumentArrowDownIcon, PrinterIcon, PencilIcon,
  TruckIcon, MapPinIcon, PhoneIcon, UserIcon, EnvelopeIcon,
  CheckIcon, ExclamationTriangleIcon, InformationCircleIcon,
  BuildingOfficeIcon, CreditCardIcon, CalendarIcon, EyeIcon,
  PaperClipIcon, ChatBubbleLeftRightIcon, DocumentTextIcon,
  ArrowDownTrayIcon, TrashIcon, TagIcon, CubeIcon
} from '@heroicons/react/24/outline';
import { generateQuoteTemplate } from './QuoteTemplate';

// Interfaces
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    email?: string;
    mobile?: string;
  };
  locations: CustomerLocation[];
  priceTier: 'T1' | 'T2' | 'T3' | 'Retail';
}

interface CustomerLocation {
  id?: string;
  type: string;
  streetNumber: string;
  streetName: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  image?: string;
  weight?: number;
  productType?: string;
}

interface QuoteLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unOrdered?: number; // Items not in purchase orders
  customName?: string;
  isCustom?: boolean;
  customMargin?: number;
}

interface JobSection {
  id: string;
  name: string;
  description?: string;
  items: QuoteLineItem[];
}

interface FinalQuoteData {
  customer: Customer;
  projectName: string;
  quoteId: string;
  referenceNumber: string;
  jobSections: JobSection[];
  accounting: {
    accountNumber: string;
    gstRate: string;
    gstAmount: number;
  };
  delivery: {
    method: 'delivery' | 'pickup' | 'courier';
    address: CustomerLocation;
    isAddressConfirmed: boolean;
    contactName: string;
    contactPhone: string;
  };
  totals: {
    subtotal: number;
    gst: number;
    total: number;
    weight: number;
    area?: number;
  };
  comments?: string;
  standardText?: string;
}

interface FinalQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuoteGenerated: () => void;
  quoteData: FinalQuoteData;
}

// PDF Settings Interface
interface PDFSettings {
  hideTotalPrice: boolean;
  hideItemPrice: boolean;
  hideItems: boolean;
  hideCustomProcess: boolean;
  hidePaymentDetails: boolean;
  hideDescription: boolean;
  insertAcceptanceSignature: boolean;
  hideProductType: boolean;
  hideCustomText: boolean;
  showKitItems: boolean;
}

// Email Interface
interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export default function FinalQuoteModal({
  isOpen,
  onClose,
  onQuoteGenerated,
  quoteData
}: FinalQuoteModalProps) {
  // Quote status
  const [quoteDate] = useState(new Date());
  const [sentStatus, setSentStatus] = useState<'not_sent' | 'sent'>('not_sent');
  const [hasOrders, setHasOrders] = useState(false);

  // PDF Settings
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    hideTotalPrice: false,
    hideItemPrice: false,
    hideItems: false,
    hideCustomProcess: false,
    hidePaymentDetails: false,
    hideDescription: false,
    insertAcceptanceSignature: true,
    hideProductType: false,
    hideCustomText: false,
    showKitItems: true
  });

  // Internal comments
  const [internalComments, setInternalComments] = useState('');

  // Email composition
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Quote ${quoteData.quoteId} - ${quoteData.projectName}`);
  
  // Template system
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [emailBody, setEmailBody] = useState(`Dear ${quoteData.customer.primaryContact.firstName},

Please find attached your quote for ${quoteData.projectName}.

Quote Details:
- Quote ID: ${quoteData.quoteId}
- Total Amount: $${quoteData.totals.total.toFixed(2)} (inc GST)
- Delivery Method: ${quoteData.delivery.method.charAt(0).toUpperCase() + quoteData.delivery.method.slice(1)}

Please don't hesitate to contact us if you have any questions.

Best regards,
Your SalesKik Team`);
  const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[]>([
    {
      id: '1',
      name: `Quote_${quoteData.quoteId}.pdf`,
      size: '245 KB',
      type: 'PDF'
    }
  ]);

  // Mail history
  const [mailHistory, setMailHistory] = useState<Array<{
    id: string;
    date: Date;
    type: 'quote' | 'invoice' | 'other';
    recipient: string;
    subject: string;
  }>>([]);

  // Load PDF settings from company settings (placeholder)
  useEffect(() => {
    const savedSettings = localStorage.getItem('saleskik-pdf-settings');
    if (savedSettings) {
      setPdfSettings(JSON.parse(savedSettings));
    }
    
    // Load active template and company profile
    loadTemplateAndProfile();
  }, []);
  
  const loadTemplateAndProfile = async () => {
    try {
      // Load active template
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      
      console.log('Loading template ID:', activeTemplateId);
      console.log('Available templates:', savedTemplates);
      
      if (savedTemplates && activeTemplateId) {
        const templates = JSON.parse(savedTemplates);
        const template = templates.find((t: any) => t.id === activeTemplateId);
        if (template) {
          setActiveTemplate(template);
          console.log('Loaded template:', template);
        } else {
          console.log('Template not found, using first available template');
          if (templates.length > 0) {
            setActiveTemplate(templates[0]);
          }
        }
      }
      
      // Load company profile from multiple sources
      const savedProfile = localStorage.getItem('companyProfile');
      const companyName = localStorage.getItem('companyName');
      const companyLogo = localStorage.getItem('companyLogo');
      
      let profile: any = {};
      
      if (savedProfile) {
        profile = JSON.parse(savedProfile);
      }
      
      // Override with individual settings if available
      if (companyName) profile.name = companyName;
      if (companyLogo) profile.logo = companyLogo;
      
      console.log('Loaded company profile:', profile);
      setCompanyProfile(profile);
      
    } catch (error) {
      console.error('Error loading template and profile:', error);
    }
  };

  // Update PDF setting
  const updatePDFSetting = (key: keyof PDFSettings, value: boolean) => {
    const newSettings = { ...pdfSettings, [key]: value };
    setPdfSettings(newSettings);
    localStorage.setItem('saleskik-pdf-settings', JSON.stringify(newSettings));
  };

  // Generate and view quote
  const generateQuote = () => {
    try {
      console.log('Quote Data:', quoteData);
      console.log('Active Template:', activeTemplate);
      console.log('Company Profile:', companyProfile);
      
      const htmlContent = generateTemplateQuote();
      console.log('Generated HTML:', htmlContent.substring(0, 500) + '...');
      
      // Open in new window for viewing/printing
      const newWindow = window.open('', '_blank', 'width=800,height=1000');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Add print and PDF generation options
        setTimeout(() => {
          const printButton = newWindow.document.createElement('button');
          printButton.innerHTML = '🖨️ Print';
          printButton.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 1000; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
          printButton.onclick = () => newWindow.print();
          
          const pdfButton = newWindow.document.createElement('button');
          pdfButton.innerHTML = '📄 Save as PDF';
          pdfButton.style.cssText = 'position: fixed; top: 10px; left: 120px; z-index: 1000; padding: 10px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;';
          pdfButton.onclick = () => {
            newWindow.print(); // Browser's print dialog includes PDF option
          };
          
          newWindow.document.body.appendChild(printButton);
          newWindow.document.body.appendChild(pdfButton);
        }, 500);
        
        newWindow.focus();
      }
      
      // Mark as completed
      onQuoteGenerated();
    } catch (error) {
      console.error('Error generating quote:', error);
      alert('Error generating quote. Please try again.');
    }
  };
  
  // Download HTML version
  const downloadQuote = async () => {
    try {
      console.log('Starting download...');
      console.log('Quote data available:', !!quoteData);
      
      const htmlContent = generateTemplateQuote();
      console.log('HTML content generated, length:', htmlContent.length);
      
      if (!htmlContent || htmlContent.length < 100) {
        throw new Error('Generated content is too short or empty');
      }
      
      // Create HTML file download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      console.log('Blob created, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote_${quoteData.quoteId}_${new Date().toISOString().split('T')[0]}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      console.log('Link created and added to DOM');
      
      link.click();
      console.log('Download triggered');
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Cleanup completed');
      }, 100);
      
      alert('Quote downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      alert(`Error downloading quote: ${error.message}. Please try again.`);
    }
  };

  // Generate quote using the clean template function
  const generateTemplateQuote = () => {
    const template = activeTemplate;
    const globalStyling = template?.globalStyling || {
      fontFamily: 'Inter',
      primaryColor: '#3b82f6',
      secondaryColor: '#1d4ed8',
      tableHeaderColor: '#3b82f6',
      accentColor: '#059669'
    };
    
    return generateQuoteTemplate(quoteData, globalStyling, companyProfile, pdfSettings);
  };
    
    // Generate valid until date (30 days from now)
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote ${quoteData.quoteId}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      font-family: ${globalStyling.fontFamily || 'Inter, sans-serif'}; 
      margin: 0; 
      padding: 0;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 24px;
      border-radius: 8px;
      background: linear-gradient(to right, ${globalStyling.primaryColor || '#3b82f6'}, ${globalStyling.secondaryColor || '#1d4ed8'});
      color: white;
    }
    .company-info {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
    }
    .company-details {
      color: white;
    }
    .company-details h1 {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 12px 0;
    }
    .company-details p {
      margin: 4px 0;
      opacity: 0.9;
      font-size: 11px;
    }
    .document-info {
      text-align: right;
    }
    .document-info h2 {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 12px 0;
    }
    .info-box {
      background: rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 12px;
      font-size: 11px;
      min-width: 150px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .info-row:last-child { margin-bottom: 0; }
    .customer-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .customer-section h3 {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 11px;
      color: ${globalStyling.primaryColor || '#3b82f6'};
    }
    .customer-section p {
      margin: 4px 0;
      font-size: 11px;
    }
    .items-section {
      margin-bottom: 24px;
    }
    .items-section h3 {
      font-weight: bold;
      margin-bottom: 12px;
      font-size: 11px;
      color: ${globalStyling.primaryColor || '#3b82f6'};
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #9ca3af;
      padding: 8px;
      text-align: left;
    }
    .items-table th {
      background: ${globalStyling.tableHeaderColor || globalStyling.primaryColor || '#3b82f6'};
      color: white;
      font-weight: bold;
      font-size: 10px;
    }
    .items-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-box {
      width: 200px;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 12px;
      border: 1px solid #e5e7eb;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .totals-total {
      border-top: 2px solid ${globalStyling.primaryColor || '#3b82f6'};
      padding-top: 8px;
      margin-top: 8px;
      font-weight: bold;
      font-size: 13px;
      color: ${globalStyling.accentColor || '#059669'};
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 24px;
    }
    .standard-text {
      margin: 24px 0;
      padding: 16px;
      background: #f8f9fa;
      border-left: 4px solid ${globalStyling.primaryColor || '#3b82f6'};
      font-size: 10px;
      white-space: pre-wrap;
    }
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="max-w-[180mm] mx-auto bg-white p-6" style="font-family: ${globalStyling.fontFamily || 'Inter, sans-serif'}; font-size: 12px; line-height: 1.4;">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6 p-6 rounded" style="background: linear-gradient(to right, ${globalStyling.primaryColor || '#3b82f6'}, ${globalStyling.secondaryColor || '#1d4ed8'}); color: white;">
      <div class="flex items-start gap-6">
        <!-- Logo -->
        <div>
          ${companyProfile?.logo ? `
            <img src="${companyProfile.logo}" alt="Company Logo" class="w-20 h-20 object-contain bg-white/20 rounded p-2" />
          ` : `
            <div class="w-20 h-20 bg-white/20 rounded flex items-center justify-center">
              <span class="text-white font-bold text-3xl">${(companyProfile?.name || (companyProfile?.name || 'Your Company') || 'C').charAt(0)}</span>
            </div>
          `}
        </div>
        
        <!-- Company Info -->
        <div>
          <h1 class="text-2xl font-bold mb-3">${companyProfile?.name || (companyProfile?.name || 'Your Company') || 'Your Company'}</h1>
          <div class="text-sm space-y-1 opacity-90">
            <p>${companyProfile?.address || '123 Business Street'}</p>
            <p>Melbourne, VIC 3000</p>
            <p>${companyProfile?.phone || '+61 3 9876 5432'}</p>
            <p>${companyProfile?.email || 'info@company.com.au'}</p>
          </div>
        </div>
      </div>
      
      <!-- Document Info -->
      <div class="text-right">
        <h2 class="text-xl font-bold mb-3">QUOTE</h2>
        <div class="bg-white/20 rounded p-3 text-sm space-y-1 min-w-[150px]">
          <div class="flex justify-between">
            <span>Quote No:</span>
            <span class="font-semibold">${quoteData.quoteId}</span>
          </div>
          <div class="flex justify-between">
            <span>Date:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="flex justify-between">
            <span>Valid Until:</span>
            <span>${validUntilDate.toLocaleDateString()}</span>
          </div>
          ${quoteData.referenceNumber ? `
          <div class="flex justify-between">
            <span>Reference:</span>
            <span>${quoteData.referenceNumber}</span>
          </div>` : ''}
        </div>
      </div>
    </div>
  
    <!-- Customer Info -->
    <div class="mb-6 p-4 bg-gray-100 rounded">
      <h3 class="font-semibold mb-2 text-sm" style="color: ${globalStyling.primaryColor || '#3b82f6'}">Bill To:</h3>
      <div class="text-sm">
        <p class="font-semibold">${quoteData.customer.name}</p>
        ${quoteData.delivery.address ? `
        <p>${quoteData.delivery.address.streetNumber} ${quoteData.delivery.address.streetName}</p>
        <p>${quoteData.delivery.address.suburb}, ${quoteData.delivery.address.state} ${quoteData.delivery.address.postcode}</p>` : ''}
        ${quoteData.customer.phone ? `<p>Phone: ${quoteData.customer.phone}</p>` : ''}
        ${quoteData.customer.email ? `<p>Email: ${quoteData.customer.email}</p>` : ''}
      </div>
    </div>
  
  <!-- Project Information -->
  ${quoteData.projectName ? `
  <div class="section">
    <h3 style="color: ${globalStyling.primaryColor || '#3b82f6'}; margin-bottom: 10px;">Project Details:</h3>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
      <p style="margin: 0; font-weight: bold;">${quoteData.projectName}</p>
      ${quoteData.referenceNumber ? `<p style="margin: 5px 0;">Reference: ${quoteData.referenceNumber}</p>` : ''}
    </div>
  </div>` : ''}
  
  <!-- Job Sections -->
  ${quoteData.jobSections.map(section => `
    <div class="section">
      <h3 style="color: ${globalStyling.primaryColor || '#3b82f6'}; margin-bottom: 15px;">${section.name}</h3>
      ${section.description ? `<p style="margin-bottom: 15px; font-style: italic; color: #666;">${section.description}</p>` : ''}
      
      <table class="table">
        <thead>
          <tr>
            <th style="width: 50%;">Description</th>
            <th style="width: 15%; text-align: center;">Qty</th>
            <th style="width: 17.5%; text-align: right;">Unit Price</th>
            <th style="width: 17.5%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${section.items.map((item, index) => `
            <tr style="${index % 2 === 1 ? 'background: #f8f9fa;' : ''}">
              <td>
                <strong>${item.customName || item.product.name}</strong>
                <br><small style="color: #666;">SKU: ${item.product.code}</small>
                ${item.isCustom ? '<br><small style="color: #7c3aed; font-weight: bold;">Custom Item</small>' : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold;">$${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  
  <!-- Comments -->
  ${quoteData.comments ? `
  <div class="section">
    <h3 style="color: ${globalStyling.primaryColor || '#3b82f6'}; margin-bottom: 10px;">Comments:</h3>
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px;">
      <p style="margin: 0; white-space: pre-wrap;">${quoteData.comments}</p>
    </div>
  </div>` : ''}
  
  <!-- Totals -->
  <div class="totals">
    <div style="text-align: right; max-width: 300px; margin-left: auto;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Subtotal:</span>
        <span>$${quoteData.totals.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>GST (${((quoteData.totals.gst / quoteData.totals.subtotal) * 100).toFixed(1)}%):</span>
        <span>$${quoteData.totals.gst.toFixed(2)}</span>
      </div>
      <div style="border-top: 2px solid ${globalStyling.primaryColor || '#3b82f6'}; padding-top: 8px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: ${globalStyling.accentColor || '#059669'};">
          <span>TOTAL:</span>
          <span>$${quoteData.totals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Standard Text -->
  ${quoteData.standardText ? `
  <div class="footer">
    <div style="white-space: pre-wrap; line-height: 1.4;">${quoteData.standardText}</div>
  </div>` : ''}
  
  <!-- Company Footer -->
  <div class="footer">
    <div style="text-align: center; padding-top: 20px;">
      <p style="margin: 0;">Quote valid for 30 days from date issued</p>
      <p style="margin: 5px 0 0 0;">Thank you for choosing ${companyProfile?.name || (companyProfile?.name || 'Your Company')}!</p>
    </div>
  </div>
</body>
</html>`;
  };
  
  // Fallback quote when no template is available
  const generateFallbackQuote = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote ${quoteData.quoteId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f8f9fa; font-weight: bold; }
    .totals { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>QUOTE ${quoteData.quoteId}</h1>
    <p>Date: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="section">
    <h3>Customer Information</h3>
    <p><strong>${quoteData.customer.name}</strong></p>
    <p>Email: ${quoteData.customer.email || 'N/A'}</p>
    <p>Phone: ${quoteData.customer.phone || 'N/A'}</p>
    <p>Price Tier: ${quoteData.customer.priceTier}</p>
  </div>
  
  ${quoteData.projectName ? `<div class="section"><h3>Project</h3><p>${quoteData.projectName}</p></div>` : ''}
  
  <div class="section">
    <h3>Items</h3>
    ${quoteData.jobSections.map(section => `
      <h4>${section.name}</h4>
      <table>
        <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${section.items.map(item => `
          <tr>
            <td>${item.customName || item.product.name}<br><small>SKU: ${item.product.code}</small></td>
            <td>${item.quantity}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
    `).join('')}
  </div>
  
  <div class="totals">
    <p>Subtotal: $${quoteData.totals.subtotal.toFixed(2)}</p>
    <p>GST: $${quoteData.totals.gst.toFixed(2)}</p>
    <p><strong>Total: $${quoteData.totals.total.toFixed(2)}</strong></p>
  </div>
  
  ${quoteData.standardText ? `<div class="section"><h3>Terms & Conditions</h3><pre>${quoteData.standardText}</pre></div>` : ''}
</body>
</html>`;
  };
  

  // Print quote
  const printQuote = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateTemplateQuote());
      printWindow.document.close();
      printWindow.print();
    }
  };


  // Print delivery docket
  const printDeliveryDocket = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateDeliveryDocket());
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate delivery docket
  const generateDeliveryDocket = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Docket - ${quoteData.quoteId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company-info { flex: 1; }
          .docket-info { flex: 1; text-align: right; }
          .customer-section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h2>Your Company Name</h2>
            <p>123 Business Street<br>
            City, State 1234<br>
            Phone: (03) 1234 5678</p>
          </div>
          <div class="docket-info">
            <h1>DELIVERY DOCKET</h1>
            <p><strong>Docket #:</strong> DD-${quoteData.quoteId}</p>
            <p><strong>Date:</strong> ${quoteDate.toLocaleDateString()}</p>
            <p><strong>Quote Ref:</strong> ${quoteData.quoteId}</p>
          </div>
        </div>

        <div class="customer-section">
          <h3>Delivery Details</h3>
          <p><strong>Customer:</strong> ${quoteData.customer.name}</p>
          <p><strong>Contact:</strong> ${quoteData.delivery.contactName}</p>
          <p><strong>Phone:</strong> ${quoteData.delivery.contactPhone}</p>
          <p><strong>Delivery Address:</strong><br>
            ${quoteData.delivery.address.streetNumber} ${quoteData.delivery.address.streetName}<br>
            ${quoteData.delivery.address.suburb}, ${quoteData.delivery.address.state} ${quoteData.delivery.address.postcode}
          </p>
          <p><strong>Delivery Method:</strong> ${quoteData.delivery.method.charAt(0).toUpperCase() + quoteData.delivery.method.slice(1)}</p>
        </div>

        <h3>Items for Delivery</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Weight (kg)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${quoteData.jobSections.map(section => 
              section.items.map(item => `
                <tr>
                  <td>${item.product.code}</td>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${((item.product.weight || 0) * item.quantity).toFixed(1)}</td>
                  <td></td>
                </tr>
              `).join('')
            ).join('')}
          </tbody>
        </table>

        <p><strong>Total Weight:</strong> ${quoteData.totals.weight.toFixed(1)} kg</p>
        
        <div class="signatures">
          <div class="signature-box">
            <p>Driver Signature</p>
          </div>
          <div class="signature-box">
            <p>Customer Signature</p>
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 12px;">
          <strong>Delivery Instructions:</strong> Please check all items upon delivery. 
          Any damage or discrepancies must be noted before signing.
        </p>
      </body>
      </html>
    `;
  };

  // Add email attachment
  const addEmailAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newAttachments = Array.from(files).map((file, index) => ({
          id: Date.now().toString() + index,
          name: file.name,
          size: (file.size / 1024).toFixed(0) + ' KB',
          type: file.type.toUpperCase().split('/')[1] || 'FILE'
        }));
        setEmailAttachments([...emailAttachments, ...newAttachments]);
      }
    };
    input.click();
  };

  // Remove email attachment
  const removeEmailAttachment = (attachmentId: string) => {
    setEmailAttachments(attachments => 
      attachments.filter(att => att.id !== attachmentId)
    );
  };

  // Send email
  const sendEmail = () => {
    // Simulate email sending
    const newMailEntry = {
      id: Date.now().toString(),
      date: new Date(),
      type: 'quote' as const,
      recipient: quoteData.customer.email || quoteData.customer.primaryContact.email || '',
      subject: emailSubject
    };

    setMailHistory([...mailHistory, newMailEntry]);
    setSentStatus('sent');
    setShowEmailComposer(false);
    
    // Update quote status to confirmed
    alert('Email sent successfully! Quote status updated to "Confirmed".');
    onQuoteGenerated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quote Details</h2>
              <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                <span><strong>Delivery:</strong> {quoteData.delivery.method.charAt(0).toUpperCase() + quoteData.delivery.method.slice(1)}</span>
                <span><strong>Quote ID:</strong> {quoteData.quoteId}</span>
                <span><strong>Customer:</strong> {quoteData.customer.name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Quote Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Information</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Contact Details</p>
                <p className="font-medium text-gray-900">{quoteData.delivery.contactName}</p>
                <p className="text-sm text-gray-600">{quoteData.delivery.contactPhone}</p>
                <p className="text-sm text-gray-600">{quoteData.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quote Date</p>
                <p className="font-medium text-gray-900">{quoteDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sent Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  sentStatus === 'sent' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {sentStatus === 'sent' ? 'Sent' : 'Not Yet Sent'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Orders</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  hasOrders 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasOrders ? 'Has Orders' : 'No Orders'}
                </span>
              </div>
            </div>
          </div>

          {/* Download and Print Options */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={downloadQuote}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                Download Quote
              </button>
              
              <button
                onClick={printQuote}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print Quote
              </button>
              
              <button
                onClick={printDeliveryDocket}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Print Delivery Docket
              </button>
            </div>
          </div>

          {/* PDF Settings */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Customize what appears on your quote PDF</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'hideTotalPrice', label: 'Hide Total Price' },
                { key: 'hideItemPrice', label: 'Hide Item Price' },
                { key: 'hideItems', label: 'Hide Items' },
                { key: 'hideCustomProcess', label: 'Hide Custom Process' },
                { key: 'hidePaymentDetails', label: 'Hide Payment Details' },
                { key: 'hideDescription', label: 'Hide Description' },
                { key: 'insertAcceptanceSignature', label: 'Insert Acceptance Signature' },
                { key: 'hideProductType', label: 'Hide Product Type' },
                { key: 'hideCustomText', label: 'Hide Custom Text' },
                { key: 'showKitItems', label: 'Show Kit Items' }
              ].map(setting => (
                <label key={setting.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pdfSettings[setting.key as keyof PDFSettings]}
                    onChange={(e) => updatePDFSetting(setting.key as keyof PDFSettings, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{setting.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Final Products Table */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Quote Items</h3>
            
            <div className="space-y-6">
              {quoteData.jobSections.map(section => (
                <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{section.name}</h4>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name/Description</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Image</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Un-ordered</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {section.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-900">{item.product.productType || 'Standard'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-gray-900">{item.product.code}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-900">{item.product.name}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                                <CubeIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm text-gray-500">{item.unOrdered || item.quantity}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm font-medium text-gray-900">${item.unitPrice.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm font-bold text-green-600">${item.totalPrice.toFixed(2)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Quote Totals */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${quoteData.totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">${quoteData.totals.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">${quoteData.totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Comments */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Comments</h3>
            <textarea
              value={internalComments}
              onChange={(e) => setInternalComments(e.target.value)}
              placeholder="Add any internal notes or comments about this quote..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email Composition */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Email Quote</h3>
              {!showEmailComposer && (
                <button
                  onClick={() => setShowEmailComposer(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2 inline" />
                  Compose Email
                </button>
              )}
            </div>

            {showEmailComposer && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                    <input
                      type="email"
                      value={quoteData.customer.email || quoteData.customer.primaryContact.email || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Attachments:</label>
                    <button
                      onClick={addEmailAttachment}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <PaperClipIcon className="w-4 h-4 mr-1" />
                      Add Files
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {emailAttachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-5 h-5 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{attachment.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({attachment.size})</span>
                        </div>
                        <button
                          onClick={() => removeEmailAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowEmailComposer(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            )}

            {/* Mail History */}
            {mailHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Mail History</h4>
                <div className="space-y-2">
                  {mailHistory.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                        <p className="text-xs text-gray-500">
                          Sent to {entry.recipient} on {entry.date.toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {entry.type.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={generateQuote}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Generate Final Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}