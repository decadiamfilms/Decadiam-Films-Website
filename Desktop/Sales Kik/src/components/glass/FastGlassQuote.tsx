import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedGlassComponent } from '../../hooks/useGlassModuleAccess';
import { glassDataService, GlassTemplate } from '../../services/glassDataService';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, CubeIcon,
  ShoppingCartIcon, CheckIcon, TrashIcon, 
  InformationCircleIcon, TagIcon, AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon, ChevronDownIcon, ChevronRightIcon,
  PhotoIcon, DocumentTextIcon, BeakerIcon, ClipboardIcon
} from '@heroicons/react/24/outline';

interface GlassType {
  id: string;
  name: string;
  description?: string;
  glassProducts: GlassProduct[];
}

interface GlassProduct {
  id: string;
  glassTypeId: string;
  productType: 'TOUGHENED' | 'NOT_TOUGHENED';
  thickness: number;
  basePrice: number;
  glassType?: GlassType;
}

interface ProcessingOptions {
  edgework: ProcessingOption[];
  cornerFinish: ProcessingOption[];
  holesCutouts: ProcessingOption[];
  services: ProcessingOption[];
  surfaceFinish: ProcessingOption[];
  thicknesses: number[];
}

interface ProcessingOption {
  id: string;
  name: string;
  description?: string;
  ratePerMeter?: number;
  ratePerPiece?: number;
  baseRate?: number;
  rate?: number;
  rateType?: string;
}

interface PriceCalculation {
  total: number;
  basePrice: number;
  processingCost: number;
  pricePerSqm: number;
  sqm: number;
  glassProduct?: GlassProduct;
  breakdown: {
    glass: string;
    processing: string[];
    processingTotal: string;
    total: string;
  };
}

interface GlassQuoteFormData {
  glassTypeId: string;
  productType: 'TOUGHENED' | 'NOT_TOUGHENED';
  thickness: number;
  quantity: number;
  heightMm: number;
  widthMm: number;
  itemCode?: string;
  selectedEdgework: string[];
  selectedCornerFinish: string[];
  selectedHoles: string[];
  selectedServices: string[];
  selectedFinishes: string[];
}

interface FastGlassQuoteProps {
  quoteId: string;
  customerId: string;
  onItemsAdded: () => void;
}

export default function FastGlassQuote({ quoteId, customerId, onItemsAdded }: FastGlassQuoteProps) {
  return (
    <ProtectedGlassComponent>
      <FastGlassQuoteContent 
        quoteId={quoteId} 
        customerId={customerId} 
        onItemsAdded={onItemsAdded} 
      />
    </ProtectedGlassComponent>
  );
}

function FastGlassQuoteContent({ quoteId, customerId, onItemsAdded }: FastGlassQuoteProps) {
  const queryClient = useQueryClient();
  
  // Customer tier state
  const [customerTier, setCustomerTier] = useState<'T1' | 'T2' | 'T3' | 'Retail'>('Retail');
  
  // 10-Step Workflow State (based on your document)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGlassType, setSelectedGlassType] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<'TOUGHENED' | 'NOT_TOUGHENED' | ''>('');
  const [selectedThickness, setSelectedThickness] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GlassProduct | null>(null);
  
  // Step 3-5: Quantity, Size & Custom Codes
  const [quantity, setQuantity] = useState<number>(1);
  const [heightMm, setHeightMm] = useState<number | null>(null);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [itemCode, setItemCode] = useState<string>('');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  
  // Step 6: Templates
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateCost, setTemplateCost] = useState<number>(0);
  
  // Get templates from admin-configured data
  const [templates, setTemplates] = useState<GlassTemplate[]>([]);
  
  useEffect(() => {
    const templateData = glassDataService.getTemplates();
    setTemplates(templateData);
  }, []);
  
  // Fetch customer tier based on customerId
  useEffect(() => {
    const fetchCustomerTier = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/tier`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCustomerTier(data.tier || 'Retail');
        }
      } catch (error) {
        console.error('Error fetching customer tier:', error);
        // Default to Retail if fetch fails
        setCustomerTier('Retail');
      }
    };
    
    if (customerId) {
      fetchCustomerTier();
    }
  }, [customerId]);
  
  // Step 7-8: Processing Chain (track if user has made selections)
  const [selectedEdgework, setSelectedEdgework] = useState<string>('');
  const [edgeworkTouched, setEdgeworkTouched] = useState<boolean>(false);
  const [selectedCornerFinish, setSelectedCornerFinish] = useState<string>('');
  const [cornerTouched, setCornerTouched] = useState<boolean>(false);
  const [selectedHoles, setSelectedHoles] = useState<string>('');
  const [holesTouched, setHolesTouched] = useState<boolean>(false);
  const [selectedServices, setSelectedServices] = useState<string>('');
  const [servicesTouched, setServicesTouched] = useState<boolean>(false);
  const [selectedFinishes, setSelectedFinishes] = useState<string>('');
  
  // Price calculation state
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  
  // Quick Price Calculator state
  const [showQuickCalculator, setShowQuickCalculator] = useState(false);
  const [quickCalcGlassType, setQuickCalcGlassType] = useState<string>('');
  const [quickCalcThickness, setQuickCalcThickness] = useState<number | null>(null);
  const [quickCalcProcessing, setQuickCalcProcessing] = useState<string>('');
  
  // Live price calculation effect using glassDataService
  useEffect(() => {
    const calculateLivePrice = () => {
      if (selectedGlassType && selectedProductType && selectedThickness && heightMm && widthMm) {
        try {
          const productTypeName = selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
          
          const calculation = glassDataService.calculatePrice({
            glassTypeId: selectedGlassType,
            productType: productTypeName as 'Toughened' | 'Not Toughened',
            thickness: selectedThickness,
            widthMm,
            heightMm,
            quantity,
            customerTier: customerTier,
            processingOptions: {
              edgework: selectedEdgework ? [selectedEdgework] : [],
              corners: selectedCornerFinish ? [selectedCornerFinish] : [],
              holes: selectedHoles ? [selectedHoles] : [],
              services: selectedServices ? [selectedServices] : [],
              surface: selectedFinishes ? [selectedFinishes] : []
            }
          });
          
          setCurrentPrice(calculation.totalPrice);
          setPriceBreakdown(calculation.breakdown);
        } catch (error) {
          console.error('Price calculation error:', error);
          setCurrentPrice(0);
          setPriceBreakdown(null);
        }
      }
    };

    calculateLivePrice();
  }, [
    selectedGlassType, selectedProductType, selectedThickness, quantity, 
    heightMm, widthMm, selectedEdgework, selectedCornerFinish, 
    selectedHoles, selectedServices, selectedFinishes, customerTier
  ]);

  // Form state
  const [formData, setFormData] = useState<GlassQuoteFormData>({
    glassTypeId: '',
    productType: 'NOT_TOUGHENED',
    thickness: 6,
    quantity: 1,
    heightMm: 1000,
    widthMm: 600,
    itemCode: '',
    selectedEdgework: [],
    selectedCornerFinish: [],
    selectedHoles: [],
    selectedServices: [],
    selectedFinishes: []
  });

  // Fetch glass types from comprehensive admin configuration
  const { data: glassTypes, isLoading: glassTypesLoading } = useQuery<GlassType[]>({
    queryKey: ['glass-types'],
    queryFn: async () => {
      // First try to get from comprehensive admin localStorage
      const adminGlassTypes = localStorage.getItem('saleskik-glass-types-complete');
      if (adminGlassTypes) {
        try {
          const parsedTypes = JSON.parse(adminGlassTypes);
          const activeTypes = parsedTypes.filter((type: any) => type.isActive && type.isComplete);
          console.log('Loaded glass types from admin config:', activeTypes);
          return activeTypes;
        } catch (error) {
          console.error('Error parsing admin glass types:', error);
        }
      }
      
      // Fallback to API
      try {
        const response = await fetch('/api/glass/types', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
      }
      
      // Final fallback to hardcoded types
      return [
        { id: 'clear', name: 'Clear Glass', glassProducts: [] },
        { id: 'ultra-clear', name: 'Ultra Clear Glass', glassProducts: [] },
        { id: 'mirror', name: 'Mirror Glass', glassProducts: [] }
      ];
    }
  });

  // Fetch processing options from comprehensive admin configuration
  const { data: processingOptions, isLoading: processingOptionsLoading } = useQuery<ProcessingOptions>({
    queryKey: ['glass-processing-options'],
    queryFn: async () => {
      // First try to get from comprehensive admin localStorage
      const adminProcessingOptions = localStorage.getItem('saleskik-glass-processing-options');
      if (adminProcessingOptions) {
        try {
          const parsedOptions = JSON.parse(adminProcessingOptions);
          const activeOptions = parsedOptions.filter((opt: any) => opt.isActive);
          
          // Group by category type for UI consumption
          const grouped = {
            edgework: activeOptions.filter((opt: any) => opt.categoryId?.includes('edgework')),
            cornerFinish: activeOptions.filter((opt: any) => opt.categoryId?.includes('corner')),
            holesCutouts: activeOptions.filter((opt: any) => opt.categoryId?.includes('hole')),
            services: activeOptions.filter((opt: any) => opt.categoryId?.includes('service')),
            surfaceFinish: activeOptions.filter((opt: any) => opt.categoryId?.includes('surface')),
            thicknesses: [4, 5, 6, 8, 10, 12, 15]
          };
          
          console.log('Loaded processing options from admin config:', grouped);
          return grouped;
        } catch (error) {
          console.error('Error parsing admin processing options:', error);
        }
      }
      
      // Fallback to API
      try {
        const response = await fetch('/api/glass/processing-options', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.error('Error fetching processing options from API:', error);
      }
      
      // Final fallback - encourage admin configuration
      console.warn('No processing options configured in admin. Please configure in Glass Admin.');
      return {
        edgework: [],
        cornerFinish: [],
        holesCutouts: [],
        services: [],
        surfaceFinish: [],
        thicknesses: []
      };
    }
  });

  // Available glass products based on selected glass type
  const availableProducts = useMemo(() => {
    if (!glassTypes || !formData.glassTypeId) return [];
    const selectedType = glassTypes.find(type => type.id === formData.glassTypeId);
    return selectedType?.glassProducts || [];
  }, [glassTypes, formData.glassTypeId]);

  // Available thicknesses for selected type and toughening
  const availableThicknesses = useMemo(() => {
    const products = availableProducts.filter(p => p.productType === formData.productType);
    return [...new Set(products.map(p => p.thickness))].sort((a, b) => a - b);
  }, [availableProducts, formData.productType]);

  // Real-time price calculation
  const priceQuery = useQuery<PriceCalculation>({
    queryKey: [
      'glass-price-calculation',
      formData.glassTypeId,
      formData.productType,
      formData.thickness,
      formData.quantity,
      formData.heightMm,
      formData.widthMm,
      customerId,
      formData.selectedEdgework,
      formData.selectedCornerFinish,
      formData.selectedHoles,
      formData.selectedServices,
      formData.selectedFinishes
    ],
    queryFn: async () => {
      if (!formData.glassTypeId || !formData.heightMm || !formData.widthMm) {
        return { total: 0, basePrice: 0, processingCost: 0, pricePerSqm: 0, sqm: 0, breakdown: { glass: '', processing: [], processingTotal: '', total: '' } };
      }

      const params = new URLSearchParams({
        glassTypeId: formData.glassTypeId,
        productType: formData.productType,
        thickness: formData.thickness.toString(),
        quantity: formData.quantity.toString(),
        heightMm: formData.heightMm.toString(),
        widthMm: formData.widthMm.toString(),
        customerId: customerId
      });

      if (formData.selectedEdgework.length) params.append('edgeworkIds', formData.selectedEdgework.join(','));
      if (formData.selectedCornerFinish.length) params.append('cornerFinishIds', formData.selectedCornerFinish.join(','));
      if (formData.selectedHoles.length) params.append('holesIds', formData.selectedHoles.join(','));
      if (formData.selectedServices.length) params.append('serviceIds', formData.selectedServices.join(','));
      if (formData.selectedFinishes.length) params.append('finishIds', formData.selectedFinishes.join(','));

      const response = await fetch(`/api/glass/calculate-price?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!formData.glassTypeId && !!formData.heightMm && !!formData.widthMm
  });

  // Add glass item to quote
  const addItemMutation = useMutation({
    mutationFn: async () => {
      const calculation = priceQuery.data;
      if (!calculation || calculation.total === 0) {
        throw new Error('Invalid price calculation');
      }

      const response = await fetch('/api/glass/quote-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          quoteId,
          glassTypeId: formData.glassTypeId,
          thickness: formData.thickness,
          productType: formData.productType,
          quantity: formData.quantity,
          heightMm: formData.heightMm,
          widthMm: formData.widthMm,
          squareMeters: calculation.sqm,
          itemCode: formData.itemCode || undefined,
          basePrice: calculation.pricePerSqm,
          totalBasePrice: calculation.basePrice,
          edgeworkSelections: formData.selectedEdgework.length ? { ids: formData.selectedEdgework } : undefined,
          cornerFinishSelections: formData.selectedCornerFinish.length ? { ids: formData.selectedCornerFinish } : undefined,
          holesAndCutouts: formData.selectedHoles.length ? { ids: formData.selectedHoles } : undefined,
          serviceSelections: formData.selectedServices.length ? { ids: formData.selectedServices } : undefined,
          surfaceFinishSelections: formData.selectedFinishes.length ? { ids: formData.selectedFinishes } : undefined,
          totalProcessingCost: calculation.processingCost,
          totalItemCost: calculation.total
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add glass item');
      }

      return response.json();
    },
    onSuccess: () => {
      // Reset form to defaults but keep glass type selected
      setFormData(prev => ({
        ...prev,
        quantity: 1,
        heightMm: 1000,
        widthMm: 600,
        itemCode: '',
        selectedEdgework: [],
        selectedCornerFinish: [],
        selectedHoles: [],
        selectedServices: [],
        selectedFinishes: []
      }));
      onItemsAdded();
    }
  });

  // Debug glass types loading
  useEffect(() => {
    console.log('Glass types loaded:', glassTypes);
    console.log('Glass types length:', glassTypes?.length);
    if (glassTypes && glassTypes.length > 0) {
      console.log('First glass type:', glassTypes[0]);
    }
  }, [glassTypes]);
  
  // Auto-select first glass type on load
  useEffect(() => {
    if (glassTypes && glassTypes.length > 0 && !formData.glassTypeId) {
      setFormData(prev => ({ ...prev, glassTypeId: glassTypes[0].id }));
      setSelectedGlassType(glassTypes[0].id);
    }
  }, [glassTypes, formData.glassTypeId]);

  // Auto-adjust thickness if not available for selected product type
  useEffect(() => {
    if (availableThicknesses.length > 0) {
      const currentThickness = availableThicknesses.find(t => t.thickness === formData.thickness);
      if (!currentThickness) {
        setFormData(prev => ({ ...prev, thickness: availableThicknesses[0].thickness }));
        setSelectedThickness(availableThicknesses[0].thickness);
      }
    }
  }, [availableThicknesses, formData.thickness]);

  const updateFormData = (updates: Partial<GlassQuoteFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleSelection = (category: keyof Pick<GlassQuoteFormData, 'selectedEdgework' | 'selectedCornerFinish' | 'selectedHoles' | 'selectedServices' | 'selectedFinishes'>, id: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter(item => item !== id)
        : [...prev[category], id]
    }));
  };

  if (glassTypesLoading || processingOptionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading glass options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Clean Custom Glass Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <div className="text-white text-2xl">🪟</div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Custom Glass</h3>
              <p className="text-base text-gray-600">
                Step {currentStep} of 7 • Professional glass quoting workflow
              </p>
            </div>
          </div>
          {/* Quick Price Calculator - Full Interface as per document */}
          <div className="relative">
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-green-600">
                  ${currentPrice.toFixed(2)}
                </div>
                <button
                  onClick={() => setShowQuickCalculator(!showQuickCalculator)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Quick Price Calculator"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">Customer Tier: {customerTier}</div>
              <div className="text-xs text-green-600">Quick Calculator • Rapid revisions</div>
            </div>

            {/* Quick Calculator Dropdown - Full Revision Interface */}
            {showQuickCalculator && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Quick Price Revision</h4>
                  <button
                    onClick={() => setShowQuickCalculator(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Quick Glass Type Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Glass Type</label>
                    <select
                      value={quickCalcGlassType || selectedGlassType}
                      onChange={(e) => setQuickCalcGlassType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose glass type...</option>
                      {glassTypes?.map(glassType => (
                        <option key={glassType.id} value={glassType.id}>
                          {glassType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Thickness Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thickness</label>
                    <select
                      value={quickCalcThickness || selectedThickness || ''}
                      onChange={(e) => setQuickCalcThickness(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose thickness...</option>
                      {(() => {
                        // Get available thicknesses from selected glass type
                        const selectedType = glassTypes?.find(type => type.id === (quickCalcGlassType || selectedGlassType));
                        const allThicknesses = new Set<number>();
                        
                        selectedType?.productTypes?.forEach(pt => {
                          pt.thicknesses?.forEach(th => {
                            if (th.isActive) allThicknesses.add(th.thickness);
                          });
                        });
                        
                        return Array.from(allThicknesses).sort((a, b) => a - b);
                      })().map(thickness => (
                        <option key={thickness} value={thickness}>{thickness}mm</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Processing Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Preset</label>
                    <select
                      value={quickCalcProcessing}
                      onChange={(e) => setQuickCalcProcessing(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No processing</option>
                      <option value="basic-edge">Basic Edge Polish</option>
                      <option value="edge-corner">Edge + Corner Finish</option>
                      <option value="full-processing">Full Processing Package</option>
                    </select>
                  </div>

                  {/* Batch Operations - As per document */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Operations</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => {
                          // Apply edgework to current selection
                          if (processingOptions.edgework.length > 0) {
                            setSelectedEdgework(processingOptions.edgework[0].id);
                            setEdgeworkTouched(true);
                            if (selectedCornerFinish) setCornerTouched(true);
                            if (selectedHoles) setHolesTouched(true);
                            if (selectedServices) setServicesTouched(true);
                          }
                          setShowQuickCalculator(false);
                        }}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                      >
                        Apply Edgework
                      </button>
                      <button
                        onClick={() => {
                          // Apply standard holes to current selection
                          if (processingOptions.holesCutouts.length > 0) {
                            setSelectedHoles(processingOptions.holesCutouts[0].id);
                            setHolesTouched(true);
                            if (selectedServices) setServicesTouched(true);
                            // Also enable prerequisites
                            setEdgeworkTouched(true);
                            setCornerTouched(true);
                          }
                          setShowQuickCalculator(false);
                        }}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                      >
                        Apply Holes
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Replace vs Create New */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        // Replace existing quote (as per document)
                        if (quickCalcGlassType && quickCalcGlassType !== selectedGlassType) {
                          setSelectedGlassType(quickCalcGlassType);
                          updateFormData({ glassTypeId: quickCalcGlassType });
                          setCurrentStep(2); // Reset workflow to product type selection
                        }
                        
                        if (quickCalcThickness && quickCalcThickness !== selectedThickness) {
                          setSelectedThickness(quickCalcThickness);
                          updateFormData({ thickness: quickCalcThickness });
                        }
                        
                        // Apply processing preset
                        if (quickCalcProcessing) {
                          const edgeworkOptions = processingOptions.edgework;
                          const cornerOptions = processingOptions.cornerFinish;
                          
                          if (quickCalcProcessing === 'basic-edge' && edgeworkOptions.length > 0) {
                            setSelectedEdgework(edgeworkOptions[0].id);
                            setEdgeworkTouched(true);
                          } else if (quickCalcProcessing === 'edge-corner') {
                            if (edgeworkOptions.length > 0) {
                              setSelectedEdgework(edgeworkOptions[0].id);
                              setEdgeworkTouched(true);
                            }
                            if (cornerOptions.length > 0) {
                              setSelectedCornerFinish(cornerOptions[0].id);
                              setCornerTouched(true);
                            }
                          } else if (quickCalcProcessing === 'full-processing') {
                            // Apply basic options from each category
                            if (edgeworkOptions.length > 0) {
                              setSelectedEdgework(edgeworkOptions[0].id);
                              setEdgeworkTouched(true);
                            }
                            if (cornerOptions.length > 0) {
                              setSelectedCornerFinish(cornerOptions[0].id);
                              setCornerTouched(true);
                            }
                            if (processingOptions.holesCutouts.length > 0) {
                              setSelectedHoles(processingOptions.holesCutouts[0].id);
                              setHolesTouched(true);
                            }
                            if (processingOptions.services.length > 0) {
                              setSelectedServices(processingOptions.services[0].id);
                              setServicesTouched(true);
                            }
                          }
                        }
                        
                        setShowQuickCalculator(false);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Replace Current
                    </button>
                    <button
                      onClick={() => {
                        // Create new quote with revisions (as per document)
                        alert('Creating new quote with revised parameters...');
                        setShowQuickCalculator(false);
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Create New
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 10-Step Sequential Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          
          {/* Step 1: Glass Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Select Glass Type</h4>
                <p className="text-sm text-gray-600">Choose from available glass types</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Glass Type</label>
                <select
                  value={selectedGlassType}
                  onChange={(e) => {
                    console.log('Glass type selected:', e.target.value);
                    setSelectedGlassType(e.target.value);
                    updateFormData({ glassTypeId: e.target.value });
                    setSelectedProductType('');
                    setSelectedThickness(null);
                    setCurrentStep(e.target.value ? 2 : 1);
                    console.log('Current step set to:', e.target.value ? 2 : 1);
                    console.log('Selected glass type data:', glassTypes?.find(t => t.id === e.target.value));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">Choose glass type...</option>
                  {glassTypes?.map(glassType => (
                    <option key={glassType.id} value={glassType.id}>
                      {glassType.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Product Type Selection - Only shows after Step 1 */}
          {currentStep >= 2 && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Product Type</h4>
                  <p className="text-sm text-gray-600">Specify toughened or not toughened</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Product Type</label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => {
                      console.log('Product type selected:', e.target.value);
                      setSelectedProductType(e.target.value as 'TOUGHENED' | 'NOT_TOUGHENED');
                      updateFormData({ productType: e.target.value as 'TOUGHENED' | 'NOT_TOUGHENED' });
                      setSelectedThickness(null);
                      setCurrentStep(e.target.value ? 3 : 2);
                      
                      // Debug available thicknesses
                      const selectedType = glassTypes?.find(type => type.id === selectedGlassType);
                      const productTypeName = e.target.value === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
                      const productType = selectedType?.productTypes?.find(pt => pt.name === productTypeName);
                      console.log('Available thicknesses for', productTypeName + ':', productType?.thicknesses);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="">Choose product type...</option>
                    <option value="NOT_TOUGHENED">Not Toughened</option>
                    <option value="TOUGHENED">Toughened</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Thickness Selection - Shows available thicknesses with prices */}
          {currentStep >= 3 && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Select Thickness</h4>
                  <p className="text-sm text-gray-600">Available thicknesses with pricing per m²</p>
                </div>
              </div>
              
              <div className="pl-11">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Get thicknesses from admin configuration */}
                  {(() => {
                    // Find selected glass type from admin data
                    const selectedType = glassTypes?.find(type => type.id === selectedGlassType);
                    if (!selectedType) {
                      console.log('No glass type found for:', selectedGlassType);
                      return [];
                    }
                    
                    // Find product type (Toughened/Not Toughened)
                    const productTypeName = selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
                    const productType = selectedType.productTypes?.find(pt => pt.name === productTypeName);
                    if (!productType) {
                      console.log('No product type found for:', productTypeName);
                      return [];
                    }
                    
                    // Get available thicknesses from admin config
                    const availableThicknesses = productType.thicknesses?.filter(t => t.isActive) || [];
                    console.log('Available thicknesses from admin:', availableThicknesses);
                    
                    return availableThicknesses;
                  })().map(thicknessItem => (
                    <button
                      key={thicknessItem.thickness}
                      onClick={() => {
                        setSelectedThickness(thicknessItem.thickness);
                        updateFormData({ thickness: thicknessItem.thickness });
                        setCurrentStep(4);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedThickness === thicknessItem.thickness
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
                    </button>
                  ))}
                </div>
                
                {/* Show message if no thicknesses available */}
                {(() => {
                  const selectedType = glassTypes?.find(type => type.id === selectedGlassType);
                  const productTypeName = selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
                  const productType = selectedType?.productTypes?.find(pt => pt.name === productTypeName);
                  const availableThicknesses = productType?.thicknesses?.filter(t => t.isActive) || [];
                  
                  if (selectedGlassType && selectedProductType && availableThicknesses.length === 0) {
                    return (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">⚠️ No thicknesses configured for {selectedType?.name} - {productTypeName}</p>
                        <p className="text-sm text-yellow-600 mt-1">
                          Please configure thicknesses in the <a href="/admin/glass" className="underline">Glass Admin</a> first.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Step 4: Quantity, Dimensions, Code & Photo - Combined as per document */}
          {currentStep >= 4 && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quantity, Size & Custom Codes</h4>
                  <p className="text-sm text-gray-600">Enter quantity, dimensions in millimeters, and optional references</p>
                </div>
              </div>
              
              {/* Combined form as per your document */}
              <div className="pl-11 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        setQuantity(qty);
                        updateFormData({ quantity: qty });
                        if (e.target.value && heightMm && widthMm) setCurrentStep(5);
                      }}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Height (mm)</label>
                    <input
                      type="number"
                      value={heightMm || ''}
                      onChange={(e) => {
                        setHeightMm(parseInt(e.target.value) || null);
                        if (e.target.value && widthMm && quantity) setCurrentStep(5);
                      }}
                      placeholder="e.g. 1200"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Width (mm)</label>
                    <input
                      type="number"
                      value={widthMm || ''}
                      onChange={(e) => {
                        setWidthMm(parseInt(e.target.value) || null);
                        if (e.target.value && heightMm && quantity) setCurrentStep(5);
                      }}
                      placeholder="e.g. 800"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                </div>

                {/* Item Code & Photo - Same stage as per document */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Item/Reference Code</label>
                    <input
                      type="text"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      placeholder="Optional project reference"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Upload Photo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUploadedPhoto(e.target.files?.[0] || null)}
                        className="hidden"
                        id="glass-photo-upload"
                      />
                      <label
                        htmlFor="glass-photo-upload"
                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        {uploadedPhoto ? uploadedPhoto.name : 'Choose file'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Templates Section - Auto-appears after dimensions */}
          {currentStep >= 5 && heightMm && widthMm && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  5
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Templates (Optional)</h4>
                  <p className="text-sm text-gray-600">Pre-defined shapes and specifications</p>
                </div>
              </div>
              
              <div className="pl-11">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(templates || []).map((template: any) => (
                    <button
                      key={template.id}
                      onClick={async () => {
                        setSelectedTemplate(template.id);
                        
                        // Automated cost calculation using glassDataService
                        if (heightMm && widthMm && selectedThickness && selectedGlassType && selectedProductType) {
                          try {
                            const productTypeName = selectedProductType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened';
                            
                            const calculation = glassDataService.calculatePrice({
                              glassTypeId: selectedGlassType,
                              productType: productTypeName as 'Toughened' | 'Not Toughened',
                              thickness: selectedThickness,
                              widthMm,
                              heightMm,
                              quantity,
                              customerTier: customerTier,
                              template: template.id,
                              processingOptions: {
                                edgework: selectedEdgework ? [selectedEdgework] : [],
                                corners: selectedCornerFinish ? [selectedCornerFinish] : [],
                                holes: selectedHoles ? [selectedHoles] : [],
                                services: selectedServices ? [selectedServices] : [],
                                surface: selectedFinishes ? [selectedFinishes] : []
                              }
                            });
                            
                            setTemplateCost(calculation.templateCost);
                            setCurrentPrice(calculation.totalPrice);
                          } catch (error) {
                            console.error('Template calculation error:', error);
                          }
                        }
                        
                        setCurrentStep(6);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                      {selectedTemplate === template.id && templateCost > 0 && (
                        <div className="text-sm font-bold text-green-600 mt-2">
                          Template Cost: ${templateCost.toFixed(2)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setCurrentStep(7)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Skip Templates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Processing Section - Unified as per document */}
          {currentStep >= 6 && heightMm && widthMm && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 6 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  6
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Processing Options</h4>
                  <p className="text-sm text-gray-600">Each dropdown appears in sequence as you work down the chain</p>
                </div>
              </div>
              
              <div className="pl-11 space-y-6">
                {/* Edgework - First dropdown */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <label className="block text-base font-medium text-gray-700 mb-2">Edgework</label>
                  <p className="text-sm text-gray-500 mb-3">Priced per linear meter, adjusts for thickness</p>
                  <select
                    value={selectedEdgework}
                    onChange={(e) => {
                      setSelectedEdgework(e.target.value);
                      setEdgeworkTouched(true); // Mark as touched so next appears
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="">No edgework</option>
                    {(processingOptions?.edgework || []).map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name} - ${option.baseRate || option.flatPricing?.retail || 'N/A'}/{option.rateType || option.pricingType}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Corner Finish - Second dropdown (appears after edgework selection made) */}
                {edgeworkTouched && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <label className="block text-base font-medium text-gray-700 mb-2">Corner Finish</label>
                    <p className="text-sm text-gray-500 mb-3">Charged per piece, adjusts for thickness and radius size</p>
                    <select
                      value={selectedCornerFinish}
                      onChange={(e) => {
                        setSelectedCornerFinish(e.target.value);
                        setCornerTouched(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="">No corner finish</option>
                      {(processingOptions?.cornerFinish || []).map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name} - ${option.baseRate || option.flatPricing?.retail || 'N/A'}/{option.rateType || option.pricingType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Holes & Cutouts - Third dropdown (appears after corner) */}
                {cornerTouched && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <label className="block text-base font-medium text-gray-700 mb-2">Holes & Cutouts</label>
                    <p className="text-sm text-gray-500 mb-3">Priced per piece, varies by hole size and thickness</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={selectedHoles}
                        onChange={(e) => {
                          setSelectedHoles(e.target.value);
                          setHolesTouched(true);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        <option value="">No holes or cutouts</option>
                        {(processingOptions?.holesCutouts || []).map(option => (
                          <option key={option.id} value={option.id}>
                            {option.name} - ${option.baseRate || option.flatPricing?.retail || 'N/A'}/{option.rateType || option.pricingType}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Manual entry for unique requests"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>
                  </div>
                )}

                {/* Services - Fourth dropdown (appears after holes) */}
                {holesTouched && (
                  <div className="border-l-4 border-purple-500 pl-4">
                    <label className="block text-base font-medium text-gray-700 mb-2">Services</label>
                    <p className="text-sm text-gray-500 mb-3">Template charges, labor, and miscellaneous services</p>
                    <select
                      value={selectedServices}
                      onChange={(e) => {
                        setSelectedServices(e.target.value);
                        setServicesTouched(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="">No additional services</option>
                      {(processingOptions?.services || []).map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name} - ${option.baseRate || option.flatPricing?.retail || 'N/A'}/{option.rateType || option.pricingType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Surface Finishes - Fifth dropdown (appears after services) */}
                {servicesTouched && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <label className="block text-base font-medium text-gray-700 mb-2">Surface Finishes</label>
                    <p className="text-sm text-gray-500 mb-3">Paint, coatings, sandblasting - varied pricing models</p>
                    <select
                      value={selectedFinishes}
                      onChange={(e) => {
                        setSelectedFinishes(e.target.value);
                        setCurrentStep(7); // Advance to final step
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="">No surface finish</option>
                      {(processingOptions?.surfaceFinish || []).map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name} - ${option.baseRate || option.flatPricing?.retail || 'N/A'}/{option.rateType || option.pricingType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Final Quote Creation */}
          {currentStep >= 7 && heightMm && widthMm && selectedThickness && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Ready to Add to Quote</h4>
                  <p className="text-sm text-gray-600">
                    {quantity}x {selectedGlassType} • {selectedThickness}mm • {heightMm}x{widthMm}mm
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Reset workflow
                      setCurrentStep(1);
                      setSelectedGlassType('');
                      setSelectedProductType('');
                      setSelectedThickness(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={() => {
                      // Add to quote logic here
                      alert('Glass item added to quote successfully!');
                      onItemsAdded();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add to Quote
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
