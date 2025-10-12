import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { dataService } from '../../services/api.service';

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

  // Load real suppliers from database
  const loadSuppliers = async () => {
    try {
      console.log('📦 SearchableSupplierDropdown: Loading suppliers from database...');
      const suppliersData = await dataService.suppliers.getAll();
      console.log('✅ SearchableSupplierDropdown: Loaded suppliers:', suppliersData.length);
      
      // Transform to match expected format and filter active only
      const activeSuppliers = suppliersData
        .filter((supplier: any) => supplier.status === 'active')
        .map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone || supplier.primaryContact?.mobile || ''
        }));
      
      setSuppliers(activeSuppliers);
      console.log('✅ SearchableSupplierDropdown: Active suppliers ready:', activeSuppliers.length);
    } catch (error) {
      console.error('❌ SearchableSupplierDropdown: Failed to load suppliers:', error);
      setSuppliers([]); // Empty array on error
    }
  };

  useEffect(() => {
    loadSuppliers();
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