// Template Service - Creates CSV templates exactly as specified

export class TemplateService {
  
  // Generate Bulk Upload Template (multiple categories at once)
  static generateBulkUploadTemplate(): string {
    const csvContent = [
      '# SalesKik Bulk Upload Template - Multiple Categories',
      '# Use this template to upload multiple main categories, subcategories, and final products at once',
      '# Perfect for initial system setup or major catalog updates',
      '',
      '# REQUIRED FIELDS: Category Name*, Product Name*, SKU*, Pricing Method*, Base Price*',
      '# OPTIONAL FIELDS: All other columns can be left blank if not applicable',
      '',
      '# PRICING METHODS: each, sqm, box',
      '# UNIT TYPES: mm, cm, m',
      '# APPLIES TO: product, category, subcategory (for documents)',
      '',
      'Category Name*,Category Color,Subcategory Name,Subcategory Order,Product Name*,SKU*,Description,Pricing Method*,Unit Type,Base Price*,Box Conversion,Image URL,Image Include In Quote,Document Name,Document Type,Document URL,Document Applies To,Special Item Name,Special Price,Special Unit,Special Applies To,Special Always Visible',
      '',
      '# SHOWER SCREENS EXAMPLE:',
      'Shower Screens,#3B82F6,Shower Screen Glass,1,Shower Screen Door,SSD-001,10mm clear toughened glass shower door,sqm,mm,420.00,,/images/shower-door.jpg,true,Installation Guide,pdf,/docs/install.pdf,product,Anti-Slip Coating,50,sqm,category,true',
      'Shower Screens,#3B82F6,Shower Screen Glass,1,Return Panel,RP-001,10mm clear toughened return panel,sqm,mm,380.00,,,,,,,,,,,,',
      'Shower Screens,#3B82F6,Hardware Finish,2,Satin Hardware Set,SHS-001,Complete satin finish hardware set,each,mm,85.00,,,,,,,,Installation Labor,200,job,category,false',
      'Shower Screens,#3B82F6,Hardware Finish,2,Black Hardware Set,BHS-001,Complete black finish hardware set,each,mm,95.00,,,,,,,,,,,,',
      '',
      '# POOL FENCING EXAMPLE:',
      'Pool Fencing,#FB923C,Frame Type,1,Frameless Gate Panel,FGP-001,12mm toughened frameless gate panel,sqm,mm,520.00,,,,,,,,Pool Compliance Cert,150,job,category,true',
      'Pool Fencing,#FB923C,Frame Type,1,Fixed Panel,FP-001,12mm toughened fixed panel,sqm,mm,480.00,,,,,,,,,,,,',
      '',
      '# PACKAGING EXAMPLE (with box conversion):',
      'Tiles,#10B981,Floor Tiles,1,Premium Porcelain Tiles,PPT-001,High-quality porcelain floor tiles,box,m,45.90,1.44,,,,,,,Delivery Service,75,order,category,false',
      '',
      '# YOUR DATA GOES BELOW THIS LINE:',
      '# Replace the examples above with your actual products',
      '# Each row creates a product with its category/subcategory structure',
      '# Special items and documents are optional - leave blank if not needed'
    ].join('\n');

    return csvContent;
  }

  // Generate Single Category Template (detailed setup for one category)
  static generateSingleCategoryTemplate(): string {
    const csvContent = [
      '# SalesKik Single Category Template - Detailed Category Setup',
      '# Use this template for detailed setup of one main category at a time',
      '# Perfect for incremental updates or adding new product lines',
      '',
      '# This template focuses on ONE main category with complete subcategory and product details',
      '# More detailed than bulk template - includes additional fields for comprehensive setup',
      '',
      'Main Category Name*,Category Color*,Category Description',
      'Shower Screens,#3B82F6,Complete shower screen and enclosure systems',
      '',
      '# SUBCATEGORIES FOR THIS CATEGORY:',
      'Subcategory Name*,Subcategory Order*,Is Visible*,Subcategory Description',
      'Shower Screen Glass,1,true,Glass options and specifications',
      'Hardware Finish,2,true,Hardware finish and style options',
      'Installation Options,3,true,Installation and labor services',
      '',
      '# FINAL PRODUCTS FOR THIS CATEGORY:',
      'Product Name*,SKU*,Description,Pricing Method*,Unit Type,Base Price*,Box Conversion,Linked Subcategories*,Width Range,Height Range,Thickness,Material,Finish Options',
      'Shower Screen Door,SSD-001,10mm clear toughened glass shower door,sqm,mm,420.00,,Shower Screen Glass,600-1200,1800-2400,10mm,Toughened Glass,Clear/Frosted',
      'Return Panel,RP-001,10mm clear toughened return panel,sqm,mm,380.00,,Shower Screen Glass,300-800,1800-2400,10mm,Toughened Glass,Clear/Frosted',
      'Hinge Panel,HP-001,10mm clear toughened hinge panel,sqm,mm,450.00,,Shower Screen Glass,700-1000,1800-2400,10mm,Toughened Glass,Clear/Frosted',
      'Satin Hardware Set,SHS-001,Complete satin finish hardware set,each,mm,85.00,,Hardware Finish,,,,,Satin',
      'Black Hardware Set,BHS-001,Complete black finish hardware set,each,mm,95.00,,Hardware Finish,,,,,Black',
      'Chrome Hardware Set,CHS-001,Complete chrome finish hardware set,each,mm,105.00,,Hardware Finish,,,,,Chrome',
      '',
      '# PRODUCT IMAGES FOR THIS CATEGORY:',
      'Product SKU*,Image Filename*,Image URL*,Include In Quote*,Image Order,Image Description',
      'SSD-001,shower-door-1.jpg,/images/shower-door-1.jpg,true,1,Front view shower door',
      'SSD-001,shower-door-2.jpg,/images/shower-door-2.jpg,false,2,Side view shower door',
      'SHS-001,satin-hardware.jpg,/images/satin-hardware.jpg,true,1,Satin hardware set',
      '',
      '# DOCUMENTS FOR THIS CATEGORY:',
      'Document Name*,Document Type*,Document URL*,Applies To*,Applied To ID,Document Description',
      'Installation Guide,pdf,/docs/shower-install.pdf,category,Shower Screens,Complete installation instructions',
      'Warranty Information,pdf,/docs/warranty.pdf,category,Shower Screens,5-year warranty details',
      'Hardware Specifications,spec,/docs/hardware-specs.pdf,subcategory,Hardware Finish,Technical specifications',
      'CAD Drawing Template,cad,/docs/shower-template.dwg,product,SSD-001,CAD template for custom sizing',
      '',
      '# SPECIAL ITEMS FOR THIS CATEGORY:',
      'Special Name*,Special Description*,Special Price*,Special Unit*,Applies To*,Always Visible*,Special Category',
      'Anti-Slip Coating,Per sqm coating application for safety,50.00,sqm,category,true,Shower Screens',
      'Installation Labor,Professional installation service,200.00,job,category,false,Shower Screens',
      'Packaging & Delivery,Special packaging and delivery service,75.00,order,category,false,Shower Screens',
      'Custom Cutting,Custom glass cutting service,25.00,cut,product,false,SSD-001',
      '',
      '# PRICING HISTORY (Optional - for existing products):',
      'Product SKU,Previous Price,New Price,Effective Date,Changed By,Reason',
      'SSD-001,400.00,420.00,2025-01-01,Admin,Annual price adjustment',
      'SHS-001,80.00,85.00,2025-01-01,Manager,Material cost increase',
      '',
      '# INSTRUCTIONS:',
      '# 1. Fill in your main category details at the top',
      '# 2. Add all subcategories for this category',
      '# 3. List all final products with complete specifications',
      '# 4. Add product images with URLs and display preferences',
      '# 5. Include any PDF/CAD documents with proper linking',
      '# 6. Define special items and extras for this category',
      '# 7. Include pricing history for existing products (optional)',
      '# 8. Save as CSV and upload through SalesKik'
    ].join('\n');

    return csvContent;
  }

  // Download template function
  static downloadTemplate(type: 'bulk' | 'single') {
    const csvContent = type === 'bulk' 
      ? this.generateBulkUploadTemplate()
      : this.generateSingleCategoryTemplate();
    
    const filename = type === 'bulk' 
      ? 'SalesKik_Bulk_Upload_Template.csv'
      : 'SalesKik_Single_Category_Template.csv';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Process uploaded CSV files
  static async processBulkUpload(file: File): Promise<{
    categories: MainCategory[];
    products: FinalProduct[];
    specialItems: SpecialItem[];
    errors: string[];
  }> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      if (lines.length === 0) {
        throw new Error('No data found in file');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const categories: MainCategory[] = [];
      const products: FinalProduct[] = [];
      const specialItems: SpecialItem[] = [];
      const errors: string[] = [];

      // Process each data line
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          // Create category if it doesn't exist
          let category = categories.find(c => c.name === rowData['Category Name*']);
          if (!category && rowData['Category Name*']) {
            category = {
              id: Date.now().toString() + Math.random(),
              name: rowData['Category Name*'],
              color: rowData['Category Color'] || '#3B82F6',
              isActive: true,
              subcategories: [],
              specialItems: [],
              permissions: ['view', 'create', 'edit']
            };
            categories.push(category);
          }

          // Create subcategory if it doesn't exist
          if (category && rowData['Subcategory Name']) {
            let subcategory = category.subcategories.find(s => s.name === rowData['Subcategory Name']);
            if (!subcategory) {
              subcategory = {
                id: Date.now().toString() + Math.random(),
                name: rowData['Subcategory Name'],
                categoryId: category.id,
                isVisible: true,
                order: parseInt(rowData['Subcategory Order']) || 1,
                finalProducts: []
              };
              category.subcategories.push(subcategory);
            }

            // Create product
            if (rowData['Product Name*'] && rowData['SKU*']) {
              const product: FinalProduct = {
                id: Date.now().toString() + Math.random(),
                name: rowData['Product Name*'],
                sku: rowData['SKU*'],
                description: rowData['Description'] || '',
                pricingMethod: (rowData['Pricing Method*'] as 'each' | 'sqm' | 'box') || 'each',
                unitType: (rowData['Unit Type'] as 'mm' | 'cm' | 'm') || 'mm',
                basePrice: parseFloat(rowData['Base Price*']) || 0,
                boxConversion: rowData['Box Conversion'] ? parseFloat(rowData['Box Conversion']) : undefined,
                images: rowData['Image URL'] ? [{
                  id: Date.now().toString(),
                  url: rowData['Image URL'],
                  filename: rowData['Image URL'].split('/').pop() || 'image.jpg',
                  isResized: true,
                  includeInQuote: rowData['Image Include In Quote']?.toLowerCase() === 'true'
                }] : [],
                documents: rowData['Document URL'] ? [{
                  id: Date.now().toString(),
                  name: rowData['Document Name'] || 'Document',
                  type: (rowData['Document Type'] as 'pdf' | 'cad' | 'spec' | 'warranty') || 'pdf',
                  url: rowData['Document URL'],
                  appliesTo: (rowData['Document Applies To'] as 'product' | 'category' | 'subcategory') || 'product'
                }] : [],
                subcategoryIds: [subcategory.id],
                isActive: true,
                versionHistory: [{
                  id: Date.now().toString(),
                  price: parseFloat(rowData['Base Price*']) || 0,
                  effectiveDate: new Date(),
                  changedBy: 'Upload',
                  reason: 'Bulk upload'
                }]
              };
              
              products.push(product);
              subcategory.finalProducts.push(product);
            }

            // Create special item if specified
            if (rowData['Special Item Name'] && category) {
              const specialItem: SpecialItem = {
                id: Date.now().toString() + Math.random(),
                name: rowData['Special Item Name'],
                description: rowData['Special Item Name'],
                price: parseFloat(rowData['Special Price']) || 0,
                unit: rowData['Special Unit'] || 'each',
                appliesTo: (rowData['Special Applies To'] as 'category' | 'product') || 'category',
                categoryId: category.id,
                isAlwaysVisible: rowData['Special Always Visible']?.toLowerCase() === 'true'
              };
              
              specialItems.push(specialItem);
              category.specialItems.push(specialItem);
            }
          }
          
        } catch (rowError) {
          errors.push(`Row ${i + 1}: ${rowError.message}`);
        }
      }

      return { categories, products, specialItems, errors };
    } catch (error) {
      throw new Error(`Failed to process upload: ${error.message}`);
    }
  }

  // Process single category upload
  static async processSingleCategoryUpload(file: File): Promise<{
    category: MainCategory;
    errors: string[];
  }> {
    try {
      const text = await file.text();
      const sections = text.split('\n\n').filter(section => 
        section.trim() && !section.startsWith('#')
      );

      // Parse each section of the single category template
      let category: MainCategory | null = null;
      const errors: string[] = [];

      for (const section of sections) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) continue;

        const headers = lines[0].split(',').map(h => h.trim());
        
        // Determine section type and process accordingly
        if (headers.includes('Main Category Name*')) {
          // Main category section
          const values = lines[1]?.split(',').map(v => v.trim()) || [];
          category = {
            id: Date.now().toString(),
            name: values[0] || 'New Category',
            color: values[1] || '#3B82F6',
            isActive: true,
            subcategories: [],
            specialItems: [],
            permissions: ['view', 'create', 'edit']
          };
        }
        // Additional processing for subcategories, products, etc. would go here
      }

      if (!category) {
        throw new Error('No valid category data found');
      }

      return { category, errors };
    } catch (error) {
      throw new Error(`Failed to process single category upload: ${error.message}`);
    }
  }
}

export default TemplateService;