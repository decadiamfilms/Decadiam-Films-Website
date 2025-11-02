import React from 'react';
import { useAutoStartSimpleTour, SimpleTourButton } from '../../components/tour/SimpleTour';

const ProductsPage: React.FC = () => {
  // Auto-start tour if continuing from categories
  useAutoStartSimpleTour();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Manage your products here.</p>
      </div>
      
      <div className="card p-6">
        <div className="text-gray-500 text-center py-12">
          Products module coming soon...
        </div>
      </div>
      
      {/* Simple Tour Button */}
      <SimpleTourButton />
    </div>
  );
};

export default ProductsPage;