import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

export function BusinessTypeStep({ data, onChange }: StepProps) {
  const [selectedMarket, setSelectedMarket] = useState<'TRADIES' | 'SME' | ''>(data.targetMarket || '');

  const businessTypes = [
    {
      id: 'TRADIES',
      title: '🔧 Tradies & Sole Traders',
      description: 'Mobile-first tools for on-the-go professionals',
      features: [
        'Quick quotes on mobile',
        'Simple invoicing & payments', 
        'Basic job tracking',
        'Customer management',
        'On-site photo timestamps'
      ],
      corePrice: 15,
      exampleModules: [
        { name: 'Core System', price: 15 },
        { name: 'Product Catalog', price: 8 },
        { name: 'Job Scheduling', price: 10 },
        { name: 'Simple Reports', price: 6 }
      ],
      totalExample: 39
    },
    {
      id: 'SME',
      title: '🏢 Small Business',
      description: 'Comprehensive business management with advanced features',
      features: [
        'Advanced quote workflows',
        'Team collaboration & permissions',
        'Multi-location inventory',
        'Detailed analytics & reporting',
        'API access & integrations'
      ],
      corePrice: 25,
      exampleModules: [
        { name: 'Core System', price: 25 },
        { name: 'Product Catalog', price: 18 },
        { name: 'Inventory Management', price: 22 },
        { name: 'Advanced Analytics', price: 16 }
      ],
      totalExample: 81
    }
  ];

  const industries = [
    'Glass & Glazing', 'Construction', 'Electrical', 'Plumbing', 'HVAC',
    'Carpentry', 'Painting', 'Landscaping', 'Cleaning', 'Manufacturing',
    'Retail', 'Wholesale', 'Other'
  ];

  const teamSizeOptions = {
    TRADIES: [
      { value: 'SOLO', label: 'Just me (1 person)' }
    ],
    SME: [
      { value: 'SMALL_TEAM', label: 'Small team (2-5 people)' },
      { value: 'MEDIUM_TEAM', label: 'Medium team (6-20 people)' },
      { value: 'LARGE_TEAM', label: 'Large team (21+ people)' }
    ]
  };

  const handleMarketSelection = (marketType: 'TRADIES' | 'SME') => {
    setSelectedMarket(marketType);
    onChange({
      ...data, 
      targetMarket: marketType,
      // Reset team size when switching markets
      teamSize: marketType === 'TRADIES' ? 'SOLO' : ''
    });
  };

  return (
    <div className="space-y-8">
      {/* Market Selection Cards */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">What best describes your business?</h3>
        <p className="text-gray-600 mb-6">This determines your pricing and available features</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businessTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleMarketSelection(type.id as 'TRADIES' | 'SME')}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                selectedMarket === type.id
                  ? 'border-amber-500 bg-amber-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{type.title}</h4>
              <p className="text-gray-600 mb-4">{type.description}</p>
              
              {/* Pricing Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Core System</span>
                  <span className="text-lg font-bold text-amber-600">${type.corePrice}/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">+ optional modules from ${type.exampleModules[1].price}/month</p>
                <p className="text-xs text-green-600">Example: ${type.totalExample}/month for full setup</p>
              </div>
              
              <ul className="space-y-2">
                {type.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {selectedMarket === type.id && (
                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">✓ Selected</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Industry & Team Size - Only show after market selection */}
      {selectedMarket && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
            <select
              value={data.industryType || ''}
              onChange={(e) => onChange({...data, industryType: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              <option value="">Select your industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Size *</label>
            <select
              value={data.teamSize || ''}
              onChange={(e) => onChange({...data, teamSize: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              <option value="">Select team size</option>
              {(teamSizeOptions[selectedMarket] || []).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Smart Recommendation Based on Selection */}
      {selectedMarket && data.industryType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">
            {selectedMarket === 'TRADIES' ? 'Perfect for Mobile Professionals!' : 'Great for Growing Businesses!'}
          </h4>
          <p className="text-blue-800">
            {selectedMarket === 'TRADIES' 
              ? `Our mobile-first tools are perfect for ${data.industryType} professionals. Get quotes done on-site and take payments immediately.`
              : `Our comprehensive platform helps ${data.industryType} businesses manage teams, inventory, and growth efficiently.`
            }
          </p>
        </div>
      )}
    </div>
  );
}