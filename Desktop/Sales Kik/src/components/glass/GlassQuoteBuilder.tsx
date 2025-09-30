import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuickPriceCalculator } from './QuickPriceCalculator';
import { GlassTypeStep } from './steps/GlassTypeStep';
import { ProductThicknessStep } from './steps/ProductThicknessStep';
import { DimensionsStep } from './steps/DimensionsStep';
import { TemplatesStep } from './steps/TemplatesStep';
import { EdgeworkStep } from './steps/EdgeworkStep';
import { CornerFinishStep } from './steps/CornerFinishStep';
import { HolesCutoutsStep } from './steps/HolesCutoutsStep';
import { ServicesFinishesStep } from './steps/ServicesFinishesStep';
import { ReviewStep } from './steps/ReviewStep';

interface GlassQuoteItem {
  id?: string;
  quoteId: string;
  glassProductId: string;
  templateId?: string;
  quantity: number;
  heightMm: number;
  widthMm: number;
  squareMeters: number;
  itemCode?: string;
  photoUrl?: string;
  basePrice: number;
  totalBasePrice: number;
  edgeworkSelections?: any;
  cornerFinishSelections?: any;
  holesAndCutouts?: any;
  serviceSelections?: any;
  surfaceFinishSelections?: any;
  edgeworkCost: number;
  cornerFinishCost: number;
  holesCutoutsCost: number;
  servicesCost: number;
  surfaceFinishCost: number;
  totalProcessingCost: number;
  totalItemCost: number;
}

interface GlassQuoteBuilderProps {
  quoteId: string | null;
  customerId: string | null;
  onItemAdded: (item: GlassQuoteItem) => void;
}

export function GlassQuoteBuilder({ quoteId, customerId, onItemAdded }: GlassQuoteBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [glassQuoteData, setGlassQuoteData] = useState({
    // Step 1-2: Glass Selection
    selectedGlassType: null as any,
    selectedProductType: null as string | null,
    selectedProduct: null as any,
    
    // Step 3: Dimensions
    quantity: 1,
    heightMm: '',
    widthMm: '',
    itemCode: '',
    photoFile: null as File | null,
    photoUrl: null as string | null,
    
    // Step 4: Template
    selectedTemplate: null as any,
    
    // Step 5-8: Processing
    edgework: [] as any[],
    cornerFinish: [] as any[],
    holesAndCutouts: [] as any[],
    services: [] as any[],
    surfaceFinishes: [] as any[],
    
    // Calculations
    squareMeters: 0,
    basePrice: 0,
    totalBasePrice: 0,
    edgeworkCost: 0,
    cornerFinishCost: 0,
    holesCutoutsCost: 0,
    servicesCost: 0,
    surfaceFinishCost: 0,
    totalProcessingCost: 0,
    totalCost: 0
  });

  const steps = [
    { id: 1, title: "Glass Type", component: GlassTypeStep },
    { id: 2, title: "Product & Thickness", component: ProductThicknessStep },
    { id: 3, title: "Dimensions", component: DimensionsStep },
    { id: 4, title: "Templates", component: TemplatesStep },
    { id: 5, title: "Edgework", component: EdgeworkStep },
    { id: 6, title: "Corner Finish", component: CornerFinishStep },
    { id: 7, title: "Holes & Cutouts", component: HolesCutoutsStep },
    { id: 8, title: "Services & Finishes", component: ServicesFinishesStep },
    { id: 9, title: "Review & Add", component: ReviewStep }
  ];

  const updateGlassQuoteData = useCallback((updates: Partial<typeof glassQuoteData>) => {
    setGlassQuoteData(prev => ({ ...prev, ...updates }));
  }, []);

  // Calculate square meters when dimensions change
  useEffect(() => {
    const height = parseFloat(glassQuoteData.heightMm) || 0;
    const width = parseFloat(glassQuoteData.widthMm) || 0;
    const quantity = parseInt(glassQuoteData.quantity.toString()) || 0;
    
    if (height > 0 && width > 0) {
      const sqmPerPanel = (height / 1000) * (width / 1000);
      const totalSqm = sqmPerPanel * quantity;
      updateGlassQuoteData({ squareMeters: totalSqm });
    }
  }, [glassQuoteData.heightMm, glassQuoteData.widthMm, glassQuoteData.quantity, updateGlassQuoteData]);

  // Calculate base price when product or dimensions change
  useEffect(() => {
    if (glassQuoteData.selectedProduct && glassQuoteData.squareMeters > 0) {
      const basePrice = glassQuoteData.selectedProduct.basePrice;
      const totalBasePrice = basePrice * glassQuoteData.squareMeters;
      updateGlassQuoteData({ 
        basePrice,
        totalBasePrice,
        totalCost: totalBasePrice + glassQuoteData.totalProcessingCost
      });
    }
  }, [glassQuoteData.selectedProduct, glassQuoteData.squareMeters, glassQuoteData.totalProcessingCost, updateGlassQuoteData]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return !!glassQuoteData.selectedGlassType;
      case 2: return !!glassQuoteData.selectedProduct;
      case 3: return glassQuoteData.heightMm && glassQuoteData.widthMm && glassQuoteData.quantity > 0;
      case 4: return true; // Templates are optional
      case 5: return true; // Edgework is optional
      case 6: return true; // Corner finish is optional
      case 7: return true; // Holes and cutouts are optional
      case 8: return true; // Services are optional
      case 9: return true; // Review step
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddToQuote = async () => {
    if (!quoteId || !customerId) {
      // Handle case where no quote/customer is selected
      console.error('No quote or customer selected');
      return;
    }

    const glassQuoteItem: Omit<GlassQuoteItem, 'id'> = {
      quoteId,
      glassProductId: glassQuoteData.selectedProduct.id,
      templateId: glassQuoteData.selectedTemplate?.id,
      quantity: glassQuoteData.quantity,
      heightMm: parseFloat(glassQuoteData.heightMm),
      widthMm: parseFloat(glassQuoteData.widthMm),
      squareMeters: glassQuoteData.squareMeters,
      itemCode: glassQuoteData.itemCode || undefined,
      photoUrl: glassQuoteData.photoUrl || undefined,
      basePrice: glassQuoteData.basePrice,
      totalBasePrice: glassQuoteData.totalBasePrice,
      edgeworkSelections: glassQuoteData.edgework.length > 0 ? glassQuoteData.edgework : undefined,
      cornerFinishSelections: glassQuoteData.cornerFinish.length > 0 ? glassQuoteData.cornerFinish : undefined,
      holesAndCutouts: glassQuoteData.holesAndCutouts.length > 0 ? glassQuoteData.holesAndCutouts : undefined,
      serviceSelections: glassQuoteData.services.length > 0 ? glassQuoteData.services : undefined,
      surfaceFinishSelections: glassQuoteData.surfaceFinishes.length > 0 ? glassQuoteData.surfaceFinishes : undefined,
      edgeworkCost: glassQuoteData.edgeworkCost,
      cornerFinishCost: glassQuoteData.cornerFinishCost,
      holesCutoutsCost: glassQuoteData.holesCutoutsCost,
      servicesCost: glassQuoteData.servicesCost,
      surfaceFinishCost: glassQuoteData.surfaceFinishCost,
      totalProcessingCost: glassQuoteData.totalProcessingCost,
      totalItemCost: glassQuoteData.totalCost
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/glass/quote-items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(glassQuoteItem)
      });

      if (!response.ok) {
        throw new Error('Failed to add glass quote item');
      }

      const addedItem = await response.json();
      onItemAdded(addedItem);
      
      // Reset the form for next item
      setGlassQuoteData({
        selectedGlassType: null,
        selectedProductType: null,
        selectedProduct: null,
        quantity: 1,
        heightMm: '',
        widthMm: '',
        itemCode: '',
        photoFile: null,
        photoUrl: null,
        selectedTemplate: null,
        edgework: [],
        cornerFinish: [],
        holesAndCutouts: [],
        services: [],
        surfaceFinishes: [],
        squareMeters: 0,
        basePrice: 0,
        totalBasePrice: 0,
        edgeworkCost: 0,
        cornerFinishCost: 0,
        holesCutoutsCost: 0,
        servicesCost: 0,
        surfaceFinishCost: 0,
        totalProcessingCost: 0,
        totalCost: 0
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error adding glass quote item:', error);
    }
  };

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component;

  return (
    <div className="w-full">
      
      {/* Header with Progress Steps and Quick Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Glass Quote Workflow</h2>
            <p className="text-base text-gray-600 mt-1">Step {currentStep} of {steps.length} - {steps.find(s => s.id === currentStep)?.title}</p>
          </div>
          <QuickPriceCalculator 
            glassQuoteData={glassQuoteData}
            onQuickUpdate={updateGlassQuoteData}
            customerId={customerId}
            className="relative"
          />
        </div>
        
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center min-w-max">
              <div 
                onClick={() => setCurrentStep(step.id)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200
                  ${currentStep >= step.id 
                    ? 'bg-[#6B7FCC] text-white shadow-md' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className="ml-3 text-base font-medium text-gray-700 whitespace-nowrap">
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-1 mx-6 flex-shrink-0 transition-colors duration-200 rounded-full
                  ${currentStep > step.id ? 'bg-[#6B7FCC]' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content - Full Width */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 min-h-96">
        {CurrentStepComponent && (
          <CurrentStepComponent 
            glassQuoteData={glassQuoteData} 
            onUpdate={updateGlassQuoteData}
            customerId={customerId}
          />
        )}
      </div>

      {/* Navigation - Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 rounded-xl shadow-lg mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </p>
            </div>
            
            {currentStep === steps.length ? (
              <button
                onClick={handleAddToQuote}
                disabled={!canProceedToNext()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Quote
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}