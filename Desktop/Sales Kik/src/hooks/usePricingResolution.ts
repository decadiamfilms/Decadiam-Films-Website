import { useState, useCallback } from 'react';

interface PricingResult {
  price: number;
  type: 'custom' | 'tier' | 'error';
  margin?: number;
  tier?: number;
  source?: string;
  error?: string;
}

interface Customer {
  id: string;
  name: string;
  priceTier?: string;
}

interface Product {
  id: string;
  priceT1: number;
  priceT2: number;
  priceT3: number;
  priceRetail: number;
}

export function usePricingResolution() {
  const [pricingCache, setPricingCache] = useState<Record<string, PricingResult>>({});
  const [loading, setLoading] = useState(false);

  const getPriceForCustomer = useCallback(async (
    product: Product, 
    customer: Customer | null
  ): Promise<number> => {
    if (!customer) {
      return product.priceRetail;
    }

    const cacheKey = `${customer.id}-${product.id}`;
    
    // Check cache first
    if (pricingCache[cacheKey]) {
      const cached = pricingCache[cacheKey];
      if (cached.type !== 'error') {
        return cached.price;
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/pricing/resolve/${customer.id}/${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to resolve pricing');
      }

      const result = await response.json();
      const pricingResult: PricingResult = result.data;

      // Cache the result
      setPricingCache(prev => ({
        ...prev,
        [cacheKey]: pricingResult
      }));

      return pricingResult.price;
    } catch (error) {
      console.error('Error resolving price:', error);
      
      // Cache error and fallback to tier pricing
      const fallbackPrice = getFallbackTierPrice(product, customer);
      setPricingCache(prev => ({
        ...prev,
        [cacheKey]: {
          price: fallbackPrice,
          type: 'tier',
          source: 'fallback'
        }
      }));
      
      return fallbackPrice;
    }
  }, [pricingCache]);

  const bulkResolvePricing = useCallback(async (
    customerId: string,
    products: Product[]
  ): Promise<Record<string, PricingResult>> => {
    if (!customerId || products.length === 0) {
      return {};
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/pricing/bulk-resolve/${customerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_ids: products.map(p => p.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk resolve pricing');
      }

      const result = await response.json();
      const pricing: Record<string, PricingResult> = result.data;

      // Update cache
      const newCache: Record<string, PricingResult> = {};
      Object.entries(pricing).forEach(([productId, pricingResult]) => {
        const cacheKey = `${customerId}-${productId}`;
        newCache[cacheKey] = pricingResult;
      });

      setPricingCache(prev => ({ ...prev, ...newCache }));
      return pricing;
    } catch (error) {
      console.error('Error bulk resolving pricing:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getPricingInfo = useCallback((productId: string, customerId: string): PricingResult | null => {
    const cacheKey = `${customerId}-${productId}`;
    return pricingCache[cacheKey] || null;
  }, [pricingCache]);

  const invalidateCache = useCallback((customerId?: string, productId?: string) => {
    if (customerId && productId) {
      const cacheKey = `${customerId}-${productId}`;
      setPricingCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });
    } else if (customerId) {
      // Clear all prices for a customer
      setPricingCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          if (key.startsWith(`${customerId}-`)) {
            delete newCache[key];
          }
        });
        return newCache;
      });
    } else {
      // Clear all cache
      setPricingCache({});
    }
  }, []);

  const savePriceToCustomerList = useCallback(async (
    customerId: string,
    productId: string,
    newPrice: number,
    reason?: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/custom-pricelists/customers/${customerId}/products/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custom_price: newPrice,
          reason: reason || 'Price updated during quote/order creation'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save custom price');
      }

      // Invalidate cache for this customer-product combination
      invalidateCache(customerId, productId);
      return true;
    } catch (error) {
      console.error('Error saving custom price:', error);
      return false;
    }
  }, [invalidateCache]);

  return {
    getPriceForCustomer,
    bulkResolvePricing,
    getPricingInfo,
    invalidateCache,
    savePriceToCustomerList,
    loading,
    pricingCache
  };
}

// Fallback function for tier pricing when API fails
function getFallbackTierPrice(product: Product, customer: Customer): number {
  const tier = customer.priceTier || 
              (customer as any).accountDetails?.paymentTerms <= 15 ? 'T1' : 
              (customer as any).accountDetails?.paymentTerms <= 30 ? 'T2' : 'T3';
  
  switch (tier) {
    case 'T1': return product.priceT1;
    case 'T2': return product.priceT2;
    case 'T3': return product.priceT3;
    default: return product.priceRetail;
  }
}

// Pricing mixin for React components
export const PricingMixin = {
  methods: {
    async loadProductPricing(customerId: string, products: Product[]) {
      if (!customerId || !products.length) return products;
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/pricing/bulk-resolve/${customerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_ids: products.map(p => p.id)
        })
      });

      if (!response.ok) {
        return products; // Return original products if pricing fails
      }

      const result = await response.json();
      const pricing: Record<string, PricingResult> = result.data;
      
      return products.map(product => ({
        ...product,
        resolvedPrice: pricing[product.id]?.price || getFallbackTierPrice(product, { id: customerId } as Customer),
        priceType: pricing[product.id]?.type || 'tier',
        hasCustomPricing: pricing[product.id]?.type === 'custom',
        priceMargin: pricing[product.id]?.margin
      }));
    },

    async showPriceSaveModal(productId: string, newPrice: number, customerId: string, productName: string) {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Save to Custom Pricelist?</h3>
            <p class="text-gray-600 mb-4">
              Would you like to save this price ($${newPrice.toFixed(2)}) for "${productName}" 
              to this customer's custom pricelist for future use?
            </p>
            <div class="flex justify-end space-x-3">
              <button id="cancel-save" class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                No, just for this quote
              </button>
              <button id="confirm-save" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Yes, save to pricelist
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const cleanup = () => {
          document.body.removeChild(modal);
        };

        modal.querySelector('#cancel-save')?.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });

        modal.querySelector('#confirm-save')?.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            cleanup();
            resolve(false);
          }
        });
      });
    }
  }
};