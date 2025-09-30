import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface GlassProduct {
  id: string;
  glassTypeId: string;
  productType: 'TOUGHENED' | 'NOT_TOUGHENED';
  thickness: number;
  basePrice: number;
  isActive: boolean;
}

interface CustomerGlassPrice {
  id: string;
  customerId: string;
  glassProductId: string;
  customerPrice: number;
}

interface ProductThicknessStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
  customerId: string | null;
}

export function ProductThicknessStep({ glassQuoteData, onUpdate, customerId }: ProductThicknessStepProps) {
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['glassProducts', glassQuoteData.selectedGlassType?.id],
    queryFn: async (): Promise<GlassProduct[]> => {
      if (!glassQuoteData.selectedGlassType?.id) return [];
      
      // Return seeded data based on selected glass type
      const allProducts = [
        // Clear Glass Products
        { id: '1', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 25.50, isActive: true },
        { id: '2', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 5, basePrice: 28.75, isActive: true },
        { id: '3', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 32.00, isActive: true },
        { id: '4', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 38.50, isActive: true },
        { id: '5', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 10, basePrice: 45.00, isActive: true },
        { id: '6', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 12, basePrice: 52.50, isActive: true },
        { id: '7', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 4, basePrice: 45.00, isActive: true },
        { id: '8', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 5, basePrice: 48.75, isActive: true },
        { id: '9', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 6, basePrice: 52.00, isActive: true },
        { id: '10', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 8, basePrice: 58.50, isActive: true },
        { id: '11', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 10, basePrice: 65.00, isActive: true },
        { id: '12', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 12, basePrice: 72.50, isActive: true },
        
        // Ultra Clear Glass Products (15% premium)
        { id: '13', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 29.33, isActive: true },
        { id: '14', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 5, basePrice: 33.06, isActive: true },
        { id: '15', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 36.80, isActive: true },
        { id: '16', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 44.28, isActive: true },
        { id: '17', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 10, basePrice: 51.75, isActive: true },
        { id: '18', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 12, basePrice: 60.38, isActive: true },
        { id: '19', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 4, basePrice: 51.75, isActive: true },
        { id: '20', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 5, basePrice: 56.06, isActive: true },
        { id: '21', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 6, basePrice: 59.80, isActive: true },
        { id: '22', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 8, basePrice: 67.28, isActive: true },
        { id: '23', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 10, basePrice: 74.75, isActive: true },
        { id: '24', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 12, basePrice: 83.38, isActive: true }
      ];
      
      return allProducts.filter(p => p.glassTypeId === glassQuoteData.selectedGlassType.id);
    },
    enabled: !!glassQuoteData.selectedGlassType
  });
  
  const { data: customerPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['customerGlassPrices', customerId],
    queryFn: async (): Promise<CustomerGlassPrice[]> => {
      // Return empty array for now - no special customer pricing set up yet
      return [];
    },
    enabled: !!customerId
  });

  const getCustomerPrice = (product: GlassProduct) => {
    const customerPrice = customerPrices?.find(cp => cp.glassProductId === product.id);
    return customerPrice ? customerPrice.customerPrice : product.basePrice;
  };

  const groupedProducts = products?.reduce((acc: Record<string, GlassProduct[]>, product) => {
    if (!acc[product.productType]) acc[product.productType] = [];
    acc[product.productType].push(product);
    return acc;
  }, {});

  if (!glassQuoteData.selectedGlassType) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <p className="text-gray-500">Please select a glass type first.</p>
      </div>
    );
  }

  if (productsLoading || pricesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Product Type & Thickness</h2>
      <p className="text-gray-600 mb-6">
        Select whether you need toughened glass and choose the thickness.
      </p>

      {Object.entries(groupedProducts || {}).map(([productType, typeProducts]) => (
        <div key={productType} className="mb-8">
          <h3 className="text-xl font-semibold mb-4 capitalize">
            {productType.toLowerCase().replace('_', ' ')} Glass
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {typeProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onUpdate({ 
                  selectedProductType: productType,
                  selectedProduct: product 
                })}
                className={`
                  card p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
                  ${glassQuoteData.selectedProduct?.id === product.id
                    ? 'border-[#6B7FCC] bg-[#6B7FCC]/5 ring-2 ring-[#6B7FCC]/20'
                    : 'border-gray-200 hover:border-[#6B7FCC]/50'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {product.thickness}mm
                  </div>
                  <div className="text-lg font-semibold text-[#6B7FCC] mb-2">
                    ${getCustomerPrice(product).toFixed(2)}/m²
                  </div>
                  {customerPrices?.find(cp => cp.glassProductId === product.id) && (
                    <div className="text-xs text-green-600 mb-2">
                      Custom Price
                    </div>
                  )}
                  {product.basePrice !== getCustomerPrice(product) && (
                    <div className="text-xs text-gray-500 line-through">
                      ${product.basePrice.toFixed(2)}/m²
                    </div>
                  )}
                  
                  {glassQuoteData.selectedProduct?.id === product.id && (
                    <div className="mt-3 flex items-center justify-center text-[#6B7FCC]">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!products?.length) && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No products available</p>
          <p className="text-sm">No products found for the selected glass type.</p>
        </div>
      )}
    </div>
  );
}