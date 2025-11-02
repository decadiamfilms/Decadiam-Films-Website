import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
  CubeIcon, AdjustmentsHorizontalIcon, UserGroupIcon, ClockIcon,
  TagIcon, DocumentTextIcon, PhotoIcon, CurrencyDollarIcon,
  WrenchScrewdriverIcon, Squares2X2Icon, ScissorsIcon,
  PaintBrushIcon, BeakerIcon, CalculatorIcon, TrashIcon, CheckIcon,
  ArrowRightIcon, LockClosedIcon
} from '@heroicons/react/24/outline';

/**
 * GLASS MODULE ADMIN - SEQUENTIAL WORKFLOW CONFIGURATION
 * 
 * This follows the same step-by-step process as the user workflow.
 * You must complete each step before the next one becomes available.
 * 
 * WORKFLOW:
 * 1. Start by creating a Glass Type (what appears in subcategory dropdown)
 * 2. Then configure Product Types (Toughened/Not Toughened) for that glass type
 * 3. Then add Thicknesses with pricing per m² for each product type
 * 4. Then configure Processing Options (Edgework → Corner → Holes → Services → Surface)
 * 5. Then add Templates that use this glass type
 * 6. Finally set Custom Pricing for specific customers
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
  pricePerMm: number;
  leadTimeBusinessDays: number;
  isActive: boolean;
}

interface ProcessingOption {
  id: string;
  category: 'edgework' | 'corner-finish' | 'holes-cutouts' | 'services' | 'surface-finishes';
  name: string;
  description?: string;
  pricingType: 'per-linear-meter' | 'per-piece' | 'per-sqmeter' | 'per-hour';
  basePrice: number;
  thicknessAdjustments: { thickness: number; multiplier: number }[];
  sequenceOrder: number;
  requiredGlassType?: string; // Which glass type this applies to
  isActive: boolean;
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
  const [workflowStep, setWorkflowStep] = useState(1); // 1=Overview, 2=Creating Glass Type, 3=Processing, 4=Templates, 5=Pricing
  const [currentGlassType, setCurrentGlassType] = useState<GlassType | null>(null);
  
  // Data states
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOption[]>([]);
  const [templates, setTemplates] = useState<GlassTemplate[]>([]);
  
  // Form states for current glass type being created/edited
  const [glassTypeForm, setGlassTypeForm] = useState({
    name: '',
    description: '',
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
  const [usePredictivePattern, setUsePredictivePattern] = useState(false);
  const [currentSkuPattern, setCurrentSkuPattern] = useState<{prefix?: string, suffix?: string, includesThickness?: boolean}>({});
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false);

  const [processingForm, setProcessingForm] = useState({
    category: 'edgework' as const,
    name: '',
    description: '',
    pricingType: 'per-linear-meter' as const,
    basePrice: '',
    thicknessAdjustments: [] as { thickness: number; multiplier: number }[]
  });

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
  }, []);

  const loadExistingConfiguration = () => {
    const savedGlassTypes = localStorage.getItem('saleskik-glass-types-complete');
    if (savedGlassTypes) {
      setGlassTypes(JSON.parse(savedGlassTypes));
    }

    const savedProcessing = localStorage.getItem('saleskik-processing-options');
    if (savedProcessing) {
      setProcessingOptions(JSON.parse(savedProcessing));
    }

    const savedTemplates = localStorage.getItem('saleskik-glass-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  };

  const saveConfiguration = () => {
    localStorage.setItem('saleskik-glass-types-complete', JSON.stringify(glassTypes));
    localStorage.setItem('saleskik-processing-options', JSON.stringify(processingOptions));
    localStorage.setItem('saleskik-glass-templates', JSON.stringify(templates));
  };

  // Check if we can proceed to next step
  const canProceedToStep = (step: number): boolean => {
    switch(step) {
      case 1: return true; // Overview always available
      case 2: return workflowStep >= 2; // Only available when actively creating glass type
      case 3: return workflowStep >= 3; // Only available when reached processing step
      case 4: return workflowStep >= 4; // Only available when reached templates step  
      case 5: return workflowStep >= 5; // Only available when reached pricing step
      default: return false;
    }
  };

  const startCreatingGlassType = () => {
    setWorkflowStep(2);
    setCurrentGlassType(null);
    setGlassTypeForm({ name: '', description: '', productTypes: [] });
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
      pricePerMm: 0, // Default price - user needs to set
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

    const newGlassType: GlassType = {
      id: `glass-${Date.now()}`,
      name: glassTypeForm.name,
      description: glassTypeForm.description,
      productTypes: glassTypeForm.productTypes,
      isActive: true,
      isComplete: true
    };

    setGlassTypes(prev => [...prev, newGlassType]);
    setCurrentGlassType(newGlassType);
    saveConfiguration();
    setWorkflowStep(3); // Now unlock processing options
  };

  return (
    <div className="space-y-6">
      
      {/* Workflow Progress Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Glass Module Configuration Workflow
              </h1>
              <p className="text-gray-600">
                Follow the sequential steps to configure glass types and processing options
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Overview', desc: 'View existing types' },
              { step: 2, title: 'Glass Type', desc: 'Create glass type' },
              { step: 3, title: 'Processing', desc: 'Add processing options' },
              { step: 4, title: 'Templates', desc: 'Create templates' },
              { step: 5, title: 'Pricing', desc: 'Custom price lists' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  workflowStep === item.step 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                    : canProceedToStep(item.step)
                      ? 'bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    workflowStep === item.step 
                      ? 'bg-blue-600 text-white' 
                      : canProceedToStep(item.step)
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-300 text-gray-500'
                  }`}>
                    {canProceedToStep(item.step) || workflowStep > item.step ? item.step : <LockClosedIcon className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs">{item.desc}</div>
                  </div>
                </div>
                {index < 4 && (
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Overview & Existing Glass Types */}
      {workflowStep === 1 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Glass Module Overview</h2>
            <p className="text-blue-700 mb-4">
              Configure glass types that will appear in users' workflow. Each glass type goes through the complete configuration process.
            </p>
            <button
              onClick={startCreatingGlassType}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Start Creating New Glass Type
            </button>
          </div>

          {/* Existing Glass Types */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Configured Glass Types</h3>
              <p className="text-sm text-gray-600">Glass types that appear in users' subcategory dropdown</p>
            </div>
            <div className="p-6">
              {glassTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No glass types configured yet</p>
                  <p className="text-sm">Users won't see any options in their glass module</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {glassTypes.map(glassType => (
                    <div key={glassType.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{glassType.name}</h4>
                          <p className="text-gray-600 text-sm">{glassType.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">
                              {glassType.productTypes.length} product types
                            </span>
                            <span className="text-sm text-gray-500">
                              {glassType.productTypes.reduce((acc, pt) => acc + pt.thicknesses.length, 0)} thicknesses total
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              glassType.isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {glassType.isComplete ? 'Complete' : 'In Progress'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentGlassType(glassType);
                              setGlassTypeForm({
                                name: glassType.name,
                                description: glassType.description || '',
                                productTypes: glassType.productTypes
                              });
                              setWorkflowStep(2);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Edit Glass Type"
                          >
                            <PencilIcon className="w-4 h-4" />
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
      {workflowStep === 2 && (
        <div className="space-y-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Glass Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={glassTypeForm.name}
                    onChange={(e) => setGlassTypeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Clear Glass, Ultra Clear, Mirror"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={glassTypeForm.description}
                    onChange={(e) => setGlassTypeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this glass type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <select
                    value={currentProductType || ''}
                    onChange={(e) => setCurrentProductType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product Type</option>
                    <option value="Toughened">Toughened</option>
                    <option value="Not Toughened">Not Toughened</option>
                  </select>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Product Type
                  </button>
                </div>
              </div>

              {/* Current Product Types */}
              {glassTypeForm.productTypes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Configured Product Types</h4>
                  <div className="space-y-4">
                    {glassTypeForm.productTypes.map(productType => (
                      <div key={productType.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-bold text-gray-900">{productType.name}</h5>
                          <span className="text-sm text-gray-500">
                            {productType.thicknesses.length} thicknesses configured
                          </span>
                        </div>

                        {/* Pattern Detection Prompt - Matching site aesthetic */}
                        {showPatternPrompt && (
                          <>
                            {/* Backdrop */}
                            <div className="fixed inset-0 bg-white bg-opacity-90 z-40" onClick={() => setShowPatternPrompt(false)} />
                            
                            {/* Modal */}
                            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
                              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
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
                                
                                {/* Content */}
                                <div className="p-6 bg-white">
                                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-700 mb-3">
                                      We've detected this pattern in your SKUs:
                                    </p>
                                    <div className="bg-gray-50 rounded-lg border-2 border-blue-300 p-3">
                                      <p className="font-mono text-lg font-bold text-center text-blue-900">
                                        {detectedPattern}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <p className="text-gray-600 text-sm mb-6">
                                    Would you like to automatically fill all remaining SKUs using this pattern?
                                  </p>
                                  
                                  {/* Action buttons */}
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
                                              if (!t.sku) {
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
                                        
                                        // Show success message
                                        if (filledCount > 0) {
                                          setShowAutoFillSuccess(true);
                                          setTimeout(() => setShowAutoFillSuccess(false), 3000);
                                        }
                                      }}
                                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                                    >
                                      <CheckIcon className="w-5 h-5" />
                                      Yes, Auto-fill All
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUsePredictivePattern(false);
                                        setShowPatternPrompt(false);
                                        setCurrentSkuPattern({});
                                      }}
                                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                      No, Manual Entry
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Success message */}
                        {showAutoFillSuccess && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-500 rounded-full">
                                <CheckIcon className="w-4 h-4 text-white" />
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
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <button
                              onClick={() => addBulkThicknesses(productType)}
                              disabled={!bulkThicknessInput.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              Create Fields
                            </button>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">This will create thickness entries with empty SKUs and $0 pricing that you can then fill in</p>
                        </div>

                        {/* Add Individual Thickness & Pricing */}
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <h6 className="font-medium text-gray-700 mb-2">Add Individual Thickness & Pricing</h6>
                          
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">SKU <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={thicknessForm.sku}
                                onChange={(e) => {
                                  const newSku = e.target.value.toUpperCase();
                                  setThicknessForm(prev => ({ ...prev, sku: newSku }));
                                  setShowSkuSuggestions(false);
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">Thickness (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={thicknessForm.thickness}
                                onChange={(e) => {
                                  setThicknessForm(prev => ({ ...prev, thickness: e.target.value }));
                                  // If using predictive pattern, auto-fill SKU
                                  if (e.target.value && !thicknessForm.sku && usePredictivePattern && currentSkuPattern) {
                                    const autoSku = generateSkuFromPattern(e.target.value, currentSkuPattern);
                                    setThicknessForm(prev => ({ ...prev, sku: autoSku }));
                                  }
                                }}
                                placeholder="6, 10, 12"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Price per mm</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={thicknessForm.pricePerMm}
                                  onChange={(e) => setThicknessForm(prev => ({ ...prev, pricePerMm: e.target.value }))}
                                  placeholder="120.00"
                                  className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Lead Time (business business days)</label>
                              <input
                                type="number"
                                value={thicknessForm.leadTimeBusinessDays}
                                onChange={(e) => setThicknessForm(prev => ({ ...prev, leadTimeBusinessDays: e.target.value }))}
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
                                        type="number"
                                        step="0.01"
                                        value={thickness.pricePerMm}
                                        onChange={(e) => {
                                          setGlassTypeForm(prev => ({
                                            ...prev,
                                            productTypes: prev.productTypes.map(pt =>
                                              pt.id === productType.id
                                                ? { ...pt, thicknesses: pt.thicknesses.map(t => 
                                                    t.id === thickness.id ? { ...t, pricePerMm: parseFloat(e.target.value) || 0 } : t
                                                  )}
                                                : pt
                                            )
                                          }));
                                        }}
                                        className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded"
                                        placeholder="0.00"
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
                                        thickness.pricePerMm > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        ${thickness.pricePerMm > 0 ? thickness.pricePerMm.toFixed(2) : '0.00'}/mm
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
                  onClick={() => setWorkflowStep(1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Processing Options (Only available after glass type is complete) */}
      {workflowStep === 3 && currentGlassType && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Step 3: Configure Processing Options for "{currentGlassType.name}"
            </h2>
            <p className="text-green-700">
              These will appear sequentially in user workflow: Edgework → Corner Finish → Holes/Cutouts → Services → Surface Finishes
            </p>
          </div>

          {/* Processing Categories in Exact Order */}
          {[
            { category: 'edgework', title: 'Edgework Options', description: 'Appears FIRST in user processing workflow', color: 'blue' },
            { category: 'corner-finish', title: 'Corner Finish Options', description: 'Appears SECOND in user processing workflow', color: 'green' },
            { category: 'holes-cutouts', title: 'Holes and Cutouts', description: 'Appears THIRD in user processing workflow', color: 'purple' },
            { category: 'services', title: 'Services', description: 'Appears FOURTH in user processing workflow', color: 'orange' },
            { category: 'surface-finishes', title: 'Surface Finishes', description: 'Appears LAST in user processing workflow', color: 'red' }
          ].map((section, index) => (
            <div key={section.category} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-${section.color}-100 text-${section.color}-600 flex items-center justify-center font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Add New {section.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Option Name</label>
                      <input
                        type="text"
                        placeholder={`e.g., ${section.category === 'edgework' ? 'Arrissed Edges' : 
                          section.category === 'corner-finish' ? 'Tip Corners' :
                          section.category === 'holes-cutouts' ? 'Standard Hole' :
                          section.category === 'services' ? 'Template Application' : 'Paint Coating'}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pricing Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="per-linear-meter">Per Linear Meter</option>
                        <option value="per-piece">Per Piece</option>
                        <option value="per-sqmeter">Per Square Meter</option>
                        <option value="per-hour">Per Hour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Base Price</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2.5 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="15.00"
                          className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Add Processing Option
                  </button>
                </div>

                {/* Show configured options for this category */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Configured {section.title} (Users will see these options)
                  </h4>
                  {processingOptions.filter(opt => opt.category === section.category && opt.requiredGlassType === currentGlassType?.id).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <p className="text-sm">No {section.title.toLowerCase()} configured yet</p>
                      <p className="text-xs">Users won't see this processing step</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {processingOptions
                        .filter(opt => opt.category === section.category && opt.requiredGlassType === currentGlassType?.id)
                        .map(option => (
                          <div key={option.id} className="bg-white border border-gray-200 rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900">{option.name}</span>
                                <span className="text-green-600 font-bold ml-4">${option.basePrice} {option.pricingType}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setProcessingOptions(prev => prev.filter(p => p.id !== option.id));
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setWorkflowStep(2)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to Glass Type
              </button>
              <div>
                <p className="text-sm text-gray-600 mb-2">Processing configuration complete</p>
                <button
                  onClick={() => setWorkflowStep(4)}
                  disabled={!canProceedToStep(4)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  Continue to Templates
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Templates (Only available after processing is configured) */}
      {workflowStep === 4 && currentGlassType && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-2">
              Step 4: Configure Templates for "{currentGlassType.name}"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Standard Pool Panel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shape Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="custom">Custom Shape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Add Template
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setWorkflowStep(3)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to Processing
              </button>
              <div>
                <p className="text-sm text-gray-600 mb-2">Templates configuration complete</p>
                <button
                  onClick={() => setWorkflowStep(5)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  Continue to Custom Pricing
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Custom Pricing (Final step) */}
      {workflowStep === 5 && currentGlassType && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
            <h2 className="text-xl font-bold text-orange-900 mb-2">
              Step 5: Configure Custom Price Lists for "{currentGlassType.name}"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price List Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Customer Pricing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Specific customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
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
                "{currentGlassType.name}" is now fully configured and ready for users
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setWorkflowStep(1);
                    setCurrentGlassType(null);
                    setGlassTypeForm({ name: '', description: '', productTypes: [] });
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
    </div>
  );
}