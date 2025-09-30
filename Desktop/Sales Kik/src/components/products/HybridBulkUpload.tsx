import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  level: number;
  sortOrder: number;
}

interface ParsedProduct {
  code: string;
  name: string;
  size: string;
  weight: number;
  cost: number;
  priceT1: number;
  priceT2: number;
  priceT3: number;
  stock: number;
  detectedCategory?: Category;
  detectedSubcategories?: Subcategory[];
  needsManualAssignment: boolean;
}

interface HybridBulkUploadProps {
  categories: Category[];
  onProductsUploaded: (products: any[]) => void;
  onClose: () => void;
}

export default function HybridBulkUpload({ categories, onProductsUploaded, onClose }: HybridBulkUploadProps) {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'assign'>('upload');
  const [assigningIndex, setAssigningIndex] = useState(0);

  // Auto-detect category based on product name/code
  const autoDetectCategory = (productName: string, productCode: string): { category?: Category; confidence: number } => {
    const searchText = `${productName} ${productCode}`.toLowerCase();
    
    // Simple keyword matching
    const keywords: { [key: string]: string[] } = {
      'glass': ['glass', 'panel', 'glazing', 'transparent'],
      'shower': ['shower', 'screen', 'bathroom', 'door'],
      'pool': ['pool', 'fencing', 'fence', 'barrier'],
      'hardware': ['hardware', 'screw', 'bolt', 'bracket', 'hinge'],
      'aluminum': ['aluminum', 'aluminium', 'metal', 'frame'],
    };
    
    let bestMatch: Category | undefined;
    let highestScore = 0;
    
    categories.forEach(category => {
      let score = 0;
      const categoryName = category.name.toLowerCase();
      
      // Direct name match
      if (searchText.includes(categoryName)) {
        score += 100;
      }
      
      // Keyword matching
      Object.entries(keywords).forEach(([key, words]) => {
        if (categoryName.includes(key)) {
          words.forEach(word => {
            if (searchText.includes(word)) {
              score += 20;
            }
          });
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = category;
      }
    });
    
    return { category: bestMatch, confidence: highestScore };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const products: ParsedProduct[] = [];
        
        results.data.forEach((row: any, index) => {
          if (!row['SKU']?.trim() && !row['**SKU**']?.trim()) return;
          
          // Handle both regular and bold headers
          const getSafeValue = (key: string) => row[key] || row[`**${key}**`] || '';
          
          const categoryName = getSafeValue('Category');
          let detectedCategory;
          let needsManual = true;
          
          if (categoryName) {
            // User provided category - try to match it
            detectedCategory = categories.find(c => 
              c.name.toLowerCase() === categoryName.toLowerCase()
            );
            needsManual = !detectedCategory;
          } else {
            // No category provided - try auto-detection
            const detection = autoDetectCategory(getSafeValue('Product Name'), getSafeValue('SKU'));
            detectedCategory = detection.category;
            needsManual = detection.confidence < 50;
          }
          
          products.push({
            code: getSafeValue('SKU'),
            name: getSafeValue('Product Name'),
            size: getSafeValue('Size/Dimensions'),
            weight: parseFloat(getSafeValue('Weight')) || 0,
            cost: parseFloat(getSafeValue('Cost Price')) || 0,
            priceT1: parseFloat(getSafeValue('Price T1')) || 0,
            priceT2: parseFloat(getSafeValue('Price T2')) || 0,
            priceT3: parseFloat(getSafeValue('Price T3')) || 0,
            stock: parseFloat(getSafeValue('Available Stock')) || 0,
            detectedCategory: detectedCategory,
            needsManualAssignment: needsManual
          });
        });
        
        setParsedProducts(products);
        
        // Check if any need manual assignment
        const needsAssignment = products.some(p => p.needsManualAssignment);
        if (needsAssignment) {
          setCurrentStep('assign');
          setAssigningIndex(products.findIndex(p => p.needsManualAssignment));
        } else {
          // All auto-detected, proceed directly
          finalizeProducts(products);
        }
      }
    });
  };

  const finalizeProducts = (products: ParsedProduct[]) => {
    const finalProducts = products.map(product => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      code: product.code,
      name: product.name,
      size: product.size,
      weight: product.weight,
      cost: product.cost,
      priceT1: product.priceT1,
      priceT2: product.priceT2,
      priceT3: product.priceT3,
      currentStock: product.stock,
      categoryId: product.detectedCategory?.id || '',
      subcategoryPath: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    onProductsUploaded(finalProducts);
    onClose();
  };

  const assignCategory = (categoryId: string) => {
    const updatedProducts = [...parsedProducts];
    const category = categories.find(c => c.id === categoryId);
    updatedProducts[assigningIndex] = {
      ...updatedProducts[assigningIndex],
      detectedCategory: category,
      needsManualAssignment: false
    };
    setParsedProducts(updatedProducts);
    
    // Find next product that needs assignment
    const nextIndex = updatedProducts.findIndex((p, i) => i > assigningIndex && p.needsManualAssignment);
    if (nextIndex !== -1) {
      setAssigningIndex(nextIndex);
    } else {
      // All assigned, finalize
      finalizeProducts(updatedProducts);
    }
  };

  const downloadSimpleTemplate = () => {
    const csvContent = [
      ['**Category**', '**Subcategory 1**', '**Subcategory 2**', '**Subcategory 3**', '**SKU**', '**Product Name**', '**Size/Dimensions**', '**Weight**', '**Cost Price**', '**Price T1**', '**Price T2**', '**Price T3**', '**Available Stock**'],
      ['Glass Pool Fencing', 'Frameless Panels', 'Clear Glass', '12mm Thick', '12F-100', 'Clear Glass Panel', '1200 x 800 mm', '25', '150', '200', '250', '300', '10'],
      ['Shower Screens', 'Fixed Panels', 'Standard', '', 'SS-200', 'Shower Screen Panel', '2000 x 900 mm', '35', '200', '280', '350', '420', '5'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '']
    ];
    
    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (currentStep === 'assign') {
    const currentProduct = parsedProducts[assigningIndex];
    const remainingCount = parsedProducts.filter(p => p.needsManualAssignment).length;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Category</h2>
                  <p className="text-gray-600">{remainingCount} products need category assignment</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Couldn't auto-detect category</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <strong>Product:</strong> {currentProduct?.name}
                  <br />
                  <strong>Code:</strong> {currentProduct?.code}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Category:</h3>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => assignCategory(category.id)}
                      className="flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {category.subcategories.length} subcategories
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Simple Bulk Upload</h2>
                <p className="text-gray-600">Upload basic product info, we'll help assign categories</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Download Simple Template */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Step 1: Get Template</h3>
                <p className="text-blue-700 mb-4">Download our simple template - no category columns needed!</p>
                <button
                  onClick={downloadSimpleTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Download Simple Template
                </button>
              </div>

              {/* Step 2: Upload */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">📤 Step 2: Upload Your CSV</h3>
                <p className="text-green-700 mb-4">We'll try to detect categories automatically based on product names</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Drop your CSV file here or click to browse</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer inline-block"
                  >
                    Upload CSV File
                  </label>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Upload basic product info (code, name, price, etc.)</div>
                  <div>• We'll automatically detect categories when possible</div>
                  <div>• For unclear products, you'll choose the category manually</div>
                  <div>• Much faster than complex CSV templates!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}