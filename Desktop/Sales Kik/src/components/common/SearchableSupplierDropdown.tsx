import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SearchableSupplierDropdownProps {
  value: string;
  onChange: (supplier: string) => void;
  placeholder?: string;
}

export function SearchableSupplierDropdown({ value, onChange, placeholder = "Search suppliers..." }: SearchableSupplierDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockSuppliers: Supplier[] = [
      { id: '1', name: 'Sydney Glass Co', email: 'orders@sydneyglass.com.au', phone: '+61 2 9555 0123' },
      { id: '2', name: 'Hardware Direct', email: 'purchasing@hardwaredirect.com.au', phone: '+61 2 9666 0456' },
      { id: '3', name: 'Building Supplies Ltd', email: 'orders@buildingsupplies.com.au', phone: '+61 2 9777 0789' },
      { id: '4', name: 'Steel Works Ltd.', email: 'orders@steelworks.com.au', phone: '+61 2 9888 0123' },
      { id: '5', name: 'Custom Cabinet Co', email: 'orders@customcabinets.com.au', phone: '+61 2 9999 0456' },
      { id: '6', name: 'Glass & Glazing Pro', email: 'orders@glassglazingpro.com.au', phone: '+61 2 9000 0789' },
      { id: '7', name: 'Alternative Glass Solutions', email: 'info@altglass.com.au', phone: '+61 2 9111 0123' },
      { id: '8', name: 'Metro Hardware Supply', email: 'sales@metrohardware.com.au', phone: '+61 2 9222 0456' },
      { id: '9', name: 'Premium Building Materials', email: 'orders@premiumbuild.com.au', phone: '+61 2 9333 0789' },
      { id: '10', name: 'Express Trade Supplies', email: 'orders@expresstrade.com.au', phone: '+61 2 9444 0123' }
    ];
    
    setSuppliers(mockSuppliers);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value || placeholder}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        <div className="absolute right-3 top-3.5 flex items-center gap-1">
          {value && (
            <button
              onClick={() => {
                onChange('');
                setSearchTerm('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => {
                  onChange(supplier.name);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900 text-base">{supplier.name}</div>
                <div className="text-sm text-gray-500">{supplier.email}</div>
                {supplier.phone && (
                  <div className="text-sm text-gray-400">{supplier.phone}</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No suppliers found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}