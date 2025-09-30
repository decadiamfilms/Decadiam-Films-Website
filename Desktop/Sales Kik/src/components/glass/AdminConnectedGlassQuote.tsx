import React, { useState, useEffect, useCallback } from 'react';
import { 
  AdjustmentsHorizontalIcon, XMarkIcon, CubeIcon, TagIcon,
  ChevronDownIcon, ChevronRightIcon, PhotoIcon, ClockIcon,
  InformationCircleIcon, CheckIcon, PlusIcon, MinusIcon,
  BeakerIcon, ClipboardDocumentListIcon, CommandLineIcon,
  DocumentTextIcon, ArrowPathIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AdminConnectedGlassQuoteProps {
  quoteId: string;
  customerId: string;
  onItemsAdded: () => void;
  onAddGlassToQuote?: (glassItem: {
    glassType: any;
    thickness: any;
    quantity: number;
    heightMm: string;
    widthMm: string;
    itemCode?: string;
    processing: any;
    priceBreakdown: any;
  }) => void;
}

export default function AdminConnectedGlassQuote({ 
  quoteId, 
  customerId, 
  onItemsAdded,
  onAddGlassToQuote
}: AdminConnectedGlassQuoteProps) {
  // Load data directly from comprehensive admin localStorage
  const [adminGlassTypes, setAdminGlassTypes] = useState<any[]>([]);
  const [adminProcessingOptions, setAdminProcessingOptions] = useState<any[]>([]);
  const [adminTemplates, setAdminTemplates] = useState<any[]>([]);
  
  // Current selections
  const [selectedGlassType, setSelectedGlassType] = useState<any>(null);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedThickness, setSelectedThickness] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [heightMm, setHeightMm] = useState<string>('');
  const [widthMm, setWidthMm] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  
  // Processing selections - comprehensive tracking
  const [selectedProcessing, setSelectedProcessing] = useState<{
    edgework?: any[];
    corner?: any[];
    holes?: any[];
    services?: any[];
    surface?: any[];
  }>({
    edgework: [],
    corner: [],
    holes: [],
    services: [],
    surface: []
  });
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Photo upload
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  
  // Advanced pricing breakdown
  const [priceBreakdown, setPriceBreakdown] = useState<{
    baseGlass: number;
    processing: { name: string; cost: number; type: string }[];
    template: number;
    subtotal: number;
    tax?: number;
    total: number;
    sqm: number;
    perimeter: number;
  } | null>(null);
  
  // Customer tier for pricing
  const [customerTier, setCustomerTier] = useState<'T1' | 'T2' | 'T3' | 'Retail'>('Retail');
  
  // Quick calculator state
  const [showQuickCalculator, setShowQuickCalculator] = useState(false);
  const [quickCalcSettings, setQuickCalcSettings] = useState<{
    glassType?: string;
    thickness?: number;
    processing?: string;
  }>({});
  
  // Advanced workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidation, setStepValidation] = useState<{
    [key: number]: boolean;
  }>({});
  
  // Real-time data refresh interval
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Variation inputs for options with ranges
  const [variationInputs, setVariationInputs] = useState<{[optionId: string]: string}>({});
  

  // Load admin data function
  const loadAdminData = () => {
    
    // Load glass types
    const glassTypesData = localStorage.getItem('saleskik-glass-types-complete');
    if (glassTypesData) {
      try {
        const types = JSON.parse(glassTypesData);
        const activeTypes = types.filter((t: any) => t.isActive && t.isComplete);
        setAdminGlassTypes(activeTypes);
        
        // Check if processing options are embedded in glass types data
        if (types.processingOptions) {
          console.log('Found processing options embedded in glass types:', types.processingOptions);
          setAdminProcessingOptions(types.processingOptions.filter((o: any) => o.isActive));
        }
      } catch (error) {
        console.error('Error parsing admin glass types:', error);
      }
    } else {
      setAdminGlassTypes([]);
    }
    
    // Load processing options - check multiple possible keys
    console.log('Checking localStorage for processing options...');
    
    
    // Check ALL possible keys where comprehensive admin might save YOUR configuration
    const possibleKeys = [
      'saleskik-glass-processing-options', // From saveConfiguration()
      'saleskik-processing-options', // From individual saves
      'saleskik-glass-types-complete', // Sometimes processing is nested here
      'glass-admin-processing-options', // Default location
      'saleskik-glass-processing-categories'
    ];
    
    let processingData = null;
    let usedKey = null;
    
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        processingData = data;
        usedKey = key;
        break;
      }
    }
    
    if (processingData) {
      try {
        const options = JSON.parse(processingData);
        
        // Also check if there are more options in the other key
        const otherKey = usedKey === 'saleskik-processing-options' ? 'saleskik-glass-processing-options' : 'saleskik-processing-options';
        const otherData = localStorage.getItem(otherKey);
        if (otherData) {
          try {
            const otherOptions = JSON.parse(otherData);
            
            // Merge both sets of options (remove duplicates by id)
            const allOptions = [...options];
            otherOptions.forEach((otherOption: any) => {
              if (!allOptions.find(opt => opt.id === otherOption.id)) {
                allOptions.push(otherOption);
              }
            });
            
            const activeOptions = Array.isArray(allOptions) ? allOptions.filter((o: any) => o.isActive) : [];
            setAdminProcessingOptions(activeOptions);
          } catch (error) {
            console.error('Error parsing other processing options:', error);
            const activeOptions = Array.isArray(options) ? options.filter((o: any) => o.isActive) : [];
            setAdminProcessingOptions(activeOptions);
          }
        } else {
          const activeOptions = Array.isArray(options) ? options.filter((o: any) => o.isActive) : [];
          setAdminProcessingOptions(activeOptions);
          console.log('Loaded admin processing options (single source):', activeOptions);
        }
        
        // Debug processing categories
        console.log('PROCESSING OPTIONS BREAKDOWN:', {
          usedKey,
          totalOptions: activeOptions.length,
          edgeworkOptions: activeOptions.filter(opt => opt.categoryId && opt.categoryId.toLowerCase().includes('edgework')),
          cornerOptions: activeOptions.filter(opt => opt.categoryId && opt.categoryId.toLowerCase().includes('corner')),
          holeOptions: activeOptions.filter(opt => opt.categoryId && opt.categoryId.toLowerCase().includes('hole')),
          serviceOptions: activeOptions.filter(opt => opt.categoryId && opt.categoryId.toLowerCase().includes('service')),
          surfaceOptions: activeOptions.filter(opt => opt.categoryId && opt.categoryId.toLowerCase().includes('surface')),
          allCategoryIds: activeOptions.map(opt => opt.categoryId),
          sampleOption: activeOptions[0]
        });
      } catch (error) {
        console.error('Error parsing admin processing options:', error);
      }
    } else {
      // No processing options found - user needs to configure in comprehensive admin
      setAdminProcessingOptions([]);
      console.log('NO PROCESSING OPTIONS FOUND. Please configure in comprehensive admin.');
    }
    
    // Load templates
    const templatesData = localStorage.getItem('saleskik-glass-templates');
    if (templatesData) {
      try {
        const templates = JSON.parse(templatesData);
        const activeTemplates = templates.filter((t: any) => t.isActive);
        setAdminTemplates(activeTemplates);
      } catch (error) {
        console.error('Error parsing admin templates:', error);
      }
    } else {
      setAdminTemplates([]);
    }
  };

  // Load admin data on mount
  useEffect(() => {
    loadAdminData();
  }, []);
  
  // Listen for localStorage changes (when admin updates data)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('saleskik-glass-')) {
        console.log('Admin data changed, reloading...', e.key);
        loadAdminData();
      }
    };
    
    // Listen for localStorage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (when saving in same tab)
    const handleCustomUpdate = () => {
      console.log('Admin data updated in same tab, reloading...');
      setTimeout(loadAdminData, 100); // Small delay to ensure data is saved
    };
    
    window.addEventListener('glass-admin-updated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('glass-admin-updated', handleCustomUpdate);
    };
  }, []);

  // Advanced price calculation with detailed breakdown
  const calculateComprehensivePrice = useCallback(() => {
    if (!selectedThickness || !heightMm || !widthMm || !quantity) {
      setPriceBreakdown(null);
      return;
    }
    
    const height = parseFloat(heightMm);
    const width = parseFloat(widthMm);
    const qty = parseInt(quantity.toString());
    
    if (height <= 0 || width <= 0 || qty <= 0) {
      setPriceBreakdown(null);
      return;
    }
    
    // Calculate total area: quantity × height × width (converted to square meters)
    const areaPerPanel = (height / 1000) * (width / 1000); // Convert mm to meters
    const totalArea = areaPerPanel * qty; // Total area for all panels
    const perimeter = 2 * ((height / 1000) + (width / 1000)) * qty; // Total perimeter for processing
    
    // Base glass price calculation: quantity × height × width × base thickness price (per tier)
    const tierKey = customerTier.toLowerCase() as 't1' | 't2' | 't3' | 'retail';
    const basePricePerSqm = parseFloat(selectedThickness.tierPrices?.[tierKey] || selectedThickness.pricePerMm || '0');
    
    // Proper pricing formula: quantity × height × width × base thickness price
    const baseGlass = totalArea * basePricePerSqm;
    
    
    // Calculate processing costs
    const processingCosts: { name: string; cost: number; type: string }[] = [];
    let totalProcessingCost = 0;
    
    // Edgework (per linear meter)
    selectedProcessing.edgework?.forEach(option => {
      if (option.thicknessPricing) {
        const thicknessKey = selectedThickness.thickness.toString();
        const thicknessPricing = option.thicknessPricing[thicknessKey];
        if (thicknessPricing) {
          const rate = parseFloat(thicknessPricing[tierKey] || '0');
          const cost = rate * perimeter;
          processingCosts.push({ name: option.name, cost, type: 'edgework' });
          totalProcessingCost += cost;
        }
      } else if (option.flatPricing) {
        const rate = parseFloat(option.flatPricing[tierKey] || '0');
        const cost = rate * perimeter;
        processingCosts.push({ name: option.name, cost, type: 'edgework' });
        totalProcessingCost += cost;
      }
    });
    
    // Other processing (corners, holes, services, surface) - Handle variations
    ['corner', 'holes', 'services', 'surface'].forEach(category => {
      const categoryOptions = selectedProcessing[category as keyof typeof selectedProcessing] || [];
      categoryOptions.forEach((option: any) => {
        let rate = 0;
        let costDescription = option.name;
        
        // Handle variation-based pricing (like your radial corner)
        if (option.selectedVariation && option.selectedVariation.pricing) {
          rate = parseFloat(option.selectedVariation.pricing[tierKey] || '0');
          costDescription = `${option.name} (${option.selectedValue}mm - ${option.selectedVariation.range}mm range)`;
        } 
        // Handle flat pricing (standard options)
        else if (option.flatPricing) {
          rate = parseFloat(option.flatPricing[tierKey] || '0');
        }
        
        if (rate > 0) {
          let cost = 0;
          
          if (option.pricingType === 'each') {
            cost = rate * qty;
          } else if (option.pricingType === 'per-sqmeter') {
            cost = rate * totalArea;
          } else if (option.pricingType === 'per-linear-meter') {
            cost = rate * perimeter;
          } else {
            cost = rate; // Fixed cost
          }
          
          processingCosts.push({ name: costDescription, cost, type: category });
          totalProcessingCost += cost;
        }
      });
    });
    
    // Template cost
    let templateCost = 0;
    if (selectedTemplate?.pricingRule) {
      if (selectedTemplate.pricingRule.type === 'fixed') {
        templateCost = selectedTemplate.pricingRule.value;
      } else if (selectedTemplate.pricingRule.type === 'percentage') {
        templateCost = baseGlass * (selectedTemplate.pricingRule.value / 100);
      } else if (selectedTemplate.pricingRule.type === 'per-sqm') {
        templateCost = selectedTemplate.pricingRule.value * sqm;
      }
    }
    
    const subtotal = baseGlass + totalProcessingCost + templateCost;
    const total = subtotal; // Add tax calculation if needed
    
    setPriceBreakdown({
      baseGlass,
      processing: processingCosts,
      template: templateCost,
      subtotal,
      total,
      sqm: totalArea, // Use proper total area calculation
      perimeter
    });
    
  }, [selectedThickness, heightMm, widthMm, quantity, selectedProcessing, selectedTemplate, customerTier]);
  
  // Recalculate price when selections change
  useEffect(() => {
    calculateComprehensivePrice();
  }, [calculateComprehensivePrice]);

  // Get available product types for selected glass type
  const getAvailableProductTypes = () => {
    if (!selectedGlassType) return [];
    return selectedGlassType.productTypes || [];
  };

  // Get available thicknesses for selected product type
  const getAvailableThicknesses = () => {
    if (!selectedGlassType || !selectedProductType) return [];
    
    const productTypeName = selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
    const productType = selectedGlassType.productTypes?.find((pt: any) => pt.name === productTypeName);
    return productType?.thicknesses?.filter((t: any) => t.isActive) || [];
  };

  // Get processing options by category - handle YOUR dynamic categoryIds
  const getProcessingByCategory = (categoryName: string) => {
    const filtered = adminProcessingOptions.filter(opt => {
      if (!opt.categoryId) return false;
      
      const categoryId = opt.categoryId.toLowerCase();
      const searchName = categoryName.toLowerCase();
      
      // Handle YOUR actual dynamic categoryIds with timestamps
      if (searchName === 'edgework') {
        return categoryId.includes('cat-edgework') || categoryId.startsWith('cat-edgework');
      }
      if (searchName === 'corner') {
        return categoryId.includes('cat-corner') || categoryId.includes('cat-') && (opt.name.toLowerCase().includes('corner') || opt.name.toLowerCase().includes('radial'));
      }
      if (searchName === 'hole') {
        return categoryId.includes('cat-hole') || categoryId.includes('cat-') && opt.name.toLowerCase().includes('hole');
      }
      if (searchName === 'service') {
        return categoryId.includes('cat-service') || categoryId.includes('cat-') && opt.name.toLowerCase().includes('service');
      }
      if (searchName === 'surface') {
        return categoryId.includes('cat-surface') || categoryId.includes('cat-') && (opt.name.toLowerCase().includes('surface') || opt.name.toLowerCase().includes('finish'));
      }
      
      return false;
    });
    
    
    return filtered;
  };

  // Get pricing for variation-based options
  const getVariationPricing = (option: any, inputValue: string) => {
    if (!option.variations || !inputValue) return null;
    
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return null;
    
    // Find the variation that matches the input range
    for (const variation of option.variations) {
      if (variation.range) {
        // Parse range like "10-25" or "25-50"
        const rangeParts = variation.range.split('-');
        if (rangeParts.length === 2) {
          const min = parseFloat(rangeParts[0]);
          const max = parseFloat(rangeParts[1]);
          
          if (numValue >= min && numValue <= max) {
            return {
              variation: variation,
              price: variation.pricing?.[customerTier.toLowerCase()] || variation.pricing?.retail || '0'
            };
          }
        }
      }
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Advanced Header with Live Pricing and Quick Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <div className="text-white text-2xl">🪟</div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Professional Glass Quote Builder</h3>
              <p className="text-gray-600">Connected to your admin configuration • Step {currentStep} of 8</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-blue-600">Last updated: {lastRefresh.toLocaleTimeString()}</span>
                <button 
                  onClick={() => {
                    loadAdminData();
                    setLastRefresh(new Date());
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          {/* Advanced Price Display with Quick Calculator */}
          <div className="relative">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-green-600">
                  ${priceBreakdown?.total.toFixed(2) || '0.00'}
                </div>
                <button
                  onClick={() => setShowQuickCalculator(!showQuickCalculator)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Quick Price Calculator & Bulk Operations"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-gray-600">
                {priceBreakdown ? (
                  <>
                    Base: ${priceBreakdown.baseGlass.toFixed(2)} • 
                    Processing: ${priceBreakdown.processing.reduce((sum, p) => sum + p.cost, 0).toFixed(2)} • 
                    {priceBreakdown.sqm.toFixed(3)}m²
                  </>
                ) : (
                  'Configure selections to see pricing'
                )}
              </div>
              
              {/* Live Cart Preview */}
              {priceBreakdown && priceBreakdown.processing.length > 0 && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <div className="text-xs font-medium text-gray-700 mb-1">Processing Selected:</div>
                  <div className="space-y-1">
                    {priceBreakdown.processing.map((proc, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{proc.name}</span>
                        <span className="font-medium text-green-600">${proc.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-blue-600 mt-1">Customer Tier: {customerTier}</div>
            </div>
            
            {/* Advanced Quick Calculator - Full Revision Interface */}
            {showQuickCalculator && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">Quick Price Calculator & Batch Operations</h4>
                  <button
                    onClick={() => setShowQuickCalculator(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Quick Glass Type Switch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Switch Glass Type</label>
                    <select
                      onChange={(e) => {
                        const newType = adminGlassTypes.find(t => t.id === e.target.value);
                        if (newType) {
                          setSelectedGlassType(newType);
                          setSelectedProductType('');
                          setSelectedThickness(null);
                          console.log('Quick switched to glass type:', newType.name);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose different glass type...</option>
                      {adminGlassTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Batch Processing Application */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Processing Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const edgeworkOptions = getProcessingByCategory('edgework');
                          if (edgeworkOptions.length > 0) {
                            setSelectedProcessing(prev => ({
                              ...prev,
                              edgework: [edgeworkOptions[0]]
                            }));
                            console.log('Applied standard edgework preset');
                          }
                        }}
                        className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium"
                      >
                        Standard Edgework
                      </button>
                      <button
                        onClick={() => {
                          const cornerOptions = getProcessingByCategory('corner');
                          const holeOptions = getProcessingByCategory('hole');
                          if (cornerOptions.length > 0 && holeOptions.length > 0) {
                            setSelectedProcessing(prev => ({
                              ...prev,
                              corner: [cornerOptions[0]],
                              holes: [holeOptions[0]]
                            }));
                            console.log('Applied premium processing preset');
                          }
                        }}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium"
                      >
                        Premium Package
                      </button>
                    </div>
                  </div>
                  
                  {/* Bulk Operations */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          // Replace current quote with quick calc settings
                          console.log('Replacing current quote with quick calc settings');
                          setShowQuickCalculator(false);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Replace Current
                      </button>
                      <button
                        onClick={() => {
                          // Create new quote with current settings
                          console.log('Creating new quote with current settings');
                          setShowQuickCalculator(false);
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                      >
                        Create New Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Admin Data Status with Configuration Health */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-900">Admin Configuration Status</h4>
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600">Live connection to admin config</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`font-bold text-lg ${
              adminGlassTypes.length > 0 ? 'text-green-600' : 'text-red-600'
            }`}>{adminGlassTypes.length}</div>
            <div className="text-sm text-blue-700">Glass Types</div>
            {adminGlassTypes.length === 0 && (
              <div className="text-xs text-red-600 mt-1">⚠️ Configure in admin</div>
            )}
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg ${
              adminProcessingOptions.length > 0 ? 'text-green-600' : 'text-red-600'
            }`}>{adminProcessingOptions.length}</div>
            <div className="text-sm text-blue-700">Processing Options</div>
            {adminProcessingOptions.length === 0 && (
              <div className="text-xs text-red-600 mt-1">⚠️ Configure in admin</div>
            )}
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg ${
              adminTemplates.length > 0 ? 'text-green-600' : 'text-orange-600'
            }`}>{adminTemplates.length}</div>
            <div className="text-sm text-blue-700">Templates</div>
            <div className="text-xs text-gray-600 mt-1">Optional</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{customerTier}</div>
            <div className="text-sm text-blue-700">Customer Tier</div>
            <div className="text-xs text-gray-600 mt-1">Auto-detected</div>
          </div>
        </div>
        
      </div>

      {/* Step 1: Glass Type Selection */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h4 className="font-medium text-gray-900 mb-4">1. Select Glass Type</h4>
        {adminGlassTypes.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">⚠️ No glass types configured</p>
            <p className="text-sm text-yellow-600">Please configure glass types in the <a href="/admin/glass" className="underline">Glass Admin</a> first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {adminGlassTypes.map(glassType => (
              <button
                key={glassType.id}
                onClick={() => {
                  setSelectedGlassType(glassType);
                  setSelectedProductType('');
                  setSelectedThickness(null);
                  console.log('Selected glass type from admin:', glassType);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedGlassType?.id === glassType.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{glassType.name}</div>
                <div className="text-sm text-gray-600">
                  {glassType.productTypes?.length || 0} product types
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Product Type Selection */}
      {selectedGlassType && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">2. Select Product Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAvailableProductTypes().map(productType => (
              <button
                key={productType.id}
                onClick={() => {
                  setSelectedProductType(productType.name === 'Toughened' ? 'TOUGHENED' : 'NOT_TOUGHENED');
                  setSelectedThickness(null);
                  console.log('Selected product type from admin:', productType);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  (selectedProductType === 'TOUGHENED' && productType.name === 'Toughened') ||
                  (selectedProductType === 'NOT_TOUGHENED' && productType.name === 'Not Toughened')
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{productType.name}</div>
                <div className="text-sm text-gray-600">
                  {productType.thicknesses?.length || 0} thicknesses available
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Thickness Selection - Using Admin Data */}
      {selectedGlassType && selectedProductType && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">3. Select Thickness (From Your Admin Config)</h4>
          {getAvailableThicknesses().length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">⚠️ No thicknesses configured for this combination</p>
              <p className="text-sm text-yellow-600">
                Please configure thicknesses for {selectedGlassType.name} - {selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened'} in the <a href="/admin/glass" className="underline">Glass Admin</a>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getAvailableThicknesses().map(thicknessItem => (
                <button
                  key={thicknessItem.id}
                  onClick={() => {
                    setSelectedThickness(thicknessItem);
                    console.log('Selected thickness from admin:', thicknessItem);
                  }}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedThickness?.id === thicknessItem.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg font-bold text-gray-900">{thicknessItem.thickness}mm</div>
                  <div className="text-sm text-green-600 font-medium">
                    ${thicknessItem.tierPrices?.retail || thicknessItem.pricePerMm || 'N/A'}/m²
                  </div>
                  <div className="text-xs text-gray-500">
                    SKU: {thicknessItem.sku}
                  </div>
                  <div className="text-xs text-blue-600">
                    Lead: {thicknessItem.leadTimeBusinessDays}d
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Comprehensive Dimensions, Quantity & References */}
      {selectedThickness && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">4. Quantity, Dimensions & Project References</h4>
          <p className="text-gray-600 mb-6">Enter precise specifications in millimeters as per your documentation</p>
          
          <div className="space-y-6">
            {/* Primary specifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(parseInt(e.target.value) || 1);
                    setCurrentStep(5);
                  }}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Height (mm)</label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => {
                    setHeightMm(e.target.value);
                    if (e.target.value && widthMm) setCurrentStep(5);
                  }}
                  placeholder="e.g. 1200"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Width (mm)</label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => {
                    setWidthMm(e.target.value);
                    if (e.target.value && heightMm) setCurrentStep(5);
                  }}
                  placeholder="e.g. 800"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>
            
            {/* Project references and photo upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Item/Project Reference Code</label>
                <input
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="Optional project reference"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <p className="text-xs text-gray-500 mt-1">Links this order to specific projects or destinations</p>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Upload Photo Reference</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setUploadedPhoto(e.target.files?.[0] || null);
                      console.log('Photo uploaded:', e.target.files?.[0]?.name);
                    }}
                    className="hidden"
                    id="glass-photo-upload"
                  />
                  <label
                    htmlFor="glass-photo-upload"
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex-1 transition-colors"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    {uploadedPhoto ? uploadedPhoto.name : 'Choose photo...'}
                  </label>
                  {uploadedPhoto && (
                    <button
                      onClick={() => setUploadedPhoto(null)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Visual reference for complex specifications</p>
              </div>
            </div>
            
            {/* Calculated values display */}
            {heightMm && widthMm && quantity && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Calculated Values</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-blue-900">{priceBreakdown?.sqm.toFixed(3) || '0'} m²</div>
                    <div className="text-sm text-blue-700">Total Area</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">{priceBreakdown?.perimeter.toFixed(2) || '0'} m</div>
                    <div className="text-sm text-blue-700">Perimeter</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">{selectedThickness.leadTimeBusinessDays}d</div>
                    <div className="text-sm text-blue-700">Lead Time</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Processing Options - Sequential Workflow */}
      {selectedThickness && heightMm && widthMm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-medium text-gray-900 text-lg">5. Professional Processing Options</h4>
            <div className="text-sm text-gray-600">
              Sequential workflow • Options appear as you progress
            </div>
          </div>
          
          {adminProcessingOptions.length === 0 ? (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                <h5 className="font-medium text-yellow-800">No Processing Options Configured</h5>
              </div>
              <p className="text-yellow-700 mb-3">
                To enable professional glass processing, please configure options in the Glass Admin.
              </p>
              <a 
                href="/admin/glass" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Configure Processing Options
              </a>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Processing - Edgework Section */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-blue-600 font-bold">🔧</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 text-lg">Processing - Edgework</h5>
                    <p className="text-sm text-gray-600">Professional edge finishing • Priced per linear meter</p>
                  </div>
                </div>
                
                {getProcessingByCategory('edgework').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getProcessingByCategory('edgework').map(option => {
                      const isSelected = selectedProcessing.edgework?.some(e => e.id === option.id);
                      // Get correct pricing based on selected thickness
                      let displayPrice = 'N/A';
                      if (option.thicknessPricing && selectedThickness) {
                        const thicknessKey = selectedThickness.thickness.toString();
                        const thicknessPricing = option.thicknessPricing[thicknessKey];
                        if (thicknessPricing) {
                          displayPrice = thicknessPricing[customerTier.toLowerCase()] || thicknessPricing.retail;
                        }
                      } else if (option.flatPricing) {
                        displayPrice = option.flatPricing[customerTier.toLowerCase()] || option.flatPricing.retail;
                      }
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProcessing(prev => ({
                                ...prev,
                                edgework: prev.edgework?.filter(e => e.id !== option.id) || []
                              }));
                            } else {
                              setSelectedProcessing(prev => ({
                                ...prev,
                                edgework: [...(prev.edgework || []), option]
                              }));
                            }
                            console.log('Toggled edgework:', option.name);
                          }}
                          className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">{option.name}</h6>
                            {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                          </div>
                          <p className="text-sm text-green-600 font-medium">
                            ${displayPrice} / linear meter
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedThickness ? `For ${selectedThickness.thickness}mm thickness` : 'Select thickness first'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">No edgework options configured in admin</p>
                  </div>
                )}
              </div>

              {/* Processing - Other Section */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-green-600 font-bold">⚙️</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 text-lg">Processing - Other</h5>
                    <p className="text-sm text-gray-600">Corners, holes, services, and surface finishes</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  
                  {/* Corner Finish - With Variation Support */}
                  {getProcessingByCategory('corner').length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">Corner Finish</h6>
                      <div className="space-y-4">
                        {getProcessingByCategory('corner').map(option => {
                          const isSelected = selectedProcessing.corner?.some(c => c.id === option.id);
                          const hasVariations = option.variations && option.variations.length > 0;
                          const inputValue = variationInputs[option.id] || '';
                          const variationPricing = hasVariations ? getVariationPricing(option, inputValue) : null;
                          
                          // Display price based on variation or flat pricing
                          let displayPrice = 'N/A';
                          let priceDescription = '';
                          
                          if (variationPricing) {
                            displayPrice = variationPricing.price;
                            priceDescription = `${variationPricing.variation.range}mm range`;
                          } else if (option.flatPricing) {
                            displayPrice = option.flatPricing[customerTier.toLowerCase()] || option.flatPricing.retail || 'N/A';
                            priceDescription = 'standard pricing';
                          }
                          
                          return (
                            <div
                              key={option.id}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="font-medium text-gray-900">{option.name}</h6>
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedProcessing(prev => ({
                                        ...prev,
                                        corner: prev.corner?.filter(c => c.id !== option.id) || []
                                      }));
                                    } else {
                                      setSelectedProcessing(prev => ({
                                        ...prev,
                                        corner: [...(prev.corner || []), { 
                                          ...option, 
                                          selectedValue: hasVariations ? inputValue : undefined,
                                          selectedVariation: variationPricing?.variation
                                        }]
                                      }));
                                    }
                                    console.log('Toggled corner:', option.name, hasVariations ? `with value: ${inputValue}` : '');
                                  }}
                                  className={`px-3 py-1 rounded font-bold text-sm ${
                                    isSelected
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                  }`}
                                >
                                  {isSelected ? '✓ Selected' : 'Select'}
                                </button>
                              </div>
                              
                              {/* Variation Input for Range-Based Options */}
                              {hasVariations && (
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter size/measurement:
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="number"
                                      value={inputValue}
                                      onChange={(e) => {
                                        setVariationInputs(prev => ({
                                          ...prev,
                                          [option.id]: e.target.value
                                        }));
                                      }}
                                      placeholder="e.g. 15"
                                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">mm</span>
                                    {variationPricing && (
                                      <span className="text-sm font-medium text-green-600">
                                        → ${variationPricing.price} ({variationPricing.variation.range}mm range)
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Show available ranges */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Available ranges:</p>
                                    <div className="flex gap-2">
                                      {option.variations.map((variation: any, index: number) => (
                                        <button
                                          key={index}
                                          onClick={() => {
                                            // Set input to middle of range
                                            const rangeParts = variation.range.split('-');
                                            if (rangeParts.length === 2) {
                                              const min = parseFloat(rangeParts[0]);
                                              const max = parseFloat(rangeParts[1]);
                                              const middle = ((min + max) / 2).toString();
                                              setVariationInputs(prev => ({
                                                ...prev,
                                                [option.id]: middle
                                              }));
                                            }
                                          }}
                                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                                        >
                                          {variation.range}mm: ${variation.pricing?.[customerTier.toLowerCase()] || variation.pricing?.retail}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Current Pricing Display */}
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Current Price:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    ${displayPrice} / piece
                                  </span>
                                </div>
                                {priceDescription && (
                                  <p className="text-xs text-gray-500 mt-1">{priceDescription}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Holes & Cutouts */}
                  {getProcessingByCategory('hole').length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">Holes & Cutouts</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getProcessingByCategory('hole').map(option => {
                          const isSelected = selectedProcessing.holes?.some(h => h.id === option.id);
                          const displayPrice = option.flatPricing?.[customerTier.toLowerCase()] || option.flatPricing?.retail || 'N/A';
                          
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    holes: prev.holes?.filter(h => h.id !== option.id) || []
                                  }));
                                } else {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    holes: [...(prev.holes || []), option]
                                  }));
                                }
                                console.log('Toggled holes:', option.name);
                              }}
                              className={`p-3 border-2 rounded-lg text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{option.name}</span>
                                {isSelected && <span className="text-orange-600 font-bold">✓</span>}
                              </div>
                              <p className="text-sm text-green-600 font-medium">
                                ${displayPrice} / piece
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {getProcessingByCategory('service').length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">Additional Services</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getProcessingByCategory('service').map(option => {
                          const isSelected = selectedProcessing.services?.some(s => s.id === option.id);
                          const displayPrice = option.flatPricing?.[customerTier.toLowerCase()] || option.flatPricing?.retail || 'N/A';
                          
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    services: prev.services?.filter(s => s.id !== option.id) || []
                                  }));
                                } else {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    services: [...(prev.services || []), option]
                                  }));
                                }
                                console.log('Toggled service:', option.name);
                              }}
                              className={`p-3 border-2 rounded-lg text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{option.name}</span>
                                {isSelected && <span className="text-purple-600 font-bold">✓</span>}
                              </div>
                              <p className="text-sm text-green-600 font-medium">
                                ${displayPrice} / service
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Surface Finishes */}
                  {getProcessingByCategory('surface').length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">Surface Finishes</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getProcessingByCategory('surface').map(option => {
                          const isSelected = selectedProcessing.surface?.some(s => s.id === option.id);
                          const displayPrice = option.flatPricing?.[customerTier.toLowerCase()] || option.flatPricing?.retail || 'N/A';
                          
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    surface: prev.surface?.filter(s => s.id !== option.id) || []
                                  }));
                                } else {
                                  setSelectedProcessing(prev => ({
                                    ...prev,
                                    surface: [...(prev.surface || []), option]
                                  }));
                                }
                                console.log('Toggled surface:', option.name);
                              }}
                              className={`p-3 border-2 rounded-lg text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                  : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{option.name}</span>
                                {isSelected && <span className="text-red-600 font-bold">✓</span>}
                              </div>
                              <p className="text-sm text-green-600 font-medium">
                                ${displayPrice} / m²
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
              
            </div>
          )}
        </div>
      )}

      {/* Templates Section */}
      {selectedThickness && heightMm && widthMm && adminTemplates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">6. Templates (From Your Admin Config)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <h5 className="font-medium">{template.name}</h5>
                <p className="text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Professional Quote Summary & Finalization */}
      {selectedThickness && heightMm && widthMm && priceBreakdown && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Quote Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Quote Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Glass Specification</span>
                  <span className="font-medium">
                    {quantity}x {selectedGlassType.name} {selectedThickness.thickness}mm
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Dimensions</span>
                  <span className="font-medium">{heightMm} × {widthMm}mm</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Area</span>
                  <span className="font-medium">{priceBreakdown.sqm.toFixed(3)} m²</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Lead Time</span>
                  <span className="font-medium">{selectedThickness.leadTimeBusinessDays} business days</span>
                </div>
                {itemCode && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Reference Code</span>
                    <span className="font-medium">{itemCode}</span>
                  </div>
                )}
                
                {/* Show Selected Processing Options */}
                {(selectedProcessing.edgework?.length || selectedProcessing.corner?.length || selectedProcessing.holes?.length || selectedProcessing.services?.length || selectedProcessing.surface?.length) && (
                  <div className="py-2 border-b border-gray-100">
                    <span className="text-gray-600 block mb-2">Selected Processing:</span>
                    <div className="space-y-1">
                      {selectedProcessing.edgework?.map(option => (
                        <div key={option.id} className="text-sm font-medium text-blue-700">
                          • {option.name} (Edgework)
                        </div>
                      ))}
                      {selectedProcessing.corner?.map(option => (
                        <div key={option.id} className="text-sm font-medium text-green-700">
                          • {option.name}{option.selectedValue ? ` - ${option.selectedValue}mm` : ''} (Corner)
                        </div>
                      ))}
                      {selectedProcessing.holes?.map(option => (
                        <div key={option.id} className="text-sm font-medium text-orange-700">
                          • {option.name} (Holes)
                        </div>
                      ))}
                      {selectedProcessing.services?.map(option => (
                        <div key={option.id} className="text-sm font-medium text-purple-700">
                          • {option.name} (Service)
                        </div>
                      ))}
                      {selectedProcessing.surface?.map(option => (
                        <div key={option.id} className="text-sm font-medium text-red-700">
                          • {option.name} (Surface)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Price Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Professional Price Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Base Glass ({customerTier} pricing)</span>
                  <span className="font-medium">${priceBreakdown.baseGlass.toFixed(2)}</span>
                </div>
                
                {/* Processing costs */}
                {priceBreakdown.processing.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Processing:</div>
                    {priceBreakdown.processing.map((proc, index) => (
                      <div key={index} className="flex justify-between items-center py-1 pl-4">
                        <span className="text-gray-600 text-sm">{proc.name}</span>
                        <span className="text-sm">${proc.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Template cost */}
                {priceBreakdown.template > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Template: {selectedTemplate?.name}</span>
                    <span className="font-medium">${priceBreakdown.template.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-bold text-green-600 text-xl">${priceBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Reset to start
                  setSelectedGlassType(null);
                  setSelectedProductType('');
                  setSelectedThickness(null);
                  setQuantity(1);
                  setHeightMm('');
                  setWidthMm('');
                  setItemCode('');
                  setSelectedProcessing({
                    edgework: [],
                    corner: [],
                    holes: [],
                    services: [],
                    surface: []
                  });
                  setSelectedTemplate(null);
                  setUploadedPhoto(null);
                  setCurrentStep(1);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>
            
            <button
              onClick={() => {
                if (onAddGlassToQuote && priceBreakdown) {
                  // Use the proper quote integration function
                  onAddGlassToQuote({
                    glassType: selectedGlassType,
                    thickness: selectedThickness,
                    quantity,
                    heightMm,
                    widthMm,
                    itemCode,
                    processing: selectedProcessing,
                    priceBreakdown
                  });
                  
                  // Reset for next item but keep glass type selected
                  setSelectedProductType('');
                  setSelectedThickness(null);
                  setQuantity(1);
                  setHeightMm('');
                  setWidthMm('');
                  setItemCode('');
                  setSelectedProcessing({
                    edgework: [],
                    corner: [],
                    holes: [],
                    services: [],
                    surface: []
                  });
                  setSelectedTemplate(null);
                  setUploadedPhoto(null);
                  setCurrentStep(selectedGlassType ? 2 : 1);
                } else {
                  // Fallback for standalone usage
                  alert(`Glass item ready: $${priceBreakdown.total.toFixed(2)}`);
                }
                onItemsAdded();
              }}
              disabled={!priceBreakdown || priceBreakdown.total === 0}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Add to Quote • ${priceBreakdown?.total.toFixed(2) || '0.00'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}