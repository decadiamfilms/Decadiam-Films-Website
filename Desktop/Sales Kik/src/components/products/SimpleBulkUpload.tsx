import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon
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

interface SimpleBulkUploadProps {
  categories: Category[];
  onProductsUploaded: (products: any[]) => void;
  onClose: () => void;
}

export default function SimpleBulkUpload({ categories, onProductsUploaded, onClose }: SimpleBulkUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate simple category reference
  const generateCategoryReference = () => {
    let reference = '';
    
    categories.forEach(category => {
      reference += `${category.name}\n`;
      
      const topLevel = category.subcategories
        .filter(sub => !sub.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      topLevel.forEach(sub => {
        reference += `  • ${sub.name}\n`;
        
        const children = category.subcategories
          .filter(child => child.parentId === sub.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        
        children.forEach(child => {
          reference += `    - ${child.name}\n`;
        });
      });
      
      reference += '\n';
    });
    
    return reference;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCategoryReference());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      ['Product Code', 'Product Name', 'Size/Dimensions', 'Weight', 'Cost Price', 'Price T1', 'Price T2', 'Price T3', 'Current Stock', 'Category', 'Subcategory Level 1', 'Subcategory Level 2', 'Subcategory Level 3'],
      ['12F-100', 'Clear Toughened Glass Panel', '1200 x 800 mm', '25', '150', '200', '250', '300', '10', 'Glass Pool Fencing', 'Frameless Panels', 'Clear Glass', '12mm Thick'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '']
    ];
    
    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const products = results.data.filter((row: any) => row['Product Code']?.trim());
          onProductsUploaded(products);
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full">
          <div className="p-8">
            {/* Simple Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h2>
                <p className="text-gray-600">Upload multiple products using CSV</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Category Reference */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Category Reference</h3>
                <p className="text-gray-600 mb-4">Copy and paste these exact names in your CSV:</p>
                
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {generateCategoryReference()}
                  </pre>
                </div>
                
                <button
                  onClick={copyToClipboard}
                  className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Copy Category Names
                    </>
                  )}
                </button>
              </div>

              {/* Right: Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Upload Your CSV</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={downloadTemplate}
                    className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download Template
                  </button>
                  
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                    >
                      Choose CSV File
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}