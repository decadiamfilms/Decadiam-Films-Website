import React, { useState } from 'react';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

export function BusinessProfileStep({ data, onChange }: StepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange({ ...data, logoFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-gray-400 text-xs">Logo</span>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
              Upload Logo
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => onChange({ ...data, businessName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter your business name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trading Name</label>
          <input
            type="text"
            value={data.tradingName}
            onChange={(e) => onChange({ ...data, tradingName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="If different from business name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="business@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="04XX XXX XXX"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ABN/ACN</label>
          <input
            type="text"
            value={data.abnAcn}
            onChange={(e) => onChange({ ...data, abnAcn: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="12 345 678 901"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => onChange({ ...data, website: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* GST Registration Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">GST Registration</h3>
        
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={data.gstEnabled || false}
            onChange={(e) => onChange({ ...data, gstEnabled: e.target.checked })}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-1"
          />
          <div className="ml-3">
            <label className="block text-sm font-medium text-gray-900">
              My business is GST registered
            </label>
            <p className="text-sm text-gray-500">
              Check this if your business is registered for GST (required for businesses with $75,000+ annual turnover)
            </p>
          </div>
        </div>
        
        {data.gstEnabled && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number *</label>
            <input
              type="text"
              value={data.gstNumber || ''}
              onChange={(e) => onChange({ ...data, gstNumber: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="12 345 678 901"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This will appear on all tax invoices</p>
          </div>
        )}
      </div>
    </div>
  );
}