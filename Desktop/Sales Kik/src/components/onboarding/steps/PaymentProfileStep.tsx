import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

export function PaymentProfileStep({ data, onChange }: StepProps) {
  const [showAddProfile, setShowAddProfile] = useState(data.paymentProfiles.length === 0);

  const defaultProfiles = [
    {
      name: 'Cash Sale',
      terms: 'Payment due on receipt',
      methods: ['cash', 'card'],
      notes: 'Payment required at time of service',
      isDefault: true
    },
    {
      name: 'Trade Account',
      terms: 'Net 30 days',
      methods: ['bank_transfer', 'cheque'],
      notes: 'Payment due within 30 days',
      isDefault: false
    }
  ];

  const paymentMethods = [
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Credit/Debit Card' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'cheque', label: 'Cheque' },
    { id: 'bpay', label: 'BPAY' }
  ];

  const addDefaultProfiles = () => {
    onChange({
      ...data,
      paymentProfiles: defaultProfiles
    });
    setShowAddProfile(false);
  };

  const addCustomProfile = () => {
    const newProfile = {
      name: '',
      terms: '',
      methods: [],
      notes: '',
      isDefault: data.paymentProfiles.length === 0
    };
    onChange({
      ...data,
      paymentProfiles: [...data.paymentProfiles, newProfile]
    });
  };

  const updateProfile = (index: number, field: string, value: any) => {
    const updated = [...data.paymentProfiles];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, paymentProfiles: updated });
  };

  const removeProfile = (index: number) => {
    const updated = data.paymentProfiles.filter((_: any, i: number) => i !== index);
    onChange({ ...data, paymentProfiles: updated });
  };

  const togglePaymentMethod = (profileIndex: number, method: string) => {
    const profile = data.paymentProfiles[profileIndex];
    const methods = profile.methods.includes(method)
      ? profile.methods.filter((m: string) => m !== method)
      : [...profile.methods, method];
    
    updateProfile(profileIndex, 'methods', methods);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Terms</h3>
        <p className="text-gray-600">
          Set up how your customers can pay you. You can add more payment options later.
        </p>
      </div>

      {/* Quick Setup Options */}
      {data.paymentProfiles.length === 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">Quick Setup</h4>
          <p className="text-sm text-blue-700 mb-4">
            We'll create common payment profiles for your business type:
          </p>
          <div className="space-y-3 mb-4">
            {defaultProfiles.map((profile, index) => (
              <div key={index} className="bg-white rounded p-3 border border-blue-200">
                <h5 className="font-medium text-gray-900">{profile.name}</h5>
                <p className="text-sm text-gray-600">{profile.terms}</p>
                <div className="flex gap-2 mt-1">
                  {profile.methods.map(method => (
                    <span key={method} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {paymentMethods.find(m => m.id === method)?.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={addDefaultProfiles}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use These Defaults
            </button>
            <button
              onClick={() => setShowAddProfile(true)}
              className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create Custom
            </button>
          </div>
        </div>
      )}

      {/* Existing Profiles */}
      {data.paymentProfiles.map((profile: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Payment Profile {index + 1}
              {profile.isDefault && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Default</span>
              )}
            </h4>
            {data.paymentProfiles.length > 1 && (
              <button
                onClick={() => removeProfile(index)}
                className="text-gray-400 hover:text-red-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Cash Sale, Trade Account"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms *</label>
              <input
                type="text"
                value={profile.terms}
                onChange={(e) => updateProfile(index, 'terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Payment due on receipt, Net 30 days"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Payment Methods *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <label key={method.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.methods.includes(method.id)}
                    onChange={() => togglePaymentMethod(index, method.id)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={profile.notes}
              onChange={(e) => updateProfile(index, 'notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Additional notes that will appear on invoices..."
              rows={2}
            />
          </div>
        </div>
      ))}

      {/* Add Profile Button */}
      {data.paymentProfiles.length > 0 && (
        <button
          onClick={addCustomProfile}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Another Payment Profile
        </button>
      )}
    </div>
  );
}