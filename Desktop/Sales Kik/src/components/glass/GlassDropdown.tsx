import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface GlassDropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface GlassDropdownProps {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: GlassDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GlassDropdown({ 
  label, 
  required, 
  value, 
  placeholder, 
  options, 
  onChange, 
  disabled,
  className = ""
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (disabled) {
    return (
      <div className={className}>
        <label className="block text-base font-medium text-gray-700 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="w-full px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl cursor-not-allowed">
          {placeholder}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-base font-medium text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-200 bg-white shadow-lg'
            : 'border-gray-300 hover:border-blue-400 bg-white shadow-sm'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full min-w-fit"
        >
          <div className="py-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              {placeholder}
            </button>
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  index < options.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  option.value === value 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}