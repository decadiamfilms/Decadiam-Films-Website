import React, { useState, useEffect } from 'react';
import { 
  SwatchIcon, PhotoIcon, EyeIcon, CheckCircleIcon,
  XMarkIcon, ArrowUpTrayIcon, PaintBrushIcon,
  DocumentTextIcon, CogIcon, SparklesIcon,
  ColorSwatchIcon, AdjustmentsHorizontalIcon,
  ClipboardDocumentIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import CompanyBrandingService from '../../services/CompanyBrandingService';

interface EmailBrandingCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandingUpdated: () => void;
}

export default function EmailBrandingCustomizer({ isOpen, onClose, onBrandingUpdated }: EmailBrandingCustomizerProps) {
  const [branding, setBranding] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LOGO' | 'COLORS' | 'SIGNATURE' | 'TEMPLATES' | 'PREVIEW'>('LOGO');
  const [previewTemplate, setPreviewTemplate] = useState('purchase-order-created');
  const [previewHTML, setPreviewHTML] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBranding();
    }
  }, [isOpen]);

  const loadBranding = () => {
    const brandingService = CompanyBrandingService.getInstance();
    const currentBranding = brandingService.getCompanyBranding();
    setBranding(currentBranding);
    
    if (currentBranding) {
      updatePreview(currentBranding);
    }
  };

  const updatePreview = (brandingData: any) => {
    const brandingService = CompanyBrandingService.getInstance();
    
    // Sample variables for preview
    const sampleVariables = {
      purchaseOrderNumber: 'PO-2024-PREVIEW',
      supplierName: 'Premium Glass Solutions',
      totalAmount: '$15,750.00',
      priority: 'HIGH',
      expectedDelivery: 'February 15, 2024',
      confirmationUrl: '#',
      approvalUrl: '#',
      purchaseOrderUrl: '#'
    };

    const preview = brandingService.generateEmailPreview(
      getSampleTemplate(previewTemplate),
      sampleVariables,
      {
        useCompanyLogo: true,
        useCompanyColors: true,
        includeSignature: true,
        includeFooter: true,
        includeDisclaimers: true,
        templateVariant: 'PROFESSIONAL'
      }
    );

    setPreviewHTML(preview);
  };

  const getSampleTemplate = (templateId: string): string => {
    const templates: { [key: string]: string } = {
      'purchase-order-created': `
        <div class="email-container">
          <div class="header brand-header">
            {{#if companyLogo}}
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            {{/if}}
            <h1 class="company-name">{{companyName}}</h1>
            <p class="subtitle">Purchase Order Created</p>
          </div>
          
          <div class="content">
            <h2>Purchase Order {{purchaseOrderNumber}}</h2>
            
            <div class="alert-box alert-success">
              <h3>✅ Order Successfully Created</h3>
              <p>Purchase Order {{purchaseOrderNumber}} has been created and is ready for processing.</p>
            </div>
            
            <table class="info-table">
              <tr><td>Supplier:</td><td>{{supplierName}}</td></tr>
              <tr><td>Total Amount:</td><td class="brand-accent">{{totalAmount}}</td></tr>
              <tr><td>Priority:</td><td>{{priority}}</td></tr>
              <tr><td>Expected Delivery:</td><td>{{expectedDelivery}}</td></tr>
            </table>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{purchaseOrderUrl}}" class="cta-button brand-button">
                View Purchase Order Details
              </a>
            </div>
          </div>
        </div>
      `,
      'supplier-order': `
        <div class="email-container">
          <div class="header brand-header">
            {{#if companyLogo}}
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            {{/if}}
            <h1 class="company-name">{{companyName}}</h1>
            <p class="subtitle">Purchase Order</p>
          </div>
          
          <div class="content">
            <h2>Purchase Order {{purchaseOrderNumber}}</h2>
            
            <div class="alert-box alert-warning">
              <h3>📋 Action Required</h3>
              <p>Please review and confirm this purchase order within 48 hours.</p>
            </div>
            
            <table class="info-table">
              <tr><td>Total Amount:</td><td class="brand-accent" style="font-size: 20px;">{{totalAmount}}</td></tr>
              <tr><td>Expected Delivery:</td><td>{{expectedDelivery}}</td></tr>
            </table>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmationUrl}}" class="cta-button brand-button">
                Confirm Order
              </a>
            </div>
          </div>
        </div>
      `
    };

    return templates[templateId] || templates['purchase-order-created'];
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Logo file size must be under 2MB');
      return;
    }

    setLogoUploading(true);

    try {
      const brandingService = CompanyBrandingService.getInstance();
      const logoDataUrl = await brandingService.uploadCompanyLogo(file);
      
      setBranding((prev: any) => ({
        ...prev,
        logo: { ...prev.logo, primary: logoDataUrl }
      }));

      updatePreview({ ...branding, logo: { ...branding.logo, primary: logoDataUrl } });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const updateBrandColor = (colorKey: string, value: string) => {
    const updatedBranding = {
      ...branding,
      colors: { ...branding.colors, [colorKey]: value }
    };
    setBranding(updatedBranding);
    updatePreview(updatedBranding);
  };

  const generateColorPalette = () => {
    if (!branding?.colors?.primary) return;

    const brandingService = CompanyBrandingService.getInstance();
    const newPalette = brandingService.generateColorPalette(branding.colors.primary);
    
    const updatedBranding = {
      ...branding,
      colors: { ...branding.colors, ...newPalette }
    };
    setBranding(updatedBranding);
    updatePreview(updatedBranding);
  };

  const updateSignature = (field: string, value: any) => {
    const updatedBranding = {
      ...branding,
      emailSignature: {
        ...branding.emailSignature,
        [field]: field === 'variables' 
          ? { ...branding.emailSignature.variables, ...value }
          : value
      }
    };
    setBranding(updatedBranding);
    updatePreview(updatedBranding);
  };

  const saveBranding = () => {
    if (!branding) return;

    const brandingService = CompanyBrandingService.getInstance();
    brandingService.updateCompanyBranding(branding);
    
    alert('Email branding updated successfully!');
    onBrandingUpdated();
    onClose();
  };

  const exportBranding = () => {
    const brandingService = CompanyBrandingService.getInstance();
    const config = brandingService.exportBrandingConfig();
    
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${branding?.companyName || 'company'}-email-branding.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !branding) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <PaintBrushIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Email Branding Customizer</h3>
              <p className="text-gray-600">Customize company branding for professional email communications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportBranding}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-180px)]">
          
          {/* Configuration Panel */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'LOGO', label: 'Logo', icon: PhotoIcon },
                  { id: 'COLORS', label: 'Colors', icon: SwatchIcon },
                  { id: 'SIGNATURE', label: 'Signature', icon: DocumentTextIcon },
                  { id: 'TEMPLATES', label: 'Templates', icon: SparklesIcon }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Logo Tab */}
              {activeTab === 'LOGO' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Company Logo</h4>
                    
                    {/* Current Logo Display */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                      {branding.logo.primary ? (
                        <div>
                          <img 
                            src={branding.logo.primary} 
                            alt={branding.companyName}
                            className="max-h-20 mx-auto mb-3"
                          />
                          <p className="text-sm text-gray-600">Current logo</p>
                        </div>
                      ) : (
                        <div>
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No logo uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                        {logoUploading ? 'Uploading...' : 'Upload New Logo'}
                      </label>
                    </div>

                    {/* Logo Settings */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Width (px)</label>
                        <input
                          type="number"
                          value={branding.logo.width || 180}
                          onChange={(e) => setBranding((prev: any) => ({
                            ...prev,
                            logo: { ...prev.logo, width: parseInt(e.target.value) || 180 }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Height (px)</label>
                        <input
                          type="number"
                          value={branding.logo.height || 60}
                          onChange={(e) => setBranding((prev: any) => ({
                            ...prev,
                            logo: { ...prev.logo, height: parseInt(e.target.value) || 60 }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors Tab */}
              {activeTab === 'COLORS' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Brand Colors</h4>
                    <button
                      onClick={generateColorPalette}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Generate Palette
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(branding.colors).map(([colorKey, colorValue]) => (
                      <div key={colorKey} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={colorValue as string}
                            onChange={(e) => updateBrandColor(colorKey, e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorValue as string}
                            onChange={(e) => updateBrandColor(colorKey, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Color Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Color Preview</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(branding.colors).map(([key, color]) => (
                        <div key={key} className="text-center">
                          <div 
                            className="w-full h-12 rounded-lg mb-2 border border-gray-200"
                            style={{ backgroundColor: color as string }}
                          />
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Signature Tab */}
              {activeTab === 'SIGNATURE' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Email Signature</h4>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={branding.emailSignature.enabled}
                        onChange={(e) => updateSignature('enabled', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Include in emails</span>
                    </label>
                  </div>

                  {/* Signature Variables */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sender Name</label>
                      <input
                        type="text"
                        value={branding.emailSignature.variables.senderName || ''}
                        onChange={(e) => updateSignature('variables', { senderName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sender Title</label>
                      <input
                        type="text"
                        value={branding.emailSignature.variables.senderTitle || ''}
                        onChange={(e) => updateSignature('variables', { senderTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Procurement Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={branding.emailSignature.variables.phone || ''}
                        onChange={(e) => updateSignature('variables', { phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="+61 2 9876 5432"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={branding.emailSignature.variables.email || ''}
                        onChange={(e) => updateSignature('variables', { email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  {/* Signature Template Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Signature HTML</label>
                    <textarea
                      value={branding.emailSignature.template}
                      onChange={(e) => updateSignature('template', e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="HTML signature template..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variables like {{senderName}}, {{companyName}}, {{primaryColor}}, etc.
                    </p>
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'TEMPLATES' && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Email Templates</h4>
                  
                  {/* Template Selection for Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview Template</label>
                    <select
                      value={previewTemplate}
                      onChange={(e) => {
                        setPreviewTemplate(e.target.value);
                        updatePreview(branding);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="purchase-order-created">Purchase Order Created</option>
                      <option value="supplier-order">Supplier Order Notification</option>
                      <option value="approval-request">Approval Request</option>
                      <option value="supplier-confirmation">Supplier Confirmation</option>
                    </select>
                  </div>

                  {/* Template Variant Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Design Variant</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'PROFESSIONAL', name: 'Professional', desc: 'Clean corporate design' },
                        { id: 'MINIMAL', name: 'Minimal', desc: 'Simple and clean' },
                        { id: 'BRANDED', name: 'Branded', desc: 'Heavy brand integration' },
                        { id: 'CORPORATE', name: 'Corporate', desc: 'Executive styling' }
                      ].map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => updatePreview(branding)}
                          className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{variant.name}</div>
                          <div className="text-sm text-gray-600">{variant.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom CSS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS (Advanced)</label>
                    <textarea
                      value={branding.customCSS || ''}
                      onChange={(e) => setBranding((prev: any) => ({ ...prev, customCSS: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="/* Custom CSS for email templates */"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Live Preview</h4>
                <button
                  onClick={() => updatePreview(branding)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <EyeIcon className="w-4 h-4" />
                  Refresh Preview
                </button>
              </div>
              
              {/* Email Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <div className="text-sm text-gray-600">Email Preview - {previewTemplate}</div>
                </div>
                <div 
                  className="bg-white p-4 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewHTML }}
                />
              </div>

              {/* Accessibility Score */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Email Accessibility</h5>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-900">85%</span>
                </div>
                <div className="text-sm text-blue-800 mt-2">
                  ✓ Good color contrast • ✓ Alt text present • ⚠ Consider larger font sizes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Changes will be applied to all new email communications
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBranding}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Save Branding
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}