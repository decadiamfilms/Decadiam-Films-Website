import React, { useState } from 'react';
import { 
  RocketLaunchIcon, CubeIcon, UsersIcon, 
  DocumentTextIcon, CheckCircleIcon, ArrowRightIcon,
  ClockIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface QuickStartWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function QuickStartWizard({ onComplete, onSkip }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 1,
      title: "Add Sample Glass Products",
      description: "Get started with common glass industry products",
      timeEstimate: "2 minutes",
      businessValue: "Start quoting immediately",
      action: () => {
        // Add glass industry template products
        addGlassIndustryProducts();
        markStepComplete(1);
      }
    },
    {
      id: 2,
      title: "Create Your First Quote",
      description: "Walk through creating a professional quote",
      timeEstimate: "3 minutes",
      businessValue: "See immediate productivity gains",
      action: () => {
        // Navigate to guided quote creation
        window.location.href = '/quotes?guided=true';
      }
    },
    {
      id: 3,
      title: "Add 3 Key Customers",
      description: "Import your most important customers",
      timeEstimate: "2 minutes",
      businessValue: "Ready for real business quotes",
      action: () => {
        // Navigate to customer quick add
        window.location.href = '/customers?quick-add=true';
      }
    }
  ];

  const addGlassIndustryProducts = async () => {
    try {
      // Add common glass industry products
      const glassProducts = [
        {
          name: "10mm Clear Shower Door",
          sku: "SSD-10C",
          category: "Shower Screens",
          subcategory: "Glass Panels",
          price: 420,
          pricingMethod: "sqm",
          stockLevel: 15
        },
        {
          name: "12mm Clear Pool Panel",
          sku: "PPF-12C", 
          category: "Pool Fencing",
          subcategory: "Frameless",
          price: 520,
          pricingMethod: "sqm",
          stockLevel: 8
        },
        {
          name: "Stainless Hardware Set",
          sku: "SHS-001",
          category: "Hardware",
          subcategory: "Hinges",
          price: 85,
          pricingMethod: "each",
          stockLevel: 25
        },
        {
          name: "Black Hardware Set",
          sku: "BHS-001",
          category: "Hardware", 
          subcategory: "Hinges",
          price: 95,
          pricingMethod: "each",
          stockLevel: 20
        },
        {
          name: "Anti-Slip Coating",
          sku: "ASC-001",
          category: "Specials",
          subcategory: "Coatings",
          price: 50,
          pricingMethod: "sqm",
          stockLevel: 100
        }
      ];

      // In production, this would make API calls
      console.log('Adding glass industry products:', glassProducts);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Added ${glassProducts.length} common glass industry products to your inventory. You can now create quotes immediately!`);
      
    } catch (error) {
      console.error('Failed to add products:', error);
      alert('Failed to add products. Please try again.');
    }
  };

  const markStepComplete = (stepId: number) => {
    setCompletedSteps([...completedSteps, stepId]);
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    } else {
      onComplete();
    }
  };

  const totalTimeEstimate = steps.reduce((total, step) => {
    const minutes = parseInt(step.timeEstimate.split(' ')[0]);
    return total + minutes;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="min-h-screen bg-pattern-subtle flex items-center justify-center p-4">
        <div className="card-premium max-w-4xl w-full p-8 border-accent">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <RocketLaunchIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-business-primary mb-2">Quick Start Setup</h1>
            <p className="text-business-secondary mb-4">
              Get SalesKik ready for your business in {totalTimeEstimate} minutes
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-business-muted">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{totalTimeEstimate} minutes total</span>
              </div>
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>Immediate business value</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-business-secondary">
                Step {Math.min(currentStep, steps.length)} of {steps.length}
              </span>
              <span className="text-sm text-business-muted">
                {completedSteps.length} completed
              </span>
            </div>
            <div className="progress-sophisticated">
              <div 
                className="progress-bar" 
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }} 
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isUpcoming = step.id > currentStep;

              return (
                <div
                  key={step.id}
                  className={`p-6 rounded-lg border transition-all ${
                    isCompleted 
                      ? 'border-success bg-gradient-to-r from-green-50 to-emerald-50' 
                      : isCurrent
                        ? 'border-accent bg-gradient-to-r from-blue-50 to-cyan-50 shadow-elevated'
                        : 'border-sophisticated bg-gradient-to-r from-white to-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                          <span className="font-bold">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-business-primary mb-1">
                          {step.title}
                        </h3>
                        <p className="text-business-secondary mb-3">{step.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-business-muted">
                            <ClockIcon className="w-4 h-4" />
                            <span>{step.timeEstimate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSignIcon className="w-4 h-4" />
                            <span>{step.businessValue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isCurrent && !isCompleted && (
                      <button
                        onClick={step.action}
                        className="btn-sophisticated btn-primary px-6 py-3 flex items-center gap-2"
                      >
                        Start Step
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-sophisticated">
            <div className="text-sm text-business-muted">
              Complete these steps to get maximum value from SalesKik
            </div>
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="btn-sophisticated btn-secondary px-4 py-2"
              >
                Skip Setup
              </button>
              {completedSteps.length === steps.length && (
                <button
                  onClick={onComplete}
                  className="btn-sophisticated btn-primary px-6 py-2 flex items-center gap-2"
                >
                  Start Using SalesKik
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickStartWizard;