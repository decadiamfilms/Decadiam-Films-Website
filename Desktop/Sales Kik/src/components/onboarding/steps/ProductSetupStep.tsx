import React, { useState } from 'react';
import { 
  PlusIcon, CubeIcon, DocumentArrowDownIcon,
  CloudArrowUpIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

function ProductSetupStep({ data, onChange }: StepProps) {
  const [setupMethod, setSetupMethod] = useState<'manual' | 'upload' | 'skip'>('manual');
  const [sampleProducts, setSampleProducts] = useState([
    { name: 'Sample Product 1', price: '100.00', category: 'General' },
    { name: 'Sample Product 2', price: '250.00', category: 'Premium' }
  ]);

  const handleSetupMethodChange = (method: 'manual' | 'upload' | 'skip') => {
    setSetupMethod(method);
    onChange({ ...data, productSetupMethod: method });
  };

  const downloadTemplate = () => {
    const csvContent = [
      '# SalesKik Product Import Template',
      '# Add your products below - required fields marked with *',
      '',
      'Product Code*,Product Name*,Category,Price*,Current Quantity*,Unit of Measure,Supplier,Location,Notes',
      '',
      '# Add your products here:'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'SalesKik_Product_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Products</h2>
        <p className="text-gray-600">Choose how you'd like to add your product catalog</p>
      </div>

      {/* Setup Method Selection */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Manual Entry */}
          <div
            onClick={() => handleSetupMethodChange('manual')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              setupMethod === 'manual'
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                setupMethod === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <PlusIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start with a few products and add more as you go
              </p>
              <div className="text-xs text-gray-500">
                Perfect for getting started quickly
              </div>
            </div>
          </div>

          {/* Bulk Upload */}
          <div
            onClick={() => handleSetupMethodChange('upload')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              setupMethod === 'upload'
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                setupMethod === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <CloudArrowUpIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your entire product catalog at once using CSV
              </p>
              <div className="text-xs text-gray-500">
                Best for existing businesses with many products
              </div>
            </div>
          </div>

          {/* Skip for Now */}
          <div
            onClick={() => handleSetupMethodChange('skip')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              setupMethod === 'skip'
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                setupMethod === 'skip' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skip for Now</h3>
              <p className="text-sm text-gray-600 mb-4">
                Set up products later and start with other features
              </p>
              <div className="text-xs text-gray-500">
                You can add products anytime from inventory
              </div>
            </div>
          </div>
        </div>

        {/* Setup Method Content */}
        <div className="mt-8">
          {setupMethod === 'manual' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Product Entry</h3>
              <p className="text-gray-600 mb-6">Add a few sample products to get started. You can add more later from the inventory section.</p>
              
              <div className="space-y-4">
                {sampleProducts.map((product, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => {
                          const updated = [...sampleProducts];
                          updated[index].name = e.target.value;
                          setSampleProducts(updated);
                          onChange({ ...data, sampleProducts: updated });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Product name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => {
                          const updated = [...sampleProducts];
                          updated[index].price = e.target.value;
                          setSampleProducts(updated);
                          onChange({ ...data, sampleProducts: updated });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={product.category}
                        onChange={(e) => {
                          const updated = [...sampleProducts];
                          updated[index].category = e.target.value;
                          setSampleProducts(updated);
                          onChange({ ...data, sampleProducts: updated });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Category"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newProduct = { name: '', price: '', category: '' };
                  const updated = [...sampleProducts, newProduct];
                  setSampleProducts(updated);
                  onChange({ ...data, sampleProducts: updated });
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Another Product
              </button>
            </div>
          )}

          {setupMethod === 'upload' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Product Upload</h3>
              <p className="text-gray-600 mb-6">Upload your entire product catalog using our CSV template.</p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={downloadTemplate}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download CSV Template
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Products</h4>
                  <p className="text-gray-600 mb-4">
                    Fill out the template and upload it here, or drag and drop your CSV file
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange({ ...data, uploadedFile: file });
                      }
                    }}
                    className="hidden"
                    id="product-upload"
                  />
                  <label
                    htmlFor="product-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>
            </div>
          )}

          {setupMethod === 'skip' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products Setup Skipped</h3>
              <p className="text-gray-600 mb-4">
                No problem! You can add products anytime from the inventory section.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  After setup, go to <strong>Inventory → Stock Management</strong> to add your products.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductSetupStep;