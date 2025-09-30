import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

function PlanSelectionStep({ data, onChange }: StepProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(data.selectedPlan || '');

  const plans = [
    {
      id: 'tradie',
      name: 'Tradie',
      price: '$49',
      subtitle: 'Perfect for solo tradies',
      features: [
        'Up to 3 users',
        'Basic quotes & invoices',
        'Simple customer management',
        'Mobile app access',
        'Email support'
      ]
    },
    {
      id: 'small-business',
      name: 'Small Business',
      price: '$149',
      subtitle: 'Great for growing teams',
      popular: true,
      features: [
        'Up to 15 users',
        'Advanced inventory management',
        'Purchase order system',
        'Team collaboration',
        'Priority phone support',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      subtitle: 'For large organizations',
      features: [
        'Unlimited users',
        'Multi-location management',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom training'
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onChange({
      ...data,
      selectedPlan: planId
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that works best for your business</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={plan.id !== 'enterprise' ? () => handlePlanSelect(plan.id) : undefined}
            className={`relative bg-white border-2 rounded-xl p-6 transition-all ${
              plan.id === 'enterprise' 
                ? 'border-gray-300 bg-gray-50'
                : selectedPlan === plan.id
                  ? 'border-blue-500 ring-4 ring-blue-100 cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Selected Indicator - Not for Enterprise */}
            {selectedPlan === plan.id && plan.id !== 'enterprise' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{plan.subtitle}</p>
              <div className="text-3xl font-bold text-gray-900">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-lg text-gray-500">/month</span>}
              </div>
              {plan.price !== 'Custom' && (
                <p className="text-sm text-gray-500 mt-1">14-day free trial</p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="mt-auto">
              {plan.id === 'enterprise' ? (
                <div className="space-y-3">
                  <div className="text-center py-2 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Contact Sales</p>
                  </div>
                  <div className="space-y-2 text-center">
                    <a 
                      href="tel:+61234567890" 
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      📞 +61 2 3456 7890
                    </a>
                    <a 
                      href="mailto:enterprise@saleskik.com" 
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      ✉️ enterprise@saleskik.com
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    selectedPlan === plan.id
                      ? 'bg-blue-600 text-white'
                      : plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Plan Comparison */}
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Not sure which plan to choose?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">Tradie Plan</h4>
            <p className="text-gray-600">Perfect for solo workers and small teams who need simple, mobile-friendly tools</p>
          </div>
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">Small Business</h4>
            <p className="text-gray-600">Ideal for growing businesses that need inventory management and team features</p>
          </div>
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">Enterprise</h4>
            <p className="text-gray-600">Custom solutions for large organizations with complex requirements</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanSelectionStep;