import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface GlassTemplate {
  id: string;
  name: string;
  description?: string;
  shapeType: string;
  presetSpecs: any;
  pricingRules: any;
  imageUrl?: string;
}

interface TemplatesStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function TemplatesStep({ glassQuoteData, onUpdate }: TemplatesStepProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['glassTemplates'],
    queryFn: async (): Promise<GlassTemplate[]> => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/glass/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch glass templates');
      }
      
      return response.json();
    }
  });

  const applyTemplate = (template: GlassTemplate) => {
    // Apply template specifications to current glass item
    const templateSpecs = template.presetSpecs;
    
    onUpdate({ 
      selectedTemplate: template,
      // Apply any template-specific processing
      ...templateSpecs
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Templates (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Choose from preset configurations to speed up your quote. Templates include common shapes and processing options.
      </p>

      {templates?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => applyTemplate(template)}
              className={`
                card p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
                ${glassQuoteData.selectedTemplate?.id === template.id
                  ? 'border-[#6B7FCC] bg-[#6B7FCC]/5 ring-2 ring-[#6B7FCC]/20'
                  : 'border-gray-200 hover:border-[#6B7FCC]/50'
                }
              `}
            >
              {template.imageUrl && (
                <img 
                  src={template.imageUrl} 
                  alt={template.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold text-lg">{template.name}</h3>
              {template.description && (
                <p className="text-gray-600 text-sm mt-1">{template.description}</p>
              )}
              <div className="mt-2 text-sm text-[#6B7FCC]">
                Shape: {template.shapeType}
              </div>
              
              {glassQuoteData.selectedTemplate?.id === template.id && (
                <div className="mt-3 flex items-center text-[#6B7FCC]">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Template Applied
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No templates available</p>
          <p className="text-sm">Templates will help speed up future quotes.</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => onUpdate({ selectedTemplate: null })}
          className="btn btn-secondary btn-md"
        >
          Skip Templates (Create Custom)
        </button>
      </div>
    </div>
  );
}