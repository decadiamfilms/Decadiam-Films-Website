import React, { useState } from 'react';
import { 
  XMarkIcon, PlusIcon, TrashIcon, 
  Cog6ToothIcon, TagIcon
} from '@heroicons/react/24/outline';
import { useCategoryStructure } from '../../hooks/useCategoryStructure';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface KanbanCategoryBuilderProps {
  onClose: () => void;
  onSave: () => void;
  standalone?: boolean;
}

export function KanbanCategoryBuilder({ onClose, onSave, standalone = false }: KanbanCategoryBuilderProps) {
  const { categoryStructure, saveStructure } = useCategoryStructure();
  const [localStructure, setLocalStructure] = useState(categoryStructure);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newItemInputs, setNewItemInputs] = useState<{[key: string]: string}>({});

  const addColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn = {
        id: Date.now().toString(),
        title: newColumnTitle.trim(),
        description: `${newColumnTitle.trim()} classification`,
        isRequired: false,
        order: localStructure.columns.length + 1,
        items: []
      };
      
      setLocalStructure({
        ...localStructure,
        columns: [...localStructure.columns, newColumn]
      });
      setNewColumnTitle('');
    }
  };

  const addItem = (columnId: string) => {
    const itemValue = newItemInputs[columnId];
    if (itemValue?.trim()) {
      setLocalStructure({
        ...localStructure,
        columns: localStructure.columns.map(column => 
          column.id === columnId 
            ? {
                ...column,
                items: [...column.items, {
                  id: Date.now().toString(),
                  label: itemValue.trim(),
                  value: itemValue.trim().toLowerCase().replace(/\s+/g, '-'),
                  isActive: true,
                  order: column.items.length + 1
                }]
              }
            : column
        )
      });
      setNewItemInputs({...newItemInputs, [columnId]: ''});
    }
  };

  const removeItem = (columnId: string, itemId: string) => {
    setLocalStructure({
      ...localStructure,
      columns: localStructure.columns.map(column =>
        column.id === columnId
          ? { ...column, items: column.items.filter(item => item.id !== itemId) }
          : column
      )
    });
  };

  const handleSave = async () => {
    try {
      await saveStructure(localStructure);
      onSave();
    } catch (error) {
      alert('Failed to save category structure. Please try again.');
    }
  };

  return (
    <div className={`${standalone ? '' : 'fixed inset-0 z-50 overflow-y-auto bg-white'}`}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Category Structure Manager</h2>
              <p className="text-sm text-gray-600 mt-1">Configure your product categorization system</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Add New Column */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Category Column</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="e.g. Category, Sub Category, Product Type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addColumn}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {localStructure.columns.map((column) => (
                <div key={column.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{column.title}</h4>
                      <p className="text-xs text-gray-500">{column.description}</p>
                    </div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={column.isRequired}
                        onChange={(e) => setLocalStructure({
                          ...localStructure,
                          columns: localStructure.columns.map(c => 
                            c.id === column.id ? {...c, isRequired: e.target.checked} : c
                          )
                        })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-xs text-gray-600">Required</span>
                    </label>
                  </div>

                  {/* Items in this column */}
                  <div className="space-y-2 mb-4">
                    {column.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{item.label}</span>
                        <button
                          onClick={() => removeItem(column.id, item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new item */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemInputs[column.id] || ''}
                      onChange={(e) => setNewItemInputs({...newItemInputs, [column.id]: e.target.value})}
                      placeholder={`Add ${column.title.toLowerCase()}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addItem(column.id)}
                    />
                    <button
                      onClick={() => addItem(column.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save/Cancel */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Category Structure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KanbanCategoryBuilder;