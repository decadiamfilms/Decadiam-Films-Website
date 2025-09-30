import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface GlassType {
  id: string;
  name: string;
  description?: string;
}

interface GlassTypeStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function GlassTypeStep({ glassQuoteData, onUpdate }: GlassTypeStepProps) {
  const { data: glassTypes, isLoading } = useQuery({
    queryKey: ['glassTypes'],
    queryFn: async (): Promise<GlassType[]> => {
      // Return the seeded data directly for now
      return [
        {
          id: 'glass-type-clear',
          name: 'Clear Glass',
          description: 'Standard clear float glass for general applications'
        },
        {
          id: 'glass-type-ultra-clear',
          name: 'Ultra Clear Glass',
          description: 'Low-iron glass with exceptional clarity and minimal green tint'
        },
        {
          id: 'glass-type-tinted',
          name: 'Tinted Glass',
          description: 'Solar control glass available in bronze, grey, and green tints'
        }
      ];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Select Glass Type</h2>
      <p className="text-gray-600 mb-6">
        Choose the type of glass for your project. Each type has different properties and pricing.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {glassTypes?.map((type) => (
          <div
            key={type.id}
            onClick={() => onUpdate({ selectedGlassType: type })}
            className={`
              card p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
              ${glassQuoteData.selectedGlassType?.id === type.id
                ? 'border-[#6B7FCC] bg-[#6B7FCC]/5 ring-2 ring-[#6B7FCC]/20'
                : 'border-gray-200 hover:border-[#6B7FCC]/50'
              }
            `}
          >
            <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
            {type.description && (
              <p className="text-gray-600 text-sm">{type.description}</p>
            )}
            
            {glassQuoteData.selectedGlassType?.id === type.id && (
              <div className="mt-4 flex items-center text-[#6B7FCC]">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {!glassTypes?.length && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No glass types available</p>
          <p className="text-sm">Contact your administrator to set up glass types.</p>
        </div>
      )}
    </div>
  );
}