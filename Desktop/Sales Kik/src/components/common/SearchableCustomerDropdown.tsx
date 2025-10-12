import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { dataService } from '../../services/api.service';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  reference?: string;
}

interface SearchableCustomerDropdownProps {
  value: string;
  onChange: (customer: string) => void;
  placeholder?: string;
}

export function SearchableCustomerDropdown({ value, onChange, placeholder = "Search customers..." }: SearchableCustomerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real customers from database
  const loadCustomersFromDatabase = async () => {
    try {
      console.log('📦 SearchableCustomerDropdown: Loading customers from database...');
      const customersData = await dataService.customers.getAll();
      console.log('✅ SearchableCustomerDropdown: Loaded customers:', customersData.length);
      
      // Transform database customers to match expected format
      const transformedCustomers = customersData
        .filter((customer: any) => customer.status === 'active')
        .map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          reference: customer.notes || ''
        }));
      
      setCustomers(transformedCustomers);
      console.log('✅ SearchableCustomerDropdown: Customers ready:', transformedCustomers.length);
      console.log('📋 SearchableCustomerDropdown: Customer names:', transformedCustomers.map(c => c.name));
    } catch (error) {
      console.error('❌ SearchableCustomerDropdown: Failed to load customers:', error);
      setCustomers([]); // Empty array on error
    }
  };

  useEffect(() => {
    loadCustomersFromDatabase();
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false ||
    customer.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || false
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
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  onChange(customer.name);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900 text-base">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
                {customer.reference && (
                  <div className="text-sm text-gray-400">Ref: {customer.reference}</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No customers found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}