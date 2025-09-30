import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  XMarkIcon, PencilIcon, PlusIcon, ChevronDownIcon,
  TruckIcon, MapPinIcon, PhoneIcon, UserIcon,
  CheckIcon, ExclamationTriangleIcon, InformationCircleIcon,
  BuildingOfficeIcon, CreditCardIcon, CalculatorIcon,
  DocumentTextIcon, TrashIcon, ChatBubbleLeftRightIcon, EyeIcon,
  DocumentDuplicateIcon, ClockIcon
} from '@heroicons/react/24/outline';
import FinalQuoteModal from './FinalQuoteModal';
import EnhancedQuoteModal from './EnhancedQuoteModal';

// Rich Text Editor Component
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  quoteItems?: any[];
}

function RichTextEditor({ value, onChange, placeholder = "Enter text...", minHeight = "100px", quoteItems = [] }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const aiDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // AI Functions using Claude Sonnet
  const handleAIAction = async (action: string) => {
    if (!value.trim() && action !== 'generate') {
      alert('Please enter some text first for AI to work with.');
      return;
    }

    setIsAIProcessing(true);
    setShowAIDropdown(false);

    try {
      let prompt = '';
      let currentText = value.replace(/<[^>]*>/g, '');

      switch (action) {
        case 'fix':
          prompt = `Please fix the formatting and grammar of this quote description: "${currentText}"`;
          break;
        case 'elaborate':
          prompt = `Please elaborate and expand on this quote description: "${currentText}"`;
          break;
        case 'generate':
          const productDetails = quoteItems.map(item => 
            `${item.product?.name} (SKU: ${item.product?.code}) - Quantity: ${item.quantity} - $${item.totalPrice?.toFixed(2)}`
          ).join('; ');
          prompt = `Generate a comprehensive, professional quote description based on these products: ${productDetails}. Create detailed, business-appropriate content explaining what we're providing.`;
          break;
        case 'simplify':
          prompt = `Please simplify this quote description: "${currentText}"`;
          break;
        case 'formalize':
          prompt = `Please rewrite this in a more formal, business tone: "${currentText}"`;
          break;
        case 'enhance':
          prompt = `Please enhance this with more compelling language: "${currentText}"`;
          break;
        case 'structure':
          prompt = `Please restructure this with better organization and bullet points: "${currentText}"`;
          break;
      }

      // Call Claude API
      const response = await fetch('/api/ai/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ prompt, model: 'claude-3-sonnet' })
      });

      if (response.ok) {
        const data = await response.json();
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || data.text;
          onChange(data.content || data.text);
        }
      } else {
        throw new Error('AI processing failed');
      }

    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback to high-quality template responses
      let fallbackContent = '';
      if (action === 'generate') {
        fallbackContent = '<p><strong>Project Overview:</strong> We are pleased to present this comprehensive quotation for your project requirements. Our experienced team will deliver exceptional quality and professional service.</p><p><strong>What\'s Included:</strong> All materials, professional installation, quality assurance, and comprehensive warranty coverage.</p>';
      } else if (action === 'fix') {
        fallbackContent = '<p>We are pleased to present this comprehensive quote for your project. Our team has carefully reviewed your requirements and selected high-quality materials to ensure exceptional results.</p>';
      }
      
      if (fallbackContent && editorRef.current) {
        editorRef.current.innerHTML = fallbackContent;
        onChange(fallbackContent);
      }
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Handle click outside to close AI dropdown
  React.useEffect(() => {
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

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="relative w-full">
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm relative w-full">
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
            {/* Left Group - Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('undo')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                title="Undo"
              >
                ↶
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('redo')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                title="Redo"
              >
                ↷
              </button>
            </div>

            {/* Center Group - Formatting */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('bold')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
                  isCommandActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('italic')}
                className={`px-3 py-2 rounded-md text-sm transition-all ${
                  isCommandActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('underline')}
                className={`px-3 py-2 rounded-md text-sm transition-all ${
                  isCommandActive('underline') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title="Underline"
              >
                <span className="underline">U</span>
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('justifyLeft')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Align Left"
              >
                ⫸
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('justifyCenter')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Align Center"
              >
                ≡
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('justifyRight')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Align Right"
              >
                ⫷
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('insertUnorderedList')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Bullet List"
              >
                •
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('insertOrderedList')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Numbered List"
              >
                1.
              </button>

              <select
                onChange={(e) => formatText('fontSize', e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:ring-1 focus:ring-blue-500 transition-colors"
                defaultValue="3"
              >
                <option value="1">8pt</option>
                <option value="2">10pt</option>
                <option value="3">12pt</option>
                <option value="4">14pt</option>
                <option value="5">18pt</option>
                <option value="6">24pt</option>
              </select>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatText('insertHorizontalRule')}
                className="px-3 py-2 rounded-md text-sm transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                title="Insert Line"
              >
                ━
              </button>
            </div>

            {/* Right Group - AI */}
            <div className="relative" ref={aiDropdownRef}>
              <button
                type="button"
                onClick={() => setShowAIDropdown(!showAIDropdown)}
                disabled={isAIProcessing}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isAIProcessing 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-sm'
                }`}
                title="AI Enhancement"
              >
                {isAIProcessing ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    AI...
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    ✨ AI
                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${showAIDropdown ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            className={`px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset text-base relative ${
              isActive ? 'bg-white' : 'bg-gray-50'
            }`}
            style={{ minHeight }}
            onInput={handleInput}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            suppressContentEditableWarning={true}
          />
          {!value && !isActive && (
            <div className="absolute top-4 left-4 text-gray-400 text-base italic pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {/* AI Dropdown - Fixed positioning to avoid clipping */}
      {showAIDropdown && !isAIProcessing && (
        <div className="fixed top-1/4 right-8 bg-white border-2 border-purple-200 rounded-xl shadow-2xl p-4 z-[70] w-80 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-3">
              <h4 className="font-bold text-gray-900 text-base mb-1">🤖 Claude Sonnet AI Assistant</h4>
              <p className="text-sm text-gray-600">Enhance your quote description with AI</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAIAction('fix')}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <div className="font-medium text-blue-900 text-base">🔧 Fix Formatting & Grammar</div>
                <div className="text-sm text-blue-700">Correct spelling, grammar, and formatting</div>
              </button>

              <button
                onClick={() => handleAIAction('elaborate')}
                className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <div className="font-medium text-green-900 text-base">📝 Elaborate & Expand</div>
                <div className="text-sm text-green-700">Add detail and professional language</div>
              </button>

              <button
                onClick={() => handleAIAction('generate')}
                className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <div className="font-medium text-purple-900 text-base">🎯 Generate from Products</div>
                <div className="text-sm text-purple-700">Create description based on quote items</div>
              </button>

              <button
                onClick={() => handleAIAction('simplify')}
                className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200"
              >
                <div className="font-medium text-yellow-900 text-base">✂️ Simplify & Clarify</div>
                <div className="text-sm text-yellow-700">Make it clearer and more concise</div>
              </button>

              <button
                onClick={() => handleAIAction('formalize')}
                className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <div className="font-medium text-indigo-900 text-base">🎩 Make More Formal</div>
                <div className="text-sm text-indigo-700">Convert to business-appropriate tone</div>
              </button>

              <button
                onClick={() => handleAIAction('enhance')}
                className="w-full text-left px-4 py-3 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <div className="font-medium text-rose-900 text-base">💎 Enhance Language</div>
                <div className="text-sm text-rose-700">Add compelling, professional terminology</div>
              </button>

              <button
                onClick={() => handleAIAction('structure')}
                className="w-full text-left px-4 py-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
              >
                <div className="font-medium text-teal-900 text-base">📋 Better Structure</div>
                <div className="text-sm text-teal-700">Organize with sections and bullet points</div>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 text-center">
                ⚡ Powered by Claude Sonnet • Professional AI Writing Assistant
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  isDeliveryAddress?: boolean;
}

interface Product {
  id: string;
  code: string;
  name: string;
  image?: string;
  weight?: number;
}

interface QuoteLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  jobName?: string;
  accountNumber?: string;
  gstRate?: string;
  internalNotes?: string;
}

interface JobSection {
  id: string;
  name: string;
  description?: string;
  items: QuoteLineItem[];
}

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateQuote: (finalQuoteData: FinalQuoteData) => void;
  onSaveDraft: () => void;
  onQuoteCompleted: () => void;
  customer: Customer;
  projectName: string;
  quoteId: string;
  referenceNumber: string;
  jobSections: JobSection[];
}

interface FinalQuoteData {
  customer: Customer;
  projectName: string;
  quoteId: string;
  referenceNumber: string;
  jobSections: JobSection[];
  optionGroups: {[category: string]: {name: string, description?: string, price: number}[]}; // Add grouped options
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
}

// GST Options
const GST_OPTIONS = [
  { value: '0-bas-excluded', label: '0% BAS Excluded', rate: 0 },
  { value: '0-gst-free-capital', label: '0% GST Free Capital', rate: 0 },
  { value: '0-gst-free-expenses', label: '0% GST Free Expenses', rate: 0 },
  { value: '0-gst-free-exports', label: '0% GST Free Exports', rate: 0 },
  { value: '0-gst-free-income', label: '0% GST Free Income', rate: 0 },
  { value: '10-gst-on-expenses', label: '10% GST on Expenses', rate: 0.1 },
  { value: '0-gst-on-imports', label: '0% GST on Imports', rate: 0 },
  { value: '10-gst-on-income', label: '10% GST on Income', rate: 0.1 },
  { value: '0-input-taxed', label: '0% Input Taxed', rate: 0 }
];

// Account Numbers
const ACCOUNT_NUMBERS = [
  { value: '41000', label: 'Sales - 41000 (Xero)', software: 'xero' },
  { value: '42000', label: 'Service Income - 42000 (Xero)', software: 'xero' },
  { value: '4-1000', label: 'Sales - 4-1000 (MYOB)', software: 'myob' },
  { value: '4000', label: 'Income - 4000 (QuickBooks)', software: 'quickbooks' }
];

// Service Types with measurement units
const SERVICE_TYPES = [
  { value: 'delivery', label: 'Delivery Service', measurementType: 'distance', unit: 'KM' },
  { value: 'installation', label: 'Installation Service', measurementType: 'time', unit: 'Hours' },
  { value: 'consultation', label: 'Consultation Service', measurementType: 'time', unit: 'Hours' },
  { value: 'packing', label: 'Packing Service', measurementType: 'quantity', unit: 'Items' },
  { value: 'site-preparation', label: 'Site Preparation', measurementType: 'area', unit: 'SqM' },
  { value: 'cleaning', label: 'Cleaning Service', measurementType: 'area', unit: 'SqM' },
  { value: 'waste-removal', label: 'Waste Removal', measurementType: 'weight', unit: 'KG' },
  { value: 'project-management', label: 'Project Management', measurementType: 'time', unit: 'Hours' },
  { value: 'design-service', label: 'Design Service', measurementType: 'time', unit: 'Hours' },
  { value: 'surveying', label: 'Site Surveying', measurementType: 'area', unit: 'SqM' },
  { value: 'maintenance', label: 'Maintenance Service', measurementType: 'time', unit: 'Hours' },
  { value: 'training', label: 'Training Service', measurementType: 'time', unit: 'Hours' },
  { value: 'pickup', label: 'Pickup Service', measurementType: 'quantity', unit: 'Items' },
  { value: 'storage', label: 'Storage Service', measurementType: 'time', unit: 'Days' },
  { value: 'custom', label: 'Custom Service', measurementType: 'quantity', unit: 'Units' }
];

// Payment Terms Options
const PAYMENT_TERMS = [
  { value: 'Net 30', label: 'Net 30 Days' },
  { value: 'Net 15', label: 'Net 15 Days' },
  { value: 'Net 7', label: 'Net 7 Days' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'Due on Receipt', label: 'Due on Receipt' },
  { value: '50% Deposit', label: '50% Deposit, Balance on Completion' },
  { value: '30% Deposit', label: '30% Deposit, Balance on Completion' },
  { value: 'Payment in Full', label: 'Payment in Full Upfront' },
  { value: 'Custom', label: 'Custom Payment Terms' }
];

// Custom Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  rate?: number;
  software?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder: string;
}

function CustomDropdown({ label, value, options, onChange, placeholder }: CustomDropdownProps) {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.software && (
                <div className="text-xs text-gray-500 mt-1">For {option.software.toUpperCase()}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuoteDetailsModal({
  isOpen,
  onClose,
  onGenerateQuote,
  onSaveDraft,
  onQuoteCompleted,
  customer,
  projectName,
  quoteId,
  referenceNumber,
  jobSections
}: QuoteDetailsModalProps) {
  const navigate = useNavigate();
  const [editableJobSections, setEditableJobSections] = useState(jobSections);
  const [showFinalQuote, setShowFinalQuote] = useState(false);
  const [finalQuoteData, setFinalQuoteData] = useState<FinalQuoteData | null>(null);
  const [showEnhancedQuote, setShowEnhancedQuote] = useState(false);
  
  // Quote details from first page - editable
  const [editableProjectName, setEditableProjectName] = useState(projectName);
  const [editableReferenceNumber, setEditableReferenceNumber] = useState(referenceNumber);
  
  // Rich text editors
  const [headerText, setHeaderText] = useState('');
  const [standardText, setStandardText] = useState('');
  const [showHeaderTextEditor, setShowHeaderTextEditor] = useState(false);
  const [showStandardTextEditor, setShowStandardTextEditor] = useState(false);
  
  // Add extras/services
  const [showAddExtras, setShowAddExtras] = useState(false);
  const [showAddServices, setShowAddServices] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [extraQuantity, setExtraQuantity] = useState('1');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceMeasurement, setServiceMeasurement] = useState('1');
  const [serviceMeasurementType, setServiceMeasurementType] = useState('quantity');
  const [availableServiceTypes, setAvailableServiceTypes] = useState(SERVICE_TYPES);
  const [showAddCustomService, setShowAddCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceMeasurement, setCustomServiceMeasurement] = useState('quantity');
  
  // Options (separate from quote total) - Grouped by category
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [optionGroups, setOptionGroups] = useState<{[category: string]: {name: string, description?: string, price: number}[]}>({});
  const [optionCategory, setOptionCategory] = useState('');
  const [multipleOptions, setMultipleOptions] = useState<{name: string, price: string}[]>([{name: '', price: ''}]);
  const [optionDescription, setOptionDescription] = useState('');
  
  // Advanced features
  const [showMargins, setShowMargins] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  
  // Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Discount functionality
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
  // Template management
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Delivery options
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | 'courier' | 'to-be-confirmed' | ''>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [courierTerms, setCourierTerms] = useState('');
  
  // Single address field (replaces individual components)
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryContact, setDeliveryContact] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryContactRole, setDeliveryContactRole] = useState('');
  const [deliveryContactTimes, setDeliveryContactTimes] = useState('');
  
  // Address suggestions for predictive typing
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // Control for showing new address form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  // Payment terms - auto-populated from customer settings
  const [paymentTerms, setPaymentTerms] = useState(customer.paymentTerms || 'Net 30');
  
  // Store original prices for reset functionality
  const [originalPrices, setOriginalPrices] = useState<{[key: string]: {unitPrice: number, name: string}}>({});
  
  // Check if all required fields are completed
  const isQuoteReady = () => {
    return deliveryMethod && 
           paymentTerms && 
           editableJobSections.length > 0 && 
           editableJobSections.some(section => section.items.length > 0) &&
           (deliveryMethod !== 'delivery' || showNewAddressForm || customer.locations[0]) &&
           (deliveryMethod !== 'courier' || courierTerms.trim());
  };

  // Initialize editable job sections and store original prices
  useEffect(() => {
    setEditableJobSections(jobSections);
    
    // Store original prices for reset functionality
    const originalPricesMap: {[key: string]: {unitPrice: number, name: string}} = {};
    jobSections.forEach(section => {
      section.items.forEach(item => {
        originalPricesMap[item.id] = {
          unitPrice: item.unitPrice,
          name: item.product.name
        };
      });
    });
    setOriginalPrices(originalPricesMap);
  }, [jobSections]);

  // Check for existing template configuration
  useEffect(() => {
    const activeTemplate = localStorage.getItem('saleskik-active-template');
    const savedTemplates = localStorage.getItem('saleskik-form-templates');
    
    if (activeTemplate && savedTemplates) {
      setSelectedTemplate(activeTemplate);
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (hasUnsavedChanges) {
        localStorage.setItem(`quote-draft-${quoteId}`, JSON.stringify({
          editableJobSections,
          headerText,
          standardText,
          editableProjectName,
          editableReferenceNumber,
          lastSaved: new Date()
        }));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    }, 30000);

    return () => clearTimeout(saveTimer);
  }, [hasUnsavedChanges, editableJobSections, headerText, standardText, editableProjectName, editableReferenceNumber, quoteId]);

  // Calculate totals with discount
  const calculateTotals = () => {
    const subtotal = editableJobSections.reduce((total, section) =>
      total + section.items.reduce((sectionTotal, item) => sectionTotal + item.totalPrice, 0), 0
    );
    
    // Calculate discount amount
    let discountTotal = 0;
    if (discountType === 'percentage' && discountPercentage > 0) {
      discountTotal = subtotal * (discountPercentage / 100);
    } else if (discountType === 'amount' && discountAmount > 0) {
      discountTotal = discountAmount;
    }
    
    const nettAfterDiscount = subtotal - discountTotal;
    const gst = nettAfterDiscount * 0.1;
    const total = nettAfterDiscount + gst;
    
    const weight = editableJobSections.reduce((totalWeight, section) =>
      totalWeight + section.items.reduce((sectionWeight, item) => 
        sectionWeight + (item.product.weight || 0) * item.quantity, 0), 0
    );

    return { 
      subtotal, 
      discount: discountTotal, 
      nettAfterDiscount, 
      gst, 
      total, 
      weight 
    };
  };

  const totals = calculateTotals();

  // Flatten all items for table display
  const allItems = editableJobSections.flatMap(section => 
    section.items.map(item => ({ ...item, sectionName: section.name, sectionId: section.id }))
  );

  // Update item
  const updateItem = (sectionId: string, itemId: string, field: string, value: any) => {
    setEditableJobSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item => {
                if (item.id === itemId) {
                  let updatedItem = { ...item };
                  
                  if (field === 'product') {
                    updatedItem.product = value;
                  } else if (field === 'quantity') {
                    updatedItem.quantity = value;
                    updatedItem.totalPrice = updatedItem.unitPrice * value;
                  } else if (field === 'unitPrice') {
                    updatedItem.unitPrice = value;
                    updatedItem.totalPrice = value * updatedItem.quantity;
                  } else {
                    updatedItem = { ...updatedItem, [field]: value };
                  }
                  
                  return updatedItem;
                }
                return item;
              })
            }
          : section
      )
    );
    setHasUnsavedChanges(true);
  };

  // Delete item
  const deleteItem = (sectionId: string, itemId: string) => {
    setEditableJobSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter(item => item.id !== itemId)
            }
          : section
      ).filter(section => section.items.length > 0)
    );
    setHasUnsavedChanges(true);
  };

  // Duplicate item
  const duplicateItem = (sectionId: string, itemId: string) => {
    const section = editableJobSections.find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    
    if (!item) return;

    const duplicatedItem: QuoteLineItem = {
      ...item,
      id: Date.now().toString(),
      productId: item.productId + '-copy'
    };

    setEditableJobSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: [...section.items, duplicatedItem]
            }
          : section
      )
    );
    setHasUnsavedChanges(true);
  };

  // Add extra item
  const addExtraItem = () => {
    if (!extraName || !extraPrice || !extraQuantity) return;

    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      productId: 'extra-' + Date.now(),
      product: {
        id: 'extra-' + Date.now(),
        code: 'EXTRA',
        name: extraName,
        weight: 0
      },
      quantity: parseInt(extraQuantity),
      unitPrice: parseFloat(extraPrice),
      totalPrice: parseFloat(extraPrice) * parseInt(extraQuantity),
      jobName: 'Extras',
      accountNumber: '41000',
      gstRate: '10-gst-on-income'
    };

    if (extraDescription) {
      (newItem as any).description = extraDescription;
    }

    const extrasSection = editableJobSections.find(s => s.name === 'Extras');
    if (extrasSection) {
      setEditableJobSections(sections =>
        sections.map(section =>
          section.name === 'Extras'
            ? { ...section, items: [...section.items, newItem] }
            : section
        )
      );
    } else {
      const newSection: JobSection = {
        id: 'extras-' + Date.now(),
        name: 'Extras',
        items: [newItem]
      };
      setEditableJobSections([...editableJobSections, newSection]);
    }

    setExtraName('');
    setExtraDescription('');
    setExtraPrice('');
    setExtraQuantity('1');
    setShowAddExtras(false);
    setHasUnsavedChanges(true);
  };

  // Add service item
  const addServiceItem = () => {
    if (!serviceName || !servicePrice || !serviceMeasurement) return;

    const quantity = parseFloat(serviceMeasurement);
    const unitPrice = parseFloat(servicePrice);

    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      productId: 'service-' + Date.now(),
      product: {
        id: 'service-' + Date.now(),
        code: 'SERVICE',
        name: serviceName,
        weight: 0
      },
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: quantity * unitPrice,
      jobName: 'Services',
      accountNumber: '42000',
      gstRate: '10-gst-on-income'
    };

    (newItem as any).measurementType = serviceMeasurementType;
    (newItem as any).serviceType = serviceType;

    const servicesSection = editableJobSections.find(s => s.name === 'Services');
    if (servicesSection) {
      setEditableJobSections(sections =>
        sections.map(section =>
          section.name === 'Services'
            ? { ...section, items: [...section.items, newItem] }
            : section
        )
      );
    } else {
      const newSection: JobSection = {
        id: 'services-' + Date.now(),
        name: 'Services',
        items: [newItem]
      };
      setEditableJobSections([...editableJobSections, newSection]);
    }

    setServiceName('');
    setServicePrice('');
    setServiceType('');
    setServiceMeasurement('1');
    setServiceMeasurementType('quantity');
    setShowAddServices(false);
    setHasUnsavedChanges(true);
  };

  // Add custom service type
  const addCustomServiceType = () => {
    if (!customServiceName) return;

    const newServiceType = {
      value: 'custom-' + Date.now(),
      label: customServiceName,
      measurementType: customServiceMeasurement,
      unit: customServiceMeasurement === 'time' ? 'Hours' : 
            customServiceMeasurement === 'area' ? 'SqM' :
            customServiceMeasurement === 'distance' ? 'KM' :
            customServiceMeasurement === 'weight' ? 'KG' : 'Units'
    };

    setAvailableServiceTypes([...availableServiceTypes, newServiceType]);
    setServiceType(newServiceType.value);
    setServiceName(newServiceType.label);
    setServiceMeasurementType(newServiceType.measurementType);
    setCustomServiceName('');
    setShowAddCustomService(false);
  };

  // Remove service type
  const removeServiceType = (serviceValue: string) => {
    setAvailableServiceTypes(availableServiceTypes.filter(s => s.value !== serviceValue));
    if (serviceType === serviceValue) {
      setServiceType('');
      setServiceName('');
    }
  };

  // Add multiple options to category group
  const addOptionItem = () => {
    if (!optionCategory) return;

    const validOptions = multipleOptions.filter(opt => opt.name.trim() && opt.price.trim());
    if (validOptions.length === 0) return;

    const newOptions = validOptions.map(opt => ({
      name: opt.name,
      description: optionDescription,
      price: parseFloat(opt.price)
    }));

    setOptionGroups(prev => ({
      ...prev,
      [optionCategory]: [...(prev[optionCategory] || []), ...newOptions]
    }));

    setOptionCategory('');
    setMultipleOptions([{name: '', price: ''}]);
    setOptionDescription('');
    setShowAddOptions(false);
    setHasUnsavedChanges(true);
  };

  // Helper functions for multiple options
  const addOptionRow = () => {
    setMultipleOptions([...multipleOptions, {name: '', price: ''}]);
  };

  const removeOptionRow = (index: number) => {
    if (multipleOptions.length > 1) {
      setMultipleOptions(multipleOptions.filter((_, i) => i !== index));
    }
  };

  const updateOptionRow = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...multipleOptions];
    updated[index][field] = value;
    setMultipleOptions(updated);
  };

  // Delete option from category
  const deleteOptionItem = (category: string, optionIndex: number) => {
    setOptionGroups(prev => ({
      ...prev,
      [category]: prev[category].filter((_, index) => index !== optionIndex)
    }));
    setHasUnsavedChanges(true);
  };

  // Reset prices to original values
  const resetPrices = () => {
    if (confirm('Reset all prices and product names to their original values? This will undo any custom changes you made.')) {
      setEditableJobSections(sections =>
        sections.map(section => ({
          ...section,
          items: section.items.map(item => {
            const original = originalPrices[item.id];
            if (original) {
              return {
                ...item,
                unitPrice: original.unitPrice,
                totalPrice: original.unitPrice * item.quantity,
                product: {
                  ...item.product,
                  name: original.name
                }
              };
            }
            return item;
          })
        }))
      );
      setHasUnsavedChanges(true);
      alert('Prices and product names have been reset to original values.');
    }
  };

  // Enhanced Australian address prediction with multiple sources
  const getAddressSuggestions = async (input: string) => {
    if (input.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      const suggestions: string[] = [];

      // If customer has existing addresses, prioritize them
      if (customer.locations && customer.locations.length > 0) {
        customer.locations.forEach(location => {
          const customerAddress = `${location.streetNumber} ${location.streetName}, ${location.suburb} ${location.state} ${location.postcode}`;
          if (customerAddress.toLowerCase().includes(input.toLowerCase())) {
            suggestions.push(customerAddress);
          }
        });
      }

      // Balanced Australian address database - Equal representation per state
      const australianAddresses = {
        'NSW': [
          { suburb: 'Sydney', postcode: '2000', streets: ['George Street', 'Pitt Street', 'Kent Street', 'Sussex Street'] },
          { suburb: 'Parramatta', postcode: '2150', streets: ['Church Street', 'Macquarie Street', 'George Street', 'Smith Street'] },
          { suburb: 'Bondi', postcode: '2026', streets: ['Campbell Parade', 'Curlewis Street', 'Hall Street', 'Blair Street'] },
          { suburb: 'Newtown', postcode: '2042', streets: ['King Street', 'Enmore Road', 'Australia Street', 'Wilson Street'] },
          { suburb: 'Manly', postcode: '2095', streets: ['The Corso', 'Pittwater Road', 'Sydney Road', 'Whistler Street'] }
        ],
        'VIC': [
          { suburb: 'Melbourne', postcode: '3000', streets: ['Collins Street', 'Bourke Street', 'Flinders Street', 'Elizabeth Street'] },
          { suburb: 'Richmond', postcode: '3121', streets: ['Swan Street', 'Bridge Road', 'Church Street', 'Burnley Street'] },
          { suburb: 'Fitzroy', postcode: '3065', streets: ['Brunswick Street', 'Gertrude Street', 'Johnston Street', 'Smith Street'] },
          { suburb: 'St Kilda', postcode: '3182', streets: ['Acland Street', 'Fitzroy Street', 'Barkly Street', 'Grey Street'] },
          { suburb: 'Carlton', postcode: '3053', streets: ['Lygon Street', 'Rathdowne Street', 'Drummond Street', 'Elgin Street'] }
        ],
        'QLD': [
          { suburb: 'Brisbane', postcode: '4000', streets: ['Queen Street', 'Adelaide Street', 'Edward Street', 'George Street'] },
          { suburb: 'Fortitude Valley', postcode: '4006', streets: ['Brunswick Street', 'Ann Street', 'Wickham Street', 'James Street'] },
          { suburb: 'South Bank', postcode: '4101', streets: ['Grey Street', 'Tribune Street', 'Ernest Street', 'Peel Street'] },
          { suburb: 'New Farm', postcode: '4005', streets: ['Brunswick Street', 'Merthyr Road', 'Commercial Road', 'Welsby Street'] },
          { suburb: 'Surfers Paradise', postcode: '4217', streets: ['Cavill Avenue', 'Orchid Avenue', 'Gold Coast Highway', 'Ferny Avenue'] }
        ],
        'WA': [
          { suburb: 'Perth', postcode: '6000', streets: ['St Georges Terrace', 'Hay Street', 'Murray Street', 'Wellington Street'] },
          { suburb: 'Fremantle', postcode: '6160', streets: ['High Street', 'Market Street', 'South Terrace', 'Henderson Street'] },
          { suburb: 'Subiaco', postcode: '6008', streets: ['Rokeby Road', 'Hay Street', 'Bagot Road', 'Roberts Road'] },
          { suburb: 'Northbridge', postcode: '6003', streets: ['William Street', 'James Street', 'Lake Street', 'Francis Street'] },
          { suburb: 'Cottesloe', postcode: '6011', streets: ['Stirling Highway', 'Napoleon Street', 'Marine Parade', 'Broome Street'] }
        ],
        'SA': [
          { suburb: 'Adelaide', postcode: '5000', streets: ['King William Street', 'Rundle Street', 'Hindley Street', 'North Terrace'] },
          { suburb: 'North Adelaide', postcode: '5006', streets: ['O\'Connell Street', 'Melbourne Street', 'Tynte Street', 'Ward Street'] },
          { suburb: 'Glenelg', postcode: '5045', streets: ['Jetty Road', 'Brighton Road', 'Moseley Street', 'Colley Terrace'] },
          { suburb: 'Norwood', postcode: '5067', streets: ['The Parade', 'Magill Road', 'Portrush Road', 'Osmond Terrace'] },
          { suburb: 'Unley', postcode: '5061', streets: ['Unley Road', 'King William Road', 'Greenhill Road', 'Cross Road'] }
        ]
      };

      // Search with truly balanced state results
      const inputLower = input.toLowerCase();
      
      // Detect customer's state for subtle prioritization (not dominance)
      let customerState = '';
      if (customer.locations && customer.locations[0]?.state) {
        customerState = customer.locations[0].state;
      }
      
      console.log('Customer state detected:', customerState);
      
      // Get exactly 1-2 results from each state, rotating through states
      const stateKeys = ['NSW', 'VIC', 'QLD', 'WA', 'SA'];
      const maxResultsTotal = 8;
      const maxPerState = Math.floor(maxResultsTotal / stateKeys.length); // 1 per state minimum
      
      // Rotate through each state to ensure balance
      stateKeys.forEach(state => {
        const stateData = australianAddresses[state];
        let addedFromState = 0;
        
        stateData.forEach(area => {
          if (addedFromState >= maxPerState || suggestions.length >= maxResultsTotal) return;
          
          // If input starts with a number, suggest street addresses
          if (/^\d+/.test(input)) {
            const streetNumber = input.match(/^\d+/)?.[0];
            const remainingInput = input.replace(/^\d+\s*/, '').toLowerCase();
            
            area.streets.forEach(street => {
              if (addedFromState >= maxPerState || suggestions.length >= maxResultsTotal) return;
              if (!remainingInput || street.toLowerCase().includes(remainingInput)) {
                suggestions.push(`${streetNumber} ${street}, ${area.suburb} ${state} ${area.postcode}`);
                addedFromState++;
              }
            });
          }
          // Check for suburb matches
          else if (area.suburb.toLowerCase().includes(inputLower)) {
            suggestions.push(`${area.suburb} ${state} ${area.postcode}`);
            addedFromState++;
          }
          // Check for street matches
          else {
            area.streets.forEach(street => {
              if (addedFromState >= maxPerState || suggestions.length >= maxResultsTotal) return;
              if (street.toLowerCase().includes(inputLower)) {
                suggestions.push(`${street}, ${area.suburb} ${state} ${area.postcode}`);
                addedFromState++;
              }
            });
          }
        });
      });
      
      console.log('Address suggestions generated:', suggestions);

      // Remove duplicates and limit results
      const uniqueSuggestions = [...new Set(suggestions)];
      setAddressSuggestions(uniqueSuggestions.slice(0, 8));
      setShowAddressSuggestions(uniqueSuggestions.length > 0);

    } catch (error) {
      console.error('Address suggestion error:', error);
      // Simple fallback
      setAddressSuggestions([
        `${input}, Melbourne VIC 3000`,
        `${input}, Sydney NSW 2000`,
        `${input}, Brisbane QLD 4000`
      ]);
      setShowAddressSuggestions(true);
    }
  };

  // Helper function to convert state names to abbreviations
  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: { [key: string]: string } = {
      'New South Wales': 'NSW',
      'Victoria': 'VIC',
      'Queensland': 'QLD',
      'Western Australia': 'WA',
      'South Australia': 'SA',
      'Tasmania': 'TAS',
      'Northern Territory': 'NT',
      'Australian Capital Territory': 'ACT'
    };
    return stateMap[stateName] || stateName;
  };

  // Populate delivery fields from customer default address
  useEffect(() => {
    if (deliveryMethod === 'delivery' && customer.locations && customer.locations[0]) {
      const defaultLocation = customer.locations[0];
      // Construct full address string
      const fullAddress = `${defaultLocation.streetNumber} ${defaultLocation.streetName}, ${defaultLocation.city} ${defaultLocation.state} ${defaultLocation.postcode}`;
      setDeliveryAddress(fullAddress);
      setDeliveryContact(`${customer.primaryContact.firstName} ${customer.primaryContact.lastName}`);
      setDeliveryPhone(customer.primaryContact.mobile || customer.phone || '');
      // Reset to show customer's default address by default
      setShowNewAddressForm(false);
    }
  }, [deliveryMethod, customer]);

  // Edit job name
  const editJobName = (jobId: string, newName: string) => {
    setEditableJobSections(sections =>
      sections.map(section =>
        section.id === jobId ? { ...section, name: newName } : section
      )
    );
    setEditingJobId(null);
  };

  // Handle generate quote
  const handleGenerateQuote = () => {
    // Validation - check required fields
    const errors = [];
    
    if (!deliveryMethod) {
      errors.push('Please select a delivery method (Delivery, Pickup, Courier, or To Be Confirmed)');
    }
    
    if (!paymentTerms) {
      errors.push('Please select payment terms');
    }
    
    if (editableJobSections.length === 0 || editableJobSections.every(section => section.items.length === 0)) {
      errors.push('Please add at least one product to the quote');
    }
    
    // Additional validation for delivery method specific fields
    if (deliveryMethod === 'delivery' && !showNewAddressForm && !customer.locations[0]) {
      errors.push('Please provide a delivery address');
    }
    
    if (deliveryMethod === 'courier' && !courierTerms.trim()) {
      errors.push('Please specify courier terms');
    }
    
    // Show validation errors
    if (errors.length > 0) {
      alert('Please complete the following before generating the quote:\n\n• ' + errors.join('\n• '));
      return;
    }
    
    // All validation passed - open the enhanced quote modal
    setShowEnhancedQuote(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 px-8 py-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-8 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
            <div className="absolute top-8 right-16 w-24 h-24 bg-purple-400 rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 left-1/3 w-28 h-28 bg-indigo-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <CalculatorIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
                  Quote Configuration
                </h1>
                <p className="text-gray-700 text-lg font-medium">Fine-tune your quote before generation</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Professional Quoting System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">AI-Powered</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-base"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Add More Items
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-full mx-auto px-8 py-8 space-y-8">
            
            {/* Quote Details from First Page */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quote Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Customer - Always first with (i) button */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Customer</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-base">
                      {customer.name}
                    </div>
                    <button
                      onClick={() => setShowCustomerInfo(true)}
                      className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View customer details"
                    >
                      <InformationCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Quote ID - Always second */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Quote ID</label>
                  <input
                    type="text"
                    value={quoteId}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-base"
                  />
                </div>
                
                {/* Reference - Always third */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Reference</label>
                  <input
                    type="text"
                    value={editableReferenceNumber}
                    onChange={(e) => {
                      setEditableReferenceNumber(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Customer PO or reference..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                
                {/* Project Name - Always fourth */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={editableProjectName}
                    onChange={(e) => {
                      setEditableProjectName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter project name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Quote Header Text Editor */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Quote Header Text</h3>
                <button
                  onClick={() => setShowHeaderTextEditor(!showHeaderTextEditor)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base"
                >
                  {showHeaderTextEditor ? 'Hide Editor' : 'Edit Header'}
                </button>
              </div>
              
              {showHeaderTextEditor && (
                <RichTextEditor
                  value={headerText}
                  onChange={setHeaderText}
                  placeholder="Enter text to appear at the top of your quote..."
                  minHeight="150px"
                  quoteItems={allItems}
                />
              )}
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Quote Items</h3>
                  
                  <div className="flex items-center gap-4">
                    {/* Auto-save indicator */}
                    {lastSaved && (
                      <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                        Auto-saved: {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                    {hasUnsavedChanges && (
                      <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Unsaved changes
                      </span>
                    )}
                    
                    <button
                      onClick={() => setShowMargins(!showMargins)}
                      className={`px-4 py-2 rounded-lg transition-colors text-base font-medium ${
                        showMargins 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {showMargins ? 'Hide Margins' : 'View Margins'}
                    </button>
                    
                    <button
                      onClick={resetPrices}
                      className="px-4 py-2 rounded-lg transition-colors text-base font-medium bg-white border border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Reset Prices
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Image</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Description</th>
                      <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Quantity</th>
                      <th className="px-6 py-4 text-right text-base font-bold text-gray-900">Unit Price</th>
                      <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Accounting</th>
                      {showMargins && (
                        <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Margin</th>
                      )}
                      <th className="px-6 py-4 text-right text-base font-bold text-gray-900">Sub Total</th>
                      <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editableJobSections.flatMap(section => 
                      section.items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div>
                              <div className="space-y-1">
                                <p className="font-bold text-gray-900 text-base">
                                  {item.product.name}
                                </p>
                                {item.product.code !== 'EXTRA' && item.product.code !== 'SERVICE' && (
                                  <div>
                                    <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                                      SKU: {item.product.code}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {(item as any).description && (
                                <p className="text-gray-700 text-base mt-2 bg-gray-50 p-2 rounded border-l-4 border-blue-500">
                                  {(item as any).description}
                                </p>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1;
                                updateItem(item.sectionId, item.id, 'quantity', newQty);
                              }}
                              className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-center text-base focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="1"
                            />
                          </td>
                          
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-gray-900 font-medium text-base mr-1">$</span>
                              <div className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-center text-base bg-gray-50">
                                {item.unitPrice.toFixed(2)}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <CustomDropdown
                                  label=""
                                  value={item.accountNumber || '41000'}
                                  options={ACCOUNT_NUMBERS}
                                  onChange={(value) => updateItem(item.sectionId, item.id, 'accountNumber', value)}
                                  placeholder="Account"
                                />
                              </div>
                              
                              <div className="flex-1">
                                <CustomDropdown
                                  label=""
                                  value={item.gstRate || '10-gst-on-income'}
                                  options={GST_OPTIONS}
                                  onChange={(value) => updateItem(item.sectionId, item.id, 'gstRate', value)}
                                  placeholder="GST"
                                />
                              </div>
                            </div>
                          </td>
                          
                          {showMargins && (
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm">
                                <div className="font-bold text-green-600">25.0%</div>
                                <div className="text-gray-500 text-xs">margin</div>
                              </div>
                            </td>
                          )}
                          
                          <td className="px-6 py-4 text-right">
                            <span className="text-green-600 font-bold text-lg">${item.totalPrice.toFixed(2)}</span>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => duplicateItem(item.sectionId, item.id)}
                                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                title="Duplicate"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.sectionId, item.id)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Add Extras */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <PlusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Add Extras</h4>
                    <p className="text-green-700 text-sm">Custom products & services</p>
                  </div>
                </div>
                
                {!showAddExtras ? (
                  <button
                    onClick={() => setShowAddExtras(true)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base font-medium"
                  >
                    Add Custom Item
                  </button>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Add Extras</h4>
                        <p className="text-gray-600 text-sm">Custom products & services</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          value={extraName}
                          onChange={(e) => setExtraName(e.target.value)}
                          placeholder="Product/Service name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={extraDescription}
                          onChange={(e) => setExtraDescription(e.target.value)}
                          placeholder="Work scope, materials, timeframes..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={extraQuantity}
                            onChange={(e) => setExtraQuantity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Cost</label>
                          <input
                            type="number"
                            value={extraPrice}
                            onChange={(e) => setExtraPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addExtraItem}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => {
                            setShowAddExtras(false);
                            setExtraName('');
                            setExtraDescription('');
                            setExtraPrice('');
                            setExtraQuantity('1');
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Services */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                    <TruckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Add Services</h4>
                    <p className="text-purple-700 text-sm">Delivery, packing & more</p>
                  </div>
                </div>
                
                {!showAddServices ? (
                  <button
                    onClick={() => setShowAddServices(true)}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-base font-medium"
                  >
                    Add Service
                  </button>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Add Services</h4>
                        <p className="text-gray-600 text-sm">Delivery, packing, etc.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-base font-medium text-gray-700">Service Type</label>
                          <button
                            onClick={() => setShowAddCustomService(!showAddCustomService)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          >
                            {showAddCustomService ? 'Cancel' : '+ Custom'}
                          </button>
                        </div>
                        
                        <CustomDropdown
                          label=""
                          value={serviceType}
                          options={availableServiceTypes.map(service => ({
                            value: service.value,
                            label: service.label,
                            software: service.measurementType
                          }))}
                          onChange={(value) => {
                            setServiceType(value);
                            const serviceData = availableServiceTypes.find(s => s.value === value);
                            if (serviceData) {
                              setServiceName(serviceData.label);
                              setServiceMeasurementType(serviceData.measurementType);
                              setServiceMeasurement('1');
                            }
                          }}
                          placeholder="Select service type..."
                        />
                      </div>
                      
                      {serviceType && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                            <input
                              type="text"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              placeholder="Customize service name..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {serviceMeasurementType === 'time' ? 'Hours' : 
                                 serviceMeasurementType === 'area' ? 'Square Meters' :
                                 serviceMeasurementType === 'distance' ? 'Kilometers' :
                                 serviceMeasurementType === 'weight' ? 'Kilograms' : 'Quantity'}
                              </label>
                              <input
                                type="number"
                                value={serviceMeasurement}
                                onChange={(e) => setServiceMeasurement(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                min="0.1"
                                step={serviceMeasurementType === 'time' ? '0.5' : serviceMeasurementType === 'area' ? '0.1' : '1'}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price per {serviceMeasurementType === 'time' ? 'Hour' : 
                                           serviceMeasurementType === 'area' ? 'SqM' :
                                           serviceMeasurementType === 'distance' ? 'KM' :
                                           serviceMeasurementType === 'weight' ? 'KG' : 'Unit'}
                              </label>
                              <input
                                type="number"
                                value={servicePrice}
                                onChange={(e) => setServicePrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <strong>Total:</strong> ${(parseFloat(serviceMeasurement || '0') * parseFloat(servicePrice || '0')).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={addServiceItem}
                          disabled={!serviceType || !serviceName || !servicePrice}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Service
                        </button>
                        <button
                          onClick={() => {
                            setShowAddServices(false);
                            setServiceType('');
                            setServiceName('');
                            setServicePrice('');
                            setServiceMeasurement('1');
                            setServiceMeasurementType('quantity');
                            setCustomServiceName('');
                            setShowAddCustomService(false);
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <EyeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Options</h4>
                    <p className="text-blue-700 text-sm">Choices & alternatives</p>
                  </div>
                </div>
                
                {!showAddOptions ? (
                  <button
                    onClick={() => setShowAddOptions(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                  >
                    Add Options
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={optionCategory}
                        onChange={(e) => setOptionCategory(e.target.value)}
                        placeholder="e.g., Colour, Size, Finish, Material"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options & Pricing</label>
                      <div className="space-y-2">
                        {multipleOptions.map((option, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateOptionRow(index, 'name', e.target.value)}
                              placeholder={index === 0 ? "e.g., Small" : index === 1 ? "e.g., Medium" : index === 2 ? "e.g., Large" : "Option name"}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) => updateOptionRow(index, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              step="0.01"
                            />
                            {index > 0 && (
                              <button
                                onClick={() => removeOptionRow(index)}
                                className="px-2 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addOptionRow}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
                        >
                          + Add Another Option
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Description (Optional)</label>
                      <textarea
                        value={optionDescription}
                        onChange={(e) => setOptionDescription(e.target.value)}
                        placeholder="General notes about these options..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addOptionItem}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Add Option
                      </button>
                      <button
                        onClick={() => {
                          setShowAddOptions(false);
                          setOptionCategory('');
                          setMultipleOptions([{name: '', price: ''}]);
                          setOptionDescription('');
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Option Groups Display */}
                {Object.keys(optionGroups).length > 0 && (
                  <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
                      <h5 className="font-medium text-blue-900 text-sm">Optional Items (Customer Choice)</h5>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-3 space-y-3">
                      {Object.entries(optionGroups).map(([category, options]) => (
                        <div key={category} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <h6 className="text-sm font-semibold text-amber-900 mb-2 capitalize">{category}:</h6>
                          <div className="space-y-2">
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">• {option.name}</span>
                                  {option.description && (
                                    <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-green-600">
                                    {option.price > 0 ? `+$${option.price.toFixed(2)}` : 
                                     option.price < 0 ? `-$${Math.abs(option.price).toFixed(2)}` : 
                                     'No extra cost'}
                                  </span>
                                  <button
                                    onClick={() => deleteOptionItem(category, index)}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quote Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Quote Expiry Date</label>
                  <input
                    type="date"
                    onChange={(e) => setHasUnsavedChanges(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                
                <div>
                  <CustomDropdown
                    label="Payment Terms"
                    value={paymentTerms}
                    options={PAYMENT_TERMS}
                    onChange={(value) => {
                      setPaymentTerms(value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Select Payment Terms"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Delivery Options</h3>
              
              <div className="space-y-4">
                {/* Delivery Method Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryMethod === 'delivery'}
                      onChange={(e) => setDeliveryMethod(e.target.checked ? 'delivery' : '')}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-base font-medium text-gray-900">Delivery</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryMethod === 'pickup'}
                      onChange={(e) => setDeliveryMethod(e.target.checked ? 'pickup' : '')}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                      <span className="text-base font-medium text-gray-900">Pick Up</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryMethod === 'courier'}
                      onChange={(e) => setDeliveryMethod(e.target.checked ? 'courier' : '')}
                      className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-purple-600" />
                      <span className="text-base font-medium text-gray-900">Courier</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryMethod === 'to-be-confirmed'}
                      onChange={(e) => setDeliveryMethod(e.target.checked ? 'to-be-confirmed' : '')}
                      className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-orange-600" />
                      <span className="text-base font-medium text-gray-900">To be confirmed</span>
                    </div>
                  </label>
                </div>

                {/* Conditional Content */}
                {deliveryMethod === 'delivery' && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPinIcon className="w-6 h-6 text-blue-600" />
                      <h4 className="font-bold text-blue-900 text-lg">Delivery Details</h4>
                    </div>
                    
                    {/* Default Customer Address Display */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-blue-900">
                          <MapPinIcon className="w-4 h-4 inline mr-1" />
                          Delivery Address
                        </label>
                        {!showNewAddressForm && (
                          <button
                            onClick={() => setShowNewAddressForm(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <PlusIcon className="w-3 h-3" />
                            Add New Address
                          </button>
                        )}
                      </div>

                      {!showNewAddressForm ? (
                        /* Show Customer's Default Address */
                        <div className="bg-white border border-blue-300 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <MapPinIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-blue-900">{customer.name} - Default Address</p>
                              <p className="text-blue-800 mt-1">
                                {customer.locations?.[0] ? (
                                  `${customer.locations[0].streetNumber} ${customer.locations[0].streetName}, ${customer.locations[0].city} ${customer.locations[0].state} ${customer.locations[0].postcode}`
                                ) : (
                                  "No default address on file"
                                )}
                              </p>
                              <p className="text-sm text-blue-600 mt-1">✓ Using customer's registered delivery address</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Show New Address Form */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-blue-800 font-medium">Enter different delivery address:</p>
                            <button
                              onClick={() => {
                                setShowNewAddressForm(false);
                                // Reset to customer's default address
                                if (customer.locations?.[0]) {
                                  const defaultLocation = customer.locations[0];
                                  const fullAddress = `${defaultLocation.streetNumber} ${defaultLocation.streetName}, ${defaultLocation.city} ${defaultLocation.state} ${defaultLocation.postcode}`;
                                  setDeliveryAddress(fullAddress);
                                }
                              }}
                              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                            >
                              <XMarkIcon className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                          
                          <div className="relative">
                            <input
                              type="text"
                              value={deliveryAddress}
                              onChange={(e) => {
                                setDeliveryAddress(e.target.value);
                                getAddressSuggestions(e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              onFocus={() => {
                                if (deliveryAddress.length >= 3) {
                                  getAddressSuggestions(deliveryAddress);
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowAddressSuggestions(false), 200);
                              }}
                              placeholder="Start typing new address... e.g., 123 Collins Street, Melbourne VIC 3000"
                              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base bg-white"
                            />
                            <MapPinIcon className="w-5 h-5 text-blue-400 absolute right-3 top-3.5" />
                            
                            {/* Enhanced Address suggestions dropdown */}
                            {showAddressSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                                <div className="p-2 bg-blue-50 border-b border-blue-200">
                                  <p className="text-xs text-blue-700 font-medium">🎯 Address Suggestions</p>
                                </div>
                                {addressSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setDeliveryAddress(suggestion);
                                      setShowAddressSuggestions(false);
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <MapPinIcon className="w-4 h-4 text-blue-500" />
                                      <div>
                                        <div className="font-medium text-blue-900 text-sm">{suggestion}</div>
                                        {index === 0 && customer.locations?.[0] && (
                                          <div className="text-xs text-blue-600">Customer's existing address</div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    
                    {/* Delivery/Site Contact Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Delivery/Site Contact</h4>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Different from customer contact</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-2">Contact Name</label>
                          <input
                            type="text"
                            value={deliveryContact}
                            onChange={(e) => {
                              setDeliveryContact(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="Site manager, foreman, or contact person"
                            className="w-full px-3 py-3 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-2">Contact Phone</label>
                          <input
                            type="tel"
                            value={deliveryPhone}
                            onChange={(e) => {
                              setDeliveryPhone(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="0400 123 456"
                            className="w-full px-3 py-3 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-blue-800 mb-2">Best Contact Times</label>
                        <input
                          type="text"
                          value={deliveryContactTimes}
                          onChange={(e) => {
                            setDeliveryContactTimes(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="e.g., Weekdays 7am-5pm, Avoid lunch 12-1pm"
                          className="w-full px-3 py-3 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    
                  </div>
                )}

                {deliveryMethod === 'pickup' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-900 text-base">Pickup Information</h4>
                    </div>
                    <p className="text-green-800 text-base">
                      <strong>Pickup Location:</strong> Items will be available for pickup at our company address.
                    </p>
                    <p className="text-green-700 text-sm mt-2">
                      This information will be automatically added to the quote with your company address details.
                    </p>
                  </div>
                )}

                {deliveryMethod === 'courier' && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="block text-base font-medium text-purple-900 mb-2">
                      <UserIcon className="w-5 h-5 inline mr-2" />
                      Courier Terms & Instructions
                    </label>
                    <textarea
                      value={courierTerms}
                      onChange={(e) => {
                        setCourierTerms(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter courier terms, special instructions, or delivery requirements..."
                      rows={3}
                      className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base bg-white"
                    />
                    <p className="text-purple-700 text-sm mt-2">These terms will be added to the quote for courier delivery</p>
                  </div>
                )}

                {deliveryMethod === 'to-be-confirmed' && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium text-orange-900">Delivery to be confirmed</h4>
                    </div>
                    <p className="text-orange-800 text-sm leading-relaxed">
                      The delivery location and method will be confirmed later. This will be clearly stated on the quote.
                    </p>
                    <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                      <p className="text-orange-900 text-sm font-medium">
                        📋 Quote will show: "Delivery location and method to be confirmed prior to dispatch"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary - Right Aligned */}
            <div className="flex justify-end">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5 text-gray-600" />
                    <h4 className="font-bold text-gray-900 text-base">Financial Summary</h4>
                  </div>
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    Add Discount
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Nett</span>
                    <span className="text-gray-900 font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totals.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">
                        Discount {discountType === 'percentage' ? `(${discountPercentage}%)` : ''}
                      </span>
                      <span className="text-red-700 font-medium">-${totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">GST</span>
                    <span className="text-gray-900 font-medium">${totals.gst.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-700 font-medium">Gross</span>
                    <span className="text-gray-900 font-medium">${totals.total.toFixed(2)}</span>
                  </div>
                  
                  {totals.weight > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Weight</span>
                      <span className="text-gray-900 font-medium">{totals.weight.toFixed(1)} kg</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end gap-4">
            <button
              onClick={onSaveDraft}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Save as Draft
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateQuote}
              disabled={!isQuoteReady()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isQuoteReady() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!isQuoteReady() ? 'Please complete all required fields' : 'Generate Quote'}
            >
              Generate Quote
            </button>
          </div>
        </div>
      </div>

      {/* Customer Info Modal */}
      {showCustomerInfo && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Customer Information</h3>
              <button
                onClick={() => setShowCustomerInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-base font-medium text-gray-500">Company Name</label>
                <p className="text-gray-900 font-medium text-lg">{customer.name}</p>
              </div>

              <div>
                <label className="text-base font-medium text-gray-500">Email</label>
                <p className="text-gray-900 text-base">{customer.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="text-base font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 text-base">{customer.phone || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-base font-medium text-gray-500">Primary Contact</label>
                <p className="text-gray-900 text-base">
                  {customer.primaryContact.firstName} {customer.primaryContact.lastName}
                </p>
                <p className="text-base text-gray-500">{customer.primaryContact.email}</p>
                <p className="text-base text-gray-500">{customer.primaryContact.mobile}</p>
              </div>

              {customer.locations[0] && (
                <div>
                  <label className="text-base font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 text-base">
                    {customer.locations[0].streetNumber} {customer.locations[0].streetName}
                  </p>
                  <p className="text-gray-900 text-base">
                    {customer.locations[0].suburb}, {customer.locations[0].state} {customer.locations[0].postcode}
                  </p>
                </div>
              )}

              <div>
                <label className="text-base font-medium text-gray-500">Price Tier</label>
                <span className="inline-block px-3 py-2 bg-blue-100 text-blue-800 rounded text-base font-medium">
                  {customer.priceTier}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Quote Modal */}
      <EnhancedQuoteModal
        isOpen={showEnhancedQuote}
        onClose={() => {
          setShowEnhancedQuote(false);
          onClose(); // Close the parent modal
          navigate('/quotes'); // Navigate to All Quotes page
        }}
        customer={customer}
        projectName={editableProjectName}
        quoteId={quoteId}
        referenceNumber={editableReferenceNumber}
        jobSections={editableJobSections}
        optionGroups={optionGroups}
        deliveryDetails={{
          method: deliveryMethod,
          address: showNewAddressForm ? deliveryAddress : (customer.locations[0] ? 
            `${customer.locations[0].streetNumber} ${customer.locations[0].streetName}, ${customer.locations[0].city}, ${customer.locations[0].state} ${customer.locations[0].postcode}` : ''),
          contactName: deliveryContact || `${customer.primaryContact.firstName} ${customer.primaryContact.lastName}`,
          contactPhone: deliveryPhone || customer.primaryContact.mobile || customer.phone,
          specialInstructions: deliveryInstructions
        }}
      />

      {/* Final Quote Modal */}
      {finalQuoteData && (
        <FinalQuoteModal
          isOpen={showFinalQuote}
          onClose={() => {
            setShowFinalQuote(false);
            setFinalQuoteData(null);
          }}
          onQuoteGenerated={() => {
            setShowFinalQuote(false);
            setFinalQuoteData(null);
            onClose();
            onQuoteCompleted();
          }}
          quoteData={finalQuoteData}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Discount</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Discount Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Discount Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      discountType === 'percentage' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Percentage</div>
                    <div className="text-sm text-gray-500">% off nett</div>
                  </button>
                  <button
                    onClick={() => setDiscountType('amount')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      discountType === 'amount' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Fixed Amount</div>
                    <div className="text-sm text-gray-500">$ off nett</div>
                  </button>
                </div>
              </div>

              {/* Discount Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (Pre-GST)'}
                </label>
                {discountType === 'percentage' ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      placeholder="100.00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pl-8"
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              {(discountPercentage > 0 || discountAmount > 0) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Preview</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Original Nett:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-${((discountType === 'percentage' ? totals.subtotal * (discountPercentage / 100) : discountAmount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (10%):</span>
                      <span>${((totals.subtotal - (discountType === 'percentage' ? totals.subtotal * (discountPercentage / 100) : discountAmount)) * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>New Gross Total:</span>
                      <span>${(totals.subtotal - (discountType === 'percentage' ? totals.subtotal * (discountPercentage / 100) : discountAmount) + (totals.subtotal - (discountType === 'percentage' ? totals.subtotal * (discountPercentage / 100) : discountAmount)) * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setDiscountPercentage(0);
                  setDiscountAmount(0);
                  setShowDiscountModal(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setHasUnsavedChanges(true);
                }}
                disabled={discountPercentage === 0 && discountAmount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}