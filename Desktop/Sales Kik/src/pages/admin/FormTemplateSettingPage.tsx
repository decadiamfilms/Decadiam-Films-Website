import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PlusIcon, EyeIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon,
  DocumentTextIcon, CheckIcon, ArrowLeftIcon, SparklesIcon,
  PhotoIcon, ChevronDownIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'signature' | 'logo' | 'heading';
  label: string;
  placeholder?: string;
  required: boolean;
  styling: {
    fontSize: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
    padding: string;
  };
}

interface CustomDropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

function CustomDropdown({ 
  label, 
  value, 
  placeholder, 
  options, 
  onChange,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full max-h-64 overflow-y-auto"
        >
          <div className="py-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                style={{ fontFamily: option.value === 'custom' ? undefined : option.value }}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormTemplate {
  id: string;
  name: string;
  documentType: string;
  description: string;
  fields: FormField[];
  globalStyling: {
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    headerStyle: 'gradient' | 'solid' | 'minimal';
    logoPosition: 'left' | 'right' | 'center';
    tableStyle: 'modern' | 'classic' | 'minimal';
    headerBackgroundColor: string;
    tableHeaderColor: string;
    textColor: string;
    accentColor: string;
    logoSize: number;
    showCompanyName: boolean;
    showLogo: boolean;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Print-Optimized Template Component
function PrintOptimizedTemplate({ template, companyProfile, companyLogo }: {
  template: FormTemplate;
  companyProfile: any;
  companyLogo: string;
}) {
  const { globalStyling } = template;

  return (
    <div className="max-w-[180mm] mx-auto bg-white p-6" style={{ fontFamily: globalStyling.fontFamily, fontSize: '12px', lineHeight: '1.4' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 p-6 rounded" style={{ 
        background: `linear-gradient(to right, ${globalStyling.primaryColor}, ${globalStyling.secondaryColor})`,
        color: 'white'
      }}>
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div>
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain bg-white/20 rounded p-2" />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded flex items-center justify-center">
                <span className="text-white font-bold text-3xl">E</span>
              </div>
            )}
          </div>
          
          {/* Company Info */}
          <div>
            <h1 className="text-2xl font-bold mb-3">{companyProfile?.name || 'Ecco Hardware'}</h1>
            <div className="text-sm space-y-1 opacity-90">
              <p>123 Hardware Street</p>
              <p>Melbourne, VIC 3000</p>
              <p>+61 3 9876 5432</p>
              <p>info@eccohardware.com.au</p>
            </div>
          </div>
        </div>
        
        {/* Document Info */}
        <div className="text-right">
          <h2 className="text-xl font-bold mb-3">QUOTE</h2>
          <div className="bg-white/20 rounded p-3 text-sm space-y-1 min-w-[150px]">
            <div className="flex justify-between">
              <span>Quote No:</span>
              <span className="font-semibold">Q-2025-001</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>19/08/2025</span>
            </div>
            <div className="flex justify-between">
              <span>Valid Until:</span>
              <span>02/09/2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2 text-sm" style={{ color: globalStyling.primaryColor }}>Bill To:</h3>
        <div className="text-sm">
          <p className="font-semibold">ABC Construction Pty Ltd</p>
          <p>456 Industrial Estate Drive</p>
          <p>Melbourne, VIC 3000</p>
          <p>Phone: +61 3 9876 5432</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-sm" style={{ color: globalStyling.primaryColor }}>Items & Services</h3>
        <table className="w-full border border-gray-400 text-xs">
          <thead>
            <tr style={{ backgroundColor: globalStyling.tableHeaderColor, color: 'white' }}>
              <th className="border border-gray-400 p-2 text-left font-semibold">Description</th>
              <th className="border border-gray-400 p-2 text-center font-semibold">Qty</th>
              <th className="border border-gray-400 p-2 text-right font-semibold">Unit Price</th>
              <th className="border border-gray-400 p-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">Premium Hardware Kit - Heavy Duty</td>
              <td className="border border-gray-400 p-2 text-center">5</td>
              <td className="border border-gray-400 p-2 text-right">$150.00</td>
              <td className="border border-gray-400 p-2 text-right font-semibold">$750.00</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2">Professional Installation Service</td>
              <td className="border border-gray-400 p-2 text-center">1</td>
              <td className="border border-gray-400 p-2 text-right">$800.00</td>
              <td className="border border-gray-400 p-2 text-right font-semibold">$800.00</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2">Delivery & Setup</td>
              <td className="border border-gray-400 p-2 text-center">1</td>
              <td className="border border-gray-400 p-2 text-right">$180.00</td>
              <td className="border border-gray-400 p-2 text-right font-semibold">$180.00</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2">2-Year Premium Warranty</td>
              <td className="border border-gray-400 p-2 text-center">1</td>
              <td className="border border-gray-400 p-2 text-right">$290.00</td>
              <td className="border border-gray-400 p-2 text-right font-semibold">$290.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-48 bg-gray-100 rounded p-3 border">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>$1,820.00</span>
            </div>
            <div className="flex justify-between">
              <span>GST (10%):</span>
              <span>$182.00</span>
            </div>
            <div className="border-t border-gray-400 pt-2 mt-2">
              <div className="flex justify-between font-bold text-base" style={{ color: globalStyling.accentColor }}>
                <span>TOTAL:</span>
                <span>$2,002.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-3">
        <p className="mb-1">Payment Terms: Net 30 days | ABN: 12 345 678 901</p>
        <p>Thank you for choosing {companyProfile?.name || 'Ecco Hardware'}!</p>
      </div>
    </div>
  );
}

export default function FormTemplateSettingPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'library' | 'configuration' | 'preview'>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    loadCompanyData();
    loadActiveTemplate();
  }, []);

  const loadActiveTemplate = () => {
    const savedActiveId = localStorage.getItem('saleskik-active-template');
    if (savedActiveId) {
      setActiveTemplateId(savedActiveId);
    }
  };

  const setAsActiveTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    localStorage.setItem('saleskik-active-template', templateId);
    setShowConfirmModal(false);
    setPendingTemplateId(null);
  };

  const initiateTemplateChange = (templateId: string) => {
    setPendingTemplateId(templateId);
    setShowConfirmModal(true);
  };

  const changeTemplate = () => {
    setActiveTemplateId(null);
    localStorage.removeItem('saleskik-active-template');
    setCurrentView('library');
  };

  const loadCompanyData = async () => {
    try {
      // Load from localStorage first (for development)
      const savedLogo = localStorage.getItem('companyLogo');
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }

      const savedProfile = localStorage.getItem('companyProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setCompanyProfile(parsed);
        } catch (error) {
          console.error('Failed to parse company profile:', error);
        }
      }

      // Try to load from API if available
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const token = localStorage.getItem('token');
        
        if (token) {
          const response = await fetch(`${API_URL}/api/company`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const companyData = await response.json();
            setCompanyProfile(companyData);
            
            // Also try to get logo if exists
            if (companyData.logoUrl) {
              setCompanyLogo(companyData.logoUrl);
            }
          }
        }
      } catch (error) {
        console.log('API not available, using localStorage data');
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      // Always load fresh templates to ensure we get the new designs
      localStorage.removeItem('saleskik-form-templates');
      
      // Clean, set templates with color customization only
      const defaultTemplates: FormTemplate[] = [
          {
            id: 'saleskik-professional',
            name: 'SalesKik Professional',
            documentType: 'Template',
            description: 'Clean professional design with structured layout and blue gradient accents',
            fields: [],
            globalStyling: {
              fontFamily: 'Inter',
              primaryColor: '#3b82f6',
              secondaryColor: '#1d4ed8',
              backgroundColor: '#ffffff',
              headerStyle: 'gradient',
              logoPosition: 'left',
              tableStyle: 'modern',
              headerBackgroundColor: '#f8fafc',
              tableHeaderColor: '#3b82f6',
              textColor: '#334155',
              accentColor: '#3b82f6',
              logoSize: 50,
              showCompanyName: true,
              showLogo: true
            },
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'clean-modern',
            name: 'Clean Modern',
            documentType: 'Template',
            description: 'Clean modern design with green accents, numbered sections, and professional layout',
            fields: [],
            globalStyling: {
              fontFamily: 'Outfit',
              primaryColor: '#48bb78',
              secondaryColor: '#38a169',
              backgroundColor: '#ffffff',
              headerStyle: 'minimal',
              logoPosition: 'left',
              tableStyle: 'modern',
              headerBackgroundColor: '#ffffff',
              tableHeaderColor: '#2d3748',
              textColor: '#4a5568',
              accentColor: '#48bb78',
              logoSize: 45,
              showCompanyName: true,
              showLogo: true
            },
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      setTemplates(defaultTemplates);
      localStorage.setItem('saleskik-form-templates', JSON.stringify(defaultTemplates));
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (fieldType: string) => {
    setDraggedFieldType(fieldType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFieldType || !selectedTemplate) return;

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: draggedFieldType as any,
      label: `New ${draggedFieldType.charAt(0).toUpperCase() + draggedFieldType.slice(1)}`,
      placeholder: `Enter ${draggedFieldType}...`,
      required: false,
      styling: {
        fontSize: '14px',
        fontWeight: 'normal',
        color: '#374151',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        padding: '12px'
      }
    };

    const updatedTemplate = {
      ...selectedTemplate,
      fields: [...selectedTemplate.fields, newField],
      updatedAt: new Date()
    };

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );

    setTemplates(updatedTemplates);
    setSelectedTemplate(updatedTemplate);
    localStorage.setItem('saleskik-form-templates', JSON.stringify(updatedTemplates));
    setDraggedFieldType(null);
  };

  const handleRemoveField = (fieldId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      fields: selectedTemplate.fields.filter(f => f.id !== fieldId),
      updatedAt: new Date()
    };

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );

    setTemplates(updatedTemplates);
    setSelectedTemplate(updatedTemplate);
    localStorage.setItem('saleskik-form-templates', JSON.stringify(updatedTemplates));
  };

  const renderCompleteTemplate = (template: FormTemplate) => {
    const { globalStyling } = template;

    if (template.id === 'saleskik-professional') {
      return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontFamily: globalStyling.fontFamily }}>
          {/* Header */}
          <div 
            className="p-4 border-b-2"
            style={{ 
              background: `linear-gradient(135deg, ${globalStyling.headerBackgroundColor} 0%, #e2e8f0 100%)`,
              borderBottomColor: globalStyling.primaryColor
            }}
          >
            <div className="grid grid-cols-3 gap-4 items-start">
              {/* Company Info */}
              <div className="flex flex-col">
                {globalStyling.showLogo ? (
                  /* Logo Mode */
                  <div>
                    {companyLogo ? (
                      <img src={companyLogo} alt="Company Logo" className="object-contain mb-1" style={{ 
                        width: '120px', 
                        height: '120px' 
                      }} />
                    ) : (
                      <div 
                        className="rounded-lg flex items-center justify-center mb-1 shadow-lg"
                        style={{ 
                          width: '120px', 
                          height: '120px',
                          backgroundColor: globalStyling.primaryColor
                        }}
                      >
                        <span className="text-white font-bold text-4xl" style={{ letterSpacing: '-0.5px' }}>SK</span>
                      </div>
                    )}
                    {globalStyling.showCompanyName && (
                      <div>
                        <h2 className="text-lg font-semibold mb-1" style={{ color: globalStyling.textColor, lineHeight: '1.2' }}>
                          {companyProfile?.name || 'SalesKik Solutions'}
                        </h2>
                        <p className="text-sm mb-1" style={{ color: '#475569', lineHeight: '1.4' }}>
                          {companyProfile?.address || '123 Business Street, Suite 100'}
                        </p>
                        <p className="text-sm" style={{ color: '#475569' }}>
                          City, State 12345
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Text-Only Mode */
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: globalStyling.primaryColor, lineHeight: '1.2' }}>
                      {companyProfile?.name || 'SalesKik Solutions'}
                    </h2>
                    <p className="text-sm mb-1" style={{ color: '#475569', lineHeight: '1.4' }}>
                      {companyProfile?.address || '123 Business Street, Suite 100'}
                    </p>
                    <p className="text-sm" style={{ color: '#475569' }}>
                      City, State 12345
                    </p>
                  </div>
                )}
              </div>
              
              {/* Contact Details */}
              <div className="flex flex-col justify-start items-center text-center" style={{ marginTop: globalStyling.showCompanyName ? '58px' : '16px' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#475569' }}>
                  <strong>ABN:</strong> {companyProfile?.abn || '12 345 678 901'}
                </p>
                <p className="text-xs font-medium mb-1" style={{ color: '#475569' }}>
                  <strong>Phone:</strong> {companyProfile?.phone || '(555) 123-4567'}
                </p>
                <p className="text-xs font-medium" style={{ color: '#475569' }}>
                  <strong>Email:</strong> {companyProfile?.email || 'hello@saleskik.com'}
                </p>
              </div>
              
              {/* Document Details */}
              <div className="text-right bg-white p-4 rounded-lg border-l-4 shadow-sm" style={{ borderLeftColor: globalStyling.primaryColor, marginTop: '8px' }}>
                <div className="text-2xl font-bold mb-2" style={{ color: globalStyling.textColor, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                  [DOCUMENT TYPE]
                </div>
                <div className="text-base font-semibold mb-1" style={{ color: globalStyling.primaryColor }}>
                  [#QUO-2024-001]
                </div>
                <div className="text-xs mb-1" style={{ color: '#64748b' }}>
                  Date: [19 Aug 2024]
                </div>
                <div className="text-xs" style={{ color: '#64748b' }}>
                  Ref: [WEB-DEV-2024]
                </div>
              </div>
            </div>
          </div>

          {/* Document Information */}
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-xs font-semibold mb-2 pb-1 border-b border-gray-200 relative uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
              Document Information
              <div className="absolute bottom-0 left-0 w-6 h-0.5" style={{ background: `${globalStyling.primaryColor}` }}></div>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: globalStyling.primaryColor }}>
                  Bill To
                </h3>
                <p className="text-sm font-medium" style={{ color: globalStyling.textColor }}>[Customer Name]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>[Customer Company]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>[Customer Address]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>[City, State Postcode]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>ABN: [Customer ABN]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>[customer@email.com]</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: globalStyling.primaryColor }}>
                  Project Details
                </h3>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Project:</strong> [Project Name]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Valid Until:</strong> [Valid Date]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Sales Rep:</strong> [Rep Name]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Payment Terms:</strong> [Terms]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}><strong>Delivery:</strong> [Timeframe]</p>
              </div>
            </div>
          </div>

          {/* Items & Services */}
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-xs font-semibold mb-2 pb-1 border-b border-gray-200 relative uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
              Items & Services
              <div className="absolute bottom-0 left-0 w-6 h-0.5" style={{ background: `${globalStyling.primaryColor}` }}></div>
            </h2>
            <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <table className="w-full">
                <thead style={{ backgroundColor: globalStyling.tableHeaderColor }}>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Description</th>
                    <th className="p-3 text-right text-xs font-semibold text-white uppercase tracking-wide">Qty</th>
                    <th className="p-3 text-right text-xs font-semibold text-white uppercase tracking-wide">Rate</th>
                    <th className="p-3 text-right text-xs font-semibold text-white uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 border-b border-gray-100">
                      <div className="font-medium text-xs" style={{ color: globalStyling.textColor }}>[Service Name 1]</div>
                      <div className="text-xs mt-0" style={{ color: '#64748b' }}>[Service description]</div>
                    </td>
                    <td className="p-2 border-b border-gray-100 text-right text-xs" style={{ color: globalStyling.textColor }}>[1]</td>
                    <td className="p-2 border-b border-gray-100 text-right text-xs" style={{ color: globalStyling.textColor }}>[Rate]</td>
                    <td className="p-2 border-b border-gray-100 text-right text-xs font-medium" style={{ color: globalStyling.textColor }}>[Amount]</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-2">
                      <div className="font-medium text-xs" style={{ color: globalStyling.textColor }}>[Service Name 2]</div>
                      <div className="text-xs mt-0" style={{ color: '#64748b' }}>[Service description]</div>
                    </td>
                    <td className="p-2 text-right text-xs" style={{ color: globalStyling.textColor }}>[1]</td>
                    <td className="p-2 text-right text-xs" style={{ color: globalStyling.textColor }}>[Rate]</td>
                    <td className="p-2 text-right text-xs font-medium" style={{ color: globalStyling.textColor }}>[Amount]</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="min-w-64">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <span className="font-medium" style={{ color: globalStyling.textColor }}>[Subtotal]</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span style={{ color: '#64748b' }}>GST (10%):</span>
                    <span className="font-medium" style={{ color: globalStyling.textColor }}>[GST]</span>
                  </div>
                  <div className="flex justify-between py-3 border-2 rounded px-3 font-semibold text-base" style={{ 
                    borderColor: globalStyling.primaryColor,
                    background: `linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)`,
                    color: globalStyling.textColor
                  }}>
                    <span>Total:</span>
                    <span>[Total Amount]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold mb-4 pb-2 border-b-2 border-gray-200 relative uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
              Terms & Conditions
              <div className="absolute bottom-0 left-0 w-8 h-0.5" style={{ background: `${globalStyling.primaryColor}` }}></div>
            </h2>
            <div 
              className="p-4 rounded border-l-4 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)`,
                borderLeftColor: globalStyling.primaryColor
              }}
            >
              <ul className="space-y-2">
                <li className="text-xs relative pl-3" style={{ color: '#475569' }}>
                  <span className="absolute left-0 font-semibold" style={{ color: globalStyling.primaryColor }}>•</span>
                  Quote is valid for 30 days from the date issued
                </li>
                <li className="text-xs relative pl-3" style={{ color: '#475569' }}>
                  <span className="absolute left-0 font-semibold" style={{ color: globalStyling.primaryColor }}>•</span>
                  50% deposit required to commence work
                </li>
                <li className="text-xs relative pl-3" style={{ color: '#475569' }}>
                  <span className="absolute left-0 font-semibold" style={{ color: globalStyling.primaryColor }}>•</span>
                  Final payment due within 30 days of project completion
                </li>
                <li className="text-xs relative pl-3" style={{ color: '#475569' }}>
                  <span className="absolute left-0 font-semibold" style={{ color: globalStyling.primaryColor }}>•</span>
                  All work is guaranteed for 12 months from completion
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="p-4 text-center text-white"
            style={{ backgroundColor: globalStyling.textColor }}
          >
            <p className="text-xs mb-1 opacity-90">
              Thank you for choosing {companyProfile?.name || 'SalesKik Solutions'}
            </p>
            <p className="text-xs">
              Questions? Contact us at <span style={{ color: '#60a5fa' }}>{companyProfile?.email || 'hello@saleskik.com'}</span> or <span style={{ color: '#60a5fa' }}>{companyProfile?.phone || '(555) 123-4567'}</span>
            </p>
          </div>
        </div>
      );
    }

    if (template.id === 'clean-modern') {
      return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg overflow-hidden border-2 border-gray-100" style={{ fontFamily: 'Outfit' }}>
          {/* Header */}
          <div className="bg-white p-4 border-l-4" style={{ borderLeftColor: globalStyling.primaryColor }}>
            {/* Header Top */}
            <div className="flex justify-between items-center mb-3">
              {/* Brand Section - Large Logo Layout */}
              <div className="flex items-start gap-6">
                {globalStyling.showLogo && (
                  <div className="flex-shrink-0">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Company Logo" 
                        className="object-contain shadow-lg rounded-lg" 
                        style={{ width: '100px', height: '100px' }}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center shadow-lg rounded-lg border-2"
                        style={{ 
                          width: '100px',
                          height: '100px',
                          backgroundColor: '#f7fafc',
                          borderColor: globalStyling.primaryColor
                        }}
                      >
                        <div className="text-center">
                          <div 
                            className="text-2xl font-bold mb-1"
                            style={{ color: globalStyling.primaryColor }}
                          >
                            LOGO
                          </div>
                          <div 
                            className="text-xs font-medium"
                            style={{ color: globalStyling.primaryColor }}
                          >
                            PLACEHOLDER
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex-1 ${globalStyling.showLogo ? 'mt-4' : ''}`}>
                  {globalStyling.showCompanyName && (
                    <h1 className="text-2xl font-semibold mb-2" style={{ color: globalStyling.textColor, letterSpacing: '-0.3px' }}>
                      {companyProfile?.name || 'SalesKik Solutions'}
                    </h1>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm" style={{ color: '#718096' }}>
                      {companyProfile?.address || '123 Business Street, Suite 100'}
                    </p>
                    <p className="text-sm" style={{ color: '#718096' }}>
                      City, State 12345
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Document Badge */}
              <div 
                className="text-white px-4 py-2 rounded-lg text-center min-w-36 shadow-sm"
                style={{ backgroundColor: globalStyling.primaryColor }}
              >
                <div className="text-sm font-bold mb-1 uppercase tracking-wide">[DOCUMENT TYPE]</div>
                <div className="text-xs opacity-90 font-medium">[#QUO-2024-001]</div>
              </div>
            </div>
            
            {/* Header Info Grid */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: globalStyling.primaryColor }}>
                  Contact Details
                </h3>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>ABN:</strong> {companyProfile?.abn || '12 345 678 901'}
                </p>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>Phone:</strong> {companyProfile?.phone || '(555) 123-4567'}
                </p>
                <p className="text-xs" style={{ color: '#4a5568' }}>
                  <strong>Email:</strong> {companyProfile?.email || 'hello@saleskik.com'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: globalStyling.primaryColor }}>
                  Document Info
                </h3>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>Date:</strong> [19 Aug 2024]
                </p>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>Valid Until:</strong> [19 Sep 2024]
                </p>
                <p className="text-xs" style={{ color: '#4a5568' }}>
                  <strong>Reference:</strong> [WEB-DEV-2024]
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: globalStyling.primaryColor }}>
                  Project Details
                </h3>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>Project:</strong> [Website Development]
                </p>
                <p className="text-xs mb-1" style={{ color: '#4a5568' }}>
                  <strong>Payment Terms:</strong> [Net 30]
                </p>
                <p className="text-xs" style={{ color: '#4a5568' }}>
                  <strong>Delivery:</strong> [4-6 weeks]
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: globalStyling.primaryColor }}
              >
                01
              </div>
              <h2 className="text-base font-semibold uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
                Client Information
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-10">
              <div>
                <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide pb-2 border-b-2 border-gray-100" style={{ color: globalStyling.primaryColor }}>
                  Bill To
                </h4>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>[Customer Name]</strong></p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}>[Customer Company]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}>[Customer Address]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}>[City, State Postcode]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}>ABN: [Customer ABN]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}>[customer@email.com]</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide pb-2 border-b-2 border-gray-100" style={{ color: globalStyling.primaryColor }}>
                  Project Overview
                </h4>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Project Name:</strong> [Project Name]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Industry:</strong> [Industry Type]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Project Type:</strong> [Project Type]</p>
                <p className="text-sm mb-1" style={{ color: globalStyling.textColor }}><strong>Timeline:</strong> [Timeline]</p>
                <p className="text-sm" style={{ color: globalStyling.textColor }}><strong>Priority:</strong> [Priority Level]</p>
              </div>
            </div>
          </div>

          {/* Items & Services */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: globalStyling.primaryColor }}
              >
                02
              </div>
              <h2 className="text-base font-semibold uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
                Items & Services
              </h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <table className="w-full">
                  <thead style={{ backgroundColor: globalStyling.tableHeaderColor }}>
                    <tr>
                      <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wide">Service Description</th>
                      <th className="p-4 text-right text-xs font-semibold text-white uppercase tracking-wide">Qty</th>
                      <th className="p-4 text-right text-xs font-semibold text-white uppercase tracking-wide">Rate</th>
                      <th className="p-4 text-right text-xs font-semibold text-white uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-5 border-b border-gray-100">
                        <div className="font-semibold text-sm" style={{ color: globalStyling.textColor }}>[Service Name 1]</div>
                        <div className="text-xs mt-1 italic" style={{ color: '#718096' }}>[Service description and details]</div>
                      </td>
                      <td className="p-5 border-b border-gray-100 text-right text-sm" style={{ color: globalStyling.textColor }}>[1]</td>
                      <td className="p-5 border-b border-gray-100 text-right text-sm" style={{ color: globalStyling.textColor }}>[Rate]</td>
                      <td className="p-5 border-b border-gray-100 text-right text-sm font-semibold" style={{ color: globalStyling.textColor }}>[Amount]</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-5">
                        <div className="font-semibold text-sm" style={{ color: globalStyling.textColor }}>[Service Name 2]</div>
                        <div className="text-xs mt-1 italic" style={{ color: '#718096' }}>[Service description and details]</div>
                      </td>
                      <td className="p-5 text-right text-sm" style={{ color: globalStyling.textColor }}>[1]</td>
                      <td className="p-5 text-right text-sm" style={{ color: globalStyling.textColor }}>[Rate]</td>
                      <td className="p-5 text-right text-sm font-semibold" style={{ color: globalStyling.textColor }}>[Amount]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Totals Card */}
              <div className="flex justify-end mt-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 min-w-80 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span style={{ color: '#718096' }}>Subtotal:</span>
                      <span className="font-semibold" style={{ color: globalStyling.textColor }}>[Subtotal]</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span style={{ color: '#718096' }}>GST (10%):</span>
                      <span className="font-semibold" style={{ color: globalStyling.textColor }}>[GST]</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span style={{ color: '#718096' }}>Discount:</span>
                      <span className="font-semibold" style={{ color: globalStyling.textColor }}>-[Discount]</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 font-bold text-lg" style={{ 
                      borderTopColor: globalStyling.primaryColor,
                      color: globalStyling.textColor
                    }}>
                      <span>TOTAL AMOUNT:</span>
                      <span>[Total Amount]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: globalStyling.primaryColor }}
              >
                03
              </div>
              <h2 className="text-base font-semibold uppercase tracking-wide" style={{ color: globalStyling.textColor }}>
                Terms & Conditions
              </h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4" style={{ borderLeftColor: globalStyling.primaryColor }}>
              <div className="grid grid-cols-2 gap-5">
                <ul className="space-y-2">
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    Quote is valid for 30 days from the date issued
                  </li>
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    50% deposit required to commence work
                  </li>
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    Final payment due within 30 days of completion
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    Additional revisions may incur extra charges
                  </li>
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    All work is guaranteed for 12 months
                  </li>
                  <li className="text-sm relative pl-5" style={{ color: globalStyling.textColor }}>
                    <span className="absolute left-0 font-bold text-sm" style={{ color: globalStyling.primaryColor }}>✓</span>
                    GST is included in all prices where applicable
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="p-6 text-center text-white"
            style={{ backgroundColor: globalStyling.tableHeaderColor }}
          >
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium">
                  Thank you for choosing {companyProfile?.name || 'SalesKik Solutions'}
                </p>
              </div>
              <div className="flex gap-6 items-center text-xs">
                <span>Questions? Contact us at</span>
                <span style={{ color: globalStyling.primaryColor, fontWeight: '600' }}>{companyProfile?.email || 'hello@saleskik.com'}</span>
                <span>or</span>
                <span style={{ color: globalStyling.primaryColor, fontWeight: '600' }}>{companyProfile?.phone || '(555) 123-4567'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template.id === 'corporate-clean') {
      return (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-4xl mx-auto" style={{ fontFamily: globalStyling.fontFamily }}>
          {/* Simple header for now */}
          <div className="p-8 bg-blue-600 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="object-contain"
                    style={{ 
                      width: `${globalStyling.logoSize}px`, 
                      height: `${globalStyling.logoSize}px`
                    }}
                  />
                ) : (
                  <div 
                    className="bg-white/20 rounded flex items-center justify-center"
                    style={{ 
                      width: `${globalStyling.logoSize}px`, 
                      height: `${globalStyling.logoSize}px`
                    }}
                  >
                    <span className="text-white font-bold">L</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{companyProfile?.name || '[COMPANY NAME]'}</h1>
                  <p>[COMPANY ADDRESS]</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold">[DOCUMENT TYPE]</h2>
                <p>[DOCUMENT NUMBER] | [DATE]</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4">[CUSTOMER SECTION]</h3>
            <p>[CUSTOMER DETAILS]</p>
            
            <div className="mt-6">
              <table className="w-full border">
                <thead>
                  <tr style={{ backgroundColor: globalStyling.tableHeaderColor, color: 'white' }}>
                    <th className="border p-3 text-left">Description</th>
                    <th className="border p-3 text-center">Qty</th>
                    <th className="border p-3 text-right">Price</th>
                    <th className="border p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 text-xs">[PRODUCT 1]</td>
                    <td className="border p-2 text-xs text-center">[QTY]</td>
                    <td className="border p-2 text-xs text-right">[PRICE]</td>
                    <td className="border p-2 text-xs text-right">[TOTAL]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Default template
    return (
      <div className="bg-white shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: globalStyling.primaryColor }}>
            [DOCUMENT TYPE]
          </h1>
          <p style={{ color: globalStyling.textColor }}>[TEMPLATE CONTENT]</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader title="Form Templates" onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="Form Templates"
        userPlan="SMALL_BUSINESS"
        userRole="ADMIN"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <main className="flex-1 overflow-hidden">
        {currentView === 'library' ? (
          <>
            <div className="bg-gradient-to-r from-white via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Form Template Settings</h1>
                    <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-gray-600 max-w-2xl">
                    Create and customize professional document templates for quotes, invoices, orders, and reports.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('configuration')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Template
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Active Template Status */}
              {activeTemplateId && (
                <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">
                          Active Template: {templates.find(t => t.id === activeTemplateId)?.name}
                        </h3>
                        <p className="text-green-700">This template is currently being used for all your business documents</p>
                      </div>
                    </div>
                    <button
                      onClick={changeTemplate}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Change Template
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                  const isActive = activeTemplateId === template.id;
                  const isLocked = activeTemplateId && activeTemplateId !== template.id;
                  
                  return (
                    <div 
                      key={template.id} 
                      className={`rounded-lg shadow-sm border overflow-hidden transition-all ${
                        isActive 
                          ? 'border-green-400 bg-green-50 shadow-lg ring-2 ring-green-200' 
                          : isLocked 
                            ? 'border-gray-200 bg-gray-50 opacity-60' 
                            : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold ${isActive ? 'text-green-900' : 'text-gray-900'}`}>
                                {template.name}
                              </h4>
                              {isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  <CheckIcon className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              )}
                              {isLocked && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                  Locked
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                              isActive ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {template.documentType}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm mb-4 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {template.description}
                        </p>
                        
                        {isActive ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setCurrentView('preview');
                              }}
                              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setCurrentView('configuration');
                              }}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit Active
                            </button>
                          </div>
                        ) : isLocked ? (
                          <div className="text-center py-4">
                            <p className="text-xs text-gray-400 mb-2">Template locked</p>
                            <button
                              onClick={changeTemplate}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200 transition-colors"
                            >
                              Change Template
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setCurrentView('preview');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setCurrentView('configuration');
                              }}
                              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Select
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : currentView === 'configuration' ? (
          <>
            <div className="bg-gradient-to-r from-white via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('library')}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to Library</span>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Template Configuration</h1>
                    <p className="text-gray-600">Configure "{selectedTemplate?.name}" for your business documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentView('preview')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTemplate) {
                        initiateTemplateChange(selectedTemplate.id);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>Save as Active Template</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Universal Template Design</h3>
                <p className="text-gray-600">This template will be used for all your business documents. Customize the design and styling to match your brand.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {selectedTemplate && (
                    <TemplateCustomizer 
                      template={selectedTemplate}
                      onUpdateTemplate={(updatedTemplate) => {
                        const updatedTemplates = templates.map(t => 
                          t.id === selectedTemplate.id ? updatedTemplate : t
                        );
                        setTemplates(updatedTemplates);
                        setSelectedTemplate(updatedTemplate);
                        localStorage.setItem('saleskik-form-templates', JSON.stringify(updatedTemplates));
                      }}
                    />
                  )}
                </div>

                <div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                      <div className="text-sm text-gray-500">Design Framework</div>
                    </div>
                    {selectedTemplate && renderCompleteTemplate(selectedTemplate)}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-white via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('library')}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to Library</span>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Template Preview</h1>
                    <p className="text-gray-600">{selectedTemplate?.name}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPrintPreview(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>Print Preview</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('configuration')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Configure Template</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 p-8">
              {selectedTemplate && renderCompleteTemplate(selectedTemplate)}
            </div>
          </>
        )}
      </main>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && pendingTemplateId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckIcon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Save as Active Template
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to save "<span className="font-semibold text-gray-900">
                    {templates.find(t => t.id === pendingTemplateId)?.name}
                  </span>" as your active template?
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-blue-900 mb-2">This will:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use this design for ALL business documents</li>
                    <li>• Lock other templates from selection</li>
                    <li>• Apply to quotes, invoices, and orders</li>
                    <li>• Save your customizations</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingTemplateId(null);
                    }}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pendingTemplateId) {
                        setAsActiveTemplate(pendingTemplateId);
                        setCurrentView("library");
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Template Customizer Component
function TemplateCustomizer({ template, onUpdateTemplate }: {
  template: FormTemplate;
  onUpdateTemplate: (template: FormTemplate) => void;
}) {
  const [globalStyling, setGlobalStyling] = useState(template.globalStyling);

  const updateStyling = (field: string, value: any) => {
    const newStyling = { ...globalStyling, [field]: value };
    setGlobalStyling(newStyling);
    onUpdateTemplate({
      ...template,
      globalStyling: newStyling,
      updatedAt: new Date()
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Design Customization</h3>
      
      <div className="space-y-6">
        {/* Colors */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Brand Colors</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={globalStyling.primaryColor}
                  onChange={(e) => updateStyling("primaryColor", e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={globalStyling.primaryColor}
                  onChange={(e) => updateStyling("primaryColor", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={globalStyling.secondaryColor}
                  onChange={(e) => updateStyling("secondaryColor", e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={globalStyling.secondaryColor}
                  onChange={(e) => updateStyling("secondaryColor", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Table Header Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={globalStyling.tableHeaderColor}
                  onChange={(e) => updateStyling("tableHeaderColor", e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={globalStyling.tableHeaderColor}
                  onChange={(e) => updateStyling("tableHeaderColor", e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Controls */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Logo & Branding</h4>
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={globalStyling.showLogo}
                  onChange={(e) => updateStyling("showLogo", e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Show Logo</span>
                  <p className="text-xs text-gray-500">Display company logo (uncheck for text-only company name)</p>
                </div>
              </label>
            </div>

            {globalStyling.showLogo && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalStyling.showCompanyName}
                    onChange={(e) => updateStyling("showCompanyName", e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show Company Name</span>
                    <p className="text-xs text-gray-500">Display company name text below logo (useful for symbol/icon logos)</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
