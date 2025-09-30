import React from 'react';

interface HolesCutoutsStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function HolesCutoutsStep({ glassQuoteData, onUpdate }: HolesCutoutsStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Holes & Cutouts (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Add holes and cutouts to your glass panels.
      </p>
      
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <p className="text-lg font-medium">Holes & Cutouts</p>
        <p className="text-sm">Add holes and cutout specifications for your glass.</p>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => onUpdate({ holesAndCutouts: [] })}
          className="btn btn-secondary btn-md"
        >
          Skip Holes & Cutouts
        </button>
      </div>
    </div>
  );
}