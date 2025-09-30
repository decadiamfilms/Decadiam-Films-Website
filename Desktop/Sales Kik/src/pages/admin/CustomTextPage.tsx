import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
  DocumentTextIcon, XMarkIcon, CheckIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

interface CustomText {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CustomDropdown({ value, placeholder, options, onChange, disabled }: CustomDropdownProps) {
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
      <div className="w-full px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-200 bg-white shadow-lg'
            : 'border-gray-300 hover:border-amber-400 bg-white shadow-sm'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full">
          <div className="py-2 max-h-60 overflow-y-auto">
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
                    ? 'bg-amber-50 text-amber-700 font-semibold' 
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

export default function CustomTextPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingText, setEditingText] = useState<CustomText | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formDescription, setFormDescription] = useState('');
  
  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [textToDelete, setTextToDelete] = useState<CustomText | null>(null);

  const typeOptions = [
    { value: '', label: '- Select -' },
    { value: 'custom_text', label: 'Custom Text' },
    { value: 'job_description', label: 'Job Description Text' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'orders', label: 'Orders' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'accounting_terms', label: 'Accounting Terms' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'custom_text', label: 'Custom Text' },
    { value: 'job_description', label: 'Job Description' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'orders', label: 'Orders' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'accounting_terms', label: 'Accounting Terms' }
  ];

  useEffect(() => {
    loadCustomTexts();
  }, []);

  const loadCustomTexts = async () => {
    try {
      const savedTexts = localStorage.getItem('saleskik-custom-texts');
      if (savedTexts) {
        setCustomTexts(JSON.parse(savedTexts));
      } else {
        // Create sample custom texts
        const sampleTexts: CustomText[] = [
          {
            id: '1',
            name: 'Standard Quote Footer',
            type: 'quotes',
            description: 'This quote is valid for 30 days from the date of issue. All prices are exclusive of GST unless otherwise stated.',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Payment Terms',
            type: 'accounting_terms',
            description: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
        setCustomTexts(sampleTexts);
        localStorage.setItem('saleskik-custom-texts', JSON.stringify(sampleTexts));
      }
    } catch (error) {
      console.error('Failed to load custom texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingText(null);
    setFormName('');
    setFormType('');
    setFormDescription('');
    setShowModal(true);
  };

  const handleEdit = (text: CustomText) => {
    setEditingText(text);
    setFormName(text.name);
    setFormType(text.type);
    setFormDescription(text.description);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formType) {
      return;
    }

    const selectedTypeOption = typeOptions.find(opt => opt.value === formType);

    if (editingText) {
      // Update existing
      const updatedTexts = customTexts.map(text =>
        text.id === editingText.id
          ? {
              ...text,
              name: formName.trim(),
              type: formType,
              description: formDescription.trim(),
              updatedAt: new Date()
            }
          : text
      );
      setCustomTexts(updatedTexts);
      localStorage.setItem('saleskik-custom-texts', JSON.stringify(updatedTexts));
    } else {
      // Add new
      const newText: CustomText = {
        id: Date.now().toString(),
        name: formName.trim(),
        type: formType,
        description: formDescription.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedTexts = [...customTexts, newText];
      setCustomTexts(updatedTexts);
      localStorage.setItem('saleskik-custom-texts', JSON.stringify(updatedTexts));
    }

    // Reset form
    setFormName('');
    setFormType('');
    setFormDescription('');
    setShowModal(false);
  };

  const handleDelete = (text: CustomText) => {
    setTextToDelete(text);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!textToDelete) return;

    const updatedTexts = customTexts.filter(text => text.id !== textToDelete.id);
    setCustomTexts(updatedTexts);
    localStorage.setItem('saleskik-custom-texts', JSON.stringify(updatedTexts));
    
    setShowDeleteModal(false);
    setTextToDelete(null);
  };

  const getFilteredTexts = () => {
    return customTexts.filter(text => {
      const typeMatch = selectedType === 'all' || text.type === selectedType;
      const searchMatch = !searchQuery || 
        text.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        text.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        typeOptions.find(opt => opt.value === text.type)?.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      return typeMatch && searchMatch;
    });
  };

  const getTypeLabel = (type: string) => {
    return typeOptions.find(opt => opt.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading custom texts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="Custom Text"
        userPlan="SMALL_BUSINESS"
        userRole="ADMIN"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <main className="flex-1 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-white via-amber-50 to-orange-50 border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Manage Custom Text</h1>
                <DocumentTextIcon className="w-6 h-6 text-amber-600" />
              </div>
              <p className="mt-1 text-gray-600">Create and manage custom text templates for your business documents</p>
            </div>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Filters */}
          <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Type Filter */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <CustomDropdown
                  value={selectedType}
                  placeholder="All"
                  options={filterOptions}
                  onChange={setSelectedType}
                />
              </div>

              {/* Search Bar */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                    placeholder="Search by name or description..."
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className="lg:col-span-1 flex items-end">
                <div className="text-sm text-gray-500 pb-3">
                  {getFilteredTexts().length} items found
                  {searchQuery && (
                    <div className="text-xs text-amber-600 mt-1">
                      Searching: "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Texts Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredTexts().map((text) => (
                    <tr key={text.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{text.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                          text.type === 'quotes' ? 'bg-blue-100 text-blue-700' :
                          text.type === 'invoice' ? 'bg-green-100 text-green-700' :
                          text.type === 'orders' ? 'bg-purple-100 text-purple-700' :
                          text.type === 'job_description' ? 'bg-indigo-100 text-indigo-700' :
                          text.type === 'accounting_terms' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {getTypeLabel(text.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={text.description}>
                          {text.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEdit(text)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit custom text"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(text)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete custom text"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredTexts().length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No custom texts found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedType !== 'all' 
                      ? 'No custom texts match the current filters.'
                      : 'Get started by creating your first custom text template.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Custom Text Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingText(null);
          setFormName('');
          setFormType('');
          setFormDescription('');
        }}
        title={editingText ? 'Edit Custom Text' : 'Add Custom Text'}
        subtitle={editingText ? 'Update your custom text template' : 'Create a new custom text template'}
        size="xl"
      >
        <div className="px-2 py-4">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-amber-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                {editingText ? 'Edit Custom Text Template' : 'New Custom Text Template'}
              </h4>
              <p className="text-gray-600">
                {editingText 
                  ? 'Update your custom text template for business documents.'
                  : 'Create reusable text templates for quotes, invoices, and other business documents.'
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description Type <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                value={formType}
                placeholder="- Select -"
                options={typeOptions.slice(1)} // Remove the "- Select -" option for the modal
                onChange={setFormType}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="e.g., Standard Quote Footer"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200 resize-none"
                placeholder="Enter the custom text content that will be used in your documents..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 px-1 py-4 rounded-b-lg">
          <button
            onClick={() => {
              setShowModal(false);
              setEditingText(null);
              setFormName('');
              setFormType('');
              setFormDescription('');
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formName.trim() || !formType}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4" />
              <span>{editingText ? 'Update' : 'Save'}</span>
            </div>
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTextToDelete(null);
        }}
        title="Delete Custom Text"
        subtitle="This action cannot be undone"
        size="md"
      >
        <div className="p-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete this custom text?
              </p>
              {textToDelete && (
                <p className="text-xs text-gray-500 mt-1">
                  {textToDelete.name}
                </p>
              )}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This custom text template will be permanently deleted and cannot be recovered.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setTextToDelete(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}