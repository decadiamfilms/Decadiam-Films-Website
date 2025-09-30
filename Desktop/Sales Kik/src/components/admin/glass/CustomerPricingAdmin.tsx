import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassDropdown } from '../../glass/GlassDropdown';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  UsersIcon,
  TagIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

interface CustomerGlassPrice {
  id: string;
  customerId: string;
  glassProductId: string;
  customerPrice: number;
  customer: {
    name: string;
    email: string;
  };
  glassProduct: {
    thickness: number;
    productType: string;
    basePrice: number;
    glassType: {
      name: string;
    };
  };
}

export function CustomerPricingAdmin() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  const { data: customerPrices, isLoading } = useQuery({
    queryKey: ['admin-customer-glass-prices'],
    queryFn: async (): Promise<CustomerGlassPrice[]> => {
      // Mock data showing customer-specific pricing
      return [
        {
          id: '1',
          customerId: 'customer-1',
          glassProductId: 'product-1',
          customerPrice: 23.00, // Discounted from base price of 25.50
          customer: {
            name: 'ABC Construction',
            email: 'contact@abcconstruction.com.au'
          },
          glassProduct: {
            thickness: 4,
            productType: 'NOT_TOUGHENED',
            basePrice: 25.50,
            glassType: {
              name: 'Clear Glass'
            }
          }
        },
        {
          id: '2',
          customerId: 'customer-1',
          glassProductId: 'product-3',
          customerPrice: 48.00, // Discounted from base price of 52.00
          customer: {
            name: 'ABC Construction',
            email: 'contact@abcconstruction.com.au'
          },
          glassProduct: {
            thickness: 6,
            productType: 'TOUGHENED',
            basePrice: 52.00,
            glassType: {
              name: 'Clear Glass'
            }
          }
        }
      ];
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-for-glass-pricing'],
    queryFn: async () => {
      // Mock customer data
      return [
        { id: 'customer-1', name: 'ABC Construction', email: 'contact@abcconstruction.com.au' },
        { id: 'customer-2', name: 'XYZ Manufacturing Ltd', email: 'procurement@xyzmanufacturing.com' },
        { id: 'customer-3', name: 'Coastal Homes NSW', email: 'orders@coastalhomes.com.au' }
      ];
    }
  });

  const { data: glassProducts } = useQuery({
    queryKey: ['glass-products-for-pricing'],
    queryFn: async () => {
      // Mock product data
      return [
        { 
          id: 'product-1', 
          thickness: 4, 
          productType: 'NOT_TOUGHENED', 
          basePrice: 25.50,
          glassType: { name: 'Clear Glass' }
        },
        { 
          id: 'product-2', 
          thickness: 6, 
          productType: 'NOT_TOUGHENED', 
          basePrice: 32.00,
          glassType: { name: 'Clear Glass' }
        },
        { 
          id: 'product-3', 
          thickness: 6, 
          productType: 'TOUGHENED', 
          basePrice: 52.00,
          glassType: { name: 'Clear Glass' }
        }
      ];
    }
  });

  const filteredCustomerPrices = customerPrices?.filter(cp =>
    cp.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cp.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cp.glassProduct.glassType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Pricing</h2>
          <p className="text-base text-gray-600 mt-1">
            Set customer-specific pricing overrides to offer special rates to key customers
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Customer Pricing
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, email, or glass type..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
        </div>
      </div>

      {/* Customer Pricing Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">
                  Glass Product
                </th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-600 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-600 uppercase tracking-wider">
                  Customer Price
                </th>
                <th className="px-6 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">
                  Savings
                </th>
                <th className="px-6 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomerPrices?.map((pricing, index) => {
                const savings = pricing.glassProduct.basePrice - pricing.customerPrice;
                const savingsPercent = (savings / pricing.glassProduct.basePrice) * 100;
                
                return (
                  <tr key={pricing.id} className={`hover:bg-blue-50 hover:shadow-sm transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900">{pricing.customer.name}</div>
                          <div className="text-sm text-gray-500">{pricing.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-base font-medium text-gray-900">
                          {pricing.glassProduct.glassType.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {pricing.glassProduct.thickness}mm • {pricing.glassProduct.productType.toLowerCase().replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-base text-gray-900 line-through">
                        ${pricing.glassProduct.basePrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-lg font-bold text-[#6B7FCC]">
                        ${pricing.customerPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-sm font-bold text-green-600">
                        ${savings.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-500">
                        ({savingsPercent.toFixed(1)}% off)
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit pricing"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Remove this customer pricing override?')) {
                              // Delete logic here
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove pricing"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!filteredCustomerPrices?.length && (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching customer pricing found' : 'No Customer Pricing Set'}
            </h3>
            <p className="text-base text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Set special pricing for key customers to offer competitive rates'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-base flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="w-4 h-4" />
                Add Customer Pricing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}