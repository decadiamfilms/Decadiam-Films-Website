import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { generateInvoiceTemplate } from './InvoiceTemplate';

interface FinalInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
}

export default function FinalInvoiceModal({
  isOpen,
  onClose,
  invoiceData
}: FinalInvoiceModalProps) {
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState({
    hideTotalPrice: false,
    hideItemPrice: false,
    hideItems: false,
    hideDescription: false,
    hideCustomText: false,
    hideProductType: false,
    hidePaymentDetails: false,
    insertAcceptanceSignature: false,
    showKitItems: true
  });
  
  // Modal state
  const [currentView, setCurrentView] = useState<'preview' | 'email' | 'settings'>('preview');

  useEffect(() => {
    if (isOpen) {
      loadTemplateAndProfile();
    }
  }, [isOpen]);

  const loadTemplateAndProfile = async () => {
    try {
      // Load active template
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      
      if (savedTemplates && activeTemplateId) {
        const templates = JSON.parse(savedTemplates);
        const template = templates.find((t: any) => t.id === activeTemplateId);
        if (template) {
          setActiveTemplate(template);
        }
      }

      // Load company profile
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/company', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to load template and profile:', error);
    }
  };

  const generateInvoicePDF = () => {
    try {
      const globalStyling = activeTemplate?.globalStyling || {
        primaryColor: '#84cc16',
        fontFamily: 'Inter'
      };

      const invoiceHTML = generateInvoiceTemplate(invoiceData, globalStyling, companyProfile, pdfSettings);
      
      // Open in new window for PDF generation
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(invoiceHTML);
        pdfWindow.document.close();
        
        // Add print functionality
        setTimeout(() => {
          pdfWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF');
    }
  };

  const downloadInvoicePDF = () => {
    try {
      const globalStyling = activeTemplate?.globalStyling || {
        primaryColor: '#84cc16',
        fontFamily: 'Inter'
      };

      const invoiceHTML = generateInvoiceTemplate(invoiceData, globalStyling, companyProfile, pdfSettings);
      
      // Create downloadable HTML file
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceData.invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Invoice PDF - {invoiceData.invoiceId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(95vh-80px)]">
          {/* PDF Preview */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <iframe
                srcDoc={generateInvoiceTemplate(
                  invoiceData,
                  activeTemplate?.globalStyling || { primaryColor: '#84cc16', fontFamily: 'Inter' },
                  companyProfile,
                  pdfSettings
                )}
                className="w-full h-[800px] border border-gray-300 rounded-lg bg-white shadow-sm"
                title="Invoice Preview"
              />
            </div>
          </div>

          {/* Action Panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <div className="space-y-4">
              <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                <h3 className="font-semibold text-lime-800 mb-2">Invoice Information</h3>
                <div className="space-y-2 text-sm text-lime-700">
                  <p><span className="font-medium">ID:</span> {invoiceData.invoiceId}</p>
                  <p><span className="font-medium">Customer:</span> {invoiceData.customerName}</p>
                  <p><span className="font-medium">Amount:</span> ${invoiceData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p><span className="font-medium">Due:</span> {invoiceData.dueDate.toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span> {invoiceData.status.replace('invoice-', '').replace('-', ' ')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={generateInvoicePDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors font-medium"
                >
                  <PrinterIcon className="w-5 h-5" />
                  Print Invoice
                </button>
                
                <button
                  onClick={downloadInvoicePDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Download HTML
                </button>
                
                <button
                  onClick={() => {
                    // Navigate to invoices page
                    window.location.href = '/invoices';
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  View All Invoices
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Invoice ${invoiceData.invoiceId} - ${invoiceData.customerName} - $${invoiceData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
                      alert('Invoice details copied to clipboard');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Copy Invoice Details
                  </button>
                  <button
                    onClick={() => {
                      const emailSubject = `Invoice ${invoiceData.invoiceId} - ${invoiceData.customerName}`;
                      const emailBody = `Dear ${invoiceData.customerName},\n\nPlease find your invoice details below:\n\nInvoice ID: ${invoiceData.invoiceId}\nAmount: $${invoiceData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\nDue Date: ${invoiceData.dueDate.toLocaleDateString()}\n\nThank you for your business.`;
                      window.location.href = `mailto:${invoiceData.customerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    disabled={!invoiceData.customerEmail}
                  >
                    Email Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}