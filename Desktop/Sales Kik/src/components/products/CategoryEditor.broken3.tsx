import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, XMarkIcon, TrashIcon, TagIcon, CheckIcon,
  FolderIcon, LinkIcon, ChevronDownIcon, ChevronRightIcon,
  EyeIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface MainCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  subcategories: Subcategory[];
  specialItems: SpecialItem[];
  isStructureComplete: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  isVisible: boolean;
  sortOrder: number;
  options: SubcategoryOption[];
  linkedFinalProducts: string[];
  level: number;
  isShared?: boolean;
  sharedLibraryId?: string;
}

interface SubcategoryOption {
  id: string;
  label: string;
  value: string;
  subcategoryId: string;
  isActive: boolean;
  sortOrder: number;
}

interface SpecialItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  categoryId: string;
  isAlwaysVisible: boolean;
  appliesTo: 'category';
}

interface CategoryEditorProps {
  category: MainCategory;
  onSave: (category: MainCategory) => void;
  onCancel: () => void;
}

export default function CategoryEditor({ category, onSave, onCancel }: CategoryEditorProps) {
  const [editedCategory, setEditedCategory] = useState<MainCategory>(category);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [tempSubcategoryName, setTempSubcategoryName] = useState('');
  
  // Multi-select and drag state
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [dragHoverId, setDragHoverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState<MainCategory[]>([category]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history.length]);

  // Save state to history
  const saveToHistory = (newState: MainCategory) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 20 items to prevent memory issues
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
    setEditedCategory(newState);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedCategory(history[newIndex]);
      setSelectedSubcategories([]); // Clear selection on undo
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedCategory(history[newIndex]);
      setSelectedSubcategories([]); // Clear selection on redo
    }
  };

  // Add subcategory
  const addSubcategory = (parentId?: string) => {
    const name = newSubcategoryName.trim() || 'New Subcategory';
    
    let parentLevel = -1;
    let subcategoryColor = editedCategory.color;
    
    if (parentId) {
      const parent = editedCategory.subcategories.find(s => s.id === parentId);
      if (parent) {
        parentLevel = parent.level;
        subcategoryColor = parent.color;
      }
    } else {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
      const topLevelCount = editedCategory.subcategories.filter(s => !s.parentId).length;
      subcategoryColor = colors[topLevelCount % colors.length];
    }

    const newSubcategory: Subcategory = {
      id: Date.now().toString(),
      name: name,
      categoryId: editedCategory.id,
      parentId: parentId,
      color: subcategoryColor,
      isVisible: true,
      sortOrder: editedCategory.subcategories.length + 1,
      options: [],
      linkedFinalProducts: [],
      level: parentLevel + 1
    };
    
    const newState = {
      ...editedCategory,
      subcategories: [...editedCategory.subcategories, newSubcategory]
    };
    saveToHistory(newState);
    setNewSubcategoryName('');
  };

  // Multi-select functions
  const toggleSubcategorySelection = (subcategoryId: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategoryId) 
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  const selectAll = () => {
    setSelectedSubcategories(editedCategory.subcategories.map(sub => sub.id));
  };

  const clearSelection = () => {
    setSelectedSubcategories([]);
  };

  const bulkDuplicateSelected = () => {
    if (selectedSubcategories.length === 0) return;
    
    // Create a mapping of old IDs to new IDs to maintain relationships
    const idMapping: {[key: string]: string} = {};
    
    // Find the top-most selected items to determine the group structure
    const selectedItems = selectedSubcategories.map(id => 
      editedCategory.subcategories.find(s => s.id === id)
    ).filter(Boolean) as Subcategory[];
    
    // Find the minimum level among selected items
    const minLevel = Math.min(...selectedItems.map(item => item.level));
    
    // Create new IDs for all selected items
    selectedItems.forEach((item, index) => {
      const newId = Date.now().toString() + Math.random() + index;
      idMapping[item.id] = newId;
    });
    
    // Create duplicated subcategories maintaining their exact hierarchy
    const newSubcategories = selectedItems.map((subcategory, index) => {
      let newParentId = subcategory.parentId; // Keep original parent by default
      
      // If the original parent is also being duplicated, link to the new parent
      if (subcategory.parentId && idMapping[subcategory.parentId]) {
        newParentId = idMapping[subcategory.parentId];
      }
      
      return {
        ...subcategory,
        id: idMapping[subcategory.id],
        name: `${subcategory.name} (Copy)`,
        sortOrder: editedCategory.subcategories.length + index + 1,
        parentId: newParentId,
        level: subcategory.level, // Keep exact same level
        color: subcategory.color // Keep exact same color
      };
    });
    
    const newState = {
      ...editedCategory,
      subcategories: [...editedCategory.subcategories, ...newSubcategories]
    };
    saveToHistory(newState);
    setSelectedSubcategories([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, subcategory: Subcategory) => {
    setIsDragging(true);
    
    const isPartOfSelection = selectedSubcategories.includes(subcategory.id);
    
    if (isPartOfSelection && selectedSubcategories.length > 1) {
      // Multi-drag
      const selectedItems = selectedSubcategories.map(id => 
        editedCategory.subcategories.find(sub => sub.id === id)
      ).filter(Boolean);
      
      const dragData = {
        isMultiDrag: true,
        selectedItems: selectedItems,
        count: selectedItems.length
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    } else {
      // Single drag
      const dragData = {
        ...subcategory,
        isMultiDrag: false
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragHoverId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (targetId: string) => {
    if (isDragging) {
      setDragHoverId(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Much more forgiving drag leave - bigger buffer zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const buffer = 50; // Large 50px buffer zone
    
    if (x < rect.left - buffer || x > rect.right + buffer || 
        y < rect.top - buffer || y > rect.bottom + buffer) {
      setDragHoverId(null);
    }
  };

  const handleDropOnSubcategory = (e: React.DragEvent, targetSubcategoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragHoverId(null);
    setIsDragging(false);
    
    const itemData = e.dataTransfer.getData('text/plain');
    if (!itemData) return;
    
    const draggedData = JSON.parse(itemData);
    const targetSubcategory = editedCategory.subcategories.find(s => s.id === targetSubcategoryId);
    
    if (!targetSubcategory) return;

    if (draggedData.isMultiDrag) {
      // Multi-drop
      const containsSelf = draggedData.selectedItems.some((item: any) => item.id === targetSubcategoryId);
      if (containsSelf) return;
      
      const updatedSubcategories = editedCategory.subcategories.map(sub => {
        const isSelected = draggedData.selectedItems.some((item: any) => item.id === sub.id);
        if (isSelected) {
          return {
            ...sub,
            parentId: targetSubcategoryId,
            level: targetSubcategory.level + 1,
            color: targetSubcategory.color
          };
        }
        return sub;
      });
      
      const newState = {
        ...editedCategory,
        subcategories: updatedSubcategories
      };
      saveToHistory(newState);
      
      setSelectedSubcategories([]);
    } else {
      // Single drop
      if (draggedData.id === targetSubcategoryId) return;
      
      const updatedSubcategories = editedCategory.subcategories.map(sub => {
        if (sub.id === draggedData.id) {
          return {
            ...sub,
            parentId: targetSubcategoryId,
            level: targetSubcategory.level + 1,
            color: targetSubcategory.color
          };
        }
        return sub;
      });
      
      const newState = {
        ...editedCategory,
        subcategories: updatedSubcategories
      };
      saveToHistory(newState);
    }
  };

  const handleDropOnMain = (e: React.DragEvent) => {
    e.preventDefault();
    setDragHoverId(null);
    setIsDragging(false);
    
    const itemData = e.dataTransfer.getData('text/plain');
    if (!itemData) return;
    
    const draggedData = JSON.parse(itemData);
    
    if (draggedData.isMultiDrag) {
      // Multi-drop to main
      const updatedSubcategories = editedCategory.subcategories.map(sub => {
        const isSelected = draggedData.selectedItems.some((item: any) => item.id === sub.id);
        if (isSelected) {
          return {
            ...sub,
            parentId: undefined,
            level: 0,
            color: editedCategory.color
          };
        }
        return sub;
      });
      
      const newState = {
        ...editedCategory,
        subcategories: updatedSubcategories
      };
      saveToHistory(newState);
      
      setSelectedSubcategories([]);
    } else {
      // Single drop to main
      const updatedSubcategories = editedCategory.subcategories.map(sub => {
        if (sub.id === draggedData.id) {
          return {
            ...sub,
            parentId: undefined,
            level: 0,
            color: editedCategory.color
          };
        }
        return sub;
      });
      
      const newState = {
        ...editedCategory,
        subcategories: updatedSubcategories
      };
      saveToHistory(newState);
    }
  };

  // Get children/top-level functions
  const getChildren = (parentId: string) => {
    return editedCategory.subcategories.filter(sub => sub.parentId === parentId);
  };

  const getTopLevel = () => {
    return editedCategory.subcategories.filter(sub => !sub.parentId);
  };

  // Remove subcategory
  const removeSubcategory = (subcategoryId: string) => {
    const subcategory = editedCategory.subcategories.find(s => s.id === subcategoryId);
    if (!subcategory) return;
    
    const hasChildren = editedCategory.subcategories.some(s => s.parentId === subcategoryId);
    
    if (hasChildren && !confirm(`Delete "${subcategory.name}" and all its children?`)) {
      return;
    }
    
    const removeRecursive = (idToRemove: string): string[] => {
      const children = editedCategory.subcategories
        .filter(s => s.parentId === idToRemove)
        .map(s => s.id);
      
      const allToRemove = [idToRemove];
      children.forEach(childId => {
        allToRemove.push(...removeRecursive(childId));
      });
      
      return allToRemove;
    };
    
    const idsToRemove = removeRecursive(subcategoryId);
    
    const newState = {
      ...editedCategory,
      subcategories: editedCategory.subcategories.filter(sub => !idsToRemove.includes(sub.id))
    };
    saveToHistory(newState);
  };

  // Subcategory tree with drag and drop
  const SubcategoryTree = ({ subcategories }: { subcategories: Subcategory[] }) => {
    return (
      <div className="space-y-4">
        {subcategories.map((subcategory) => {
          const children = getChildren(subcategory.id);
          const isSelected = selectedSubcategories.includes(subcategory.id);
          const isHovered = dragHoverId === subcategory.id;
          const isMainCategory = subcategory.level === 0;
          
          return (
            <div key={subcategory.id} className={isMainCategory ? 'bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg mb-6' : 'mb-3'}>
              {/* Main category header */}
              {isMainCategory && (
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
                  <div 
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: subcategory.color }}
                  />
                  <h6 className="font-bold text-gray-800 text-lg uppercase tracking-wide">
                    {subcategory.name} Section
                  </h6>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-400 to-transparent"></div>
                  <span className="text-sm text-gray-600 font-medium">
                    {children.length} children
                  </span>
                </div>
              )}

              {/* Large Drop Zone - Much Easier to Target */}
              <div 
                className={`relative p-3 rounded-xl transition-all duration-200 ${
                  isHovered 
                    ? 'bg-green-200 border-4 border-green-600 shadow-2xl' 
                    : isDragging 
                      ? 'border-4 border-dashed border-green-400 bg-green-50 hover:border-green-600 hover:bg-green-100' 
                      : 'border-2 border-transparent hover:border-gray-300'
                }`}
                style={{ 
                  marginLeft: `${subcategory.level * 20}px`,
                  minHeight: '80px', // Larger target area
                  padding: '20px' // More padding for easier targeting
                }}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(subcategory.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnSubcategory(e, subcategory.id)}
              >
                {/* Large Drop Preview Banner */}
                {isHovered && isDragging && (
                  <div className="absolute -top-4 left-0 right-0 bg-green-600 text-white text-sm px-4 py-2 rounded-t-xl z-30 text-center font-bold shadow-lg">
                    📍 DROP HERE → Will become children of "{subcategory.name}"
                  </div>
                )}
                
                {/* Actual Subcategory Item - Smaller, More Precise */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-move ${
                    isSelected ? 'ring-3 ring-blue-500 bg-blue-100 border-blue-500' : 'border-gray-300'
                  } ${
                    isHovered ? 'transform scale-110 shadow-2xl bg-white border-green-600' : 'hover:shadow-lg hover:border-gray-400'
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? `${subcategory.color}30` : `${subcategory.color}10`,
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, subcategory)}
                  onDragEnd={handleDragEnd}
                >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSubcategorySelection(subcategory.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subcategory.color }}
                    />
                    {editingSubcategoryId === subcategory.id ? (
                      <input
                        type="text"
                        value={tempSubcategoryName}
                        onChange={(e) => setTempSubcategoryName(e.target.value)}
                        onBlur={() => {
                          const updatedSubcategories = editedCategory.subcategories.map(sub => 
                            sub.id === subcategory.id 
                              ? { ...sub, name: tempSubcategoryName }
                              : sub
                          );
                          setEditedCategory({
                            ...editedCategory,
                            subcategories: updatedSubcategories
                          });
                          setEditingSubcategoryId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            const updatedSubcategories = editedCategory.subcategories.map(sub => 
                              sub.id === subcategory.id 
                                ? { ...sub, name: tempSubcategoryName }
                                : sub
                            );
                            setEditedCategory({
                              ...editedCategory,
                              subcategories: updatedSubcategories
                            });
                            setEditingSubcategoryId(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingSubcategoryId(null);
                            setTempSubcategoryName('');
                          }
                        }}
                        className="bg-white border border-blue-300 text-gray-900 font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSubcategoryId(subcategory.id);
                          setTempSubcategoryName(subcategory.name);
                        }}
                        className="text-gray-900 font-medium hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                      >
                        {subcategory.name}
                      </button>
                    )}
                    <span className="text-xs bg-white px-2 py-1 rounded" style={{
                      color: subcategory.color,
                      backgroundColor: `${subcategory.color}20`
                    }}>
                      {subcategory.level}
                    </span>
                    {subcategory.isShared && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Shared
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => addSubcategory(subcategory.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Add child subcategory"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const duplicatedSubcategory: Subcategory = {
                          ...subcategory,
                          id: Date.now().toString() + Math.random(),
                          name: `${subcategory.name} (Copy)`,
                          // Keep same parent and level to maintain hierarchy
                          parentId: subcategory.parentId,
                          level: subcategory.level
                        };
                        const newState = {
                          ...editedCategory,
                          subcategories: [...editedCategory.subcategories, duplicatedSubcategory]
                        };
                        saveToHistory(newState);
                        setTimeout(() => {
                          setEditingSubcategoryId(duplicatedSubcategory.id);
                          setTempSubcategoryName(duplicatedSubcategory.name);
                        }, 50);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Duplicate this subcategory"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSubcategory(subcategory.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                </div>
              </div>
              
              {children.length > 0 && (
                <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200">
                  <SubcategoryTree subcategories={children} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-start justify-center min-h-screen p-4 pt-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
          <div className="flex flex-1 min-h-0">
            {/* Left Panel */}
            <div className="w-96 border-r border-gray-200 p-8 flex-shrink-0">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
                <p className="text-sm text-gray-600 mt-1">{editedCategory.name}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={editedCategory.name}
                    onChange={(e) => setEditedCategory({...editedCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                  <input
                    type="color"
                    value={editedCategory.color}
                    onChange={(e) => setEditedCategory({...editedCategory, color: e.target.value})}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Stats</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Subcategories: {editedCategory.subcategories.length}</div>
                  <div>Selected: {selectedSubcategories.length}</div>
                  <div>History: {historyIndex + 1}/{history.length}</div>
                </div>
              </div>

              {/* Undo/Redo Controls */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Undo last action"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Redo last undone action"
                >
                  ↷ Redo
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onSave(editedCategory)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save Category
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-8 pb-6 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <h5 className="font-medium text-gray-900">Build Structure</h5>
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="New subcategory name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        addSubcategory();
                      }
                    }}
                  />
                  <button
                    onClick={() => addSubcategory()}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Multi-Select Controls */}
                {selectedSubcategories.length > 0 ? (
                  <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedSubcategories.length} selected
                    </span>
                    <button
                      onClick={bulkDuplicateSelected}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 inline mr-1" />
                      Duplicate {selectedSubcategories.length}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                ) : editedCategory.subcategories.length > 0 ? (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Multi-Select:</span>
                    <button
                      onClick={selectAll}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Select All ({editedCategory.subcategories.length})
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Scrollable Structure Area */}
              <div className="flex-1 overflow-y-auto px-8 pb-8">
                {/* Prominent Main Drop Zone */}
                {isDragging && (
                  <div 
                    className="mb-4 p-6 border-4 border-dashed border-blue-500 bg-blue-50 rounded-2xl text-center transition-all duration-200 hover:border-blue-600 hover:bg-blue-100"
                    onDragOver={(e) => {
                      handleDragOver(e);
                      handleDragEnter('main');
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropOnMain}
                  >
                    <div className="text-blue-700 font-bold text-lg mb-2">🎯 TOP LEVEL DROP ZONE</div>
                    <div className="text-blue-600 text-sm">Drop here to make items top-level subcategories</div>
                  </div>
                )}
                
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 min-h-96 ${
                    isDragging && dragHoverId === 'main' 
                      ? 'border-green-500 bg-green-100 ring-4 ring-green-300 shadow-2xl transform scale-102' 
                      : isDragging 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                  onDragOver={(e) => {
                    handleDragOver(e);
                    handleDragEnter('main');
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropOnMain}
                >
                  {/* Main Drop Preview */}
                  {dragHoverId === 'main' && isDragging && (
                    <div className="absolute top-2 left-2 right-2 bg-green-500 text-white text-sm px-4 py-2 rounded-lg z-10 text-center font-bold">
                      🎯 Drop here to make top-level subcategories
                    </div>
                  )}
                  
                  <div className={dragHoverId === 'main' && isDragging ? 'mt-12' : ''}>
                    {getTopLevel().length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">Create subcategories above to build your structure</p>
                      </div>
                    ) : (
                      <SubcategoryTree subcategories={getTopLevel()} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}