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
  
  // Sync with global state
  useEffect(() => {
    setCurrentStep(globalTourState.currentStep);
  }, [globalTourState.currentStep]);
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
    const currentStepData = steps[currentStep];
    
    // If this step has an action, execute it (navigation, modal opening, etc.)
    if (currentStepData.action) {
      console.log('Executing action:', currentStepData.action.text);
      currentStepData.action.onClick();
      return; // Action will handle advancement
    }
    
    // Regular advancement for educational steps
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      globalTourState.currentStep = nextStepIndex;
      setCurrentStep(nextStepIndex);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Smooth transition to previous step  
      const prevStepIndex = currentStep - 1;
      globalTourState.currentStep = prevStepIndex;
      setCurrentStep(prevStepIndex);
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
            key={currentStep} // Force re-render on step change
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-[9999]"
            style={{
              top: isCenter ? '50%' : '20%',  // Always keep it high on screen
              left: isCenter ? '50%' : step.position === 'left' ? '20px' : 'calc(100% - 420px)',
              transform: isCenter ? 'translate(-50%, -50%)' : 'none',
              maxWidth: '400px',
              minWidth: '320px',
              right: step.position === 'right' ? '20px' : 'auto'
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

              {/* Actions now handled by Continue button */}

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

                {step.action ? (
                  <button
                    onClick={handleNext}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md text-sm font-medium hover:from-orange-600 hover:to-yellow-600 transition-all shadow-sm"
                  >
                    {step.action.text}
                  </button>
                ) : currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    onClick={onComplete}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                  >
                    Complete Tour! 🎉
                  </button>
                )}
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
  currentStep: 0,
  onClose: () => {},
  onComplete: () => {},
  nextStep: () => {},
  prevStep: () => {}
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
      currentStep: 0,
      onClose: () => {
        console.log('Simple Tour: Closed by user');
        globalTourState.isOpen = false;
      },
      onComplete: () => {
        console.log('Simple Tour: Completed');
        localStorage.setItem('saleskik-tour-completed', 'true');
        globalTourState.isOpen = false;
      },
      nextStep: () => {
        if (globalTourState.currentStep < globalTourState.steps.length - 1) {
          globalTourState.currentStep += 1;
        } else {
          globalTourState.onComplete();
        }
      },
      prevStep: () => {
        if (globalTourState.currentStep > 0) {
          globalTourState.currentStep -= 1;
        }
      }
    };
  };

  const closeTour = () => {
    globalTourState.isOpen = false;
  };

  const nextStep = () => {
    globalTourState.nextStep();
  };

  return { startTour, closeTour, nextStep };
}

// Dashboard tour steps - Direct and actionable
export const dashboardTourSteps: TourStep[] = [
  {
    title: 'Welcome to SalesKik! 🎉',
    content: `
      <p>Let's get your business set up in SalesKik! I'll guide you through each section step by step.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">Complete setup tour:</div>
        <div class="text-sm text-blue-700">🏗️ Categories → 🛍️ Products → 👥 Customers → 🏭 Suppliers → 📋 Quotes</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '🏗️ Let\'s Start with Categories',
    content: `
      <p>Categories are the foundation of your business structure in SalesKik. Let's create your first category to organize your products!</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Categories help you:</div>
        <div class="text-sm text-green-700">• Organize products logically</div>
        <div class="text-sm text-green-700">• Create quotes faster</div>
        <div class="text-sm text-green-700">• Keep business structured</div>
      </div>
    `,
    position: 'center',
    action: {
      text: 'Go to Categories →',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'categories');
        window.location.href = '/inventory/builder';
      }
    }
  }
];

// Category tour steps - Detailed educational workflow
export const categoryTourSteps: TourStep[] = [
  {
    title: '🏗️ Welcome to Category Builder!',
    content: `
      <p>Perfect! This is where you organize your business into logical categories. Let me show you each part of the category creation process.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-900 mb-1">What we'll cover:</div>
        <div class="text-sm text-blue-800">• What categories are and why you need them</div>
        <div class="text-sm text-blue-800">• How to create and name categories</div>
        <div class="text-sm text-blue-800">• Adding subcategories for organization</div>
        <div class="text-sm text-blue-800">• Setting up product options</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '📋 Understanding Categories',
    content: `
      <p>Categories are like folders for your products. They group similar items together, making it easy for customers to find what they need and for you to create quotes quickly.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Real examples:</div>
        <div class="text-sm text-green-700">• "Pool Fencing" → Glass panels, posts, hardware</div>
        <div class="text-sm text-green-700">• "Shower Screens" → Framed, frameless, semi-frameless</div>
        <div class="text-sm text-green-700">• "Services" → Installation, maintenance, repairs</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '➕ The Add Category Button',
    content: `
      <p>This colorful button creates new categories. When you click it, you'll get a form to enter the category name, choose a color, and add subcategories.</p>
      <div class="bg-purple-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-purple-800 mb-1">💡 Category naming tips:</div>
        <div class="text-sm text-purple-700">• Use clear, business-specific names</div>
        <div class="text-sm text-purple-700">• Think about what customers would expect</div>
        <div class="text-sm text-purple-700">• Keep names short but descriptive</div>
      </div>
    `,
    target: '[data-tour="add-category"]',
    position: 'bottom',
    action: {
      text: 'Open Editor →',
      onClick: () => {
        console.log('Opening category creation modal...');
        
        // Find the add category button
        const allButtons = Array.from(document.querySelectorAll('button'));
        const addButton = allButtons.find(btn => 
          btn.textContent?.toLowerCase().includes('add') &&
          (btn.textContent?.toLowerCase().includes('category') || btn.textContent?.toLowerCase().includes('first'))
        ) as HTMLButtonElement;
        
        if (addButton) {
          console.log('Clicking add category button');
          addButton.click();
          setTimeout(() => {
            globalTourState.currentStep = (globalTourState.currentStep || 0) + 1;
          }, 1200);
        } else {
          console.log('Add button not found, advancing to next step');
          globalTourState.currentStep = (globalTourState.currentStep || 0) + 1;
        }
      }
    }
  },
  {
    title: '✏️ Category Name & Color',
    content: `
      <p>Now you see the category editor! Give your category a descriptive name and choose a color that helps you identify it quickly.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">The form includes:</div>
        <div class="text-sm text-amber-700">• Category Name: Make it clear and specific</div>
        <div class="text-sm text-amber-700">• Color Picker: Choose a unique color</div>
        <div class="text-sm text-amber-700">• Description: Optional details</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '🗂️ Adding Subcategories',
    content: `
      <p>Subcategories organize products within your main category. They help customers drill down to exactly what they need.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">For "Pool Fencing" subcategories:</div>
        <div class="text-sm text-blue-700">• "Glass Panels" → Different sizes and types</div>
        <div class="text-sm text-blue-700">• "Posts & Hardware" → Structural components</div>
        <div class="text-sm text-blue-700">• "Gates" → Access points</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '⚙️ Product Options & Specifications',
    content: `
      <p>For each subcategory, you can add specific options that help with precise quoting and product selection.</p>
      <div class="bg-orange-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-orange-800 mb-1">Example: "Glass Panels" options:</div>
        <div class="text-sm text-orange-700">• Size: 1200mm, 1500mm, 1800mm</div>
        <div class="text-sm text-orange-700">• Thickness: 10mm, 12mm, 15mm</div>
        <div class="text-sm text-orange-700">• Finish: Clear, Tinted, Frosted</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '🎉 Categories Mastered!',
    content: `
      <p>Excellent! You now understand the complete category system in SalesKik. You can create organized structures that make your business more professional.</p>
      <div class="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-gray-800 mb-1">✅ You learned:</div>
        <div class="text-sm text-green-700">• What categories and subcategories do</div>
        <div class="text-sm text-blue-700">• How to name and organize them</div>
        <div class="text-sm text-purple-700">• Setting up product options</div>
        <div class="text-sm font-medium text-gray-800 mt-2">Next: Product management! →</div>
      </div>
    `,
    position: 'center',
    action: {
      text: 'Products →',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'products');
        window.location.href = '/products';
      }
    }
  }
];

// Product tour steps - Complete workflow with creation guidance
export const productTourSteps: TourStep[] = [
  {
    title: '🛍️ Welcome to Product Management!',
    content: `
      <p>Great! You have categories set up. Now let's learn about product management and add your first product to the catalog.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-900 mb-1">In this section:</div>
        <div class="text-sm text-blue-800">• Understanding the product interface</div>
        <div class="text-sm text-blue-800">• Adding your first product</div>
        <div class="text-sm text-blue-800">• Setting up pricing and details</div>
        <div class="text-sm text-blue-800">• Then continue to customers</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '📋 Product Catalog Interface',
    content: `
      <p>This is your product management dashboard. Here you can view all products, their pricing, categories, and inventory levels.</p>
      <div class="bg-purple-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-purple-800 mb-1">Key features:</div>
        <div class="text-sm text-purple-700">• Product list with search and filters</div>
        <div class="text-sm text-purple-700">• Pricing tiers (Cost, T1, T2, T3, Retail)</div>
        <div class="text-sm text-purple-700">• Category assignments and inventory</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '➕ Adding Products',
    content: `
      <p>To add products, you'll use the "Add Product" button. This opens a form where you can set up product details, pricing, and categorization.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">💡 Product tips:</div>
        <div class="text-sm text-amber-700">• Give clear, descriptive names</div>
        <div class="text-sm text-amber-700">• Use consistent product codes</div>
        <div class="text-sm text-amber-700">• Set realistic pricing tiers</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '💰 Pricing Strategy',
    content: `
      <p>SalesKik supports multiple pricing tiers for different customer types. This helps you offer competitive pricing while maintaining margins.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Pricing tiers explained:</div>
        <div class="text-sm text-green-700">• Cost: Your purchase price</div>
        <div class="text-sm text-green-700">• Tier 1: Trade/wholesale customers</div>
        <div class="text-sm text-green-700">• Tier 2: Regular business customers</div>
        <div class="text-sm text-green-700">• Tier 3: Premium customers</div>
        <div class="text-sm text-green-700">• Retail: End consumer price</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '👥 Next: Add Your Customers',
    content: `
      <p>Perfect! You understand product management. Now let's add your customers - this is crucial for creating targeted quotes and managing relationships.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">Why customers matter:</div>
        <div class="text-sm text-blue-700">• Each customer gets personalized pricing</div>
        <div class="text-sm text-blue-700">• You can track project history</div>
        <div class="text-sm text-blue-700">• Quotes become professional and targeted</div>
      </div>
    `,
    position: 'center',
    action: {
      text: 'Customers →',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'customers');
        window.location.href = '/customers';
      }
    }
  }
];

// Customer tour steps - Complete workflow with creation guidance
export const customerTourSteps: TourStep[] = [
  {
    title: '👥 Welcome to Customer Management!',
    content: `
      <p>Now let's add your customers! This is where you build your client database and manage business relationships.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-900 mb-1">We'll cover:</div>
        <div class="text-sm text-blue-800">• Adding customer information</div>
        <div class="text-sm text-blue-800">• Setting up contact details</div>
        <div class="text-sm text-blue-800">• Customer pricing tiers</div>
        <div class="text-sm text-blue-800">• Managing customer relationships</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '➕ Add Your First Customer',
    content: `
      <p>Click the "Add Customer" button to create your first customer profile. You'll need this for creating quotes.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">💡 Customer tips:</div>
        <div class="text-sm text-amber-700">Start with your most important or frequent customers</div>
      </div>
    `,
    target: '[data-tour="add-customer"], .add-customer-btn, button[aria-label*="Add Customer"]',
    position: 'bottom'
  },
  {
    title: '🏢 Customer Details',
    content: `
      <p>Fill in customer information: company name, contact person, phone, email, and address. This appears on all quotes and invoices.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Essential information:</div>
        <div class="text-sm text-green-700">• Business/company name</div>
        <div class="text-sm text-green-700">• Primary contact person</div>
        <div class="text-sm text-green-700">• Phone and email address</div>
        <div class="text-sm text-green-700">• Business/delivery address</div>
      </div>
    `,
    target: '.customer-form, input[name*="name"], .contact-details',
    position: 'right'
  },
  {
    title: '💰 Customer Pricing Tiers',
    content: `
      <p>Assign pricing tiers to customers based on their relationship with your business. This determines which prices they see.</p>
      <div class="bg-purple-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-purple-800 mb-1">Tier examples:</div>
        <div class="text-sm text-purple-700">• Tier 1: Long-term trade partners</div>
        <div class="text-sm text-purple-700">• Tier 2: Regular business customers</div>
        <div class="text-sm text-purple-700">• Tier 3: Occasional/premium customers</div>
      </div>
    `,
    target: '.pricing-tier, select[name*="tier"], .customer-pricing',
    position: 'left'
  },
  {
    title: '🏭 Next: Add Your Suppliers',
    content: `
      <p>Excellent! Customer management setup complete. Now let's add your suppliers - the companies you buy products from.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">Why suppliers are important:</div>
        <div class="text-sm text-blue-700">• Track inventory sources</div>
        <div class="text-sm text-blue-700">• Manage purchase orders</div>
        <div class="text-sm text-blue-700">• Know lead times and costs</div>
      </div>
    `,
    position: 'center',
    action: {
      text: 'Suppliers →',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'suppliers');
        window.location.href = '/suppliers';
      }
    }
  }
];

// Supplier tour steps - Complete workflow with creation guidance  
export const supplierTourSteps: TourStep[] = [
  {
    title: '🏭 Welcome to Supplier Management!',
    content: `
      <p>Perfect! Now let's add your suppliers. These are the companies you buy products from - essential for inventory and purchasing.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-900 mb-1">We'll learn about:</div>
        <div class="text-sm text-blue-800">• Adding supplier information</div>
        <div class="text-sm text-blue-800">• Setting up contact details</div>
        <div class="text-sm text-blue-800">• Payment terms and lead times</div>
        <div class="text-sm text-blue-800">• Purchase order management</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '➕ Add Your First Supplier',
    content: `
      <p>Click the "Add Supplier" button to create your first supplier profile. This helps with inventory management and purchasing.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">💡 Supplier tips:</div>
        <div class="text-sm text-green-700">Start with your main product suppliers - glass companies, hardware suppliers, etc.</div>
      </div>
    `,
    target: '[data-tour="add-supplier"], .add-supplier-btn, button[aria-label*="Add Supplier"]',
    position: 'bottom'
  },
  {
    title: '🏢 Supplier Details',
    content: `
      <p>Add supplier information: company name, ABN, contact person, and address. This is crucial for purchase orders and payments.</p>
      <div class="bg-purple-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-purple-800 mb-1">Essential supplier info:</div>
        <div class="text-sm text-purple-700">• Company name and ABN number</div>
        <div class="text-sm text-purple-700">• Primary contact and phone</div>
        <div class="text-sm text-purple-700">• Email and business address</div>
        <div class="text-sm text-purple-700">• Account/reference numbers</div>
      </div>
    `,
    target: '.supplier-form, input[name*="company"], .supplier-details',
    position: 'right'
  },
  {
    title: '💳 Payment Terms & Lead Times',
    content: `
      <p>Set up payment terms and lead times for each supplier. This helps with cash flow planning and inventory ordering.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">Important terms:</div>
        <div class="text-sm text-amber-700">• Payment terms (30 days, COD, etc.)</div>
        <div class="text-sm text-amber-700">• Lead times for ordering</div>
        <div class="text-sm text-amber-700">• Minimum order quantities</div>
      </div>
    `,
    target: '.payment-terms, select[name*="terms"], .supplier-terms',
    position: 'left'
  },
  {
    title: '🎯 Ready for Professional Quotes!',
    content: `
      <p>🎉 Outstanding! You now have the complete SalesKik foundation: Categories, Products, Customers, and Suppliers. Time to create your first professional quote!</p>
      <div class="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-gray-800 mb-1">🚀 You can now:</div>
        <div class="text-sm text-gray-700">• Create beautiful PDF quotes</div>
        <div class="text-sm text-gray-700">• Use organized categories and products</div>
        <div class="text-sm text-green-700">• Send professional quotes to customers</div>
        <div class="text-sm text-blue-700">• Track orders and manage your business!</div>
      </div>
    `,
    position: 'center',
    action: {
      text: 'Quotes →',
      onClick: () => {
        sessionStorage.setItem('continue-tour', 'quotes');
        window.location.href = '/quotes/new';
      }
    }
  }
];

// Quote tour steps - Complete quote creation workflow
export const quoteTourSteps: TourStep[] = [
  {
    title: '📋 Welcome to Quote Creation!',
    content: `
      <p>🎉 Congratulations! You've reached the final step - creating professional quotes. This is where all your setup comes together.</p>
      <div class="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-gray-800 mb-1">✅ You've completed:</div>
        <div class="text-sm text-green-700">✅ Categories (organized structure)</div>
        <div class="text-sm text-green-700">✅ Products (catalog with pricing)</div>
        <div class="text-sm text-green-700">✅ Customers (client database)</div>
        <div class="text-sm text-green-700">✅ Suppliers (vendor management)</div>
        <div class="text-sm text-blue-700">🎯 Now: Professional quote creation!</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '🎨 Quote Builder Interface',
    content: `
      <p>This is the quote creation interface. Here you'll select customers, add products, and generate beautiful PDF quotes.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">Quote creation process:</div>
        <div class="text-sm text-blue-700">• Select customer</div>
        <div class="text-sm text-blue-700">• Add products from your catalog</div>
        <div class="text-sm text-blue-700">• Apply pricing tiers</div>
        <div class="text-sm text-blue-700">• Generate professional PDF</div>
      </div>
    `,
    position: 'center'
  },
  {
    title: '👤 Select Your Customer',
    content: `
      <p>Choose which customer this quote is for. The system will automatically use their pricing tier and contact information.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Customer benefits:</div>
        <div class="text-sm text-green-700">• Automatic pricing tier application</div>
        <div class="text-sm text-green-700">• Contact info on quote</div>
        <div class="text-sm text-green-700">• Professional personalization</div>
      </div>
    `,
    target: '.customer-selector, select[name*="customer"], .quote-customer',
    position: 'right'
  },
  {
    title: '🛍️ Add Products to Quote',
    content: `
      <p>Browse your categories and add products to the quote. The system will show the correct pricing tier for the selected customer.</p>
      <div class="bg-purple-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-purple-800 mb-1">Product selection:</div>
        <div class="text-sm text-purple-700">• Browse by categories you created</div>
        <div class="text-sm text-purple-700">• Search by product name or code</div>
        <div class="text-sm text-purple-700">• Automatic customer pricing</div>
      </div>
    `,
    target: '.product-selector, .add-products, .quote-products',
    position: 'left'
  },
  {
    title: '📄 Quote Details & Notes',
    content: `
      <p>Add project details, special instructions, and notes. This information appears on the professional PDF quote.</p>
      <div class="bg-amber-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-amber-800 mb-1">Professional touches:</div>
        <div class="text-sm text-amber-700">• Project name and description</div>
        <div class="text-sm text-amber-700">• Delivery address and timeline</div>
        <div class="text-sm text-amber-700">• Special instructions or notes</div>
      </div>
    `,
    target: '.quote-details, textarea[name*="description"], .project-info',
    position: 'right'
  },
  {
    title: '📊 Review Quote Totals',
    content: `
      <p>Review the quote totals, including subtotal, tax, and final amount. Everything is calculated automatically based on your pricing.</p>
      <div class="bg-blue-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-blue-800 mb-1">Auto-calculated:</div>
        <div class="text-sm text-blue-700">• Line totals per product</div>
        <div class="text-sm text-blue-700">• Subtotal and tax amounts</div>
        <div class="text-sm text-blue-700">• Final quote total</div>
      </div>
    `,
    target: '.quote-totals, .quote-summary, .totals-section',
    position: 'left'
  },
  {
    title: '📨 Generate & Send Quote',
    content: `
      <p>Generate the professional PDF quote and send it to your customer. The quote includes your branding and all the details.</p>
      <div class="bg-green-50 p-3 rounded-lg mt-3">
        <div class="text-sm font-medium text-green-800 mb-1">Quote features:</div>
        <div class="text-sm text-green-700">• Professional PDF with your branding</div>
        <div class="text-sm text-green-700">• Customer and project details</div>
        <div class="text-sm text-green-700">• Itemized products and pricing</div>
        <div class="text-sm text-green-700">• Email delivery option</div>
      </div>
    `,
    target: '.generate-quote, .send-quote, button[data-action="generate"]',
    position: 'top'
  },
  {
    title: '🎉 SalesKik Setup Complete!',
    content: `
      <p>🚀 Outstanding! You've successfully completed the entire SalesKik setup and created your first quote. You're now ready to run your business professionally!</p>
      <div class="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 p-4 rounded-lg mt-3">
        <div class="text-sm font-bold text-gray-800 mb-2">🏆 What you've accomplished:</div>
        <div class="text-sm text-green-700">✅ Organized business categories</div>
        <div class="text-sm text-blue-700">✅ Set up product catalog with pricing</div>
        <div class="text-sm text-purple-700">✅ Added customer database</div>
        <div class="text-sm text-orange-700">✅ Configured supplier management</div>
        <div class="text-sm text-red-700">✅ Created your first professional quote</div>
        <div class="text-sm font-medium text-gray-800 mt-2">🚀 SalesKik is now fully operational for your business!</div>
      </div>
    `,
    position: 'center'
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
    } else if (continueTour === 'products') {
      console.log('Simple Tour: Continuing on products page');
      sessionStorage.removeItem('continue-tour');
      setTimeout(() => startTour(productTourSteps), 1000);
    } else if (continueTour === 'customers') {
      console.log('Simple Tour: Continuing on customers page');
      sessionStorage.removeItem('continue-tour');
      setTimeout(() => startTour(customerTourSteps), 1000);
    } else if (continueTour === 'suppliers') {
      console.log('Simple Tour: Continuing on suppliers page');
      sessionStorage.removeItem('continue-tour');
      setTimeout(() => startTour(supplierTourSteps), 1000);
    } else if (continueTour === 'quotes') {
      console.log('Simple Tour: Continuing on quotes page');
      sessionStorage.removeItem('continue-tour');
      setTimeout(() => startTour(quoteTourSteps), 1000);
    } else if (!hasSeenTour) {
      // Auto-start for new users
      setTimeout(() => startTour(dashboardTourSteps), 3000);
    }
  }, [startTour]);
}