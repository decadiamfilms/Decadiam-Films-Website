import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, DocumentArrowDownIcon, PhotoIcon, 
  DocumentTextIcon, TrashIcon, PencilIcon,
  ClipboardDocumentListIcon, CogIcon,
  ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { useActionLogger } from '../../hooks/useActionLogger';
import TemplateService from '../../services/templateService';
import PricingEngine from '../../services/pricingEngine';

// Exact interfaces matching your specifications
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
  categoryId: string;
  isVisible: boolean;
  finalProducts: FinalProduct[];
  order: number;
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

export function ProductQuotingSystem() {
  // State management exactly as specified
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<{[key: string]: string}>({});
  const [availableFinalProducts, setAvailableFinalProducts] = useState<FinalProduct[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showSpecialsPrompt, setShowSpecialsPrompt] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { hasPermission, userRole } = usePermissions();
  const { logAction } = useActionLogger();

  useEffect(() => {
    fetchMainCategories();
  }, []);

  // Fetch main categories with exact structure from specs
  const fetchMainCategories = async () => {
    try {
      // Mock data matching your specifications exactly
      const mockCategories: MainCategory[] = [
        {
          id: '1',
          name: 'Shower Screens',
          color: '#3B82F6', // SalesKik blue
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [
            {
              id: 's1',
              name: 'Anti-Slip Coating',
              description: '$50 per sqm coating application',
              price: 50,
              unit: 'sqm',
              appliesTo: 'category',
              categoryId: '1',
              isAlwaysVisible: true
            },
            {
              id: 's2',
              name: 'Installation Labor',
              description: 'Professional installation service',
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
              name: 'Shower Screen Glass',
              categoryId: '1',
              isVisible: true,
              order: 1,
              finalProducts: [
                {
                  id: 'fp1',
                  name: 'Shower Screen Door',
                  sku: 'SSD-001',
                  description: '10mm clear toughened glass shower door',
                  pricingMethod: 'sqm',
                  unitType: 'mm',
                  basePrice: 420.00,
                  images: [
                    {
                      id: 'img1',
                      url: '/images/shower-door.jpg',
                      filename: 'shower-door.jpg',
                      isResized: true,
                      includeInQuote: true
                    }
                  ],
                  documents: [
                    {
                      id: 'doc1',
                      name: 'Installation Guide',
                      type: 'pdf',
                      url: '/docs/shower-door-install.pdf',
                      appliesTo: 'product'
                    }
                  ],
                  subcategoryIds: ['sub1'],
                  isActive: true,
                  versionHistory: [
                    {
                      id: 'v1',
                      price: 420.00,
                      effectiveDate: new Date(),
                      changedBy: 'Admin',
                      reason: 'Initial pricing'
                    }
                  ]
                },
                {
                  id: 'fp2',
                  name: 'Return Panel',
                  sku: 'RP-001',
                  description: '10mm clear toughened return panel',
                  pricingMethod: 'sqm',
                  unitType: 'mm',
                  basePrice: 380.00,
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
              name: 'Hardware Finish',
              categoryId: '1',
              isVisible: true,
              order: 2,
              finalProducts: [
                {
                  id: 'fp3',
                  name: 'Satin Hardware Set',
                  sku: 'SHS-001',
                  description: 'Complete satin finish hardware set',
                  pricingMethod: 'each',
                  unitType: 'mm',
                  basePrice: 85.00,
                  images: [],
                  documents: [],
                  subcategoryIds: ['sub2'],
                  isActive: true,
                  versionHistory: []
                },
                {
                  id: 'fp4',
                  name: 'Black Hardware Set',
                  sku: 'BHS-001',
                  description: 'Complete black finish hardware set',
                  pricingMethod: 'each',
                  unitType: 'mm',
                  basePrice: 95.00,
                  images: [],
                  documents: [],
                  subcategoryIds: ['sub2'],
                  isActive: true,
                  versionHistory: []
                }
              ]
            }
          ]
        },
        {
          id: '2',
          name: 'Pool Fencing',
          color: '#FB923C', // SalesKik orange
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [
            {
              id: 's3',
              name: 'Pool Compliance Certification',
              description: 'Council compliance documentation',
              price: 150,
              unit: 'job',
              appliesTo: 'category',
              categoryId: '2',
              isAlwaysVisible: true
            }
          ],
          subcategories: [
            {
              id: 'sub3',
              name: 'Frame Type',
              categoryId: '2',
              isVisible: true,
              order: 1,
              finalProducts: [
                {
                  id: 'fp5',
                  name: 'Frameless Gate Panel',
                  sku: 'FGP-001',
                  description: '12mm toughened frameless gate panel',
                  pricingMethod: 'sqm',
                  unitType: 'mm',
                  basePrice: 520.00,
                  images: [],
                  documents: [],
                  subcategoryIds: ['sub3'],
                  isActive: true,
                  versionHistory: []
                }
              ]
            }
          ]
        },
        {
          id: '3',
          name: 'Balustrades',
          color: '#10B981', // Additional category
          isActive: true,
          permissions: ['view', 'create', 'edit'],
          specialItems: [],
          subcategories: []
        }
      ];
      
      setMainCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main category selection with color highlighting (from specs)
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategories({});
    setAvailableFinalProducts([]);
    
    // Log action as specified
    await logAction('main_category_selected', {
      categoryId,
      categoryName: mainCategories.find(c => c.id === categoryId)?.name,
      previousCategory: selectedCategory,
      userId: userRole,
      timestamp: new Date().toISOString()
    });
    
    // Load subcategories for selected category
    loadSubcategoriesForCategory(categoryId);
  };

  // Dynamic subcategory loading (from specs)
  const loadSubcategoriesForCategory = (categoryId: string) => {
    const category = mainCategories.find(cat => cat.id === categoryId);
    if (category) {
      // Filter visible subcategories and sort by order
      const visibleSubcategories = category.subcategories
        .filter(sub => sub.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      console.log(`Loaded ${visibleSubcategories.length} subcategories for ${category.name}`);
    }
  };

  // Handle subcategory selection (from specs)
  const handleSubcategorySelect = async (subcategoryId: string, value: string) => {
    const newSelections = {
      ...selectedSubcategories,
      [subcategoryId]: value
    };
    setSelectedSubcategories(newSelections);
    
    await logAction('subcategory_selected', {
      subcategoryId,
      value,
      allSelections: newSelections,
      userId: userRole,
      timestamp: new Date().toISOString()
    });
    
    updateAvailableFinalProducts(selectedCategory!, newSelections);
  };

  // Update final products based on selections (from specs)
  const updateAvailableFinalProducts = (categoryId: string, subcategorySelections: {[key: string]: string}) => {
    const category = mainCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    let finalProducts: FinalProduct[] = [];
    
    // Get final products from selected subcategories
    Object.entries(subcategorySelections).forEach(([subcategoryId, selection]) => {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory && selection) {
        // In real implementation, filter products based on selection value
        finalProducts = [...finalProducts, ...subcategory.finalProducts.filter(fp => fp.isActive)];
      }
    });

    setAvailableFinalProducts(finalProducts);
  };

  // Add final product to quote (from specs)
  const addFinalProductToQuote = async (finalProduct: FinalProduct) => {
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
    
    // Log action with complete details as specified
    await logAction('final_product_added_to_quote', {
      productId: finalProduct.id,
      productName: finalProduct.name,
      sku: finalProduct.sku,
      pricingMethod: finalProduct.pricingMethod,
      basePrice: finalProduct.basePrice,
      quoteItemId: newQuoteItem.id,
      userId: userRole,
      timestamp: new Date().toISOString()
    });
  };

  // Advanced pricing calculation using PricingEngine (from specs)
  const calculatePrice = (product: FinalProduct, quantity: number, width?: number, height?: number) => {
    const calculation = PricingEngine.calculatePrice(
      product.basePrice,
      quantity,
      product.pricingMethod,
      width,
      height,
      product.boxConversion
    );
    
    // Log calculation for transparency
    console.log(`Pricing calculation for ${product.name}:`, calculation.breakdown);
    
    return calculation.totalPrice;
  };

  // Product duplication with minor edits (from specs)
  const duplicateQuoteItem = async (itemId: string) => {
    const originalItem = quoteItems.find(qi => qi.id === itemId);
    if (originalItem) {
      const duplicatedItem: QuoteItem = {
        ...originalItem,
        id: Date.now().toString(),
        isDuplicated: true,
        originalItemId: itemId,
        sku: originalItem.sku + '-COPY' // Allow for SKU editing as specified
      };
      
      setQuoteItems([...quoteItems, duplicatedItem]);
      
      // Log duplication action as specified
      await logAction('product_duplicated_in_quote', {
        originalItemId: itemId,
        newItemId: duplicatedItem.id,
        originalSku: originalItem.sku,
        newSku: duplicatedItem.sku,
        productName: originalItem.productName,
        userId: userRole,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Specials prompt before quote completion (from specs)
  const handleCompleteQuote = () => {
    if (quoteItems.length > 0) {
      setShowSpecialsPrompt(true);
    }
  };

  const totalQuoteValue = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SalesKik Product & Quoting System</h1>
            <p className="text-gray-600">Professional quoting with dynamic product selection</p>
          </div>
          <div className="flex gap-3">
            {hasPermission('setup') && (
              <>
                <button 
                  onClick={() => TemplateService.downloadTemplate('bulk')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Bulk Template
                </button>
                <button 
                  onClick={() => TemplateService.downloadTemplate('single')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Single Category
                </button>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Upload Data
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 1. MAIN CATEGORY BUTTONS - Row across top as specified */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Product Category</h2>
          <div className="flex flex-wrap gap-3">
            {mainCategories.filter(cat => cat.isActive).map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg scale-105 ring-4 ring-opacity-30'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  borderColor: selectedCategory === category.id ? category.color : undefined,
                  ringColor: selectedCategory === category.id ? category.color + '30' : undefined
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. DYNAMIC SUBCATEGORY DROPDOWNS - As specified */}
        {selectedCategory && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mainCategories
                .find(cat => cat.id === selectedCategory)
                ?.subcategories.filter(sub => sub.isVisible)
                .sort((a, b) => a.sortOrder - b.sortOrder)
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
                    {/* Dynamic options based on subcategory - would be populated from data */}
                    <option value="option1">Standard</option>
                    <option value="option2">Premium</option>
                    <option value="option3">Custom</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3. AVAILABLE FINAL PRODUCTS - As specified */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Products</h3>
            {availableFinalProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Select a category and options to see available products
              </div>
            ) : (
              <div className="space-y-4">
                {availableFinalProducts.map((finalProduct) => (
                  <ProductCard
                    key={finalProduct.id}
                    product={finalProduct}
                    onAddToQuote={() => addFinalProductToQuote(finalProduct)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 4. QUOTE ENTRY AREA - As specified */}
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
                  <QuoteItemCard
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

      {/* 5. SPECIALS PROMPT MODAL - As specified */}
      {showSpecialsPrompt && selectedCategory && (
        <SpecialsPromptModal 
          category={mainCategories.find(c => c.id === selectedCategory)!}
          onClose={() => setShowSpecialsPrompt(false)}
          onAddSpecials={(specials) => {
            // Add specials to quote items
            setShowSpecialsPrompt(false);
            console.log('Added specials:', specials);
          }}
          onSkip={() => {
            setShowSpecialsPrompt(false);
            console.log('Skipped specials');
          }}
        />
      )}

      {/* 6. UPLOAD MODAL - As specified */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={(data) => {
            // Process uploaded data
            setMainCategories([...mainCategories, ...data.categories]);
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

// Product Card Component with image/document support (from specs)
function ProductCard({ product, onAddToQuote }: {
  product: FinalProduct;
  onAddToQuote: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* Product Image (auto-resized as specified) */}
            {product.images.length > 0 && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={product.images[0].url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600">
                  ${product.basePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  per {product.pricingMethod}
                  {product.pricingMethod === 'box' && product.boxConversion && (
                    <span className="ml-1">({product.boxConversion} sqm/box)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Document and Image indicators (from specs) */}
          <div className="flex items-center gap-2 mt-3">
            {product.images.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <PhotoIcon className="w-3 h-3 mr-1" />
                {product.images.length} image{product.images.length !== 1 ? 's' : ''}
              </span>
            )}
            {product.documents.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <DocumentTextIcon className="w-3 h-3 mr-1" />
                {product.documents.length} doc{product.documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onAddToQuote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add to Quote
        </button>
      </div>
    </div>
  );
}

// Quote Item Card with duplication support (from specs)
function QuoteItemCard({ item, onDuplicate, onUpdate, onRemove }: {
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
    
    // Log the update with version history as specified
    await logAction('quote_item_updated', {
      itemId: item.id,
      changes: {
        sku: { from: item.sku, to: updatedItem.sku },
        quantity: { from: item.quantity, to: updatedItem.quantity },
        unitPrice: { from: item.unitPrice, to: updatedItem.unitPrice },
        totalPrice: { from: item.totalPrice, to: updatedItem.totalPrice }
      },
      userId: 'current-user', // Would get from auth context
      timestamp: new Date().toISOString()
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
          <div className="text-sm text-gray-500">Pricing: {item.pricingMethod}</div>
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
          {/* SKU Edit (especially for duplicated items as specified) */}
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
          
          {/* Size inputs for sqm pricing (from specs) */}
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
          
          {/* Show included images (from specs) */}
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

// Specials Prompt Modal (from specs)
function SpecialsPromptModal({ category, onClose, onAddSpecials, onSkip }: {
  category: MainCategory;
  onClose: () => void;
  onAddSpecials: (specials: SelectedSpecialItem[]) => void;
  onSkip: () => void;
}) {
  const [selectedSpecials, setSelectedSpecials] = useState<SelectedSpecialItem[]>([]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Special Items?</h2>
                <p className="text-gray-600">
                  Would you like to add any special items or extras to this {category.name} quote?
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {category.specialItems.map((special) => (
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

// Upload Modal Component (from specs)
function UploadModal({ onClose, onUploadComplete }: {
  onClose: () => void;
  onUploadComplete: (data: any) => void;
}) {
  const [uploadType, setUploadType] = useState<'bulk' | 'single'>('bulk');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Process upload based on type
      if (uploadType === 'bulk') {
        const result = await TemplateService.processBulkUpload(file);
        
        if (result.errors.length > 0) {
          alert(`Upload completed with ${result.errors.length} errors:\n${result.errors.join('\n')}`);
        } else {
          alert(`Successfully uploaded ${result.categories.length} categories and ${result.products.length} products!`);
        }
        
        onUploadComplete(result);
      } else {
        const result = await TemplateService.processSingleCategoryUpload(file);
        
        if (result.errors.length > 0) {
          alert(`Upload completed with ${result.errors.length} errors:\n${result.errors.join('\n')}`);
        } else {
          alert(`Successfully uploaded category: ${result.category.name}`);
        }
        
        onUploadComplete({ categories: [result.category] });
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full border border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Product Data</h2>
            
            {/* Upload Type Selection */}
            <div className="mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setUploadType('bulk')}
                  className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                    uploadType === 'bulk'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Bulk Upload</h3>
                  <p className="text-sm text-gray-600">Upload multiple categories and products at once</p>
                </button>
                <button
                  onClick={() => setUploadType('single')}
                  className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                    uploadType === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Single Category</h3>
                  <p className="text-sm text-gray-600">Detailed setup for one category at a time</p>
                </button>
              </div>
            </div>

            {/* Template Download */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Download Template First</h4>
              <p className="text-sm text-gray-600 mb-3">
                Download the {uploadType} template, fill it with your data, then upload it here.
              </p>
              <button
                onClick={() => TemplateService.downloadTemplate(uploadType)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Download {uploadType === 'bulk' ? 'Bulk' : 'Single Category'} Template
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Your Completed Template
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className={`cursor-pointer ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isUploading ? 'Processing...' : 'Choose CSV File'}
                  </h3>
                  <p className="text-gray-600">
                    {isUploading 
                      ? `Upload progress: ${uploadProgress}%`
                      : 'Upload your completed product template'
                    }
                  </p>
                </label>
              </div>
            </div>

            {/* Template Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">
                {uploadType === 'bulk' ? 'Bulk Upload' : 'Single Category'} Template Includes:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {uploadType === 'bulk' ? (
                  <>
                    <li>• Multiple main categories with colors</li>
                    <li>• Subcategories with visibility and order</li>
                    <li>• Final products with complete specifications</li>
                    <li>• Pricing methods (each/sqm/box) and conversions</li>
                    <li>• Image and document links</li>
                    <li>• Special items and category linking</li>
                  </>
                ) : (
                  <>
                    <li>• Detailed single category configuration</li>
                    <li>• Complete subcategory structure</li>
                    <li>• Product specifications with dimensions</li>
                    <li>• Advanced pricing and packaging options</li>
                    <li>• Image management with display preferences</li>
                    <li>• Document attachments with linking rules</li>
                    <li>• Special items and pricing history</li>
                  </>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
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

export default ProductQuotingSystem;