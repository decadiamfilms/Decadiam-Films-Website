import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassDropdown } from '../../glass/GlassDropdown';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon 
} from '@heroicons/react/24/outline';

interface GlassTemplate {
  id: string;
  name: string;
  description?: string;
  shapeType: string;
  presetSpecs: any;
  pricingRules: any;
  imageUrl?: string;
  isActive: boolean;
}

export function TemplatesAdmin() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    shapeType: '',
    imageUrl: ''
  });

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-glass-templates'],
    queryFn: async (): Promise<GlassTemplate[]> => {
      // Mock data based on the seed specifications
      return [
        {
          id: 'template-standard-shower-screen',
          name: 'Standard Shower Screen',
          description: 'Common shower screen panel with standard processing',
          shapeType: 'Rectangle',
          presetSpecs: {
            heightMm: 2000,
            widthMm: 900,
            defaultEdgework: ['flat-polished-edge'],
            defaultCorners: ['tip-corners']
          },
          pricingRules: {
            minimumThickness: 6,
            recommendedType: 'TOUGHENED'
          },
          isActive: true
        },
        {
          id: 'template-tabletop-glass',
          name: 'Tabletop Glass',
          description: 'Standard table top with polished edges',
          shapeType: 'Rectangle',
          presetSpecs: {
            defaultEdgework: ['flat-polished-edge'],
            defaultCorners: ['radius-polished-5mm']
          },
          pricingRules: {
            minimumThickness: 6,
            recommendedType: 'TOUGHENED'
          },
          isActive: true
        },
        {
          id: 'template-window-panel',
          name: 'Window Panel',
          description: 'Standard window glazing panel',
          shapeType: 'Rectangle',
          presetSpecs: {
            defaultEdgework: ['arrised-edge']
          },
          pricingRules: {
            minimumThickness: 4,
            recommendedType: 'NOT_TOUGHENED'
          },
          isActive: true
        }
      ];
    }
  });

  const shapeTypes = [
    { value: 'Rectangle', label: 'Rectangle' },
    { value: 'Circle', label: 'Circle' },
    { value: 'Custom', label: 'Custom Shape' },
    { value: 'Oval', label: 'Oval' },
    { value: 'Triangle', label: 'Triangle' }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Glass Templates</h2>
          <p className="text-base text-gray-600 mt-1">
            Create preset configurations for common glass applications to speed up quoting
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Template
        </button>
      </div>

      {/* Add New Template Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Create New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Template Name *</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g. Standard Shower Screen"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
            
            <GlassDropdown
              label="Shape Type"
              required
              value={newTemplate.shapeType}
              placeholder="Select Shape"
              options={shapeTypes}
              onChange={(value) => setNewTemplate({ ...newTemplate, shapeType: value })}
            />
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={newTemplate.imageUrl}
                onChange={(e) => setNewTemplate({ ...newTemplate, imageUrl: e.target.value })}
                placeholder="https://example.com/template-image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-base font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="Describe the template and its typical use case"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                // Add template logic here
                setIsAddingNew(false);
                setNewTemplate({ name: '', description: '', shapeType: '', imageUrl: '' });
              }}
              disabled={!newTemplate.name.trim() || !newTemplate.shapeType}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Create Template
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewTemplate({ name: '', description: '', shapeType: '', imageUrl: '' });
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            {/* Template Image */}
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {template.imageUrl ? (
                <img 
                  src={template.imageUrl} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhotoIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-bold text-gray-900">{template.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description || 'No description available'}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="px-2 py-1 bg-[#6B7FCC]/10 text-[#6B7FCC] rounded-full font-medium">
                  {template.shapeType}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setEditingId(template.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit template"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this template?')) {
                        // Delete logic here
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!templates?.length && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
            <p className="text-base text-gray-600 mb-4">
              Create templates to speed up common glass configurations and improve quoting efficiency.
            </p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-base flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Create First Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}