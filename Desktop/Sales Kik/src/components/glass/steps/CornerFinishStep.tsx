import React from 'react';

interface CornerFinishStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function CornerFinishStep({ glassQuoteData, onUpdate }: CornerFinishStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Corner Finish (Optional)</h2>
      <p className="text-gray-600 mb-6">
        Select corner finishing options for your glass panels.
      </p>
      
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-lg font-medium">Corner Finish Options</p>
        <p className="text-sm">Configure corner finishing options for your glass.</p>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => onUpdate({ cornerFinish: [] })}
          className="btn btn-secondary btn-md"
        >
          Skip Corner Finish
        </button>
      </div>
    </div>
  );
}