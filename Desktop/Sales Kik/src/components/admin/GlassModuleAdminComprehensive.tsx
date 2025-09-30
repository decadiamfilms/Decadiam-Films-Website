import React, { useState, useEffect } from 'react';
import CustomDropdown from '../common/CustomDropdown';
import { 
  PlusIcon, PencilIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
  CubeIcon, AdjustmentsHorizontalIcon, UserGroupIcon, ClockIcon,
  TagIcon, DocumentTextIcon, PhotoIcon, CurrencyDollarIcon,
  WrenchScrewdriverIcon, Squares2X2Icon, ScissorsIcon,
  PaintBrushIcon, BeakerIcon, CalculatorIcon, TrashIcon, CheckIcon,
  ArrowRightIcon, LockClosedIcon, Bars3Icon
} from '@heroicons/react/24/outline';

/**
 * GLASS MODULE ADMIN - SEQUENTIAL WORKFLOW CONFIGURATION
 * 
 * This follows the same step-by-step process as the user workflow.
 * You must complete each step before the next one becomes available.
 * 
 * WORKFLOW:
 * 1. Start by creating a Glass Type (what appears in subcategory dropdown)
 * 2. Configure Product Types (Toughened/Not Toughened) with Thicknesses and base pricing
 * 3. Set up Tier/Customer Pricing (pricing tiers and customer-specific overrides)
 * 4. Configure Processing Options (Edgework → Corner → Holes → Services → Surface) - extras
 * 5. Add Templates that use this glass type (pre-defined shapes/specs)
 * 
 * Each step unlocks the next step - no skipping ahead!
 */

interface GlassType {
  id: string;
  name: string; // Clear Glass, Ultra Clear, Mirror, etc.
  description?: string;
  productTypes: ProductType[];
  isActive: boolean;
  isComplete: boolean; // Must be true before processing options can be added
}

interface ProductType {
  id: string;
  name: 'Toughened' | 'Not Toughened';
  glassTypeId: string;
  thicknesses: GlassThickness[];
}

interface GlassThickness {
  id: string;
  sku: string; // Unique SKU for this specific thickness
  thickness: number;
  pricePerMm: number | string; // Allow string for empty state
  leadTimeBusinessDays: number;
  isActive: boolean;
  tierPrices?: {
    t1: number | string;
    t2: number | string;
    t3: number | string;
    retail: number | string;
  };
}

interface ProcessingCategory {
  id: string;
  name: string; // e.g., "Edgework Options"
  sequenceOrder: number;
  isThicknessBased?: boolean; // Only true for Edgework
}

interface ProcessingOption {
  id: string;
  categoryId: string; // References ProcessingCategory
  name: string;
  supplierId?: string; // Which supplier provides this processing
  description?: string;
  pricingType: 'per-linear-meter' | 'each' | 'per-sqmeter';
  basePrice?: number; // For non-thickness based options
  flatPricing?: { // For non-thickness based options (single price for all thicknesses)
    costPrice: string;
    t1: string;
    t2: string;
    t3: string;
    retail: string;
  };
  variations?: { // Range-based pricing variations (e.g., 0-100mm, 101-200mm)
    id: string;
    range: string; // e.g., "0-100mm", "101-200mm"
    pricing: {
      costPrice: string;
      t1: string;
      t2: string;
      t3: string;
      retail: string;
    };
  }[];
  thicknessPricing?: { // Only for Edgework (thickness-based pricing)
    [thickness: string]: {
      costPrice: string;
      t1: string;
      t2: string;
      t3: string;
      retail: string;
    }
  };
  displayOrder: number; // Order within the category
  isActive: boolean;
}

interface PricingTier {
  id: string;
  name: string; // Bronze, Silver, Gold, Platinum
  discountPercentage: number; // e.g., 10%, 15%, 20%, 25%
  minimumOrderValue?: number;
  description?: string;
  color: string; // For UI display
}

interface CustomerPricing {
  id: string;
  customerId: string;
  customerName: string;
  tierId?: string; // Links to PricingTier
  customDiscountPercentage?: number; // Override tier discount
  specificGlassPricing?: { // Override specific glass type pricing
    glassTypeId: string;
    productTypeId: string;
    thicknessId: string;
    customPrice: number;
  }[];
  notes?: string;
}

interface GlassTemplate {
  id: string;
  name: string;
  description?: string;
  shapeType: 'rectangle' | 'circle' | 'custom';
  costMultiplier: number;
  autoProcessingSteps: string[];
  applicableGlassTypes: string[]; // Which glass types this template works with
  isActive: boolean;
}

export default function GlassModuleAdminComprehensive() {
  // Current workflow state
  // Tab and step management
  const [activeTab, setActiveTab] = useState<'glass' | 'processing-edgework' | 'processing-other' | 'templates'>('glass');
  const [glassStep, setGlassStep] = useState(1); // 1=Overview, 2=Configure Glass Types, 3=Customer Pricing
  const [processingStep, setProcessingStep] = useState(1); // 1=Overview, 2=Configure Options
  const [currentGlassType, setCurrentGlassType] = useState<GlassType | null>(null);
  
  // UI Enhancement States
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [expandedHelp, setExpandedHelp] = useState<Set<string>>(new Set());
  
  // Tier pricing configuration - load from localStorage or use defaults
  const [tierLabels, setTierLabels] = useState(() => {
    const saved = localStorage.getItem('saleskik-tier-labels');
    return saved ? JSON.parse(saved) : {
      t1: 'T1',
      t2: 'T2', 
      t3: 'T3',
      retail: 'Retail'
    };
  });
  
  // State for showing margins in tier pricing table
  const [showMargins, setShowMargins] = useState(false);
  
  // Data states
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [customerPricing, setCustomerPricing] = useState<CustomerPricing[]>([]);
  const [processingCategories, setProcessingCategories] = useState<ProcessingCategory[]>([]);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOption[]>([]);
  const [templates, setTemplates] = useState<GlassTemplate[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Form states for current glass type being created/edited
  const [glassTypeForm, setGlassTypeForm] = useState({
    name: '',
    productTypes: [] as ProductType[]
  });

  const [currentProductType, setCurrentProductType] = useState<'Toughened' | 'Not Toughened' | null>(null);
  const [thicknessForm, setThicknessForm] = useState({
    sku: '',
    thickness: '',
    pricePerMm: '',
    leadTimeBusinessDays: '7'
  });

  const [bulkThicknessInput, setBulkThicknessInput] = useState('');
  const [editingThickness, setEditingThickness] = useState<string | null>(null);
  const [skuSuggestions, setSkuSuggestions] = useState<string[]>([]);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [detectedPattern, setDetectedPattern] = useState<string>('');
  const [showPatternPrompt, setShowPatternPrompt] = useState(false);
  
  // Processing - Other states
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<ProcessingOption | null>(null);
  const [optionForm, setOptionForm] = useState({
    name: '',
    supplierId: '',
    pricingType: 'each' as 'per-linear-meter' | 'each' | 'per-sqmeter',
    flatPricing: {
      costPrice: '',
      t1: '',
      t2: '',
      t3: '',
      retail: ''
    },
    variations: [] as {
      id: string;
      range: string;
      pricing: {
        costPrice: string;
        t1: string;
        t2: string;
        t3: string;
        retail: string;
      };
    }[]
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showOtherMargins, setShowOtherMargins] = useState(false);
  const [usePredictivePattern, setUsePredictivePattern] = useState(false);
  const [currentSkuPattern, setCurrentSkuPattern] = useState<{prefix?: string, suffix?: string, includesThickness?: boolean}>({});
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  
  const [processingForm, setProcessingForm] = useState<{
    name: string;
    pricingType: string;
    supplierId: string;
    currentCategoryId?: string;
    flatPricing?: {
      costPrice: string;
      t1: string;
      t2: string;
      t3: string;
      retail: string;
    };
    thicknessPricing: { 
      [thickness: string]: {
        costPrice: string;
        t1: string;
        t2: string;
        t3: string;
        retail: string;
      }
    };
  }>({
    name: '',
    pricingType: 'each',
    supplierId: '',
    flatPricing: {
      costPrice: '',
      t1: '',
      t2: '',
      t3: '',
      retail: ''
    },
    thicknessPricing: {}
  });

  // Modal state for creating processing categories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  
  // State for showing margins in processing pricing
  const [showProcessingMargins, setShowProcessingMargins] = useState(false);
  const [showEdgeworkMargins, setShowEdgeworkMargins] = useState(false);
  
  // State for editing processing options
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  
  // State for drag and drop
  const [draggedOption, setDraggedOption] = useState<ProcessingOption | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Drag and drop handlers for processing options
  const handleDragStart = (e: React.DragEvent, option: ProcessingOption) => {
    setDraggedOption(option);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, optionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(optionId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetOption: ProcessingOption) => {
    e.preventDefault();
    setDragOverId(null);
    
    if (!draggedOption || draggedOption.id === targetOption.id) {
      return;
    }

    // Only reorder within the same category
    if (draggedOption.categoryId !== targetOption.categoryId) {
      return;
    }

    const categoryOptions = processingOptions.filter(opt => opt.categoryId === targetOption.categoryId);
    const draggedIndex = categoryOptions.findIndex(opt => opt.id === draggedOption.id);
    const targetIndex = categoryOptions.findIndex(opt => opt.id === targetOption.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const reorderedOptions = [...categoryOptions];
      reorderedOptions.splice(draggedIndex, 1);
      reorderedOptions.splice(targetIndex, 0, draggedOption);

      // Update display order for all options in this category
      const updatedOptions = reorderedOptions.map((opt, index) => ({
        ...opt,
        displayOrder: index
      }));

      // Update the main options list
      setProcessingOptions(prev => {
        const otherOptions = prev.filter(opt => opt.categoryId !== targetOption.categoryId);
        const newOptions = [...otherOptions, ...updatedOptions];
        // Auto-save after reordering
        setTimeout(() => {
          localStorage.setItem('saleskik-processing-options', JSON.stringify(newOptions));
        }, 100);
        return newOptions;
      });
    }
    
    setDraggedOption(null);
  };

  // Detect SKU pattern from user input
  const detectSkuPattern = (sku: string, thickness: string) => {
    console.log(`detectSkuPattern called with SKU: "${sku}", thickness: "${thickness}"`);
    
    if (!sku || !thickness) {
      console.log('Missing SKU or thickness, returning null');
      return null;
    }
    
    const thicknessNum = Math.round(parseFloat(thickness));
    const thicknessStr = thicknessNum.toString();
    
    console.log(`Looking for thickness "${thicknessStr}" in SKU "${sku}"`);
    
    // Check if the SKU contains the thickness
    if (sku.includes(thicknessStr)) {
      const thicknessIndex = sku.indexOf(thicknessStr);
      const prefix = sku.substring(0, thicknessIndex);
      const suffix = sku.substring(thicknessIndex + thicknessStr.length);
      
      const pattern = {
        prefix,
        suffix,
        includesThickness: true,
        example: `${prefix}[thickness]${suffix}`
      };
      
      console.log('Pattern detected with thickness:', pattern);
      return pattern;
    }
    
    // SKU doesn't include thickness - it's a static pattern
    const pattern = {
      prefix: sku,
      suffix: '',
      includesThickness: false,
      example: sku
    };
    
    console.log('Pattern detected without thickness:', pattern);
    return pattern;
  };

  // Generate SKU based on detected pattern
  const generateSkuFromPattern = (thickness: string, pattern: typeof currentSkuPattern) => {
    if (!pattern || Object.keys(pattern).length === 0) return '';
    
    const thicknessNum = Math.round(parseFloat(thickness));
    
    if (pattern.includesThickness) {
      return `${pattern.prefix || ''}${thicknessNum}${pattern.suffix || ''}`;
    }
    
    // Static pattern - doesn't change with thickness
    return pattern.prefix || '';
  };

  // Check if we should prompt for predictive pattern
  const checkForPredictivePattern = (productType: ProductType) => {
    console.log('checkForPredictivePattern called with:', productType);
    
    const existingSkus = productType.thicknesses.filter(t => t.sku).map(t => ({
      sku: t.sku,
      thickness: t.thickness
    }));
    
    console.log('Existing SKUs:', existingSkus);
    
    if (existingSkus.length >= 2) {
      // Try to detect a pattern from existing SKUs
      const firstPattern = detectSkuPattern(existingSkus[0].sku, existingSkus[0].thickness.toString());
      const secondPattern = detectSkuPattern(existingSkus[1].sku, existingSkus[1].thickness.toString());
      
      console.log('First pattern:', firstPattern);
      console.log('Second pattern:', secondPattern);
      
      // Check if patterns match
      if (firstPattern && secondPattern && 
          firstPattern.prefix === secondPattern.prefix && 
          firstPattern.suffix === secondPattern.suffix &&
          firstPattern.includesThickness === secondPattern.includesThickness) {
        console.log('PATTERNS MATCH! Returning:', firstPattern);
        return firstPattern;
      } else {
        console.log('Patterns do not match');
      }
    } else {
      console.log('Not enough SKUs to detect pattern');
    }
    
    return null;
  };

  // Load existing data
  useEffect(() => {
    loadExistingConfiguration();
    // Check if this is first time setup
    const hasSeenGuide = localStorage.getItem('saleskik-glass-guide-seen');
    if (!hasSeenGuide && glassTypes.length === 0) {
      setShowWelcomeGuide(true);
    }
  }, []);
  
  // Auto-hide success messages
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const loadExistingConfiguration = () => {
    const savedGlassTypes = localStorage.getItem('saleskik-glass-types-complete');
    if (savedGlassTypes) {
      setGlassTypes(JSON.parse(savedGlassTypes));
    }

    const savedCategories = localStorage.getItem('saleskik-processing-categories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      setProcessingCategories(categories);
      // Start with all categories expanded
      setExpandedCategories(new Set(categories.map((cat: ProcessingCategory) => cat.id)));
    }

    const savedProcessing = localStorage.getItem('saleskik-processing-options');
    if (savedProcessing) {
      setProcessingOptions(JSON.parse(savedProcessing));
    }

    const savedTemplates = localStorage.getItem('saleskik-glass-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }

    // Load suppliers from API
    const loadSuppliers = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch('/api/glass/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const suppliersData = await response.json();
          setSuppliers(suppliersData);
          console.log('Loaded suppliers from API:', suppliersData);
        } else {
          console.error('Suppliers API failed:', response.status, response.statusText);
          throw new Error('API failed');
        }
      } catch (error) {
        console.error('Error loading suppliers:', error);
        // Fallback to localStorage if API fails
        const savedSuppliers = localStorage.getItem('saleskik-suppliers');
        if (savedSuppliers) {
          const parsedSuppliers = JSON.parse(savedSuppliers);
          setSuppliers(parsedSuppliers);
          console.log('Loaded suppliers from localStorage:', parsedSuppliers);
        } else {
          // If no saved suppliers, add some defaults for glass processing
          const defaultSuppliers = [
            { id: 'supplier-1', name: 'ABC Glass Supplies' },
            { id: 'supplier-2', name: 'XYZ Hardware Distributors' },
            { id: 'supplier-3', name: 'Premium Glass Solutions' }
          ];
          setSuppliers(defaultSuppliers);
          console.log('Using default suppliers:', defaultSuppliers);
        }
      }
    };
    
    loadSuppliers();
  };

  const saveConfiguration = () => {
    localStorage.setItem('saleskik-glass-types-complete', JSON.stringify(glassTypes));
    localStorage.setItem('saleskik-glass-processing-categories', JSON.stringify(processingCategories));
    localStorage.setItem('saleskik-glass-processing-options', JSON.stringify(processingOptions));
    localStorage.setItem('saleskik-glass-templates', JSON.stringify(templates));
    localStorage.setItem('saleskik-tier-labels', JSON.stringify(tierLabels));
    
    // Notify main glass module to refresh data
    window.dispatchEvent(new CustomEvent('glass-admin-updated', {
      detail: { 
        timestamp: new Date(),
        glassTypesCount: glassTypes.length,
        processingOptionsCount: processingOptions.length,
        templatesCount: templates.length
      }
    }));
    
    console.log('Glass admin configuration saved and modules notified');
  };

  // Check if we can proceed to next step within Glass tab
  const canProceedToGlassStep = (step: number): boolean => {
    switch(step) {
      case 1: return true; // Overview always available
      case 2: 
        // Can only go to step 2 if:
        // - Currently editing a glass type OR
        // - Have at least one completed glass type
        return currentGlassType !== null || glassTypes.some(gt => gt.isComplete);
      case 3: 
        // Can only go to step 3 if:
        // - Currently have a glass type being edited with product types configured
        return currentGlassType !== null && glassTypeForm.productTypes.length > 0;
      default: return false;
    }
  };

  // Processing tab steps are always available (no restrictions)

  const startCreatingGlassType = () => {
    setCurrentGlassType(null);
    setGlassTypeForm({ name: '', productTypes: [] });
    setGlassStep(2);
  };

  const addThicknessToProductType = (productType: ProductType) => {
    if (!thicknessForm.sku || !thicknessForm.thickness || !thicknessForm.pricePerMm) return;

    const newThickness: GlassThickness = {
      id: `thickness-${Date.now()}`,
      sku: thicknessForm.sku,
      thickness: parseFloat(thicknessForm.thickness),
      pricePerMm: parseFloat(thicknessForm.pricePerMm),
      leadTimeBusinessDays: parseInt(thicknessForm.leadTimeBusinessDays),
      isActive: true
    };

    // Update the product type with new thickness
    const updatedProductTypes = glassTypeForm.productTypes.map(pt => 
      pt.id === productType.id 
        ? { ...pt, thicknesses: [...pt.thicknesses, newThickness] }
        : pt
    );

    setGlassTypeForm(prev => ({
      ...prev,
      productTypes: updatedProductTypes
    }));

    // Check if we should detect a pattern after adding
    const updatedProductType = updatedProductTypes.find(pt => pt.id === productType.id);
    if (updatedProductType && updatedProductType.thicknesses.length === 2 && !usePredictivePattern) {
      // After adding the second SKU, check for pattern
      const pattern = checkForPredictivePattern(updatedProductType);
      console.log('Checking for pattern after adding second thickness:', pattern);
      if (pattern) {
        setDetectedPattern(pattern.example || '');
        setCurrentSkuPattern(pattern);
        setShowPatternPrompt(true);
      }
    } else if (updatedProductType && updatedProductType.thicknesses.length > 2 && !usePredictivePattern && !currentSkuPattern.prefix) {
      // Try to detect pattern even after more than 2 entries
      const pattern = checkForPredictivePattern(updatedProductType);
      if (pattern) {
        setDetectedPattern(pattern.example || '');
        setCurrentSkuPattern(pattern);
        setShowPatternPrompt(true);
      }
    }

    setThicknessForm({ sku: '', thickness: '', pricePerMm: '', leadTimeBusinessDays: '7' });
  };

  const addBulkThicknesses = (productType: ProductType) => {
    if (!bulkThicknessInput.trim()) return;
    
    const thicknessList = bulkThicknessInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t && !isNaN(parseFloat(t)))
      .map(t => parseFloat(t));
    
    if (thicknessList.length === 0) return;

    const newThicknesses: GlassThickness[] = thicknessList.map((thickness, index) => ({
      id: `thickness-bulk-${Date.now()}-${index}`,
      sku: usePredictivePattern && currentSkuPattern ? generateSkuFromPattern(thickness.toString(), currentSkuPattern) : '',
      thickness: thickness,
      pricePerMm: '', // Default price - user needs to set
      leadTimeBusinessDays: 7, // Default lead time
      isActive: true
    }));

    setGlassTypeForm(prev => ({
      ...prev,
      productTypes: prev.productTypes.map(pt => 
        pt.id === productType.id 
          ? { ...pt, thicknesses: [...pt.thicknesses, ...newThicknesses] }
          : pt
      )
    }));

    setBulkThicknessInput('');
  };

  const completeGlassTypeCreation = () => {
    if (!glassTypeForm.name || glassTypeForm.productTypes.length === 0) return;

    if (currentGlassType) {
      // Editing existing glass type - update it
      const updatedGlassType: GlassType = {
        ...currentGlassType,
        name: glassTypeForm.name,
        description: '',
        productTypes: glassTypeForm.productTypes,
        isActive: true,
        isComplete: true
      };
      setGlassTypes(prev => prev.map(gt => 
        gt.id === currentGlassType.id ? updatedGlassType : gt
      ));
      setCurrentGlassType(updatedGlassType);
    } else {
      // Creating new glass type
      const newGlassType: GlassType = {
        id: `glass-${Date.now()}`,
        name: glassTypeForm.name,
        description: '',
        productTypes: glassTypeForm.productTypes,
        isActive: true,
        isComplete: true
      };
      setGlassTypes(prev => [...prev, newGlassType]);
      setCurrentGlassType(newGlassType);
    }

    saveConfiguration();
    setShowSuccessMessage('Glass type saved successfully!');
    setGlassStep(3); // Now go to Customer Pricing step
  };

  // Calculate completion progress
  const calculateProgress = () => {
    let completed = 0;
    let total = 4;
    
    if (glassTypes.some(gt => gt.isComplete)) completed++;
    if (processingCategories.filter(c => c.isThicknessBased).length > 0) completed++;
    if (processingCategories.filter(c => !c.isThicknessBased).length > 0) completed++;
    if (templates.length > 0) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };
  
  const progress = calculateProgress();
  
  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <CheckIcon className="w-6 h-6" />
          {showSuccessMessage}
        </div>
      )}
      
      {/* Modal for Creating Processing Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 border-2 border-gray-200">
            <div className="px-8 py-6 border-b-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Create Processing Category</h3>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-700 mb-3">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  placeholder="E.g., Edgework Options"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
                <p className="text-base text-gray-500 mt-2">
                  This will be the header for this processing category
                </p>
              </div>
            </div>
            <div className="px-8 py-6 border-t-2 border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryForm({ name: '' });
                }}
                className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (categoryForm.name.trim()) {
                    const newCategory: ProcessingCategory = {
                      id: `cat-${Date.now()}`,
                      name: categoryForm.name.trim(),
                      sequenceOrder: processingCategories.length,
                      isThicknessBased: categoryForm.name.toLowerCase().includes('edgework')
                    };
                    setProcessingCategories(prev => [...prev, newCategory]);
                    // Add new category to expanded set so it's open by default
                    setExpandedCategories(prev => new Set([...prev, newCategory.id]));
                    setShowCategoryModal(false);
                    setCategoryForm({ name: '' });
                    // Don't auto-save - wait for user to click Save button
                  }
                }}
                disabled={!categoryForm.name.trim()}
                className="px-6 py-3 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Workflow Progress Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <CubeIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Glass Module Configuration Workflow
              </h1>
              <p className="text-lg text-gray-600">
                Follow the sequential steps to configure glass types and processing options
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="text-xs text-center">
                <div className={`font-medium ${glassTypes.some(gt => gt.isComplete) ? 'text-green-600' : 'text-gray-400'}`}>
                  {glassTypes.some(gt => gt.isComplete) ? '✓' : '○'} Glass Types
                </div>
              </div>
              <div className="text-xs text-center">
                <div className={`font-medium ${processingCategories.filter(c => c.isThicknessBased).length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {processingCategories.filter(c => c.isThicknessBased).length > 0 ? '✓' : '○'} Edgework
                </div>
              </div>
              <div className="text-xs text-center">
                <div className={`font-medium ${processingCategories.filter(c => !c.isThicknessBased).length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {processingCategories.filter(c => !c.isThicknessBased).length > 0 ? '✓' : '○'} Other Processing
                </div>
              </div>
              <div className="text-xs text-center">
                <div className={`font-medium ${templates.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {templates.length > 0 ? '✓' : '○'} Templates
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('glass')}
              className={`py-4 px-8 border-b-3 font-semibold text-base transition-colors ${
                activeTab === 'glass'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CubeIcon className="w-6 h-6" />
                <span>Glass Configuration</span>
                {glassTypes.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {glassTypes.length} types
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                if (glassTypes.some(gt => gt.isComplete)) {
                  setActiveTab('processing-edgework');
                }
              }}
              disabled={!glassTypes.some(gt => gt.isComplete)}
              className={`py-4 px-8 border-b-3 font-semibold text-base transition-colors ${
                activeTab === 'processing-edgework'
                  ? 'border-green-500 text-green-600'
                  : !glassTypes.some(gt => gt.isComplete)
                  ? 'border-transparent text-gray-400 cursor-not-allowed opacity-60 pointer-events-none'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={!glassTypes.some(gt => gt.isComplete) ? 'Complete at least one glass type first' : ''}
            >
              <div className="flex items-center gap-2">
                {!glassTypes.some(gt => gt.isComplete) && <LockClosedIcon className="w-6 h-6" />}
                <AdjustmentsHorizontalIcon className="w-7 h-7" />
                <span>Processing - Edgework</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (glassTypes.some(gt => gt.isComplete)) {
                  setActiveTab('processing-other');
                }
              }}
              disabled={!glassTypes.some(gt => gt.isComplete)}
              className={`py-4 px-8 border-b-3 font-semibold text-base transition-colors ${
                activeTab === 'processing-other'
                  ? 'border-purple-500 text-purple-600'
                  : !glassTypes.some(gt => gt.isComplete)
                  ? 'border-transparent text-gray-400 cursor-not-allowed opacity-60 pointer-events-none'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={!glassTypes.some(gt => gt.isComplete) ? 'Complete at least one glass type first' : ''}
            >
              <div className="flex items-center gap-2">
                {!glassTypes.some(gt => gt.isComplete) && <LockClosedIcon className="w-6 h-6" />}
                <AdjustmentsHorizontalIcon className="w-7 h-7" />
                <span>Processing - Other</span>
                {processingOptions.length > 0 && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {processingOptions.length} options
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                if (glassTypes.some(gt => gt.isComplete) && processingCategories.length > 0) {
                  setActiveTab('templates');
                }
              }}
              disabled={!(glassTypes.some(gt => gt.isComplete) && processingCategories.length > 0)}
              className={`py-4 px-8 border-b-3 font-semibold text-base transition-colors ${
                activeTab === 'templates'
                  ? 'border-purple-500 text-purple-600'
                  : !(glassTypes.some(gt => gt.isComplete) && processingCategories.length > 0)
                  ? 'border-transparent text-gray-400 cursor-not-allowed opacity-60 pointer-events-none'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={
                !glassTypes.some(gt => gt.isComplete) 
                  ? 'Complete at least one glass type first' 
                  : !processingCategories.length 
                  ? 'Configure processing options first'
                  : ''
              }
            >
              <div className="flex items-center gap-2">
                {!(glassTypes.some(gt => gt.isComplete) && processingCategories.length > 0) && <LockClosedIcon className="w-6 h-6" />}
                <DocumentTextIcon className="w-7 h-7" />
                <span>Templates</span>
                {templates.length > 0 && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {templates.length} templates
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Sub-navigation based on active tab */}
        {activeTab === 'glass' && (currentGlassType || glassTypeForm.productTypes.length > 0) && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-4">
              {[
                { step: 1, title: 'Overview', desc: 'View glass types' },
                { step: 2, title: 'Configure Types', desc: 'Create & edit' },
                { step: 3, title: 'Customer Pricing', desc: 'Set tier prices' }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <button
                    onClick={() => {
                      if (canProceedToGlassStep(item.step)) {
                        setGlassStep(item.step);
                      }
                    }}
                    disabled={!canProceedToGlassStep(item.step)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      glassStep === item.step 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                        : canProceedToGlassStep(item.step)
                          ? 'bg-white text-gray-700 cursor-pointer hover:bg-gray-100 border border-gray-300'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 pointer-events-none'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      glassStep === item.step 
                        ? 'bg-blue-600 text-white' 
                        : canProceedToGlassStep(item.step)
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-300 text-gray-500'
                    }`}>
                      {canProceedToGlassStep(item.step) ? item.step : <LockClosedIcon className="w-3 h-3" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{item.title}</div>
                      <div className="text-base text-gray-600">{item.desc}</div>
                    </div>
                  </button>
                  {index < 2 && (
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 mx-3" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'processing-edgework' || activeTab === 'processing-other') && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-4">
              {[
                { step: 1, title: 'Overview', desc: 'View all options' },
                { step: 2, title: 'Configure Options', desc: 'Add & edit processing' }
              ].map((item, index) => {
                // Determine if this step can be accessed
                const canAccessStep = () => {
                  if (item.step === 1) return true; // Overview is always accessible
                  if (item.step === 2) {
                    // For edgework: need at least one thickness type
                    if (activeTab === 'processing-edgework') {
                      const hasThicknesses = glassTypes.some(gt => 
                        gt.productTypes.some(pt => pt.thicknesses.length > 0)
                      );
                      return hasThicknesses;
                    }
                    // For other: need at least one supplier
                    if (activeTab === 'processing-other') {
                      return suppliers.length > 0;
                    }
                  }
                  return true;
                };
                
                const isAccessible = canAccessStep();
                
                return (
                  <div key={item.step} className="flex items-center">
                    <button
                      onClick={() => {
                        if (isAccessible) {
                          setProcessingStep(item.step);
                        }
                      }}
                      disabled={!isAccessible}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        processingStep === item.step 
                          ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                          : !isAccessible
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 pointer-events-none'
                          : 'bg-white text-gray-700 cursor-pointer hover:bg-gray-100 border border-gray-300'
                      }`}
                      title={
                        !isAccessible && item.step === 2 && activeTab === 'processing-edgework'
                          ? 'Add thickness types in Glass Types first'
                          : !isAccessible && item.step === 2 && activeTab === 'processing-other'
                          ? 'Add suppliers first'
                          : ''
                      }
                    >
                      {!isAccessible && (
                        <LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        processingStep === item.step 
                          ? 'bg-green-600 text-white' 
                          : !isAccessible
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {item.step}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs">{item.desc}</div>
                      </div>
                    </button>
                    {index < 1 && (
                      <ArrowRightIcon className={`w-4 h-4 ${!isAccessible ? 'text-gray-300' : 'text-gray-400'} mx-2`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pattern Detection Prompt - Global Level */}
      {showPatternPrompt && (
        <>
          {/* Backdrop - Changed to semi-transparent white */}
          <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm z-40" onClick={() => setShowPatternPrompt(false)} />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Header - Gradient background matching site style */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                    <div className="text-white text-xl">🎯</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">SKU Pattern Detected!</h3>
                    <p className="text-blue-100 text-sm">Smart pattern recognition found a match</p>
                  </div>
                </div>
              </div>
              
              {/* Content - Clean white background */}
              <div className="p-6 bg-white">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-3">
                    We've detected this pattern in your SKUs:
                  </p>
                  <div className="bg-gray-50 rounded-lg border-2 border-blue-300 p-3">
                    <p className="font-mono text-lg font-bold text-center text-blue-900">
                      {detectedPattern}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    <span className="font-medium">[thickness]</span> will be replaced with the actual thickness value
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Would you like to:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Auto-fill all remaining SKUs with this pattern</li>
                    <li>• Use smart suggestions for future entries</li>
                    <li>• Save time with automatic SKU generation</li>
                  </ul>
                </div>
                
                {/* Action Buttons - Matching site button styles */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUsePredictivePattern(true);
                      setShowPatternPrompt(false);
                      
                      // Auto-fill all empty SKUs with the detected pattern
                      let filledCount = 0;
                      setGlassTypeForm(prev => ({
                        ...prev,
                        productTypes: prev.productTypes.map(pt => ({
                          ...pt,
                          thicknesses: pt.thicknesses.map(t => {
                            if (!t.sku && currentSkuPattern) {
                              filledCount++;
                              return {
                                ...t,
                                sku: generateSkuFromPattern(t.thickness.toString(), currentSkuPattern)
                              };
                            }
                            return t;
                          })
                        }))
                      }));
                      
                      if (filledCount > 0) {
                        setShowAutoFillSuccess(true);
                        setTimeout(() => setShowAutoFillSuccess(false), 3000);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="w-6 h-6" />
                    Yes, Use Pattern
                  </button>
                  <button
                    onClick={() => {
                      setUsePredictivePattern(false);
                      setShowPatternPrompt(false);
                      setCurrentSkuPattern({});
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="w-6 h-6" />
                    No Thanks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Glass Configuration Tab Content */}
      {activeTab === 'glass' && (
        <>
          {/* Step 1: Overview & Existing Glass Types */}
          {glassStep === 1 && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Glass Module Overview</h2>
            <p className="text-blue-700 mb-4">
              Configure glass types that will appear in users' workflow. Each glass type goes through the complete configuration process.
            </p>
            <button
              onClick={startCreatingGlassType}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <PlusIcon className="w-6 h-6" />
              Start Creating New Glass Type
            </button>
          </div>

          {/* Existing Glass Types */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Configured Glass Types</h3>
              <p className="text-base text-gray-600">Glass types that appear in users' subcategory dropdown</p>
            </div>
            <div className="p-6">
              {glassTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No glass types configured yet</p>
                  <p className="text-sm">Users won't see any options in their glass module</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {glassTypes.map(glassType => (
                    <div key={glassType.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{glassType.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex gap-2">
                              {glassType.productTypes.map(pt => (
                                <span key={pt.id} className={`px-2 py-0.5 rounded text-sm font-semibold ${
                                  pt.name === 'Toughened' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {pt.name}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {glassType.productTypes.reduce((acc, pt) => acc + pt.thicknesses.length, 0)} thicknesses total
                            </span>
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${
                              glassType.isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {glassType.isComplete ? 'Complete' : 'In Progress'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Create a variation with opposite toughening
                              const hasToughened = glassType.productTypes.some(pt => pt.name === 'Toughened');
                              const hasNotToughened = glassType.productTypes.some(pt => pt.name === 'Not Toughened');
                              
                              if (!hasToughened || !hasNotToughened) {
                                // Create the opposite variation
                                const sourceProductType = glassType.productTypes[0];
                                const oppositeType = sourceProductType.name === 'Toughened' ? 'Not Toughened' : 'Toughened';
                                
                                // Clone thicknesses with cleared prices
                                const clonedThicknesses = sourceProductType.thicknesses.map(t => ({
                                  ...t,
                                  id: `thickness-${Date.now()}-${Math.random()}`,
                                  pricePerMm: '', // Clear price for user to enter new values
                                  tierPrices: undefined // Clear tier prices
                                }));
                                
                                // Create new product type
                                const newProductType: ProductType = {
                                  id: `product-${Date.now()}`,
                                  glassTypeId: glassType.id,
                                  name: oppositeType,
                                  thicknesses: clonedThicknesses
                                };
                                
                                // Update the glass type with the new variation
                                const updatedGlassType = {
                                  ...glassType,
                                  productTypes: [...glassType.productTypes, newProductType]
                                };
                                
                                // Update state and save
                                setGlassTypes(prev => prev.map(gt => 
                                  gt.id === glassType.id ? updatedGlassType : gt
                                ));
                                localStorage.setItem('saleskik-glass-types-complete', 
                                  JSON.stringify(glassTypes.map(gt => 
                                    gt.id === glassType.id ? updatedGlassType : gt
                                  ))
                                );
                                
                                // Navigate to edit mode for pricing
                                setCurrentGlassType(updatedGlassType);
                                setGlassTypeForm({
                                  name: updatedGlassType.name,
                                  productTypes: updatedGlassType.productTypes
                                });
                                setGlassStep(2);
                                alert(`Added ${oppositeType} variation. Please update the pricing for the new variation.`);
                              } else {
                                alert('This glass type already has both Toughened and Not Toughened variations.');
                              }
                            }}
                            className="px-3 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            title="Add Variation (Toughened/Not Toughened)"
                          >
                            <PlusIcon className="w-5 h-5" />
                            <span>Add Variation</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentGlassType(glassType);
                              setGlassTypeForm({
                                name: glassType.name,
                                productTypes: glassType.productTypes
                              });
                              setGlassStep(2);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Glass Type"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${glassType.name}"?\n\nThis will remove:\n• All product types and thicknesses\n• All tier pricing\n• All associated processing options\n\nThis action cannot be undone.`)) {
                                // Remove the glass type
                                setGlassTypes(prev => prev.filter(gt => gt.id !== glassType.id));
                                
                                // Note: Processing options are now global and not removed with glass types
                                
                                // Save to localStorage
                                const updatedGlassTypes = glassTypes.filter(gt => gt.id !== glassType.id);
                                localStorage.setItem('saleskik-glass-types-complete', JSON.stringify(updatedGlassTypes));
                                
                                // Processing options remain unchanged as they are now global
                                localStorage.setItem('saleskik-processing-options', JSON.stringify(processingOptions));
                                
                                // Clear current glass type if it was the one being deleted
                                if (currentGlassType?.id === glassType.id) {
                                  setCurrentGlassType(null);
                                }
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Glass Type"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
          )}

          {/* Step 2: Creating/Editing Glass Type */}
          {glassStep === 2 && (
        <div className="space-y-8">
          {/* Glass Type Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Step 1: Configure Glass Type
              </h2>
              <p className="text-gray-600">This will appear in the user's subcategory dropdown</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">
                    Glass Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={glassTypeForm.name}
                    onChange={(e) => setGlassTypeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Clear Glass, Ultra Clear, Mirror"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Types Configuration */}
          <div className={`rounded-xl border shadow-sm ${
            glassTypeForm.name.trim() 
              ? 'bg-white border-gray-200' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            <div className={`px-6 py-4 border-b border-gray-200 ${!glassTypeForm.name.trim() ? 'opacity-50' : ''}`}>
              <h3 className={`text-lg font-bold ${glassTypeForm.name.trim() ? 'text-gray-900' : 'text-gray-500'}`}>
                Step 2: Configure Product Types 
              </h3>
              <p className={`${glassTypeForm.name.trim() ? 'text-gray-600' : 'text-gray-400'}`}>
                {glassTypeForm.name.trim() ? 'Add Toughened and/or Not Toughened variants' : 'Complete Step 1 first to unlock this step'}
              </p>
            </div>

            <div className={`p-6 space-y-6 ${!glassTypeForm.name.trim() ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Add Product Type */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Add Product Type Variant</h4>
                <div className="flex items-center gap-4">
                  <CustomDropdown
                    value={currentProductType || ''}
                    onChange={(value) => setCurrentProductType(value as any)}
                    placeholder="Select Product Type"
                    options={[
                      { value: 'Toughened', label: 'Toughened' },
                      { value: 'Not Toughened', label: 'Not Toughened' }
                    ]}
                    className="min-w-[180px]"
                  />
                  <button
                    onClick={() => {
                      if (!currentProductType) return;
                      
                      const exists = glassTypeForm.productTypes.some(pt => pt.name === currentProductType);
                      if (exists) return;

                      const newProductType: ProductType = {
                        id: `${currentProductType.toLowerCase().replace(' ', '-')}-${Date.now()}`,
                        name: currentProductType,
                        glassTypeId: currentGlassType?.id || '',
                        thicknesses: []
                      };

                      setGlassTypeForm(prev => ({
                        ...prev,
                        productTypes: [...prev.productTypes, newProductType]
                      }));
                      setCurrentProductType(null);
                    }}
                    disabled={!currentProductType}
                    className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Product Type
                  </button>
                </div>
              </div>

              {/* Current Product Types */}
              {glassTypeForm.productTypes.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-4">Configured Product Types</h4>
                  <div className="space-y-6">
                    {glassTypeForm.productTypes.map(productType => (
                      <div key={productType.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-gray-900">{productType.name}</h5>
                            <span className="text-sm text-gray-500">
                              ({productType.thicknesses.length} thicknesses)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {glassTypeForm.productTypes.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${productType.name} variation?\n\nThis will delete all ${productType.thicknesses.length} configured thicknesses for this variation.`)) {
                                    setGlassTypeForm(prev => ({
                                      ...prev,
                                      productTypes: prev.productTypes.filter(pt => pt.id !== productType.id)
                                    }));
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Delete this variation"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Pattern detection prompt moved to global level */}

                        {/* Success message */}
                        {showAutoFillSuccess && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-500 rounded-full">
                                <CheckIcon className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-sm text-green-800 font-medium">
                                All empty SKUs have been auto-filled with the pattern!
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Show active pattern */}
                        {usePredictivePattern && currentSkuPattern && Object.keys(currentSkuPattern).length > 0 && (
                          <div className="bg-green-50 border border-green-300 rounded p-2 mb-3">
                            <p className="text-xs text-green-800">
                              ✅ Using predictive pattern: <span className="font-mono font-bold">{currentSkuPattern.prefix}[thickness]{currentSkuPattern.suffix}</span>
                              <button
                                onClick={() => {
                                  setUsePredictivePattern(false);
                                  setCurrentSkuPattern({});
                                }}
                                className="ml-2 text-red-600 hover:text-red-800 underline text-xs"
                              >
                                Disable
                              </button>
                            </p>
                          </div>
                        )}

                        {/* Bulk Thickness Entry */}
                        <div className="bg-blue-50 rounded p-3 mb-3">
                          <h6 className="font-medium text-blue-900 mb-2">🚀 Quick Bulk Entry (Optional)</h6>
                          <p className="text-xs text-blue-700 mb-2">Type comma-separated thicknesses: "4, 5, 6, 8, 10, 12" and press Enter</p>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={bulkThicknessInput}
                                onChange={(e) => setBulkThicknessInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addBulkThicknesses(productType);
                                  }
                                }}
                                placeholder="4, 5, 6, 8, 10, 12, 15"
                                className="w-full px-4 py-3 text-base border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              onClick={() => addBulkThicknesses(productType)}
                              disabled={!bulkThicknessInput.trim()}
                              className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              Create Fields
                            </button>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">This will create thickness entries with empty SKUs and $0 pricing that you can then fill in</p>
                        </div>

                        {/* Add Individual Thickness & Pricing */}
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <h6 className="font-bold text-gray-700 text-base mb-3">Add Individual Thickness & Pricing</h6>
                          
                          {/* Simple Pattern Detection Info */}
                          {productType.thicknesses.length === 1 && !usePredictivePattern && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                              <p className="text-xs text-blue-700">
                                💡 Tip: After adding your second thickness, we'll detect if you're using a pattern and offer to auto-generate SKUs
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-5 gap-3 items-end">
                            <div className="relative">
                              <label className="block text-base font-bold text-gray-600 mb-2">SKU <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={thicknessForm.sku}
                                onChange={(e) => {
                                  const newSku = e.target.value.toUpperCase();
                                  setThicknessForm(prev => ({ ...prev, sku: newSku }));
                                  setShowSkuSuggestions(false);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && thicknessForm.sku && thicknessForm.thickness && thicknessForm.pricePerMm) {
                                    e.preventDefault();
                                    addThicknessToProductType(productType);
                                  }
                                }}
                                onFocus={() => {
                                  // If predictive pattern is enabled and thickness is entered, show suggestion
                                  if (thicknessForm.thickness && !thicknessForm.sku && usePredictivePattern && currentSkuPattern) {
                                    const suggestion = generateSkuFromPattern(thicknessForm.thickness, currentSkuPattern);
                                    if (suggestion) {
                                      setSkuSuggestions([suggestion]);
                                      setShowSkuSuggestions(true);
                                    }
                                  }
                                }}
                                onBlur={() => setTimeout(() => setShowSkuSuggestions(false), 200)}
                                placeholder={usePredictivePattern && currentSkuPattern.prefix ? `Pattern: ${currentSkuPattern.prefix}[thickness]${currentSkuPattern.suffix}` : "Enter SKU"}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                              />
                              {showSkuSuggestions && skuSuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg">
                                  {skuSuggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setThicknessForm(prev => ({ ...prev, sku: suggestion }));
                                        setShowSkuSuggestions(false);
                                      }}
                                      className="w-full px-2 py-1 text-left text-sm hover:bg-blue-50 font-mono"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-base font-bold text-gray-600 mb-2">Thickness (mm)</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={thicknessForm.thickness}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string, numbers, and decimal point
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setThicknessForm(prev => ({ ...prev, thickness: value }));
                                    // If using predictive pattern, auto-fill SKU
                                    if (value && !thicknessForm.sku && usePredictivePattern && currentSkuPattern) {
                                      const autoSku = generateSkuFromPattern(value, currentSkuPattern);
                                      setThicknessForm(prev => ({ ...prev, sku: autoSku }));
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && thicknessForm.sku && thicknessForm.thickness && thicknessForm.pricePerMm) {
                                    e.preventDefault();
                                    addThicknessToProductType(productType);
                                  }
                                }}
                                placeholder="6, 10, 12"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-base font-bold text-gray-600 mb-2">Cost Price per m²</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={thicknessForm.pricePerMm}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty string, numbers, and decimal point
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                      setThicknessForm(prev => ({ ...prev, pricePerMm: value }));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && thicknessForm.sku && thicknessForm.thickness && thicknessForm.pricePerMm) {
                                      e.preventDefault();
                                      addThicknessToProductType(productType);
                                    }
                                  }}
                                  placeholder="120.00"
                                  className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-base font-bold text-gray-600 mb-2">Lead Time (business days)</label>
                              <input
                                type="number"
                                value={thicknessForm.leadTimeBusinessDays}
                                onChange={(e) => setThicknessForm(prev => ({ ...prev, leadTimeBusinessDays: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && thicknessForm.sku && thicknessForm.thickness && thicknessForm.pricePerMm) {
                                    e.preventDefault();
                                    addThicknessToProductType(productType);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              onClick={() => addThicknessToProductType(productType)}
                              disabled={!thicknessForm.sku || !thicknessForm.thickness || !thicknessForm.pricePerMm}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Current Thicknesses for this Product Type */}
                        {productType.thicknesses.length > 0 && (
                          <div className="space-y-2">
                            {/* Auto-fill button when pattern is active */}
                            {usePredictivePattern && currentSkuPattern && productType.thicknesses.some(t => !t.sku) && (
                              <div className="bg-green-50 border border-green-300 rounded p-2 flex items-center justify-between">
                                <p className="text-sm text-green-800">
                                  Pattern active: <span className="font-mono font-bold">{currentSkuPattern.prefix}[thickness]{currentSkuPattern.suffix}</span>
                                </p>
                                <button
                                  onClick={() => {
                                    // Auto-fill all empty SKUs with pattern
                                    setGlassTypeForm(prev => ({
                                      ...prev,
                                      productTypes: prev.productTypes.map(pt =>
                                        pt.id === productType.id
                                          ? {
                                              ...pt,
                                              thicknesses: pt.thicknesses.map(t => ({
                                                ...t,
                                                sku: t.sku || generateSkuFromPattern(t.thickness.toString(), currentSkuPattern)
                                              }))
                                            }
                                          : pt
                                      )
                                    }));
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  Auto-fill Empty SKUs
                                </button>
                              </div>
                            )}
                            
                            {productType.thicknesses.map(thickness => (
                              <div key={thickness.id} className="bg-white border border-gray-200 rounded p-2">
                                {editingThickness === thickness.id ? (
                                  // Inline editing mode
                                  <div className="grid grid-cols-5 gap-2 items-center">
                                    <input
                                      type="text"
                                      value={thickness.sku}
                                      onChange={(e) => {
                                        const newSku = e.target.value.toUpperCase();
                                        
                                        // Update the SKU
                                        setGlassTypeForm(prev => ({
                                          ...prev,
                                          productTypes: prev.productTypes.map(pt =>
                                            pt.id === productType.id
                                              ? { ...pt, thicknesses: pt.thicknesses.map(t => 
                                                  t.id === thickness.id ? { ...t, sku: newSku } : t
                                                )}
                                              : pt
                                          )
                                        }));
                                        
                                        // Check for pattern when editing bulk SKUs
                                        if (newSku && !usePredictivePattern && !showPatternPrompt) {
                                          const skusWithValues = productType.thicknesses
                                            .filter(t => (t.id === thickness.id ? newSku : t.sku))
                                            .map(t => ({
                                              sku: t.id === thickness.id ? newSku : t.sku,
                                              thickness: t.thickness
                                            }))
                                            .filter(t => t.sku);
                                          
                                          if (skusWithValues.length >= 2) {
                                            // Check if all entered SKUs follow a pattern
                                            const patterns = skusWithValues.map(item => 
                                              detectSkuPattern(item.sku, item.thickness.toString())
                                            );
                                            
                                            // Check if all patterns match
                                            const firstPattern = patterns[0];
                                            const allMatch = patterns.every(p => 
                                              p && firstPattern &&
                                              p.prefix === firstPattern.prefix &&
                                              p.suffix === firstPattern.suffix &&
                                              p.includesThickness === firstPattern.includesThickness
                                            );
                                            
                                            if (allMatch && firstPattern) {
                                              console.log('Bulk pattern detected:', firstPattern);
                                              setDetectedPattern(firstPattern.example || '');
                                              setCurrentSkuPattern(firstPattern);
                                              setShowPatternPrompt(true);
                                            }
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && usePredictivePattern && !thickness.sku) {
                                          // Auto-fill with pattern on Enter
                                          const autoSku = generateSkuFromPattern(thickness.thickness.toString(), currentSkuPattern);
                                          if (autoSku) {
                                            setGlassTypeForm(prev => ({
                                              ...prev,
                                              productTypes: prev.productTypes.map(pt =>
                                                pt.id === productType.id
                                                  ? { ...pt, thicknesses: pt.thicknesses.map(t => 
                                                      t.id === thickness.id ? { ...t, sku: autoSku } : t
                                                    )}
                                                  : pt
                                              )
                                            }));
                                          }
                                        }
                                      }}
                                      className="font-mono text-sm border border-gray-300 rounded px-2 py-1"
                                      placeholder={usePredictivePattern && currentSkuPattern.prefix ? 
                                        generateSkuFromPattern(thickness.thickness.toString(), currentSkuPattern) : 
                                        "Enter SKU"
                                      }
                                    />
                                    <span className="font-bold text-gray-900 text-center">{thickness.thickness}mm</span>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={thickness.pricePerMm || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          // Allow empty string, numbers, and decimal point
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            setGlassTypeForm(prev => ({
                                              ...prev,
                                              productTypes: prev.productTypes.map(pt =>
                                                pt.id === productType.id
                                                  ? { ...pt, thicknesses: pt.thicknesses.map(t => 
                                                      t.id === thickness.id ? { ...t, pricePerMm: value === '' ? '' : parseFloat(value) || value } : t
                                                    )}
                                                  : pt
                                              )
                                            }));
                                          }
                                        }}
                                        className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded"
                                        placeholder="120.00"
                                      />
                                    </div>
                                    <input
                                      type="number"
                                      value={thickness.leadTimeBusinessDays}
                                      onChange={(e) => {
                                        setGlassTypeForm(prev => ({
                                          ...prev,
                                          productTypes: prev.productTypes.map(pt =>
                                            pt.id === productType.id
                                              ? { ...pt, thicknesses: pt.thicknesses.map(t => 
                                                  t.id === thickness.id ? { ...t, leadTimeBusinessDays: parseInt(e.target.value) || 7 } : t
                                                )}
                                              : pt
                                          )
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setEditingThickness(null)}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                      >
                                        <CheckIcon className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setGlassTypeForm(prev => ({
                                            ...prev,
                                            productTypes: prev.productTypes.map(pt =>
                                              pt.id === productType.id
                                                ? { ...pt, thicknesses: pt.thicknesses.filter(t => t.id !== thickness.id) }
                                                : pt
                                            )
                                          }));
                                          setEditingThickness(null);
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      >
                                        <XMarkIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // Display mode
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                      <span className={`font-mono text-blue-600 font-bold text-sm px-2 py-1 rounded ${
                                        thickness.sku ? 'bg-blue-50' : 'bg-red-50 text-red-600'
                                      }`}>
                                        {thickness.sku || 'SKU NEEDED'}
                                      </span>
                                      <span className="font-bold text-gray-900">{thickness.thickness}mm</span>
                                      <span className={`font-medium ${
                                        (typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm) > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        ${(typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm) > 0 ? 
                                          (typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm).toFixed(2) : thickness.pricePerMm.toFixed(2)) : 
                                          '0.00'}/m²
                                      </span>
                                      <span className="text-gray-500 text-sm">{thickness.leadTimeBusinessDays} business days</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setEditingThickness(thickness.id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Edit thickness details"
                                      >
                                        <PencilIcon className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setGlassTypeForm(prev => ({
                                            ...prev,
                                            productTypes: prev.productTypes.map(pt =>
                                              pt.id === productType.id
                                                ? { ...pt, thicknesses: pt.thicknesses.filter(t => t.id !== thickness.id) }
                                                : pt
                                            )
                                          }));
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Delete thickness"
                                      >
                                        <XMarkIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complete Glass Type Creation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">Ready to Complete Glass Type?</h3>
                <p className="text-gray-600 text-sm">
                  Glass type must have at least one product type with thicknesses before proceeding to processing options
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setGlassStep(1)}
                  className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Overview
                </button>
                <button
                  onClick={completeGlassTypeCreation}
                  disabled={!glassTypeForm.name || glassTypeForm.productTypes.length === 0 || 
                            !glassTypeForm.productTypes.some(pt => pt.thicknesses.length > 0)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  Complete Glass Type & Continue
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
          )}

          {/* Step 3: Customer Pricing (Using existing T1/T2/T3/Retail system) */}
          {glassStep === 3 && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-2">
              Step 3: Configure Customer Pricing Tiers
            </h2>
            <p className="text-purple-700">
              Configure the pricing tier system used across quotes and orders. Each customer is assigned to one of these tiers.
            </p>
            <div className="mt-3 bg-purple-100 rounded-lg p-3">
              <p className="text-sm text-purple-800 font-medium">
                💡 This integrates with your existing customer pricing system (T1, T2, T3, Retail)
              </p>
            </div>
          </div>

          {/* Tier Labels Configuration */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Customize Tier Names</h3>
              <p className="text-base text-gray-600">Rename the pricing tiers to match your business terminology</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Tier 1 Label (Best Price)
                  </label>
                  <input
                    type="text"
                    value={tierLabels.t1}
                    onChange={(e) => setTierLabels((prev: typeof tierLabels) => ({ ...prev, t1: e.target.value }))}
                    placeholder="T1"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Currently: {tierLabels.t1}</p>
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Tier 2 Label
                  </label>
                  <input
                    type="text"
                    value={tierLabels.t2}
                    onChange={(e) => setTierLabels((prev: typeof tierLabels) => ({ ...prev, t2: e.target.value }))}
                    placeholder="T2"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Currently: {tierLabels.t2}</p>
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Tier 3 Label
                  </label>
                  <input
                    type="text"
                    value={tierLabels.t3}
                    onChange={(e) => setTierLabels((prev: typeof tierLabels) => ({ ...prev, t3: e.target.value }))}
                    placeholder="T3"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Currently: {tierLabels.t3}</p>
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Retail Label
                  </label>
                  <input
                    type="text"
                    value={tierLabels.retail}
                    onChange={(e) => setTierLabels((prev: typeof tierLabels) => ({ ...prev, retail: e.target.value }))}
                    placeholder="Retail"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Currently: {tierLabels.retail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Glass Type Selector for Tier Pricing */}
          {glassTypes.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Select Glass Type for Pricing</h3>
                <p className="text-base text-gray-600">Choose which glass type to configure pricing for</p>
              </div>
              <div className="p-6">
                <CustomDropdown
                  value={currentGlassType?.id || ''}
                  onChange={(value) => {
                    const selectedGlass = glassTypes.find(gt => gt.id === value);
                    setCurrentGlassType(selectedGlass || null);
                  }}
                  placeholder="Select a glass type..."
                  options={glassTypes.map(glassType => ({
                    value: glassType.id,
                    label: `${glassType.name} (${glassType.productTypes.reduce((acc, pt) => acc + pt.thicknesses.length, 0)} thicknesses)`
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3">
                <CubeIcon className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-yellow-900">No Glass Types Available</h3>
                  <p className="text-yellow-700">Please configure glass types in Step 2 before setting up tier pricing.</p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Table for All Thicknesses */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Configure Tier Pricing</h3>
                  <p className="text-base text-gray-600">
                    {currentGlassType ? `Set prices for ${currentGlassType.name}` : 'Select a glass type above to set tier prices'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-base font-semibold text-gray-700">Show Margins</label>
                  <button
                    onClick={() => setShowMargins(!showMargins)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showMargins ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showMargins ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {currentGlassType && currentGlassType.productTypes.some(pt => pt.thicknesses.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-5 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                          Thickness
                        </th>
                        <th className="px-8 py-5 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                          SKU
                        </th>
                        <th className="px-8 py-5 text-center text-base font-bold text-gray-700 uppercase tracking-wide bg-gray-100">
                          Cost Price
                        </th>
                        <th className="px-8 py-5 text-center text-base font-bold text-gray-700 uppercase tracking-wide bg-green-50">
                          {tierLabels.t1} Price
                        </th>
                        <th className="px-8 py-5 text-center text-base font-bold text-gray-700 uppercase tracking-wide bg-blue-50">
                          {tierLabels.t2} Price
                        </th>
                        <th className="px-8 py-5 text-center text-base font-bold text-gray-700 uppercase tracking-wide bg-purple-50">
                          {tierLabels.t3} Price
                        </th>
                        <th className="px-8 py-5 text-center text-base font-bold text-gray-700 uppercase tracking-wide bg-orange-50">
                          {tierLabels.retail} Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentGlassType.productTypes.map((productType) => (
                        <React.Fragment key={productType.id}>
                          {productType.thicknesses.length > 0 && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-6 py-3 text-base font-semibold text-gray-800">
                                {productType.name}
                              </td>
                            </tr>
                          )}
                          {productType.thicknesses.map((thickness) => {
                            // Initialize tier prices if not exists - start with empty values
                            if (!thickness.tierPrices) {
                              thickness.tierPrices = {
                                t1: '',      // User enters their own price
                                t2: '',      // User enters their own price
                                t3: '',      // User enters their own price
                                retail: ''   // User enters their own price
                              };
                            }
                            return (
                              <tr key={thickness.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-lg font-bold text-gray-900">
                                  {thickness.thickness}mm
                                </td>
                                <td className="px-6 py-4 text-lg font-mono font-semibold text-gray-700">
                                  {thickness.sku}
                                </td>
                                <td className="px-6 py-4 text-center bg-gray-100">
                                  <span className="text-lg font-bold text-gray-800">
                                    ${typeof thickness.pricePerMm === 'string' && thickness.pricePerMm ? 
                                      parseFloat(thickness.pricePerMm).toFixed(2) : 
                                      typeof thickness.pricePerMm === 'number' ? 
                                      thickness.pricePerMm.toFixed(2) : 
                                      '—'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 bg-green-50">
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-gray-500 text-base">$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={thickness.tierPrices?.t1 || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          // Allow empty string, numbers, and decimal point
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            const updatedGlassTypes = [...glassTypes];
                                            const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                            const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                            const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                            if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                              updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              };
                                            }
                                            updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t1 = value;
                                            setGlassTypes(updatedGlassTypes);
                                            setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%') {
                                            e.preventDefault();
                                            const marginPercent = parseFloat(thickness.tierPrices?.t1 as string || '0');
                                            if (marginPercent > 0 && marginPercent < 100) {
                                              const costPrice = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) || 0 : thickness.pricePerMm;
                                              if (costPrice > 0) {
                                                // Calculate price from margin: price = cost / (1 - margin/100)
                                                const calculatedPrice = costPrice / (1 - marginPercent / 100);
                                                const updatedGlassTypes = [...glassTypes];
                                                const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                                const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                                const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                                if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                                  updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                    t1: '',
                                                    t2: '',
                                                    t3: '',
                                                    retail: ''
                                                  };
                                                }
                                                updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t1 = calculatedPrice.toFixed(2);
                                                setGlassTypes(updatedGlassTypes);
                                                setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                              }
                                            }
                                          }
                                        }}
                                        placeholder="Price or %"
                                        className="w-full pl-8 pr-3 py-2 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                      />
                                    </div>
                                    {showMargins && thickness.pricePerMm && thickness.tierPrices?.t1 && (
                                      <div className="text-center">
                                        <span className="text-sm font-semibold text-green-700">
                                          {(() => {
                                            const cost = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm;
                                            const price = typeof thickness.tierPrices.t1 === 'string' ? parseFloat(thickness.tierPrices.t1) : thickness.tierPrices.t1;
                                            if (cost > 0 && price > 0) {
                                              const margin = ((price - cost) / price * 100).toFixed(1);
                                              return `${margin}% margin`;
                                            }
                                            return '';
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 bg-blue-50">
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-gray-500 text-base">$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={thickness.tierPrices?.t2 || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            const updatedGlassTypes = [...glassTypes];
                                            const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                            const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                            const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                            if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                              updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              };
                                            }
                                            updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t2 = value;
                                            setGlassTypes(updatedGlassTypes);
                                            setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%') {
                                            e.preventDefault();
                                            const marginPercent = parseFloat(thickness.tierPrices?.t2 as string || '0');
                                            if (marginPercent > 0 && marginPercent < 100) {
                                              const costPrice = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) || 0 : thickness.pricePerMm;
                                              if (costPrice > 0) {
                                                const calculatedPrice = costPrice / (1 - marginPercent / 100);
                                                const updatedGlassTypes = [...glassTypes];
                                                const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                                const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                                const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                                if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                                  updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                    t1: '',
                                                    t2: '',
                                                    t3: '',
                                                    retail: ''
                                                  };
                                                }
                                                updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t2 = calculatedPrice.toFixed(2);
                                                setGlassTypes(updatedGlassTypes);
                                                setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                              }
                                            }
                                          }
                                        }}
                                        placeholder="Price or %"
                                        className="w-full pl-8 pr-3 py-2 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    {showMargins && thickness.pricePerMm && thickness.tierPrices?.t2 && (
                                      <div className="text-center">
                                        <span className="text-sm font-semibold text-blue-700">
                                          {(() => {
                                            const cost = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm;
                                            const price = typeof thickness.tierPrices.t2 === 'string' ? parseFloat(thickness.tierPrices.t2) : thickness.tierPrices.t2;
                                            if (cost > 0 && price > 0) {
                                              const margin = ((price - cost) / price * 100).toFixed(1);
                                              return `${margin}% margin`;
                                            }
                                            return '';
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 bg-purple-50">
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-gray-500 text-base">$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={thickness.tierPrices?.t3 || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            const updatedGlassTypes = [...glassTypes];
                                            const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                            const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                            const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                            if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                              updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              };
                                            }
                                            updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t3 = value;
                                            setGlassTypes(updatedGlassTypes);
                                            setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%') {
                                            e.preventDefault();
                                            const marginPercent = parseFloat(thickness.tierPrices?.t3 as string || '0');
                                            if (marginPercent > 0 && marginPercent < 100) {
                                              const costPrice = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) || 0 : thickness.pricePerMm;
                                              if (costPrice > 0) {
                                                const calculatedPrice = costPrice / (1 - marginPercent / 100);
                                                const updatedGlassTypes = [...glassTypes];
                                                const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                                const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                                const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                                if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                                  updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                    t1: '',
                                                    t2: '',
                                                    t3: '',
                                                    retail: ''
                                                  };
                                                }
                                                updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.t3 = calculatedPrice.toFixed(2);
                                                setGlassTypes(updatedGlassTypes);
                                                setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                              }
                                            }
                                          }
                                        }}
                                        placeholder="Price or %"
                                        className="w-full pl-8 pr-3 py-2 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>
                                    {showMargins && thickness.pricePerMm && thickness.tierPrices?.t3 && (
                                      <div className="text-center">
                                        <span className="text-sm font-semibold text-purple-700">
                                          {(() => {
                                            const cost = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm;
                                            const price = typeof thickness.tierPrices.t3 === 'string' ? parseFloat(thickness.tierPrices.t3) : thickness.tierPrices.t3;
                                            if (cost > 0 && price > 0) {
                                              const margin = ((price - cost) / price * 100).toFixed(1);
                                              return `${margin}% margin`;
                                            }
                                            return '';
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 bg-orange-50">
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-gray-500 text-base">$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={thickness.tierPrices?.retail || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            const updatedGlassTypes = [...glassTypes];
                                            const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                            const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                            const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                            if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                              updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              };
                                            }
                                            updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.retail = value;
                                            setGlassTypes(updatedGlassTypes);
                                            setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%') {
                                            e.preventDefault();
                                            const marginPercent = parseFloat(thickness.tierPrices?.retail as string || '0');
                                            if (marginPercent > 0 && marginPercent < 100) {
                                              const costPrice = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) || 0 : thickness.pricePerMm;
                                              if (costPrice > 0) {
                                                const calculatedPrice = costPrice / (1 - marginPercent / 100);
                                                const updatedGlassTypes = [...glassTypes];
                                                const glassTypeIndex = updatedGlassTypes.findIndex(gt => gt.id === currentGlassType.id);
                                                const productTypeIndex = updatedGlassTypes[glassTypeIndex].productTypes.findIndex(pt => pt.id === productType.id);
                                                const thicknessIndex = updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses.findIndex(t => t.id === thickness.id);
                                                if (!updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices) {
                                                  updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices = {
                                                    t1: '',
                                                    t2: '',
                                                    t3: '',
                                                    retail: ''
                                                  };
                                                }
                                                updatedGlassTypes[glassTypeIndex].productTypes[productTypeIndex].thicknesses[thicknessIndex].tierPrices!.retail = calculatedPrice.toFixed(2);
                                                setGlassTypes(updatedGlassTypes);
                                                setCurrentGlassType(updatedGlassTypes[glassTypeIndex]);
                                              }
                                            }
                                          }
                                        }}
                                        placeholder="Price or %"
                                        className="w-full pl-8 pr-3 py-2 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                      />
                                    </div>
                                    {showMargins && thickness.pricePerMm && thickness.tierPrices?.retail && (
                                      <div className="text-center">
                                        <span className="text-sm font-semibold text-orange-700">
                                          {(() => {
                                            const cost = typeof thickness.pricePerMm === 'string' ? parseFloat(thickness.pricePerMm) : thickness.pricePerMm;
                                            const price = typeof thickness.tierPrices.retail === 'string' ? parseFloat(thickness.tierPrices.retail) : thickness.tierPrices.retail;
                                            if (cost > 0 && price > 0) {
                                              const margin = ((price - cost) / price * 100).toFixed(1);
                                              return `${margin}% margin`;
                                            }
                                            return '';
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : currentGlassType ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No thicknesses configured for {currentGlassType.name}. Please complete Step 2 to add thicknesses first.</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a glass type above to configure tier pricing.</p>
                </div>
              )}
            </div>
          </div>

          {/* How Tiers Are Used */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">How Customer Tiers Work</h3>
              <p className="text-base text-gray-600">Understanding the pricing system integration</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-base">Customer Assignment</h5>
                    <p className="text-base text-gray-600">Each customer is assigned to one tier ({tierLabels.t1}, {tierLabels.t2}, {tierLabels.t3}, or {tierLabels.retail})</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-base">Automatic Price Calculation</h5>
                    <p className="text-base text-gray-600">When creating quotes, prices are automatically calculated based on the customer's tier</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-base">Glass Module Integration</h5>
                    <p className="text-base text-gray-600">The base prices you set in Step 2 are used as {tierLabels.t1} prices</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Configuration */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">Glass Configuration Complete</h3>
                <p className="text-gray-600 text-sm">
                  Save this glass type configuration to make it available for quotes
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setGlassStep(2)}
                  className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Configure
                </button>
                <button
                  onClick={() => {
                    // Save all configurations
                    localStorage.setItem('saleskik-tier-labels', JSON.stringify(tierLabels));
                    localStorage.setItem('saleskik-glass-types-complete', JSON.stringify(glassTypes));
                    
                    // Mark current glass type as complete if it exists
                    if (currentGlassType) {
                      setGlassTypes(prev => prev.map(gt => 
                        gt.id === currentGlassType.id 
                          ? { ...gt, isComplete: true }
                          : gt
                      ));
                    }
                    
                    // Return to overview
                    setGlassStep(1);
                    setCurrentGlassType(null);
                    setGlassTypeForm({ name: '', productTypes: [] });
                    
                    // Show success message (you could add a toast here)
                    alert('Glass configuration saved successfully!');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2"
                >
                  <CheckIcon className="w-6 h-6" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
          )}
        </>
      )}

      {/* Processing - Edgework Tab Content */}
      {activeTab === 'processing-edgework' && (
        <div className="space-y-8">
          {/* Edgework Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <h2 className="text-xl font-bold text-green-900 mb-2">Edgework Processing Configuration</h2>
            <p className="text-green-700">
              Configure edgework options with thickness-based pricing. Edgework prices vary based on glass thickness.
            </p>
          </div>

          {/* Add New Edgework Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Add New Edgework Option</h3>
              <p className="text-base text-gray-600">Create a new edgework option with thickness-based pricing</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Option Name</label>
                  <input
                    type="text"
                    value={processingForm.name || ''}
                    onChange={(e) => setProcessingForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Polished Edge"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Supplier</label>
                  <CustomDropdown
                    value={processingForm.supplierId || ''}
                    onChange={(value) => setProcessingForm(prev => ({ ...prev, supplierId: value }))}
                    placeholder="Select Supplier..."
                    options={suppliers.map(supplier => ({
                      value: supplier.id,
                      label: supplier.name
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Pricing Type</label>
                  <CustomDropdown
                    value={processingForm.pricingType || 'per-linear-meter'}
                    onChange={(value) => setProcessingForm(prev => ({ ...prev, pricingType: value }))}
                    placeholder="Select Pricing Type"
                    options={[
                      { value: 'per-linear-meter', label: 'Per Linear Meter' },
                      { value: 'per-sqmeter', label: 'Per Square Meter' },
                      { value: 'each', label: 'Each' }
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Pricing Table for New Option */}
              {processingForm.name && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">Set Thickness Pricing</h4>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-600">Show Margins</label>
                      <button
                        onClick={() => setShowEdgeworkMargins(!showEdgeworkMargins)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          showEdgeworkMargins ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          showEdgeworkMargins ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  {glassTypes.length > 0 && glassTypes.some(gt => gt.productTypes.some(pt => pt.thicknesses.length > 0)) ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-base font-bold text-gray-600 uppercase">Thickness</th>
                            <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-gray-100">Cost</th>
                            <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-green-50">{tierLabels.t1}</th>
                            <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-blue-50">{tierLabels.t2}</th>
                            <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-purple-50">{tierLabels.t3}</th>
                            <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-orange-50">{tierLabels.retail}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {(() => {
                            // Get all unique thicknesses from all glass types
                            const allThicknesses = new Set<number>();
                            glassTypes.forEach(gt => {
                              gt.productTypes.forEach(pt => {
                                pt.thicknesses.forEach(t => {
                                  allThicknesses.add(t.thickness);
                                });
                              });
                            });
                            const sortedThicknesses = Array.from(allThicknesses).sort((a, b) => a - b);
                            
                            return sortedThicknesses.map(thickness => {
                              const thicknessKey = thickness.toString();
                              if (!processingForm.thicknessPricing[thicknessKey]) {
                                processingForm.thicknessPricing[thicknessKey] = {
                                  costPrice: '',
                                  t1: '',
                                  t2: '',
                                  t3: '',
                                  retail: ''
                                };
                              }
                              
                              return (
                                <tr key={thicknessKey}>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{thickness}mm</td>
                                  <td className="px-3 py-2 bg-gray-50">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={processingForm.thicknessPricing[thicknessKey]?.costPrice || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setProcessingForm(prev => ({
                                            ...prev,
                                            thicknessPricing: {
                                              ...prev.thicknessPricing,
                                              [thicknessKey]: {
                                                ...prev.thicknessPricing[thicknessKey],
                                                costPrice: value
                                              }
                                            }
                                          }));
                                        }
                                      }}
                                      placeholder="0.00"
                                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2 bg-green-50">
                                    <div>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={processingForm.thicknessPricing[thicknessKey]?.t1 || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            setProcessingForm(prev => ({
                                              ...prev,
                                              thicknessPricing: {
                                                ...prev.thicknessPricing,
                                                [thicknessKey]: {
                                                  ...prev.thicknessPricing[thicknessKey],
                                                  t1: value
                                                }
                                              }
                                            }));
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%' && processingForm.thicknessPricing[thicknessKey]?.costPrice) {
                                            e.preventDefault();
                                            const costPrice = parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice);
                                            const marginValue = parseFloat(processingForm.thicknessPricing[thicknessKey].t1 || '0');
                                            if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                              const price = costPrice / (1 - marginValue / 100);
                                              setProcessingForm(prev => ({
                                                ...prev,
                                                thicknessPricing: {
                                                  ...prev.thicknessPricing,
                                                  [thicknessKey]: {
                                                    ...prev.thicknessPricing[thicknessKey],
                                                    t1: price.toFixed(2)
                                                  }
                                                }
                                              }));
                                            }
                                          }
                                        }}
                                        placeholder="0.00"
                                        className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                      />
                                      {showEdgeworkMargins && processingForm.thicknessPricing[thicknessKey]?.costPrice && processingForm.thicknessPricing[thicknessKey]?.t1 && (
                                        <p className="text-xs text-green-600 mt-0.5">
                                          {((parseFloat(processingForm.thicknessPricing[thicknessKey].t1) - parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice)) / parseFloat(processingForm.thicknessPricing[thicknessKey].t1) * 100).toFixed(0)}%
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 bg-blue-50">
                                    <div>
                                      <input
                                      type="text"
                                      inputMode="decimal"
                                      value={processingForm.thicknessPricing[thicknessKey]?.t2 || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setProcessingForm(prev => ({
                                            ...prev,
                                            thicknessPricing: {
                                              ...prev.thicknessPricing,
                                              [thicknessKey]: {
                                                ...prev.thicknessPricing[thicknessKey],
                                                t2: value
                                              }
                                            }
                                          }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === '%' && processingForm.thicknessPricing[thicknessKey]?.costPrice) {
                                          e.preventDefault();
                                          const costPrice = parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice);
                                          const marginValue = parseFloat(processingForm.thicknessPricing[thicknessKey].t2 || '0');
                                          if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                            const price = costPrice / (1 - marginValue / 100);
                                            setProcessingForm(prev => ({
                                              ...prev,
                                              thicknessPricing: {
                                                ...prev.thicknessPricing,
                                                [thicknessKey]: {
                                                  ...prev.thicknessPricing[thicknessKey],
                                                  t2: price.toFixed(2)
                                                }
                                              }
                                            }));
                                          }
                                        }
                                      }}
                                      placeholder="0.00"
                                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                    />
                                    {showEdgeworkMargins && processingForm.thicknessPricing[thicknessKey]?.costPrice && processingForm.thicknessPricing[thicknessKey]?.t2 && (
                                      <p className="text-xs text-blue-600 mt-0.5">
                                        {((parseFloat(processingForm.thicknessPricing[thicknessKey].t2) - parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice)) / parseFloat(processingForm.thicknessPricing[thicknessKey].t2) * 100).toFixed(0)}%
                                      </p>
                                    )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 bg-purple-50">
                                    <div>
                                      <input
                                      type="text"
                                      inputMode="decimal"
                                      value={processingForm.thicknessPricing[thicknessKey]?.t3 || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setProcessingForm(prev => ({
                                            ...prev,
                                            thicknessPricing: {
                                              ...prev.thicknessPricing,
                                              [thicknessKey]: {
                                                ...prev.thicknessPricing[thicknessKey],
                                                t3: value
                                              }
                                            }
                                          }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === '%' && processingForm.thicknessPricing[thicknessKey]?.costPrice) {
                                          e.preventDefault();
                                          const costPrice = parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice);
                                          const marginValue = parseFloat(processingForm.thicknessPricing[thicknessKey].t3 || '0');
                                          if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                            const price = costPrice / (1 - marginValue / 100);
                                            setProcessingForm(prev => ({
                                              ...prev,
                                              thicknessPricing: {
                                                ...prev.thicknessPricing,
                                                [thicknessKey]: {
                                                  ...prev.thicknessPricing[thicknessKey],
                                                  t3: price.toFixed(2)
                                                }
                                              }
                                            }));
                                          }
                                        }
                                      }}
                                      placeholder="0.00"
                                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                    />
                                    {showEdgeworkMargins && processingForm.thicknessPricing[thicknessKey]?.costPrice && processingForm.thicknessPricing[thicknessKey]?.t3 && (
                                      <p className="text-xs text-purple-600 mt-0.5">
                                        {((parseFloat(processingForm.thicknessPricing[thicknessKey].t3) - parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice)) / parseFloat(processingForm.thicknessPricing[thicknessKey].t3) * 100).toFixed(0)}%
                                      </p>
                                    )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 bg-orange-50">
                                    <div>
                                      <input
                                      type="text"
                                      inputMode="decimal"
                                      value={processingForm.thicknessPricing[thicknessKey]?.retail || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setProcessingForm(prev => ({
                                            ...prev,
                                            thicknessPricing: {
                                              ...prev.thicknessPricing,
                                              [thicknessKey]: {
                                                ...prev.thicknessPricing[thicknessKey],
                                                retail: value
                                              }
                                            }
                                          }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === '%' && processingForm.thicknessPricing[thicknessKey]?.costPrice) {
                                          e.preventDefault();
                                          const costPrice = parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice);
                                          const marginValue = parseFloat(processingForm.thicknessPricing[thicknessKey].retail || '0');
                                          if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                            const price = costPrice / (1 - marginValue / 100);
                                            setProcessingForm(prev => ({
                                              ...prev,
                                              thicknessPricing: {
                                                ...prev.thicknessPricing,
                                                [thicknessKey]: {
                                                  ...prev.thicknessPricing[thicknessKey],
                                                  retail: price.toFixed(2)
                                                }
                                              }
                                            }));
                                          }
                                        }
                                      }}
                                      placeholder="0.00"
                                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                    />
                                    {showEdgeworkMargins && processingForm.thicknessPricing[thicknessKey]?.costPrice && processingForm.thicknessPricing[thicknessKey]?.retail && (
                                      <p className="text-xs text-orange-600 mt-0.5">
                                        {((parseFloat(processingForm.thicknessPricing[thicknessKey].retail) - parseFloat(processingForm.thicknessPricing[thicknessKey].costPrice)) / parseFloat(processingForm.thicknessPricing[thicknessKey].retail) * 100).toFixed(0)}%
                                      </p>
                                    )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      Please configure glass types with thicknesses first to set pricing.
                    </p>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  if (processingForm.name) {
                    // Ensure an edgework category exists
                    let edgeworkCategory = processingCategories.find(cat => cat.isThicknessBased);
                    if (!edgeworkCategory) {
                      edgeworkCategory = {
                        id: `cat-edgework-${Date.now()}`,
                        name: 'Edgework',
                        sequenceOrder: 0,
                        isThicknessBased: true
                      };
                      setProcessingCategories(prev => {
                        const updated = [edgeworkCategory!, ...prev];
                        localStorage.setItem('saleskik-processing-categories', JSON.stringify(updated));
                        return updated;
                      });
                    }
                    
                    // Create new edgework option
                    const newOption: ProcessingOption = {
                      id: `edgework-${Date.now()}`,
                      categoryId: edgeworkCategory.id,
                      name: processingForm.name,
                      supplierId: processingForm.supplierId,
                      pricingType: processingForm.pricingType as any || 'per-linear-meter',
                      thicknessPricing: processingForm.thicknessPricing || {},
                      displayOrder: processingOptions.filter(opt => opt.categoryId === edgeworkCategory!.id).length,
                      isActive: true
                    };
                    
                    const updatedOptions = [...processingOptions, newOption];
                    setProcessingOptions(updatedOptions);
                    localStorage.setItem('saleskik-processing-options', JSON.stringify(updatedOptions));
                    
                    // Clear form
                    setProcessingForm({ 
                      name: '', 
                      supplierId: '',
                      pricingType: 'per-linear-meter',
                      flatPricing: {
                        costPrice: '',
                        t1: '',
                        t2: '',
                        t3: '',
                        retail: ''
                      },
                      thicknessPricing: {} 
                    });
                  }
                }}
                disabled={!processingForm.name || !suppliers.length || !glassTypes.some(gt => gt.productTypes.some(pt => pt.thicknesses.length > 0))}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  !processingForm.name || !suppliers.length || !glassTypes.some(gt => gt.productTypes.some(pt => pt.thicknesses.length > 0))
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={
                  !processingForm.name ? 'Enter an option name first' :
                  !suppliers.length ? 'Add suppliers first' :
                  !glassTypes.some(gt => gt.productTypes.some(pt => pt.thicknesses.length > 0)) ? 'Add thickness types first' :
                  ''
                }
              >
                <PlusIcon className="w-6 h-6" />
                Add Edgework Option with Pricing
              </button>
            </div>
          </div>

          {/* Configured Edgework Options */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Configured Edgework Options</h3>
              <p className="text-base text-gray-600">Manage your existing edgework options and set pricing by thickness</p>
            </div>
                <div className="p-6">
                  {(() => {
                    // Find the edgework category
                    const edgeworkCategory = processingCategories.find(cat => cat.isThicknessBased);
                    // Get all options for the edgework category
                    const edgeworkOptions = edgeworkCategory 
                      ? processingOptions.filter(opt => opt.categoryId === edgeworkCategory.id)
                      : [];
                    
                    if (edgeworkOptions.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <AdjustmentsHorizontalIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No edgework options configured yet</p>
                          <p className="text-sm mt-2">Click "Configure Edgework Options" to add options</p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {edgeworkOptions.map(option => (
                          <div key={option.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4 bg-white">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{option.name}</h4>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      // Toggle expanded state for this option
                                      setExpandedOptions(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(option.id)) {
                                          newSet.delete(option.id);
                                        } else {
                                          newSet.add(option.id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    className={`p-1 ${expandedOptions.has(option.id) ? 'text-green-700 bg-green-100' : 'text-green-600 hover:bg-green-100'} rounded transition-colors`}
                                    title="Configure Pricing"
                                  >
                                    <CurrencyDollarIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete "${option.name}"? This action cannot be undone.`)) {
                                        const updatedOptions = processingOptions.filter(p => p.id !== option.id);
                                        setProcessingOptions(updatedOptions);
                                        // Save after deletion
                                        localStorage.setItem('saleskik-processing-options', JSON.stringify(updatedOptions));
                                      }
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete Option"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                {option.pricingType.replace(/-/g, ' ')}
                              </p>
                              {option.supplierId && suppliers.find(s => s.id === option.supplierId) && (
                                <p className="text-xs text-blue-600 mb-2">
                                  Supplier: {suppliers.find(s => s.id === option.supplierId)?.name}
                                </p>
                              )}
                              <p className="text-sm text-gray-700">
                                {Object.keys(option.thicknessPricing || {}).filter(
                                  key => option.thicknessPricing![key].retail || 
                                         option.thicknessPricing![key].t1 || 
                                         option.thicknessPricing![key].t2 || 
                                         option.thicknessPricing![key].t3
                                ).length > 0
                                  ? `✓ Pricing configured for ${Object.keys(option.thicknessPricing || {}).filter(
                                      key => option.thicknessPricing![key].retail || 
                                             option.thicknessPricing![key].t1 || 
                                             option.thicknessPricing![key].t2 || 
                                             option.thicknessPricing![key].t3
                                    ).length} thicknesses`
                                  : '⚠️ No pricing configured yet'}
                              </p>
                            </div>
                            
                            {/* Expandable Pricing Section */}
                            {expandedOptions.has(option.id) && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4">
                                <h5 className="font-medium text-gray-900 mb-3">Configure Thickness Pricing</h5>
                                {glassTypes.length > 0 && glassTypes.some(gt => gt.productTypes.some(pt => pt.thicknesses.length > 0)) ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                      <thead className="bg-white">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-base font-bold text-gray-600 uppercase">Thickness</th>
                                          <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-gray-100">Cost</th>
                                          <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-green-50">{tierLabels.t1}</th>
                                          <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-blue-50">{tierLabels.t2}</th>
                                          <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-purple-50">{tierLabels.t3}</th>
                                          <th className="px-4 py-3 text-center text-base font-bold text-gray-600 uppercase bg-orange-50">{tierLabels.retail}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {(() => {
                                          // Get all unique thicknesses from all glass types
                                          const allThicknesses = new Set<number>();
                                          glassTypes.forEach(gt => {
                                            gt.productTypes.forEach(pt => {
                                              pt.thicknesses.forEach(t => {
                                                allThicknesses.add(t.thickness);
                                              });
                                            });
                                          });
                                          const sortedThicknesses = Array.from(allThicknesses).sort((a, b) => a - b);
                                          
                                          return sortedThicknesses.map(thickness => {
                                            const thicknessKey = thickness.toString();
                                            if (!option.thicknessPricing) {
                                              option.thicknessPricing = {};
                                            }
                                            if (!option.thicknessPricing[thicknessKey]) {
                                              option.thicknessPricing[thicknessKey] = {
                                                costPrice: '',
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              };
                                            }
                                            
                                            return (
                                              <tr key={thicknessKey}>
                                                <td className="px-3 py-2 text-sm font-medium text-gray-900">{thickness}mm</td>
                                                <td className="px-3 py-2 bg-gray-50">
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={option.thicknessPricing[thicknessKey]?.costPrice || ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;
                                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        const updatedOptions = processingOptions.map(opt => {
                                                          if (opt.id === option.id) {
                                                            return {
                                                              ...opt,
                                                              thicknessPricing: {
                                                                ...opt.thicknessPricing,
                                                                [thicknessKey]: {
                                                                  ...opt.thicknessPricing![thicknessKey],
                                                                  costPrice: value
                                                                }
                                                              }
                                                            };
                                                          }
                                                          return opt;
                                                        });
                                                        setProcessingOptions(updatedOptions);
                                                      }
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 bg-green-50">
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={option.thicknessPricing[thicknessKey]?.t1 || ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;
                                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        const updatedOptions = processingOptions.map(opt => {
                                                          if (opt.id === option.id) {
                                                            return {
                                                              ...opt,
                                                              thicknessPricing: {
                                                                ...opt.thicknessPricing,
                                                                [thicknessKey]: {
                                                                  ...opt.thicknessPricing![thicknessKey],
                                                                  t1: value
                                                                }
                                                              }
                                                            };
                                                          }
                                                          return opt;
                                                        });
                                                        setProcessingOptions(updatedOptions);
                                                      }
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 bg-blue-50">
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={option.thicknessPricing[thicknessKey]?.t2 || ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;
                                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        const updatedOptions = processingOptions.map(opt => {
                                                          if (opt.id === option.id) {
                                                            return {
                                                              ...opt,
                                                              thicknessPricing: {
                                                                ...opt.thicknessPricing,
                                                                [thicknessKey]: {
                                                                  ...opt.thicknessPricing![thicknessKey],
                                                                  t2: value
                                                                }
                                                              }
                                                            };
                                                          }
                                                          return opt;
                                                        });
                                                        setProcessingOptions(updatedOptions);
                                                      }
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 bg-purple-50">
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={option.thicknessPricing[thicknessKey]?.t3 || ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;
                                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        const updatedOptions = processingOptions.map(opt => {
                                                          if (opt.id === option.id) {
                                                            return {
                                                              ...opt,
                                                              thicknessPricing: {
                                                                ...opt.thicknessPricing,
                                                                [thicknessKey]: {
                                                                  ...opt.thicknessPricing![thicknessKey],
                                                                  t3: value
                                                                }
                                                              }
                                                            };
                                                          }
                                                          return opt;
                                                        });
                                                        setProcessingOptions(updatedOptions);
                                                      }
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 bg-orange-50">
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={option.thicknessPricing[thicknessKey]?.retail || ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;
                                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        const updatedOptions = processingOptions.map(opt => {
                                                          if (opt.id === option.id) {
                                                            return {
                                                              ...opt,
                                                              thicknessPricing: {
                                                                ...opt.thicknessPricing,
                                                                [thicknessKey]: {
                                                                  ...opt.thicknessPricing![thicknessKey],
                                                                  retail: value
                                                                }
                                                              }
                                                            };
                                                          }
                                                          return opt;
                                                        });
                                                        setProcessingOptions(updatedOptions);
                                                      }
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                                  />
                                                </td>
                                              </tr>
                                            );
                                          });
                                        })()}
                                      </tbody>
                                    </table>
                                    <button
                                      onClick={() => {
                                        // Save the pricing
                                        localStorage.setItem('saleskik-processing-options', JSON.stringify(processingOptions));
                                        // Collapse this option
                                        setExpandedOptions(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(option.id);
                                          return newSet;
                                        });
                                      }}
                                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      Save Pricing
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Please configure glass types with thicknesses first to set pricing.</p>
                                )}
                              </div>
                            )}
                          </div>
                          ))}
                        </div>
                      );
                    }
                  })()}
                </div>
          </div>
        </div>
      )}

      {/* Processing - Other Tab Content */}
      {activeTab === 'processing-other' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-2">Other Processing Options</h2>
            <p className="text-purple-700 mb-4">
              Configure processing options like holes, corners, cutouts with flat pricing (same price for all thicknesses).
            </p>
          </div>
          
          {/* Processing Categories Management */}
          {processingStep === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Processing Categories Overview</h3>
                <button
                  onClick={() => {
                    if (suppliers.length === 0) {
                      alert('Please add at least one supplier first');
                      return;
                    }
                    setShowCreateCategoryModal(true);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    suppliers.length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  disabled={suppliers.length === 0}
                >
                  <PlusIcon className="w-6 h-6" />
                  Create Category
                </button>
              </div>
              <div className="p-6">
                {processingCategories.filter(cat => !cat.isThicknessBased).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-2">No processing categories created yet</p>
                    <p className="text-sm">Create categories to organize your processing options</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {processingCategories.filter(cat => !cat.isThicknessBased).map(category => {
                      const categoryOptions = processingOptions.filter(opt => opt.categoryId === category.id);
                      const isExpanded = expandedCategories.has(category.id);
                      
                      return (
                        <div key={category.id} className="border border-gray-200 rounded-lg">
                          <div 
                            className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer"
                            onClick={() => {
                              const newExpanded = new Set(expandedCategories);
                              if (isExpanded) {
                                newExpanded.delete(category.id);
                              } else {
                                newExpanded.add(category.id);
                              }
                              setExpandedCategories(newExpanded);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-6 h-6 text-gray-500" />
                              ) : (
                                <ChevronRightIcon className="w-6 h-6 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-900">{category.name}</h4>
                              <span className="text-sm text-gray-500">({categoryOptions.length} options)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOption(null);
                                  setOptionForm({
                                    name: '',
                                    supplierId: '',
                                    pricingType: 'each',
                                    flatPricing: {
                                      costPrice: '',
                                      t1: '',
                                      t2: '',
                                      t3: '',
                                      retail: ''
                                    },
                                    variations: []
                                  });
                                  setSelectedCategoryId(category.id);
                                  setShowCreateOptionModal(true);
                                }}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                              >
                                <PlusIcon className="w-5 h-5 inline mr-2" />
                                Add Option
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete category "${category.name}"? This will also delete all its options.`)) {
                                    setProcessingCategories(prev => prev.filter(c => c.id !== category.id));
                                    setProcessingOptions(prev => prev.filter(o => o.categoryId !== category.id));
                                    localStorage.setItem('saleskik-processing-categories', JSON.stringify(
                                      processingCategories.filter(c => c.id !== category.id)
                                    ));
                                    localStorage.setItem('saleskik-processing-options', JSON.stringify(
                                      processingOptions.filter(o => o.categoryId !== category.id)
                                    ));
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 space-y-2">
                              {categoryOptions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  No options in this category yet
                                </p>
                              ) : (
                                categoryOptions.map(option => (
                                  <div key={option.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-bold text-gray-900 text-base">{option.name}</h5>
                                        <p className="text-base text-gray-600">
                                          Pricing: {option.pricingType === 'each' ? 'Each' : 
                                                   option.pricingType === 'per-linear-meter' ? 'Per Linear Meter' : 
                                                   'Per Square Meter'}
                                        </p>
                                        {option.supplierId && (
                                          <p className="text-base text-gray-600">
                                            Supplier: {suppliers.find(s => s.id === option.supplierId)?.name || 'Unknown'}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingOption(option);
                                            setSelectedCategoryId(option.categoryId);
                                            setOptionForm({
                                              name: option.name,
                                              supplierId: option.supplierId || '',
                                              pricingType: option.pricingType,
                                              flatPricing: option.flatPricing || {
                                                costPrice: '',
                                                t1: '',
                                                t2: '',
                                                t3: '',
                                                retail: ''
                                              },
                                              variations: option.variations || []
                                            });
                                            setShowCreateOptionModal(true);
                                          }}
                                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                          <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Delete option "${option.name}"?`)) {
                                              setProcessingOptions(prev => prev.filter(o => o.id !== option.id));
                                              localStorage.setItem('saleskik-processing-options', JSON.stringify(
                                                processingOptions.filter(o => o.id !== option.id)
                                              ));
                                            }
                                          }}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                          <TrashIcon className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Pricing Display */}
                                    {option.variations && option.variations.length > 0 ? (
                                      <div className="mt-3 space-y-2">
                                        <p className="text-sm font-semibold text-gray-700">Variations:</p>
                                        {option.variations.map(variation => (
                                          <div key={variation.id} className="bg-white p-2 rounded border border-gray-200">
                                            <p className="text-sm font-semibold text-gray-600 mb-1">{variation.range}</p>
                                            <div className="grid grid-cols-5 gap-2 text-xs">
                                              <div className="text-center">
                                                <div className="font-medium text-gray-500">Cost</div>
                                                <div className="font-bold">${variation.pricing.costPrice || '0'}</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-medium text-gray-500">{tierLabels.t1}</div>
                                                <div className="font-bold">${variation.pricing.t1 || '0'}</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-medium text-gray-500">{tierLabels.t2}</div>
                                                <div className="font-bold">${variation.pricing.t2 || '0'}</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-medium text-gray-500">{tierLabels.t3}</div>
                                                <div className="font-bold">${variation.pricing.t3 || '0'}</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-medium text-gray-500">{tierLabels.retail}</div>
                                                <div className="font-bold">${variation.pricing.retail || '0'}</div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : option.flatPricing && (
                                      <div className="mt-3 bg-white p-2 rounded border border-gray-200">
                                        <div className="grid grid-cols-5 gap-2 text-xs">
                                          <div className="text-center">
                                            <div className="font-medium text-gray-500">Cost</div>
                                            <div className="font-bold">${option.flatPricing.costPrice || '0'}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-medium text-gray-500">{tierLabels.t1}</div>
                                            <div className="font-bold">${option.flatPricing.t1 || '0'}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-medium text-gray-500">{tierLabels.t2}</div>
                                            <div className="font-bold">${option.flatPricing.t2 || '0'}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-medium text-gray-500">{tierLabels.t3}</div>
                                            <div className="font-bold">${option.flatPricing.t3 || '0'}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="font-medium text-gray-500">{tierLabels.retail}</div>
                                            <div className="font-bold">${option.flatPricing.retail || '0'}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Configure Options */}
          {processingStep === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Configure Processing Options</h3>
                <p className="text-sm text-gray-600 mt-1">Add and configure processing options with flat pricing</p>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Select a category from the overview to add options.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
            <h2 className="text-xl font-bold text-indigo-900 mb-2">
              Step 5: Configure Templates
            </h2>
            <p className="text-purple-700">
              Create pre-defined shapes that users can select for automated cost calculations
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Create Template</h3>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Standard Pool Panel"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Shape Type</label>
                  <CustomDropdown
                    value="rectangle"
                    onChange={() => {}}
                    placeholder="Select Shape Type"
                    options={[
                      { value: 'rectangle', label: 'Rectangle' },
                      { value: 'circle', label: 'Circle' },
                      { value: 'custom', label: 'Custom Shape' }
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Cost Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.15"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <button className="mt-6 px-6 py-3 text-lg font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Add Template
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveTab('glass');
                  setGlassStep(3);
                }}
                className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to Processing
              </button>
              <div>
                <p className="text-sm text-gray-600 mb-2">Templates configuration complete</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  Continue to Custom Pricing
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed duplicate sections */}
      {false && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
            <h2 className="text-xl font-bold text-orange-900 mb-2">
              Step 5: Configure Custom Price Lists for "{currentGlassType?.name}"
            </h2>
            <p className="text-orange-700">
              Create customer-specific pricing that overrides standard pricing for this glass type
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Create Custom Price List</h3>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Price List Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Customer Pricing"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Specific customer name"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <button className="mt-6 px-6 py-3 text-lg font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Create Price List
              </button>
            </div>
          </div>

          {/* Final Completion */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="text-center">
              <CheckIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Glass Type Configuration Complete!</h3>
              <p className="text-gray-600 mb-6">
                "{currentGlassType?.name}" is now fully configured and ready for users
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setActiveTab('glass');
                    setGlassStep(1);
                    setCurrentGlassType(null);
                    setGlassTypeForm({ name: '', productTypes: [] });
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Return to Overview
                </button>
                <button
                  onClick={startCreatingGlassType}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Create Another Glass Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <>
          <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm z-40" onClick={() => setShowCreateCategoryModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white rounded-xl shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Create Processing Category</h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-base font-bold text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ name: e.target.value })}
                    placeholder="e.g., Corner Processing"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setCategoryForm({ name: '' });
                      setShowCreateCategoryModal(false);
                    }}
                    className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (categoryForm.name.trim()) {
                        const newCategory: ProcessingCategory = {
                          id: `cat-${Date.now()}`,
                          name: categoryForm.name.trim(),
                          sequenceOrder: processingCategories.filter(c => !c.isThicknessBased).length,
                          isThicknessBased: false
                        };
                        const updatedCategories = [...processingCategories, newCategory];
                        setProcessingCategories(updatedCategories);
                        localStorage.setItem('saleskik-processing-categories', JSON.stringify(updatedCategories));
                        setCategoryForm({ name: '' });
                        setShowCreateCategoryModal(false);
                        setShowSuccessMessage('Category created successfully!');
                      }
                    }}
                    disabled={!categoryForm.name.trim()}
                    className="px-6 py-3 text-lg bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Create Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Create Option Modal */}
      {showCreateOptionModal && selectedCategoryId && (
        <>
          <div className="fixed inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm z-40" onClick={() => {
            setShowCreateOptionModal(false);
            setEditingOption(null);
            setSelectedCategoryId(null);
          }} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">{editingOption ? 'Edit' : 'Add'} Processing Option</h3>
                <p className="text-base text-gray-600">
                  Category: {processingCategories.find(c => c.id === selectedCategoryId)?.name}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">Option Name</label>
                    <input
                      type="text"
                      value={optionForm.name}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., 45° Corner Cut"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">Supplier</label>
                    <CustomDropdown
                      value={optionForm.supplierId}
                      onChange={(value) => setOptionForm(prev => ({ ...prev, supplierId: value }))}
                      placeholder="Select Supplier"
                      options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">Pricing Type</label>
                    <CustomDropdown
                      value={optionForm.pricingType}
                      onChange={(value) => setOptionForm(prev => ({ ...prev, pricingType: value as any }))}
                      placeholder="Select Pricing Type"
                      options={[
                        { value: 'each', label: 'Each' },
                        { value: 'per-linear-meter', label: 'Per Linear Meter' },
                        { value: 'per-sqmeter', label: 'Per Square Meter' }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Variations Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Variations (Size/Range Based Pricing)</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariation = {
                          id: `var-${Date.now()}`,
                          range: '',
                          pricing: {
                            costPrice: '',
                            t1: '',
                            t2: '',
                            t3: '',
                            retail: ''
                          }
                        };
                        setOptionForm(prev => ({
                          ...prev,
                          variations: [...prev.variations, newVariation]
                        }));
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add Variation
                    </button>
                  </div>
                  
                  {optionForm.variations.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                      No variations added. Click "Add Variation" to create size/range based pricing.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {optionForm.variations.map((variation, index) => (
                        <div key={variation.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 mr-2">
                              <label className="block text-base font-bold text-gray-700 mb-2">Range</label>
                              <input
                                type="text"
                                value={variation.range}
                                onChange={(e) => {
                                  const newVariations = [...optionForm.variations];
                                  newVariations[index].range = e.target.value;
                                  setOptionForm(prev => ({ ...prev, variations: newVariations }));
                                }}
                                placeholder="e.g., 0-100mm or Small"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOptionForm(prev => ({
                                  ...prev,
                                  variations: prev.variations.filter(v => v.id !== variation.id)
                                }));
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Variation Pricing Table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr>
                                  <th className="px-2 py-1 text-left text-gray-500">Cost</th>
                                  <th className="px-2 py-1 text-left text-gray-500">{tierLabels.t1}</th>
                                  <th className="px-2 py-1 text-left text-gray-500">{tierLabels.t2}</th>
                                  <th className="px-2 py-1 text-left text-gray-500">{tierLabels.t3}</th>
                                  <th className="px-2 py-1 text-left text-gray-500">{tierLabels.retail}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="px-2 py-1">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={variation.pricing.costPrice}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          const newVariations = [...optionForm.variations];
                                          newVariations[index].pricing.costPrice = value;
                                          setOptionForm(prev => ({ ...prev, variations: newVariations }));
                                        }
                                      }}
                                      placeholder="0.00"
                                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    />
                                  </td>
                                  {['t1', 't2', 't3', 'retail'].map((tier) => (
                                    <td key={tier} className="px-2 py-1">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={variation.pricing[tier as keyof typeof variation.pricing]}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            const newVariations = [...optionForm.variations];
                                            newVariations[index].pricing[tier as keyof typeof variation.pricing] = value;
                                            setOptionForm(prev => ({ ...prev, variations: newVariations }));
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '%' && variation.pricing.costPrice) {
                                            e.preventDefault();
                                            const costPrice = parseFloat(variation.pricing.costPrice);
                                            const marginValue = parseFloat(variation.pricing[tier as keyof typeof variation.pricing] || '0');
                                            if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                              const price = costPrice / (1 - marginValue / 100);
                                              const newVariations = [...optionForm.variations];
                                              newVariations[index].pricing[tier as keyof typeof variation.pricing] = price.toFixed(2);
                                              setOptionForm(prev => ({ ...prev, variations: newVariations }));
                                            }
                                          }
                                        }}
                                        placeholder="0.00"
                                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Default Pricing Table (disabled if variations exist) */}
                <div className={optionForm.variations.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">
                      {optionForm.variations.length > 0 ? 'Default Pricing (Disabled - Using Variations)' : 'Set Pricing'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-600">Show Margins</label>
                      <button
                        onClick={() => setShowOtherMargins(!showOtherMargins)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          showOtherMargins ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          showOtherMargins ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-center text-sm font-semibold text-gray-500 uppercase bg-gray-100">Cost</th>
                          <th className="px-3 py-2 text-center text-sm font-semibold text-gray-500 uppercase bg-green-50">{tierLabels.t1}</th>
                          <th className="px-3 py-2 text-center text-sm font-semibold text-gray-500 uppercase bg-blue-50">{tierLabels.t2}</th>
                          <th className="px-3 py-2 text-center text-sm font-semibold text-gray-500 uppercase bg-purple-50">{tierLabels.t3}</th>
                          <th className="px-3 py-2 text-center text-sm font-semibold text-gray-500 uppercase bg-orange-50">{tierLabels.retail}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-3 py-2 bg-gray-50">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={optionForm.flatPricing.costPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setOptionForm(prev => ({
                                    ...prev,
                                    flatPricing: { ...prev.flatPricing, costPrice: value }
                                  }));
                                }
                              }}
                              placeholder="0.00"
                              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                            />
                          </td>
                          {['t1', 't2', 't3', 'retail'].map((tier) => (
                            <td key={tier} className="px-3 py-2">
                              <div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={optionForm.flatPricing[tier as keyof typeof optionForm.flatPricing]}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                      setOptionForm(prev => ({
                                        ...prev,
                                        flatPricing: { ...prev.flatPricing, [tier]: value }
                                      }));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === '%' && optionForm.flatPricing.costPrice) {
                                      e.preventDefault();
                                      const costPrice = parseFloat(optionForm.flatPricing.costPrice);
                                      const marginValue = parseFloat(optionForm.flatPricing[tier as keyof typeof optionForm.flatPricing] || '0');
                                      if (!isNaN(costPrice) && !isNaN(marginValue) && marginValue < 100) {
                                        const price = costPrice / (1 - marginValue / 100);
                                        setOptionForm(prev => ({
                                          ...prev,
                                          flatPricing: { ...prev.flatPricing, [tier]: price.toFixed(2) }
                                        }));
                                      }
                                    }
                                  }}
                                  placeholder="0.00"
                                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
                                />
                                {showOtherMargins && optionForm.flatPricing.costPrice && optionForm.flatPricing[tier as keyof typeof optionForm.flatPricing] && (
                                  <p className="text-xs text-green-600 mt-0.5">
                                    {((parseFloat(optionForm.flatPricing[tier as keyof typeof optionForm.flatPricing]) - parseFloat(optionForm.flatPricing.costPrice)) / parseFloat(optionForm.flatPricing[tier as keyof typeof optionForm.flatPricing]) * 100).toFixed(0)}%
                                  </p>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setOptionForm({
                        name: '',
                        supplierId: '',
                        pricingType: 'each',
                        flatPricing: {
                          costPrice: '',
                          t1: '',
                          t2: '',
                          t3: '',
                          retail: ''
                        },
                        variations: []
                      });
                      setShowCreateOptionModal(false);
                      setSelectedCategoryId(null);
                      setEditingOption(null);
                    }}
                    className="px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (optionForm.name.trim()) {
                        if (editingOption) {
                          // Update existing option
                          const updatedOptions = processingOptions.map(opt => {
                            if (opt.id === editingOption.id) {
                              return {
                                ...opt,
                                name: optionForm.name.trim(),
                                supplierId: optionForm.supplierId,
                                pricingType: optionForm.pricingType as any,
                                flatPricing: optionForm.variations.length > 0 ? undefined : optionForm.flatPricing,
                                variations: optionForm.variations.length > 0 ? optionForm.variations : undefined
                              };
                            }
                            return opt;
                          });
                          setProcessingOptions(updatedOptions);
                          localStorage.setItem('saleskik-processing-options', JSON.stringify(updatedOptions));
                          setShowSuccessMessage('Option updated successfully!');
                        } else {
                          // Create new option
                          const newOption: ProcessingOption = {
                            id: `opt-${Date.now()}`,
                            categoryId: selectedCategoryId,
                            name: optionForm.name.trim(),
                            supplierId: optionForm.supplierId,
                            pricingType: optionForm.pricingType as any,
                            flatPricing: optionForm.variations.length > 0 ? undefined : optionForm.flatPricing,
                            variations: optionForm.variations.length > 0 ? optionForm.variations : undefined,
                            displayOrder: processingOptions.filter(o => o.categoryId === selectedCategoryId).length,
                            isActive: true
                          };
                          const updatedOptions = [...processingOptions, newOption];
                          setProcessingOptions(updatedOptions);
                          localStorage.setItem('saleskik-processing-options', JSON.stringify(updatedOptions));
                          setShowSuccessMessage('Option added successfully!');
                        }
                        
                        // Reset form
                        setOptionForm({
                          name: '',
                          supplierId: '',
                          pricingType: 'each',
                          flatPricing: {
                            costPrice: '',
                            t1: '',
                            t2: '',
                            t3: '',
                            retail: ''
                          },
                          variations: []
                        });
                        setShowCreateOptionModal(false);
                        setSelectedCategoryId(null);
                        setEditingOption(null);
                      }
                    }}
                    disabled={!optionForm.name.trim()}
                    className="px-6 py-3 text-lg bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {editingOption ? 'Update' : 'Add'} Option
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}