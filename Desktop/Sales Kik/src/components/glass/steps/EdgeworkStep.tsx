import React from 'react';

interface EdgeworkStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function EdgeworkStep({ glassQuoteData, onUpdate }: EdgeworkStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edgework (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Select edge finishing options for your glass panels.
      </p>
      
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        <p className="text-lg font-medium">Edgework Options</p>
        <p className="text-sm">Configure edge finishing options for your glass.</p>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => onUpdate({ edgework: [] })}
          className="btn btn-secondary btn-md"
        >
          Skip Edgework
        </button>
      </div>
    </div>
  );
}