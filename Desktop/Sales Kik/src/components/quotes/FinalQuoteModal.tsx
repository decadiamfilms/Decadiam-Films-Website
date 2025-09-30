import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { generateQuoteTemplate } from './QuoteTemplate';

interface FinalQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuoteGenerated: () => void;
  quoteData: any;
}

export default function FinalQuoteModal({
  isOpen,
  onClose,
  onQuoteGenerated,
  quoteData
}: FinalQuoteModalProps) {
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
    insertAcceptanceSignature: true,
    showKitItems: true
  });
  
  // Email composition
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Quote ${quoteData.quoteId} - ${quoteData.projectName}`);
  const [emailBody, setEmailBody] = useState(`Dear ${quoteData.customer.name},\n\nPlease find attached your quote for ${quoteData.projectName}.\n\nQuote Details:\n- Quote ID: ${quoteData.quoteId}\n- Total Amount: $${quoteData.totals.total.toFixed(2)} (inc GST)\n\nPlease don't hesitate to contact us if you have any questions.\n\nBest regards,\nYour SalesKik Team`);
  
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
        } else if (templates.length > 0) {
          setActiveTemplate(templates[0]);
        }
      }
      
      // Load company profile
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
      
      // Load PDF settings
      const savedSettings = localStorage.getItem('saleskik-pdf-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setPdfSettings(settings.documentSettings?.quote || pdfSettings);
      }
      
    } catch (error) {
      console.error('Error loading template and profile:', error);
    }
  };
  
  // Update PDF setting
  const updatePDFSetting = (key: string, value: boolean) => {
    const newSettings = { ...pdfSettings, [key]: value };
    setPdfSettings(newSettings);
    localStorage.setItem('saleskik-pdf-settings', JSON.stringify({
      documentSettings: {
        quote: newSettings
      }
    }));
  };

  const generateQuote = () => {
    try {
      console.log('Starting quote generation...');
      console.log('Quote data:', quoteData);
      console.log('Active template:', activeTemplate);
      console.log('Template globalStyling:', activeTemplate?.globalStyling);
      console.log('Logo settings - showLogo:', activeTemplate?.globalStyling?.showLogo);
      console.log('Logo settings - showCompanyName:', activeTemplate?.globalStyling?.showCompanyName);
      console.log('Logo settings - logoSize:', activeTemplate?.globalStyling?.logoSize);
      console.log('Active template ID:', localStorage.getItem('saleskik-active-template'));
      console.log('All templates:', localStorage.getItem('saleskik-form-templates'));
      console.log('Company profile:', companyProfile);
      console.log('PDF settings:', pdfSettings);
      
      if (!quoteData) {
        alert('No quote data available');
        return;
      }
      
      const template = activeTemplate;
      const globalStyling = template?.globalStyling || {
        fontFamily: 'Inter',
        primaryColor: '#3b82f6',
        secondaryColor: '#1d4ed8',
        tableHeaderColor: '#3b82f6',
        accentColor: '#059669'
      };
      
      console.log('Using styling:', globalStyling);
      
      const htmlContent = generateQuoteTemplate(quoteData, globalStyling, companyProfile, pdfSettings);
      
      console.log('Generated HTML content length:', htmlContent.length);
      console.log('HTML preview:', htmlContent.substring(0, 200));
      
      if (!htmlContent || htmlContent.length < 100) {
        alert('Generated quote content is empty or too short');
        return;
      }
      
      // Open in new window
      const newWindow = window.open('', '_blank', 'width=800,height=1000');
      if (newWindow) {
        console.log('New window opened successfully');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Add print and PDF buttons
        setTimeout(() => {
          const printButton = newWindow.document.createElement('button');
          printButton.innerHTML = '🖨️ Print';
          printButton.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 1000; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
          printButton.onclick = () => newWindow.print();
          
          const pdfButton = newWindow.document.createElement('button');
          pdfButton.innerHTML = '📄 Save as PDF';
          pdfButton.style.cssText = 'position: fixed; top: 10px; left: 120px; z-index: 1000; padding: 10px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;';
          pdfButton.onclick = () => newWindow.print();
          
          newWindow.document.body.appendChild(printButton);
          newWindow.document.body.appendChild(pdfButton);
        }, 500);
        
        newWindow.focus();
      }
      
      console.log('Quote generation completed successfully');
      onQuoteGenerated();
    } catch (error) {
      console.error('Error generating quote:', error);
      alert(`Error generating quote: ${error}. Please try again.`);
    }
  };

  const downloadQuote = () => {
    try {
      const template = activeTemplate;
      const globalStyling = template?.globalStyling || {
        fontFamily: 'Inter',
        primaryColor: '#3b82f6',
        secondaryColor: '#1d4ed8',
        tableHeaderColor: '#3b82f6',
        accentColor: '#059669'
      };
      
      const htmlContent = generateQuoteTemplate(quoteData, globalStyling, companyProfile, pdfSettings);
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote_${quoteData.quoteId}_${new Date().toISOString().split('T')[0]}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      alert('Quote downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading quote. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Final Quote</h2>
            <p className="text-gray-600">Configure and generate your professional quote</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setCurrentView('preview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview & Generate
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              PDF Settings
            </button>
            <button
              onClick={() => setCurrentView('email')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentView === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Email & Send
            </button>
          </nav>
        </div>
        
        {/* Content based on active tab */}
        <div className="p-6">
          {currentView === 'preview' && (
            <div>
              <p className="text-gray-600 mb-6">Your quote is ready! Generate the final document using your template.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={generateQuote}
                  className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Generate Final Quote
                </button>
                
                <button
                  onClick={downloadQuote}
                  className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Download Quote
                </button>
                
                <button
                  onClick={() => {
                    const template = activeTemplate;
                    const globalStyling = template?.globalStyling || {
                      fontFamily: 'Inter',
                      primaryColor: '#3b82f6',
                      secondaryColor: '#1d4ed8'
                    };
                    
                    const htmlContent = generateQuoteTemplate(quoteData, globalStyling, companyProfile, pdfSettings);
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(htmlContent);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <PrinterIcon className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>
          )}
          
          {currentView === 'settings' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">PDF Settings</h3>
              <p className="text-gray-600 mb-6">Configure what information to include in the generated quote.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'hideTotalPrice', label: 'Hide Total Price', description: 'Remove total pricing from document' },
                  { key: 'hideItemPrice', label: 'Hide Item Price', description: 'Remove individual item pricing' },
                  { key: 'hideItems', label: 'Hide Items', description: 'Remove item details from document' },
                  { key: 'hideDescription', label: 'Hide Description', description: 'Remove item descriptions' },
                  { key: 'hideProductType', label: 'Hide Product Type', description: 'Remove product type/SKU information' },
                  { key: 'hideCustomText', label: 'Hide Custom Text', description: 'Remove comments and standard text sections' },
                  { key: 'insertAcceptanceSignature', label: 'Insert Acceptance Signature', description: 'Add signature field for acceptance' },
                  { key: 'showKitItems', label: 'Show Kit Items', description: 'Display individual kit components' }
                ].map(option => (
                  <div key={option.key} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id={option.key}
                      checked={pdfSettings[option.key as keyof typeof pdfSettings] || false}
                      onChange={(e) => updatePDFSetting(option.key, e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor={option.key} className="font-medium text-gray-900 cursor-pointer">
                        {option.label}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentView === 'email' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Email & Send</h3>
              <p className="text-gray-600 mb-6">Compose and send the quote directly to your customer.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      // In production, this would integrate with email service
                      alert('Email functionality would be integrated with your email service.');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Send Quote
                  </button>
                  
                  <button
                    onClick={() => {
                      // Save as draft
                      alert('Quote saved as draft.');
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}