import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  CircleStackIcon,
  Square3Stack3DIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface ProcessingOption {
  id: string;
  type: string;
  name: string;
  description?: string;
  baseRate: number;
  rateType: string;
  isActive: boolean;
}

export function ProcessingOptionsAdmin() {
  const [activeSection, setActiveSection] = useState('EDGEWORK');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOption, setNewOption] = useState({
    name: '',
    description: '',
    baseRate: '15',
    rateType: 'PER_METER'
  });

  const queryClient = useQueryClient();

  const sections = [
    { 
      id: 'EDGEWORK', 
      label: 'Edgework', 
      icon: WrenchScrewdriverIcon,
      description: 'Edge finishing options',
      defaultRate: 'PER_METER'
    },
    { 
      id: 'CORNER', 
      label: 'Corner Finishes', 
      icon: CircleStackIcon,
      description: 'Corner treatment options',
      defaultRate: 'PER_PIECE'
    },
    { 
      id: 'HOLE', 
      label: 'Holes & Cutouts', 
      icon: Square3Stack3DIcon,
      description: 'Drilling and cutting services',
      defaultRate: 'PER_PIECE'
    },
    { 
      id: 'SERVICE', 
      label: 'Services', 
      icon: CogIcon,
      description: 'Additional services and labor',
      defaultRate: 'FIXED'
    },
    { 
      id: 'FINISH', 
      label: 'Surface Finishes', 
      icon: BeakerIcon,
      description: 'Surface treatments and coatings',
      defaultRate: 'PER_SQM'
    }
  ];

  // Fetch processing options from API
  const { data: allProcessingOptions, isLoading } = useQuery({
    queryKey: ['admin-processing-options'],
    queryFn: async (): Promise<ProcessingOption[]> => {
      const response = await fetch('/api/glass/processing-options', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch processing options');
      const data = await response.json();
      
      // Flatten all processing options into a single array
      const allOptions: ProcessingOption[] = [];
      Object.entries(data).forEach(([category, options]: [string, any]) => {
        if (Array.isArray(options)) {
          options.forEach((option: any) => {
            allOptions.push({
              ...option,
              type: category.toUpperCase() === 'CORNERFINISH' ? 'CORNER' : 
                    category.toUpperCase() === 'HOLESCUTOUTS' ? 'HOLE' :
                    category.toUpperCase() === 'SURFACEFINISH' ? 'FINISH' :
                    category.toUpperCase()
            });
          });
        }
      });
      return allOptions;
    }
  });

  // Create processing option mutation  
  const createProcessingOptionMutation = useMutation({
    mutationFn: async (data: { type: string; name: string; description?: string; baseRate: number; rateType: string }) => {
      // For now, use a simple direct database insert via our API
      const response = await fetch('/api/glass/processing-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create processing option');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-processing-options'] });
      setNewOption({
        name: '',
        description: '',
        baseRate: getDefaultRate(activeSection),
        rateType: sections.find(s => s.id === activeSection)?.defaultRate || 'PER_METER'
      });
      setIsAddingNew(false);
    }
  });

  const getDefaultRate = (type: string) => {
    const defaults = {
      'EDGEWORK': '15',
      'CORNER': '8',
      'HOLE': '12',
      'SERVICE': '50',
      'FINISH': '18'
    };
    return defaults[type as keyof typeof defaults] || '15';
  };

  const handleCreateOption = () => {
    if (!newOption.name.trim() || !newOption.baseRate) return;
    createProcessingOptionMutation.mutate({
      type: activeSection,
      name: newOption.name.trim(),
      description: newOption.description.trim() || undefined,
      baseRate: parseFloat(newOption.baseRate),
      rateType: newOption.rateType
    });
  };

  // Get options for current section
  const currentOptions = allProcessingOptions?.filter(option => option.type === activeSection) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading processing options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const optionCount = allProcessingOptions?.filter(opt => opt.type === section.id).length || 0;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsAddingNew(false);
                  const currentSection = sections.find(s => s.id === section.id);
                  setNewOption({
                    name: '',
                    description: '',
                    baseRate: getDefaultRate(section.id),
                    rateType: currentSection?.defaultRate || 'PER_METER'
                  });
                }}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {section.label}
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {optionCount}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h3>
            <p className="text-sm text-gray-600">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Option
          </button>
        </div>

        {/* Add New Form */}
        {isAddingNew && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-3">Add New Processing Option</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Option Name</label>
                <input
                  type="text"
                  value={newOption.name}
                  onChange={(e) => setNewOption(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Polished Edge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                <select
                  value={newOption.rateType}
                  onChange={(e) => setNewOption(prev => ({ ...prev, rateType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PER_METER">Per Meter</option>
                  <option value="PER_PIECE">Per Piece</option>
                  <option value="PER_SQM">Per m²</option>
                  <option value="FIXED">Fixed Rate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newOption.baseRate}
                    onChange={(e) => setNewOption(prev => ({ ...prev, baseRate: e.target.value }))}
                    placeholder="15.00"
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newOption.description}
                  onChange={(e) => setNewOption(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateOption}
                disabled={!newOption.name.trim() || !newOption.baseRate || createProcessingOptionMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                {createProcessingOptionMutation.isPending ? 'Creating...' : 'Create Option'}
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Option Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <CogIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {sections.find(s => s.id === activeSection)?.label.toLowerCase()} options yet
                      </h3>
                      <p className="text-gray-600 mb-4">Create your first processing option</p>
                      <button
                        onClick={() => setIsAddingNew(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add Option
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentOptions.map((option) => (
                    <tr key={option.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{option.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-bold">${option.baseRate?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {option.rateType.replace('PER_', '').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{option.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-medium text-gray-900">{currentOptions.length}</div>
                <div className="text-sm text-gray-500">Options Available</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-medium text-gray-900">
                  {currentOptions.filter(opt => opt.isActive !== false).length}
                </div>
                <div className="text-sm text-gray-500">Active Options</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-xl">💰</div>
              </div>
              <div className="ml-3">
                <div className="text-lg font-medium text-gray-900">
                  ${currentOptions.length ? 
                    (currentOptions.reduce((sum, opt) => sum + (opt.baseRate || 0), 0) / currentOptions.length).toFixed(2) :
                    '0.00'
                  }
                </div>
                <div className="text-sm text-gray-500">Average Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Square3Stack3DIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-medium text-gray-900">
                  {sections.find(s => s.id === activeSection)?.defaultRate.replace('PER_', '')}
                </div>
                <div className="text-sm text-gray-500">Default Rate Type</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}