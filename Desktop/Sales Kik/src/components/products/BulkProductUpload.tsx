import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
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
}

interface BulkProductUploadProps {
  categories: Category[];
  pricingTierNames: { t1: string; t2: string; t3: string; net: string };
  onProductsUploaded: (products: any[]) => void;
  onClose: () => void;
}

interface TemplateRow {
  'Product Code': string;
  'Product Name': string;
  'Size/Dimensions': string;
  'Weight': number;
  'Cost Price': number;
  [key: string]: string | number; // For dynamic tier pricing columns
  'Current Stock': number;
  'Reorder Point': number;
  'Supplier': string;
  'Category': string;
  'Subcategory Level 1': string;
  'Subcategory Level 2': string;
  'Subcategory Level 3': string;
  'Subcategory Level 4': string;
  'Active': string;
}

export default function BulkProductUpload({ 
  categories, 
  pricingTierNames, 
  onProductsUploaded, 
  onClose 
}: BulkProductUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResults, setParseResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Generate single category template
  const generateSingleCategoryTemplate = (category: Category) => {
    const headers = [
      'Product Code',
      'Product Name', 
      'Size/Dimensions',
      'Weight',
      'Cost Price',
      `${pricingTierNames.t1} Price`,
      `${pricingTierNames.t2} Price`,
      `${pricingTierNames.t3} Price`,
      `${pricingTierNames.net} Price`,
      'Current Stock',
      'Reorder Point',
      'Category', // Fixed to this category
    ];

    // Add subcategory columns based on category structure (sorted)
    const maxLevel = Math.max(0, ...category.subcategories.map(sub => sub.level || 0));
    for (let level = 0; level <= maxLevel; level++) {
      headers.push(`Subcategory Level ${level + 1}`);
    }
    
    headers.push('Active');

    // Create sample data rows with better examples
    const sampleRows = [
      [
        `${category.name.substring(0, 3).toUpperCase()}-001`,
        `Premium ${category.name} Product`,
        '1200 x 150 mm',
        '2.50',
        '15.99',
        '19.99',
        '21.99',
        '25.99',
        '29.99',
        '50',
        '10',
        category.name,
      ],
      [
        `${category.name.substring(0, 3).toUpperCase()}-002`,
        `Standard ${category.name} Product`,
        '1000 x 100 mm',
        '1.80',
        '8.50',
        '10.99',
        '12.99',
        '15.99',
        '18.99',
        '25',
        '5',
        category.name,
      ]
    ];

    // Add subcategory sample values for each row (sorted by name)
    sampleRows.forEach(row => {
      for (let level = 0; level <= maxLevel; level++) {
        const levelSubs = category.subcategories
          .filter(sub => sub.level === level && !sub.parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        row.push(levelSubs.length > 0 ? levelSubs[0].name : '');
      }
      row.push('TRUE');
    });

    return { headers, sampleRows, categoryName: category.name };
  };

  // Generate multi-category template
  const generateMultiCategoryTemplate = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'Size/Dimensions', 
      'Weight',
      'Cost Price',
      `${pricingTierNames.t1} Price`,
      `${pricingTierNames.t2} Price`,
      `${pricingTierNames.t3} Price`,
      `${pricingTierNames.net} Price`,
      'Current Stock',
      'Reorder Point',
      'Category',
      'Subcategory Level 1',
      'Subcategory Level 2', 
      'Subcategory Level 3',
      'Subcategory Level 4',
      'Active'
    ];

    // Create sample rows for each category with multiple examples (sorted)
    const sampleRows: string[][] = [];
    
    // Sort categories alphabetically
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCategories.forEach((category, categoryIndex) => {
      // Add 2-3 sample products per category
      const productCount = Math.min(3, Math.max(2, categoryIndex + 1));
      
      for (let i = 0; i < productCount; i++) {
        const productTypes = ['Premium', 'Standard', 'Economy'];
        const productType = productTypes[i] || 'Standard';
        const productNum = String(i + 1).padStart(3, '0');
        
        const row = [
          `${category.name.substring(0, 3).toUpperCase()}-${productNum}`,
          `${productType} ${category.name} Product`,
          i === 0 ? '1200 x 150 mm' : i === 1 ? '1000 x 100 mm' : '800 x 80 mm',
          (1.5 + i * 0.5).toFixed(2),
          (10.99 + i * 5).toFixed(2),
          (15.99 + i * 6).toFixed(2),
          (17.99 + i * 7).toFixed(2),
          (22.99 + i * 8).toFixed(2),
          (26.99 + i * 9).toFixed(2),
          String(50 - i * 15),
          String(10 - i * 2),
          category.name,
        ];

        // Add subcategory sample values (sorted)
        const maxLevel = Math.max(0, ...category.subcategories.map(sub => sub.level || 0));
        for (let level = 0; level <= 3; level++) { // Fixed 4 levels max
          if (level <= maxLevel) {
            const levelSubs = category.subcategories
              .filter(sub => sub.level === level && !sub.parentId)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            row.push(levelSubs.length > 0 ? levelSubs[0].name : '');
          } else {
            row.push('');
          }
        }
        
        row.push('TRUE');
        sampleRows.push(row);
      }
    });

    return { headers, sampleRows };
  };

  // Create clean, spreadsheet-friendly CSV content with sections
  const createStyledSectionedCSV = (templateType: string, categoryName?: string, category?: Category) => {
    const csvContent = [];
    
    // Add clean header section
    csvContent.push('# ================================================================================');
    csvContent.push('# SALESKIK PRODUCT IMPORT TEMPLATE');
    if (categoryName) {
      csvContent.push(`# Category: ${categoryName}`);
    }
    csvContent.push(`# Template: ${templateType}`);
    csvContent.push(`# Generated: ${new Date().toLocaleDateString()}`);
    csvContent.push('# ================================================================================');
    csvContent.push('');
    
    // Add clear instructions
    csvContent.push('# INSTRUCTIONS:');
    csvContent.push('# 1. Fill in your products in the sections below');
    csvContent.push('# 2. Do NOT modify the header rows');
    csvContent.push('# 3. Required: Product Code, Name, Cost Price, Category');
    csvContent.push('# 4. Pricing: Numbers only (no $ symbols)');
    csvContent.push('# 5. Stock: Whole numbers only');
    csvContent.push('# 6. Active: TRUE/FALSE or YES/NO');
    csvContent.push('# 7. Categories & Subcategories: Must match exactly');
    csvContent.push('# 8. Delete example rows after reviewing');
    csvContent.push('');
    
    // Add pricing tiers section
    csvContent.push('# PRICING TIERS:');
    csvContent.push(`# ${pricingTierNames.t1}: Your first pricing tier`);
    csvContent.push(`# ${pricingTierNames.t2}: Your second pricing tier`);
    csvContent.push(`# ${pricingTierNames.t3}: Your third pricing tier`);
    csvContent.push(`# ${pricingTierNames.net}: Your fourth pricing tier`);
    csvContent.push('');
    
    if (categoryName && category) {
      // Single category template with clean sections
      return createSingleCategoryCleanCSV(csvContent, category);
    } else {
      // Multi-category template with sections for each category
      return createMultiCategoryCleanCSV(csvContent);
    }
  };

  // Create single category clean CSV matching user template
  const createSingleCategoryCleanCSV = (csvContent: string[], category: Category) => {
    const categoryColor = category.color || '#3B82F6';
    
    // Add padding commas to maintain CSV structure
    const padCommas = ',,,,,,,,,,,,,';
    
    // Update csvContent to include padding
    csvContent = csvContent.map(line => line + padCommas);
    
    // Category header - clean and readable
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push(`# CATEGORY: ${category.name.toUpperCase()}` + padCommas);
    csvContent.push(`# Color: ${categoryColor}` + padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push(padCommas);
    
    // Show subcategory structure - simplified like your template
    csvContent.push('# SUBCATEGORY STRUCTURE:' + padCommas);
    if (category.subcategories.length > 0) {
      const level1Subs = category.subcategories
        .filter(sub => sub.level === 0 && !sub.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      if (level1Subs.length > 0) {
        // Just show first subcategory like your template
        csvContent.push(`# Level 1: ${level1Subs[0].name}` + padCommas);
      }
    }
    csvContent.push(padCommas);
    
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push('# DATA SECTION - ADD YOUR PRODUCTS BELOW' + padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push(padCommas);
    
    // Headers in YOUR order: Category first, then subcategories, then product details
    const headers = [
      'Category', 'Subcategory Level 1', 'Subcategory Level 2', 
      'Product Code', 'Product Name', 'Size/Dimensions', 'Weight', 'Cost Price',
      `${pricingTierNames.t1} Price`, `${pricingTierNames.t2} Price`, 
      `${pricingTierNames.t3} Price`, `${pricingTierNames.net} Price`,
      'Current Stock', 'Reorder Point', 'Active'
    ];
    
    csvContent.push(headers.join(','));
    
    // Add sample rows in YOUR format
    const level1Subs = category.subcategories
      .filter(sub => sub.level === 0 && !sub.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const firstSubcategory = level1Subs.length > 0 ? level1Subs[0].name : '';
    
    const sampleRows = [
      [
        category.name, firstSubcategory, '', // Category, Subcategory Level 1, Subcategory Level 2
        `${category.name.substring(0, 3).toUpperCase()}-001`,
        `Premium ${category.name} Product`, '1200 x 150 mm', '2.5', '15.99',
        '19.99', '21.99', '25.99', '29.99', '50', '10', 'TRUE'
      ],
      [
        category.name, firstSubcategory, '', // Category, Subcategory Level 1, Subcategory Level 2
        `${category.name.substring(0, 3).toUpperCase()}-002`,
        `Standard ${category.name} Product`, '1000 x 100 mm', '1.8', '8.5',
        '10.99', '12.99', '15.99', '18.99', '25', '5', 'TRUE'
      ]
    ];
    
    sampleRows.forEach(row => {
      csvContent.push(row.join(','));
    });
    
    // Footer with padding
    csvContent.push(padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push('# END OF TEMPLATE - Add your products above this line' + padCommas);
    csvContent.push('# Save as CSV format before uploading to SalesKik' + padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    
    return csvContent.join('\n');
  };

  // Create multi-category clean CSV matching user template format
  const createMultiCategoryCleanCSV = (csvContent: string[]) => {
    const padCommas = ',,,,,,,,,,,,,';
    
    // Update csvContent to include padding
    csvContent = csvContent.map(line => line + padCommas);
    
    // Headers in YOUR order: Category first, then subcategories, then product details
    const headers = [
      'Category', 'Subcategory Level 1', 'Subcategory Level 2', 'Subcategory Level 3', 'Subcategory Level 4',
      'Product Code', 'Product Name', 'Size/Dimensions', 'Weight', 'Cost Price',
      `${pricingTierNames.t1} Price`, `${pricingTierNames.t2} Price`, 
      `${pricingTierNames.t3} Price`, `${pricingTierNames.net} Price`,
      'Current Stock', 'Reorder Point', 'Active'
    ];
    
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push('# DATA SECTION - ORGANIZED BY CATEGORY' + padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push(padCommas);
    csvContent.push(headers.join(','));
    
    // Sort categories and create sections for each
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCategories.forEach((category, categoryIndex) => {
      csvContent.push(padCommas);
      csvContent.push(`# ---- ${category.name.toUpperCase()} SECTION ----` + padCommas);
      csvContent.push(`# Color: ${category.color || '#3B82F6'}` + padCommas);
      
      if (category.subcategories.length > 0) {
        const level1Subs = category.subcategories
          .filter(sub => sub.level === 0 && !sub.parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        
        if (level1Subs.length > 0) {
          csvContent.push(`# Level 1: ${level1Subs.map(s => s.name).join(', ')}` + padCommas);
        }
      }
      csvContent.push('# ----------------------------------------------------------------' + padCommas);
      
      // Add sample products for this category
      const level1Subs = category.subcategories
        .filter(sub => sub.level === 0 && !sub.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      const firstSubcategory = level1Subs.length > 0 ? level1Subs[0].name : '';
      
      const productCount = Math.min(3, Math.max(2, categoryIndex + 1));
      for (let i = 0; i < productCount; i++) {
        const productTypes = ['Premium', 'Standard', 'Economy'];
        const productType = productTypes[i] || 'Standard';
        const productNum = String(i + 1).padStart(3, '0');
        
        const row = [
          category.name, firstSubcategory, '', '', '', // Category, Subcategory Levels 1-4
          `${category.name.substring(0, 3).toUpperCase()}-${productNum}`,
          `${productType} ${category.name} Product`,
          i === 0 ? '1200 x 150 mm' : i === 1 ? '1000 x 100 mm' : '800 x 80 mm',
          (1.5 + i * 0.5).toFixed(1), (10.99 + i * 5).toFixed(2),
          (15.99 + i * 6).toFixed(2), (17.99 + i * 7).toFixed(2),
          (22.99 + i * 8).toFixed(2), (26.99 + i * 9).toFixed(2),
          String(50 - i * 15), String(10 - i * 2), 'TRUE'
        ];
        
        csvContent.push(row.join(','));
      }
    });
    
    // Footer with padding
    csvContent.push(padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    csvContent.push('# END OF TEMPLATE - Add your products in the sections above' + padCommas);
    csvContent.push('# Save as CSV format before uploading to SalesKik' + padCommas);
    csvContent.push('# ================================================================================' + padCommas);
    
    return csvContent.join('\n');
  };

  // Download single category template
  const downloadSingleCategoryTemplate = (category: Category) => {
    const csvContent = createStyledSectionedCSV(
      'Single Category', 
      category.name,
      category
    );

    downloadCSV(csvContent, `SalesKik_${category.name.replace(/\s+/g, '_')}_Template.csv`);
  };

  // Download multi-category template  
  const downloadMultiCategoryTemplate = () => {
    const csvContent = createStyledSectionedCSV('Multi-Category (All Categories)');

    downloadCSV(csvContent, 'SalesKik_All_Categories_Template.csv');
  };

  // Utility function to download CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setParseResults(null);
      setErrors([]);
    }
  };

  // Process uploaded file
  const processUploadedFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          const { data, errors: parseErrors } = results;

          if (parseErrors.length > 0) {
            setErrors(parseErrors.map(err => `Parse error: ${err.message}`));
            setIsProcessing(false);
            return;
          }

          // Filter out comment rows and empty rows
          const validRows = data.filter((row: any) => {
            const firstValue = Object.values(row)[0] as string;
            return firstValue && !firstValue.toString().startsWith('#');
          });

          if (validRows.length === 0) {
            throw new Error('No valid data rows found in file');
          }

          // Validate required headers
          const requiredHeaders = ['Product Code', 'Product Name', 'Cost Price', 'Category'];
          const fileHeaders = Object.keys(validRows[0]);
          const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
          }

          // Parse data rows
          const parsedProducts = [];
          const validationErrors = [];

          validRows.forEach((row: any, index: number) => {
            const rowNumber = index + 2; // Account for header row

            // Validate required fields
            if (!row['Product Code']?.trim()) {
              validationErrors.push(`Row ${rowNumber}: Product Code is required`);
              return;
            }

            if (!row['Product Name']?.trim()) {
              validationErrors.push(`Row ${rowNumber}: Product Name is required`);
              return;
            }

            if (!row['Category']?.trim()) {
              validationErrors.push(`Row ${rowNumber}: Category is required`);
              return;
            }

            // Validate category exists
            const categoryExists = categories.find(c => c.name === row['Category']);
            if (!categoryExists) {
              validationErrors.push(`Row ${rowNumber}: Category "${row['Category']}" does not exist`);
              return;
            }

            // Parse numeric fields (removed supplier field)
            const numericFields = ['Weight', 'Cost Price', 'Current Stock', 'Reorder Point'];
            const pricingFields = [`${pricingTierNames.t1} Price`, `${pricingTierNames.t2} Price`, `${pricingTierNames.t3} Price`, `${pricingTierNames.net} Price`];
            
            const processedRow = { ...row };
            let hasNumericErrors = false;

            [...numericFields, ...pricingFields].forEach(field => {
              if (processedRow[field] && processedRow[field] !== '') {
                const parsed = parseFloat(processedRow[field]);
                if (isNaN(parsed)) {
                  validationErrors.push(`Row ${rowNumber}: ${field} must be a valid number`);
                  hasNumericErrors = true;
                } else {
                  processedRow[field] = parsed;
                }
              } else {
                processedRow[field] = (field === 'Current Stock' || field === 'Reorder Point') ? 0 : 0;
              }
            });

            // Parse active field
            const activeValue = processedRow['Active']?.toString()?.toLowerCase();
            processedRow['Active'] = activeValue === 'true' || activeValue === 'yes' || activeValue === '1';

            if (!hasNumericErrors) {
              parsedProducts.push(processedRow);
            }
          });

          if (validationErrors.length > 0) {
            setErrors(validationErrors);
          }

          setParseResults({
            totalRows: validRows.length,
            validProducts: parsedProducts,
            errorCount: validationErrors.length
          });

          setIsProcessing(false);
        },
        error: (error) => {
          setErrors([`Failed to parse file: ${error.message}`]);
          setIsProcessing(false);
        }
      });

    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to process file']);
      setIsProcessing(false);
    }
  };

  // Import validated products
  const importProducts = () => {
    if (parseResults?.validProducts) {
      const productsToImport = parseResults.validProducts.map((product: any) => {
        const category = categories.find(c => c.name === product['Category']);
        
        // Build subcategory path from new template format
        const subcategoryPath = [];
        for (let level = 1; level <= 4; level++) {
          const subcatName = product[`Subcategory Level ${level}`];
          if (subcatName && category) {
            const subcategory = category.subcategories.find(sub => 
              sub.name === subcatName && sub.level === (level - 1)
            );
            if (subcategory) {
              subcategoryPath.push({
                id: subcategory.id,
                name: subcategory.name,
                level: subcategory.level,
                color: subcategory.color
              });
            }
          }
        }

        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          code: product['Product Code'],
          name: product['Product Name'],
          size: product['Size/Dimensions'] || '',
          weight: product['Weight'] || 0,
          cost: product['Cost Price'] || 0,
          priceT1: product[`${pricingTierNames.t1} Price`] || 0,
          priceT2: product[`${pricingTierNames.t2} Price`] || 0,
          priceT3: product[`${pricingTierNames.t3} Price`] || 0,
          priceN: product[`${pricingTierNames.net} Price`] || 0,
          categoryId: category?.id || '',
          categoryName: category?.name || '',
          subcategoryPath,
          inventory: {
            currentStock: product['Current Stock'] || 0,
            reorderPoint: product['Reorder Point'] || 10,
            supplier: '',
            primaryLocation: 'Main Warehouse'
          },
          isActive: product['Active'] !== false,
          productType: category?.name || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      onProductsUploaded(productsToImport);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h2>
                <p className="text-gray-600 mt-2">Download templates and upload CSV files to add multiple products quickly</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-8 h-8" />
              </button>
            </div>

            {/* Template Downloads Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📥 Download Templates</h3>
              
              {/* Single Category Templates */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-bold text-blue-900 mb-3">📋 Single Category Templates</h4>
                <p className="text-blue-700 mb-2">Download a focused template for one specific category</p>
                <div className="text-sm text-blue-600 mb-4">
                  ✨ <strong>Features:</strong> Pre-filled category, specific subcategory structure, 2 sample products with realistic data
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(category => (
                    <button
                      key={category.id}
                      onClick={() => downloadSingleCategoryTemplate(category)}
                      className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-bold text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-600">
                          {category.subcategories.length} subcategories • 2 examples
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Category Template */}
              <div className="bg-emerald-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-emerald-900 mb-3">🌍 Multi-Category Template</h4>
                <p className="text-emerald-700 mb-2">Download one comprehensive template with all your categories</p>
                <div className="text-sm text-emerald-600 mb-4">
                  ✨ <strong>Features:</strong> All {categories.length} categories, {categories.reduce((total, cat) => total + Math.min(3, Math.max(2, categories.indexOf(cat) + 1)), 0)} sample products, standardized format
                </div>
                
                <button
                  onClick={downloadMultiCategoryTemplate}
                  className="flex items-center gap-3 p-6 bg-white rounded-lg border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md w-full"
                >
                  <DocumentArrowDownIcon className="w-6 h-6 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">All Categories Template</div>
                    <div className="text-sm text-gray-600">
                      Comprehensive template • {categories.length} categories • Multiple examples per category
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">
                      Perfect for bulk importing across multiple product lines
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Upload Section */}
            <div className="border-t-2 border-gray-200 pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📤 Upload Products</h3>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  
                  {!uploadedFile ? (
                    <>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Upload your completed CSV file</h4>
                      <p className="text-gray-600 mb-4">Choose a file you've filled out using one of the templates above</p>
                      
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        <CloudArrowUpIcon className="w-5 h-5" />
                        Choose File
                      </label>
                    </>
                  ) : (
                    <div>
                      <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">File Selected</h4>
                      <p className="text-gray-600 mb-4">{uploadedFile.name}</p>
                      
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={processUploadedFile}
                          disabled={isProcessing}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : 'Process File'}
                        </button>
                        <button
                          onClick={() => {
                            setUploadedFile(null);
                            setParseResults(null);
                            setErrors([]);
                          }}
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Choose Different File
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing Results */}
                {parseResults && (
                  <div className="mt-6 p-4 bg-white rounded-lg border">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Processing Results</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{parseResults.totalRows}</div>
                        <div className="text-sm text-blue-700">Total Rows</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{parseResults.validProducts.length}</div>
                        <div className="text-sm text-green-700">Valid Products</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{parseResults.errorCount}</div>
                        <div className="text-sm text-red-700">Errors</div>
                      </div>
                    </div>

                    {parseResults.validProducts.length > 0 && (
                      <button
                        onClick={importProducts}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Import {parseResults.validProducts.length} Products
                      </button>
                    )}
                  </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <h4 className="font-bold text-red-900">Validation Errors</h4>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Instructions */}
            <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 mb-3 text-lg">📖 Quick Start Guide</h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-amber-800 mb-2">📥 Template Selection</h5>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• <strong>Single Category:</strong> Focus on one product category</li>
                        <li>• <strong>Multi-Category:</strong> Import products across all categories</li>
                        <li>• Templates include sample data and detailed instructions</li>
                        <li>• Professional formatting with clear sections</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-amber-800 mb-2">✏️ Filling Templates</h5>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• <strong>Required:</strong> Product Code, Name, Cost Price, Category</li>
                        <li>• <strong>Pricing:</strong> Numbers only (no $ symbols)</li>
                        <li>• <strong>Active:</strong> TRUE/FALSE or YES/NO</li>
                        <li>• <strong>Categories:</strong> Must match exactly</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <h5 className="font-bold text-amber-900 mb-1">💡 Pro Tips</h5>
                    <div className="text-sm text-amber-800">
                      • Delete example rows after reviewing • Save as CSV before uploading • 
                      Your pricing tiers: <strong>{pricingTierNames.t1}, {pricingTierNames.t2}, {pricingTierNames.t3}, {pricingTierNames.net}</strong>
                    </div>
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