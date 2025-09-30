import React from 'react';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

export function LocationStep({ data, onChange }: StepProps) {
  const australianStates = [
    'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Primary Business Location</h3>
        <p className="text-gray-600">
          This will be used for invoices, quotes, and local tax requirements.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="123 Business Street"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City/Suburb *
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Melbourne"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              value={data.state}
              onChange={(e) => onChange({ ...data, state: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              <option value="">Select state</option>
              {australianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              value={data.postcode}
              onChange={(e) => onChange({ ...data, postcode: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="3000"
              required
              pattern="[0-9]{4}"
              maxLength={4}
            />
          </div>
        </div>

        {/* Location Type Explanation */}
        <div className="bg-amber-50 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">Why do we need this?</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Appears on invoices and quotes</li>
            <li>• Required for GST and tax compliance</li>
            <li>• Helps with local payment processing</li>
            <li>• You can add multiple locations later</li>
          </ul>
        </div>

        {/* Mobile Business Option */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="mobile-business"
              checked={data.isMobileBusiness || false}
              onChange={(e) => onChange({ ...data, isMobileBusiness: e.target.checked })}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-1"
            />
            <div className="ml-3">
              <label htmlFor="mobile-business" className="block text-sm font-medium text-amber-900">
                🚐 I'm a mobile business
              </label>
              <p className="text-sm text-amber-700">
                Check this if you primarily work at customer locations rather than a fixed address.
                You can still use the above as your business postal address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}