import React from 'react';

interface ServicesFinishesStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function ServicesFinishesStep({ glassQuoteData, onUpdate }: ServicesFinishesStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Services & Finishes (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Add additional services and surface finishes to your glass panels.
      </p>
      
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <p className="text-lg font-medium">Services & Surface Finishes</p>
        <p className="text-sm">Add additional services and surface finishing options.</p>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => onUpdate({ services: [], surfaceFinishes: [] })}
          className="btn btn-secondary btn-md"
        >
          Skip Services & Finishes
        </button>
      </div>
    </div>
  );
}