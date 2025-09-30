import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, DocumentArrowDownIcon, PhotoIcon, 
  DocumentTextIcon, CogIcon, TrashIcon, PencilIcon,
  ClipboardDocumentListIcon, ArrowUpTrayIcon,
  ExclamationTriangleIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { useActionLogger } from '../../hooks/useActionLogger';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import DataIntegrationService from '../../services/dataIntegration';
import { useNotifications } from '../ui/Notification';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

interface MainCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  subcategories: Subcategory[];
  specialItems: SpecialItem[];
  permissions: string[];
}

interface Subcategory {
  id: string;
  name: string;
  finalProducts: FinalProduct[];
  categoryId: string;
  isVisible: boolean;
}

interface FinalProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  pricingMethod: 'each' | 'sqm' | 'box';
  unitType: 'mm' | 'cm' | 'm';
  basePrice: number;
  boxConversion?: number; // e.g., 1 box = 1.44 sqm
  images: ProductImage[];
  documents: ProductDocument[];
  subcategoryIds: string[];
  isActive: boolean;
  versionHistory: PriceVersion[];
}

interface ProductImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  isResized: boolean;
  includeInQuote: boolean;
}

interface ProductDocument {
  id: string;
  name: string;
  type: 'pdf' | 'cad' | 'spec' | 'warranty';
  url: string;
  appliesTo: 'product' | 'category' | 'subcategory';
}

interface PriceVersion {
  id: string;
  price: number;
  effectiveDate: Date;
  changedBy: string;
  reason: string;
}

interface SpecialItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  appliesTo: 'category' | 'product';
  categoryId?: string;
  isAlwaysVisible: boolean;
}

interface QuoteItem {
  id: string;
  finalProductId: string;
  productName: string;
  sku: string;
  quantity: number;
  width?: number;
  height?: number;
  area?: number;
  dimensions: string;
  unitPrice: number;
  totalPrice: number;
  pricingMethod: 'each' | 'sqm' | 'box';
  specialItems: SelectedSpecialItem[];
  images: ProductImage[];
  isDuplicated: boolean;
  originalItemId?: string;
}

interface SelectedSpecialItem {
  specialItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export function EnhancedQuotingInterface() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<{[key: string]: string}>({});
  const [availableFinalProducts, setAvailableFinalProducts] = useState<FinalProduct[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showSpecialsPrompt, setShowSpecialsPrompt] = useState(false);
  const [showUploadTemplates, setShowUploadTemplates] = useState(false);
  const { hasPermission, userRole } = usePermissions();
  const { logAction } = useActionLogger();
  const { showSuccess, showWarning, showError } = useNotifications();

  useEffect(() => {
    fetchMainCategories();
  }, []);

  const fetchMainCategories = async () => {
    try {
      // Mock data for glass industry
      const mockCategories: MainCategory[] = [
        {
          id: '1',
          name: 'Pool Fencing',
          color: '#3B82F6',
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [
            {
              id: 's1',
              name: 'Anti-Slip Coating',
              description: 'Per sqm coating application',
              price: 50,
              unit: 'sqm',
              appliesTo: 'category',
              categoryId: '1',
              isAlwaysVisible: true
            },
            {
              id: 's2',
              name: 'Installation Service',
              description: 'Professional installation',
              price: 200,
              unit: 'job',
              appliesTo: 'category',
              categoryId: '1',
              isAlwaysVisible: false
            }
          ],
          subcategories: [
            {
              id: 'sub1',
              name: 'Frame Type',
              categoryId: '1',
              isVisible: true,
              finalProducts: [
                {
                  id: 'fp1',
                  name: '10mm Clear Toughened Door Panel',
                  sku: 'DD700',
                  description: 'Premium quality toughened glass door panel',
                  pricingMethod: 'sqm',
                  unitType: 'mm',
                  basePrice: 520.00,
                  images: [
                    {
                      id: 'img1',
                      url: '/images/dd700.jpg',
                      filename: 'dd700.jpg',
                      size: 2048000,
                      isResized: true,
                      includeInQuote: true
                    }
                  ],
                  documents: [
                    {
                      id: 'doc1',
                      name: 'Installation Guide',
                      type: 'pdf',
                      url: '/docs/dd700-install.pdf',
                      appliesTo: 'product'
                    }
                  ],
                  subcategoryIds: ['sub1'],
                  isActive: true,
                  versionHistory: [
                    {
                      id: 'v1',
                      price: 520.00,
                      effectiveDate: new Date(),
                      changedBy: 'Admin',
                      reason: 'Initial price'
                    }
                  ]
                },
                {
                  id: 'fp2',
                  name: '10mm Clear Fixed Panel',
                  sku: 'DF500',
                  description: 'Standard fixed glass panel',
                  pricingMethod: 'sqm',
                  unitType: 'mm',
                  basePrice: 413.40,
                  images: [],
                  documents: [],
                  subcategoryIds: ['sub1'],
                  isActive: true,
                  versionHistory: []
                }
              ]
            },
            {
              id: 'sub2',
              name: 'Glass Type',
              categoryId: '1',
              isVisible: true,
              finalProducts: []
            }
          ]
        },
        {
          id: '2',
          name: 'Shower Screens',
          color: '#10B981',
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [],
          subcategories: []
        },
        {
          id: '3',
          name: 'Hardware',
          color: '#F59E0B',
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [],
          subcategories: []
        }
      ];
      setMainCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Handle main category selection with color highlighting
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategories({});
    
    // Log action
    await logAction('category_selected', {
      categoryId,
      previousCategory: selectedCategory
    });
    
    // Load subcategories
    loadSubcategoriesForCategory(categoryId);
  };

  // Load subcategories based on quantity and visibility rules
  const loadSubcategoriesForCategory = (categoryId: string) => {
    const category = mainCategories.find(cat => cat.id === categoryId);
    if (category) {
      // Filter visible subcategories
      const visibleSubcategories = category.subcategories.filter(sub => sub.isVisible);
      // The number of dropdowns depends on visible subcategories
      setSelectedSubcategories({});
      updateAvailableFinalProducts(categoryId, {});
    }
  };

  // Handle subcategory selection
  const handleSubcategorySelect = async (subcategoryId: string, value: string) => {
    const newSelections = {
      ...selectedSubcategories,
      [subcategoryId]: value
    };
    setSelectedSubcategories(newSelections);
    
    await logAction('subcategory_selected', {
      subcategoryId,
      value,
      allSelections: newSelections
    });
    
    updateAvailableFinalProducts(selectedCategory!, newSelections);
  };

  // Update final products based on selections
  const updateAvailableFinalProducts = (categoryId: string, subcategorySelections: {[key: string]: string}) => {
    const category = mainCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    let finalProducts: FinalProduct[] = [];
    
    // Get final products from selected subcategories
    Object.entries(subcategorySelections).forEach(([subcategoryId, selection]) => {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory && selection) {
        finalProducts = [...finalProducts, ...subcategory.finalProducts.filter(fp => fp.isActive)];
      }
    });

    setAvailableFinalProducts(finalProducts);
  };

  // Add final product to quote with stock checking
  const addFinalProductToQuote = async (finalProduct: FinalProduct) => {
    // Check stock availability first
    const stockResponse = await fetch(`/api/inventory/product/${finalProduct.id}/stock`);
    let stockLevel = 999; // Default for demo
    let stockWarning = '';
    
    if (stockResponse.ok) {
      const { stockLevel: currentStock } = await stockResponse.json();
      stockLevel = currentStock;
      
      if (currentStock === 0) {
        stockWarning = 'Out of stock - will need to order';
      } else if (currentStock < 5) {
        stockWarning = `Low stock - only ${currentStock} available`;
      }
    }

    const newQuoteItem: QuoteItem = {
      id: Date.now().toString(),
      finalProductId: finalProduct.id,
      productName: finalProduct.name,
      sku: finalProduct.sku,
      quantity: 1,
      width: finalProduct.pricingMethod === 'sqm' ? 1000 : undefined,
      height: finalProduct.pricingMethod === 'sqm' ? 2000 : undefined,
      area: finalProduct.pricingMethod === 'sqm' ? 2 : undefined,
      dimensions: finalProduct.pricingMethod === 'sqm' ? '1000mm × 2000mm' : '1 unit',
      unitPrice: finalProduct.basePrice,
      totalPrice: calculatePrice(finalProduct, 1, 1000, 2000),
      pricingMethod: finalProduct.pricingMethod,
      specialItems: [],
      images: finalProduct.images.filter(img => img.includeInQuote),
      isDuplicated: false
    };
    
    setQuoteItems([...quoteItems, newQuoteItem]);
    
    // Show stock warning if needed
    if (stockWarning) {
      showWarning('Stock Warning', stockWarning);
    } else {
      showSuccess('Product Added', `${finalProduct.name} added to quote`);
    }
    
    await logAction('product_added_to_quote', {
      productId: finalProduct.id,
      productName: finalProduct.name,
      quoteItemId: newQuoteItem.id,
      stockLevel,
      stockWarning
    });
  };

  // Calculate price based on method (each/sqm/box)
  const calculatePrice = (product: FinalProduct, quantity: number, width?: number, height?: number) => {
    switch (product.pricingMethod) {
      case 'each':
        return product.basePrice * quantity;
      case 'sqm':
        if (width && height) {
          const area = (width * height) / 1000000; // Convert mm² to m²
          return product.basePrice * area;
        }
        return product.basePrice * quantity;
      case 'box':
        const boxPrice = product.basePrice * quantity;
        // If box has sqm conversion, could show equivalent sqm
        return boxPrice;
      default:
        return product.basePrice * quantity;
    }
  };

  // Duplicate quote item with minor edits capability
  const duplicateQuoteItem = async (itemId: string) => {
    const originalItem = quoteItems.find(qi => qi.id === itemId);
    if (originalItem) {
      const duplicatedItem: QuoteItem = {
        ...originalItem,
        id: Date.now().toString(),
        isDuplicated: true,
        originalItemId: itemId,
        sku: originalItem.sku + '-COPY' // Allow for SKU editing
      };
      
      setQuoteItems([...quoteItems, duplicatedItem]);
      
      await logAction('item_duplicated', {
        originalItemId: itemId,
        newItemId: duplicatedItem.id,
        productName: originalItem.productName
      });
    }
  };

  // Prompt for specials before completing quote
  const handleCompleteQuote = () => {
    if (quoteItems.length > 0) {
      setShowSpecialsPrompt(true);
    }
  };

  // Calculate total quote value
  const totalQuoteValue = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Universal Navigation */}
      <UniversalNavigation 
        currentPage="quotes" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Universal Header */}
      <UniversalHeader
        title="Quotes"
        subtitle="Create professional quotes with dynamic product selection"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <>
            {hasPermission('setup') && (
              <button
                onClick={() => setShowUploadTemplates(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Upload Templates
              </button>
            )}
            <button
              onClick={() => setShowUploadTemplates(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Download Templates
            </button>
          </>
        }
      />

      <div className="p-6">
        {/* Main Category Buttons with Color Highlighting */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Main Product Category</h2>
          <div className="flex flex-wrap gap-3">
            {mainCategories.filter(cat => cat.isActive).map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg scale-105 ring-4 ring-opacity-50'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  borderColor: selectedCategory === category.id ? category.color : undefined,
                  ringColor: selectedCategory === category.id ? category.color + '50' : undefined
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Subcategory Dropdowns */}
        {selectedCategory && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Product Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mainCategories
                .find(cat => cat.id === selectedCategory)
                ?.subcategories.filter(sub => sub.isVisible)
                .map((subcategory) => (
                <div key={subcategory.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {subcategory.name}
                  </label>
                  <select
                    value={selectedSubcategories[subcategory.id] || ''}
                    onChange={(e) => handleSubcategorySelect(subcategory.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select {subcategory.name}</option>
                    {/* Dynamic options based on subcategory */}
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Final Products */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Final Products</h3>
            {availableFinalProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Select a category and options to see available final products
              </div>
            ) : (
              <div className="space-y-4">
                {availableFinalProducts.map((finalProduct) => (
                  <FinalProductCard
                    key={finalProduct.id}
                    finalProduct={finalProduct}
                    onAddToQuote={() => addFinalProductToQuote(finalProduct)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quote Items with Flexible Entry */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quote Items</h3>
              <div className="text-xl font-bold text-green-600">
                Total: ${totalQuoteValue.toFixed(2)}
              </div>
            </div>
            
            {quoteItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added to quote yet
              </div>
            ) : (
              <div className="space-y-4">
                {quoteItems.map((item) => (
                  <FlexibleQuoteItemCard
                    key={item.id}
                    item={item}
                    onDuplicate={() => duplicateQuoteItem(item.id)}
                    onUpdate={(updatedItem) => {
                      setQuoteItems(quoteItems.map(qi => 
                        qi.id === item.id ? updatedItem : qi
                      ));
                    }}
                    onRemove={() => {
                      setQuoteItems(quoteItems.filter(qi => qi.id !== item.id));
                    }}
                  />
                ))}
              </div>
            )}

            {/* Quote Actions */}
            {quoteItems.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Save Draft
                </button>
                <button 
                  onClick={handleCompleteQuote}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specials Prompt Modal */}
      {showSpecialsPrompt && (
        <SpecialsPromptModal 
          categoryId={selectedCategory!}
          onClose={() => setShowSpecialsPrompt(false)}
          onAddSpecials={(specials) => {
            // Add specials to quote
            setShowSpecialsPrompt(false);
            // Proceed to generate quote
          }}
          onSkip={() => {
            setShowSpecialsPrompt(false);
            // Generate quote without specials
          }}
        />
      )}

      {/* Upload Templates Modal */}
      {showUploadTemplates && (
        <UploadTemplatesModal onClose={() => setShowUploadTemplates(false)} />
      )}
    </div>
  );
}

// PART 2: FINAL PRODUCT CARD WITH IMAGE/DOCUMENT SUPPORT
function FinalProductCard({ finalProduct, onAddToQuote }: {
  finalProduct: FinalProduct;
  onAddToQuote: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* Product Image Preview */}
            {finalProduct.images.length > 0 && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={finalProduct.images[0].url} 
                  alt={finalProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{finalProduct.name}</h4>
              <p className="text-sm text-gray-600">{finalProduct.description}</p>
              <p className="text-sm text-gray-500">SKU: {finalProduct.sku}</p>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600">
                  ${finalProduct.basePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  per {finalProduct.pricingMethod}
                  {finalProduct.pricingMethod === 'box' && finalProduct.boxConversion && (
                    <span className="ml-1">({finalProduct.boxConversion} sqm/box)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Documents and Images Icons */}
          <div className="flex items-center gap-2 mt-3">
            {finalProduct.images.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <PhotoIcon className="w-3 h-3 mr-1" />
                {finalProduct.images.length} image{finalProduct.images.length !== 1 ? 's' : ''}
              </span>
            )}
            {finalProduct.documents.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <DocumentTextIcon className="w-3 h-3 mr-1" />
                {finalProduct.documents.length} doc{finalProduct.documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onAddToQuote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-1 inline" />
          Add to Quote
        </button>
      </div>
    </div>
  );
}

// PART 3: FLEXIBLE QUOTE ITEM CARD WITH PRICING METHODS
function FlexibleQuoteItemCard({ item, onDuplicate, onUpdate, onRemove }: {
  item: QuoteItem;
  onDuplicate: () => void;
  onUpdate: (item: QuoteItem) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(item);
  const { logAction } = useActionLogger();

  const calculateTotal = () => {
    switch (editValues.pricingMethod) {
      case 'each':
        return editValues.unitPrice * editValues.quantity;
      case 'sqm':
        if (editValues.width && editValues.height) {
          const area = (editValues.width * editValues.height) / 1000000;
          return editValues.unitPrice * area;
        }
        return editValues.unitPrice * editValues.quantity;
      case 'box':
        return editValues.unitPrice * editValues.quantity;
      default:
        return editValues.unitPrice * editValues.quantity;
    }
  };

  const handleSave = async () => {
    const updatedItem = {
      ...editValues,
      totalPrice: calculateTotal(),
      dimensions: editValues.width && editValues.height 
        ? `${editValues.width}mm × ${editValues.height}mm`
        : `${editValues.quantity} ${editValues.pricingMethod}`
    };
    onUpdate(updatedItem);
    setIsEditing(false);
    
    // Log the update
    await logAction('quote_item_updated', {
      itemId: item.id,
      changes: updatedItem,
      previousValues: item
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{item.productName}</h4>
            {item.isDuplicated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Duplicated
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
          <div className="text-sm text-gray-500">Method: {item.pricingMethod}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Edit item"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Duplicate item"
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Remove item"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* SKU Edit (especially for duplicated items) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">SKU Code</label>
            <input
              type="text"
              value={editValues.sku}
              onChange={(e) => setEditValues({...editValues, sku: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                value={editValues.quantity}
                onChange={(e) => setEditValues({...editValues, quantity: Number(e.target.value)})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={editValues.unitPrice}
                onChange={(e) => setEditValues({...editValues, unitPrice: Number(e.target.value)})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          
          {/* Size inputs for sqm pricing */}
          {editValues.pricingMethod === 'sqm' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={editValues.width || ''}
                  onChange={(e) => setEditValues({...editValues, width: Number(e.target.value)})}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={editValues.height || ''}
                  onChange={(e) => setEditValues({...editValues, height: Number(e.target.value)})}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditValues(item);
                setIsEditing(false);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">{item.quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dimensions:</span>
            <span className="font-medium">{item.dimensions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unit Price:</span>
            <span className="font-medium">${item.unitPrice.toFixed(2)} per {item.pricingMethod}</span>
          </div>
          
          {/* Show included images */}
          {item.images.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Images:</span>
              <span className="font-medium">{item.images.length} included in quote</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-semibold text-green-600 pt-2 border-t">
            <span>Total:</span>
            <span>${item.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// PART 4: SPECIALS PROMPT MODAL
function SpecialsPromptModal({ categoryId, onClose, onAddSpecials, onSkip }: {
  categoryId: string;
  onClose: () => void;
  onAddSpecials: (specials: SelectedSpecialItem[]) => void;
  onSkip: () => void;
}) {
  const [availableSpecials, setAvailableSpecials] = useState<SpecialItem[]>([]);
  const [selectedSpecials, setSelectedSpecials] = useState<SelectedSpecialItem[]>([]);

  useEffect(() => {
    fetchSpecialsForCategory(categoryId);
  }, [categoryId]);

  const fetchSpecialsForCategory = async (catId: string) => {
    // Fetch specials that apply to this category
    const specials: SpecialItem[] = [
      {
        id: '1',
        name: 'Anti-Slip Coating',
        description: 'Per sqm coating application',
        price: 50,
        unit: 'sqm',
        appliesTo: 'category',
        categoryId: catId,
        isAlwaysVisible: true
      },
      {
        id: '2',
        name: 'Installation Service',
        description: 'Professional installation',
        price: 200,
        unit: 'job',
        appliesTo: 'category',
        categoryId: catId,
        isAlwaysVisible: false
      },
      {
        id: '3',
        name: 'Packaging & Delivery',
        description: 'Special packaging and delivery',
        price: 75,
        unit: 'order',
        appliesTo: 'category',
        categoryId: catId,
        isAlwaysVisible: true
      }
    ];
    setAvailableSpecials(specials);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Special Items?</h2>
                <p className="text-gray-600">Would you like to add any special items or extras to this quote?</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {availableSpecials.map((special) => (
                <div key={special.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{special.name}</h3>
                      <p className="text-sm text-gray-600">{special.description}</p>
                      <p className="text-lg font-semibold text-green-600 mt-2">
                        ${special.price} per {special.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newSpecial: SelectedSpecialItem = {
                          specialItemId: special.id,
                          name: special.name,
                          quantity: 1,
                          price: special.price
                        };
                        setSelectedSpecials([...selectedSpecials, newSpecial]);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onSkip}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Skip Specials
              </button>
              <button
                onClick={() => onAddSpecials(selectedSpecials)}
                disabled={selectedSpecials.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
              >
                Add Selected ({selectedSpecials.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PART 5: UPLOAD TEMPLATES MODAL
function UploadTemplatesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full border border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Upload Templates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bulk Upload Template */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bulk Upload Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload multiple main categories, subcategories, and final products at once. 
                  Perfect for initial system setup or major catalog updates.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Template includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Main categories with color settings</li>
                    <li>• Subcategories and visibility rules</li>
                    <li>• Final products with SKU, pricing method</li>
                    <li>• Dimensions, units, and conversions</li>
                    <li>• Image and document upload links</li>
                    <li>• Special items and category linking</li>
                  </ul>
                </div>
                
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2 inline" />
                  Download Bulk Template
                </button>
              </div>

              {/* Single Category Template */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Single Category Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Detailed setup for one main category at a time. Ideal for incremental 
                  updates or adding new product lines.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Template includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Detailed subcategory configuration</li>
                    <li>• Final product specifications</li>
                    <li>• Pricing methods (each/sqm/box)</li>
                    <li>• Unit types and conversions</li>
                    <li>• Image optimization settings</li>
                    <li>• Document attachment rules</li>
                  </ul>
                </div>
                
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2 inline" />
                  Download Single Template
                </button>
              </div>
            </div>

            {/* Template Instructions */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Template Instructions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <h5 className="font-medium mb-2">Image Handling:</h5>
                  <ul className="space-y-1">
                    <li>• Images will be auto-resized for consistency</li>
                    <li>• Supported formats: JPG, PNG, WebP</li>
                    <li>• Maximum file size: 5MB per image</li>
                    <li>• Include in quote: Yes/No option</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Document Attachments:</h5>
                  <ul className="space-y-1">
                    <li>• PDFs, CAD files, spec sheets supported</li>
                    <li>• Can apply to product or category level</li>
                    <li>• Warranties can be shared across products</li>
                    <li>• Maximum file size: 10MB per document</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedQuotingInterface;