import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  title: string;
  content: string;
  target?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  action?: {
    text: string;
    onClick: () => void;
  };
}

interface SimpleTourProps {
  isOpen: boolean;
  steps: TourStep[];
  onClose: () => void;
  onComplete: () => void;
}

function SimpleTour({ isOpen, steps, onClose, onComplete }: SimpleTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Find and highlight target element
  useEffect(() => {
    if (isOpen && steps[currentStep]?.target && steps[currentStep].target !== 'body') {
      const element = document.querySelector(steps[currentStep].target!) as HTMLElement;
      setHighlightedElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isCenter = !step.target || step.target === 'body' || step.position === 'center';

  // Create portal to render outside component tree
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={onClose}
          />

          {/* Highlight ring */}
          {highlightedElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: highlightedElement.getBoundingClientRect().top - 8,
                left: highlightedElement.getBoundingClientRect().left - 8,
                width: highlightedElement.offsetWidth + 16,
                height: highlightedElement.offsetHeight + 16,
                border: '3px solid #D4A574',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(212, 165, 116, 0.5)',
                zIndex: 9999,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Tour popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999]"
            style={{
              top: isCenter ? '50%' : (highlightedElement?.getBoundingClientRect().bottom || 100) + 20,
              left: isCenter ? '50%' : (highlightedElement?.getBoundingClientRect().left || 100),
              transform: isCenter ? 'translate(-50%, -50%)' : 'none',
              maxWidth: '400px'
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <div 
                className="text-gray-600 mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: step.content }}
              />

              {/* Action Button */}
              {step.action && (
                <button
                  onClick={step.action.onClick}
                  className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  {step.action.text}
                </button>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentStep === 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ← Back
                </button>

                <div className="flex space-x-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next →'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Global tour state
let globalTourState = {
  isOpen: false,
  steps: [] as TourStep[],
  onClose: () => {},
  onComplete: () => {}
};

// Simple tour component that renders via portal
export function GlobalTour() {
  const [tourState, setTourState] = useState(globalTourState);

  useEffect(() => {
    const interval = setInterval(() => {
      setTourState({...globalTourState});
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  if (!tourState.isOpen) return null;

  return (
    <SimpleTour
      isOpen={tourState.isOpen}
      steps={tourState.steps}
      onClose={tourState.onClose}
      onComplete={tourState.onComplete}
    />
  );
}

// Export simple tour hooks
export function useSimpleTour() {
  const startTour = (steps: TourStep[]) => {
    console.log('Simple Tour: Starting with steps:', steps.length);
    globalTourState = {
      isOpen: true,
      steps,
      onClose: () => {
        console.log('Simple Tour: Closed by user');
        globalTourState.isOpen = false;
      },
      onComplete: () => {
        console.log('Simple Tour: Completed');
        localStorage.setItem('saleskik-tour-completed', 'true');
        globalTourState.isOpen = false;
      }
    };
  };

  const closeTour = () => {
    globalTourState.isOpen = false;
  };

  return { startTour, closeTour };
}

// Dashboard tour steps
export const dashboardTourSteps: TourStep[] = [
  {
    title: 'Welcome to SalesKik! 🎉',
    content: 'Let\'s take a quick 2-minute tour to get you started with your business management platform.',
    position: 'center'
  },
  {
    title: 'Start with Categories',
    content: 'First, create categories for your products. This helps organize your inventory and makes quoting faster.',
    target: '[data-tour="categories-link"]',
    position: 'right',
    action: {
      text: 'Create Your First Category',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'categories');
        window.location.href = '/inventory/builder';
      }
    }
  }
];

// Category tour steps
export const categoryTourSteps: TourStep[] = [
  {
    title: '🏗️ Welcome to Category Builder!',
    content: `
      <p>This is where you organize your products into categories and subcategories.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-900 mb-1">Examples:</div>
        <div class="text-sm text-blue-800">• Pool Fencing → Glass Panels, Posts, Hardware</div>
        <div class="text-sm text-blue-800">• Shower Screens → Framed, Frameless, Semi-Frameless</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '📝 Create Your First Category',
    content: `
      <p>Click this button to create a new category. You'll be able to customize the name and color.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">💡 Pro tip:</div>
        <div class="text-sm text-amber-700">Choose names that your team will easily understand when creating quotes</div>
      </div>
    `,
    target: '[data-tour="add-category"]',
    position: 'bottom'
  },
  {
    title: '🎉 Category Builder Complete!',
    content: `
      <p>Perfect! You now understand how to create and organize categories. Next, let's add some products to your categories.</p>
      <div class="text-sm text-gray-600 mt-2">The tour will continue on the products page</div>
    `,
    position: 'center',
    action: {
      text: '🛍️ Add Your First Product',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'products');
        window.location.href = '/products';
      }
    }
  }
];

// Simple tour controls
export function SimpleTourButton() {
  const { startTour } = useSimpleTour();
  const hasSeenTour = localStorage.getItem('saleskik-tour-completed') === 'true';

  return (
    <button
      onClick={() => startTour(dashboardTourSteps)}
      className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
    >
      <span className="text-sm font-medium">
        {hasSeenTour ? 'Restart Tour' : 'Take Tour'}
      </span>
    </button>
  );
}

// Auto-start for new users
export function useAutoStartSimpleTour() {
  const { startTour } = useSimpleTour();
  
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('saleskik-tour-completed') === 'true';
    const continueTour = sessionStorage.getItem('continue-tour');
    
    if (continueTour === 'categories') {
      console.log('Simple Tour: Continuing on categories page');
      sessionStorage.removeItem('continue-tour');
      setTimeout(() => startTour(categoryTourSteps), 1000);
    } else if (!hasSeenTour) {
      // Auto-start for new users
      setTimeout(() => startTour(dashboardTourSteps), 3000);
    }
  }, [startTour]);
}