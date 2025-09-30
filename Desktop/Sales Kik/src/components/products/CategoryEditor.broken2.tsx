import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, XMarkIcon, TrashIcon, TagIcon, CheckIcon,
  FolderIcon, LinkIcon, ChevronDownIcon, ChevronRightIcon,
  EyeIcon
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
  const [librarySubcategories, setLibrarySubcategories] = useState<any[]>([]);
  const [selectedLibraryItems, setSelectedLibraryItems] = useState<string[]>([]);
  const [expandedLibraryItems, setExpandedLibraryItems] = useState<string[]>([]);
  const [selectedChildSubcategories, setSelectedChildSubcategories] = useState<string[]>([]);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [tempSubcategoryName, setTempSubcategoryName] = useState('');

  // Load existing subcategories from other categories (library)
  useEffect(() => {
    console.log('Loading library for category:', editedCategory.name);
    const savedCategories = localStorage.getItem('saleskik-categories');
    console.log('Saved categories:', savedCategories);
    
    if (savedCategories) {
      const allCategories = JSON.parse(savedCategories);
      console.log('All categories:', allCategories);
      const library: any[] = [];
      
      allCategories.forEach((cat: any) => {
        console.log('Processing category:', cat.name, 'ID:', cat.id, 'Current category ID:', editedCategory.id);
        if (cat.id !== editedCategory.id && cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach((sub: any) => {
            console.log('Processing subcategory:', sub.name, 'from category:', cat.name);
            const existing = library.find(lib => lib.name === sub.name);
            if (existing) {
              if (!existing.usedInCategories.includes(cat.name)) {
                existing.usedInCategories.push(cat.name);
              }
            } else {
              library.push({
                id: sub.id,
                name: sub.name,
                color: sub.color || '#6B7280',
                options: sub.options || [],
                usedInCategories: [cat.name],
                originalCategoryId: cat.id,
                level: sub.level || 0,
                parentId: sub.parentId
              });
            }
          });
        }
      });
      
      console.log('Final library:', library);
      setLibrarySubcategories(library);
    } else {
      console.log('No saved categories found');
    }
  }, [editedCategory.id]);

  // Add subcategory
  const addSubcategory = (parentId?: string) => {
    const name = newSubcategoryName.trim() || 'New Subcategory';
    
    let parentLevel = -1;
    let subcategoryColor = editedCategory.color;
    
    if (parentId) {
      const parent = editedCategory.subcategories.find(s => s.id === parentId);
      if (parent) {
        parentLevel = parent.level;
        let topLevelParent = parent;
        while (topLevelParent.parentId) {
          const grandParent = editedCategory.subcategories.find(s => s.id === topLevelParent.parentId);
          if (grandParent) {
            topLevelParent = grandParent;
          } else {
            break;
          }
        }
        subcategoryColor = topLevelParent.color;
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
    
    setEditedCategory({
      ...editedCategory,
      subcategories: [...editedCategory.subcategories, newSubcategory]
    });
    setNewSubcategoryName('');
  };

  // Get children of a subcategory
  const getChildren = (parentId: string) => {
    return editedCategory.subcategories.filter(sub => sub.parentId === parentId);
  };

  // Get top-level subcategories
  const getTopLevel = () => {
    return editedCategory.subcategories.filter(sub => !sub.parentId);
  };

  // Get count of child subcategories for a library item
  const getChildrenCount = (libSubId: string) => {
    const savedCategories = localStorage.getItem('saleskik-categories');
    if (!savedCategories) return 0;
    
    const allCategories = JSON.parse(savedCategories);
    let childCount = 0;
    
    allCategories.forEach((cat: any) => {
      childCount += cat.subcategories.filter((sub: any) => sub.parentId === libSubId).length;
    });
    
    return childCount;
  };

  // Get child subcategories for a library item
  const getLibraryChildren = (libSubId: string) => {
    const savedCategories = localStorage.getItem('saleskik-categories');
    if (!savedCategories) return [];
    
    const allCategories = JSON.parse(savedCategories);
    const children: any[] = [];
    
    allCategories.forEach((cat: any) => {
      cat.subcategories.forEach((sub: any) => {
        if (sub.parentId === libSubId) {
          children.push({
            ...sub,
            categoryName: cat.name
          });
        }
      });
    });
    
    return children;
  };

  // Toggle library expansion
  const toggleLibraryExpansion = (libId: string) => {
    setExpandedLibraryItems(prev => 
      prev.includes(libId) 
        ? prev.filter(id => id !== libId)
        : [...prev, libId]
    );
  };

  // Toggle child selection
  const toggleChildSubcategorySelection = (childId: string) => {
    setSelectedChildSubcategories(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  // Add selected children
  const addSelectedChildren = () => {
    if (selectedChildSubcategories.length === 0) return;

    const savedCategories = localStorage.getItem('saleskik-categories');
    if (!savedCategories) return;

    const allCategories = JSON.parse(savedCategories);
    const newSubcategories = [...editedCategory.subcategories];
    
    selectedChildSubcategories.forEach(childId => {
      let foundChild: any = null;
      allCategories.forEach((cat: any) => {
        const child = cat.subcategories.find((sub: any) => sub.id === childId);
        if (child) {
          foundChild = child;
        }
      });

      if (foundChild) {
        const exists = newSubcategories.find(sub => sub.name === foundChild.name);
        if (!exists) {
          const newSubcategory: Subcategory = {
            id: Date.now().toString() + Math.random(),
            name: foundChild.name,
            categoryId: editedCategory.id,
            color: foundChild.color || editedCategory.color,
            isVisible: true,
            sortOrder: newSubcategories.length + 1,
            options: foundChild.options || [],
            linkedFinalProducts: [],
            level: 0,
            isShared: true,
            sharedLibraryId: foundChild.id
          };
          newSubcategories.push(newSubcategory);
        }
      }
    });

    setEditedCategory({
      ...editedCategory,
      subcategories: newSubcategories
    });
    
    setSelectedChildSubcategories([]);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, item: any, isMainSubcategory = false) => {
    const dragData = {
      ...item,
      isMainSubcategory: isMainSubcategory
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    console.log('Started dragging:', item.name, isMainSubcategory ? '(entire subcategory)' : '(individual item)');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Drop on main structure area (creates top-level)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData('text/plain');
    if (itemData) {
      const draggedItem = JSON.parse(itemData);
      console.log('Dropped item on main area:', draggedItem.name);
      
      const newSubcategory: Subcategory = {
        id: Date.now().toString() + Math.random(),
        name: draggedItem.name,
        categoryId: editedCategory.id,
        color: draggedItem.color || editedCategory.color,
        isVisible: true,
        sortOrder: editedCategory.subcategories.length + 1,
        options: draggedItem.options || [],
        linkedFinalProducts: [],
        level: 0,
        isShared: true,
        sharedLibraryId: draggedItem.id
      };

      setEditedCategory({
        ...editedCategory,
        subcategories: [...editedCategory.subcategories, newSubcategory]
      });
    }
  };

  // Drop on specific subcategory (creates child)
  const handleDropOnSubcategory = (e: React.DragEvent, targetSubcategoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemData = e.dataTransfer.getData('text/plain');
    if (itemData) {
      const draggedItem = JSON.parse(itemData);
      const targetSubcategory = editedCategory.subcategories.find(s => s.id === targetSubcategoryId);
      
      if (targetSubcategory) {
        console.log('Dropped item on subcategory:', draggedItem.name, 'onto', targetSubcategory.name);
        
        if (draggedItem.isMainSubcategory) {
          console.log('Dragging entire subcategory:', draggedItem.name, 'with ID:', draggedItem.id);
          
          // Dragging entire subcategory - add it with all its children
          const newMainSubcategory: Subcategory = {
            id: Date.now().toString() + Math.random(),
            name: draggedItem.name,
            categoryId: editedCategory.id,
            parentId: targetSubcategoryId,
            color: targetSubcategory.color,
            isVisible: true,
            sortOrder: editedCategory.subcategories.length + 1,
            options: draggedItem.options || [],
            linkedFinalProducts: [],
            level: targetSubcategory.level + 1,
            isShared: true,
            sharedLibraryId: draggedItem.id
          };

          // Find and copy all children from the source
          const savedCategories = localStorage.getItem('saleskik-categories');
          let allChildren: Subcategory[] = [];
          
          if (savedCategories) {
            const allCategories = JSON.parse(savedCategories);
            console.log('Looking for children of:', draggedItem.id, 'in categories:', allCategories.length);
            
            // Find the source category
            let sourceCategory: any = null;
            allCategories.forEach((cat: any) => {
              const hasThisSubcategory = cat.subcategories?.some((sub: any) => sub.id === draggedItem.id);
              if (hasThisSubcategory) {
                sourceCategory = cat;
                console.log('Found source category:', cat.name);
              }
            });
            
            if (sourceCategory && sourceCategory.subcategories) {
              console.log('Source category subcategories:', sourceCategory.subcategories.length);
              
              // Recursively collect all descendants
              const collectDescendants = (parentId: string, newParentId: string, currentLevel: number) => {
                const directChildren = sourceCategory.subcategories.filter((sub: any) => sub.parentId === parentId);
                console.log('Found', directChildren.length, 'direct children of', parentId);
                
                directChildren.forEach((child: any, index: number) => {
                  const newChildId = Date.now().toString() + Math.random() + index;
                  console.log('Adding child:', child.name, 'at level', currentLevel);
                  
                  allChildren.push({
                    id: newChildId,
                    name: child.name,
                    categoryId: editedCategory.id,
                    parentId: newParentId,
                    color: child.color || targetSubcategory.color,
                    isVisible: true,
                    sortOrder: editedCategory.subcategories.length + allChildren.length + 2,
                    options: child.options || [],
                    linkedFinalProducts: [],
                    level: currentLevel,
                    isShared: true,
                    sharedLibraryId: child.id
                  });
                  
                  // Recursively collect grandchildren
                  collectDescendants(child.id, newChildId, currentLevel + 1);
                });
              };
              
              // Start collecting from the dragged subcategory's children
              collectDescendants(draggedItem.id, newMainSubcategory.id, newMainSubcategory.level + 1);
            }
          }
          
          console.log('Final result: Adding', 1 + allChildren.length, 'subcategories (1 main +', allChildren.length, 'children)');

          setEditedCategory({
            ...editedCategory,
            subcategories: [...editedCategory.subcategories, newMainSubcategory, ...allChildren]
          });
        } else {
          // Dragging individual child - add just this one
          const newSubcategory: Subcategory = {
            id: Date.now().toString() + Math.random(),
            name: draggedItem.name,
            categoryId: editedCategory.id,
            parentId: targetSubcategoryId,
            color: targetSubcategory.color,
            isVisible: true,
            sortOrder: editedCategory.subcategories.length + 1,
            options: draggedItem.options || [],
            linkedFinalProducts: [],
            level: targetSubcategory.level + 1,
            isShared: true,
            sharedLibraryId: draggedItem.id
          };

          setEditedCategory({
            ...editedCategory,
            subcategories: [...editedCategory.subcategories, newSubcategory]
          });
        }
      }
    }
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
    
    setEditedCategory({
      ...editedCategory,
      subcategories: editedCategory.subcategories.filter(sub => !idsToRemove.includes(sub.id))
    });
  };

  // Simple subcategory tree component
  const SubcategoryTree = ({ subcategories }: { subcategories: Subcategory[] }) => {
    return (
      <div className="space-y-2">
        {subcategories.map((subcategory) => {
          const children = getChildren(subcategory.id);
          
          return (
            <div key={subcategory.id}>
              <div 
                className="p-3 rounded border transition-colors hover:shadow-sm hover:border-green-400"
                style={{ 
                  marginLeft: `${subcategory.level * 16}px`,
                  backgroundColor: `${subcategory.color}08`,
                  borderColor: `${subcategory.color}40`
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSubcategory(e, subcategory.id)}
                title="Drop library items here to make them children of this subcategory"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                          // Save the changes when user clicks away
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
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            // Save on Enter
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
                      Level {subcategory.level}
                    </span>
                    {subcategory.isShared && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Shared
                      </span>
                    )}
                    <span className="text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                      Drop Zone
                    </span>
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
                      onClick={() => removeSubcategory(subcategory.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {children.length > 0 && (
                <div className="mt-2">
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden">
          <div className="flex h-full">
            {/* Left Panel - Category Basics */}
            <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
                <p className="text-sm text-gray-600 mt-1">{editedCategory.name}</p>
              </div>

              {/* Basic Info */}
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

              {/* Stats */}
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Structure Stats</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Subcategories: {editedCategory.subcategories.length}</div>
                  <div>Library Available: {librarySubcategories.length}</div>
                </div>
              </div>

              {/* Actions */}
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

            {/* Right Panel - Structure Building */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Library Section - Always Show */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-blue-900">Reuse from Library</h5>
                    {(selectedLibraryItems.length > 0 || selectedChildSubcategories.length > 0) && (
                      <button
                        onClick={() => {
                          addSelectedChildren();
                          setSelectedLibraryItems([]);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                      >
                        Add Selected
                      </button>
                    )}
                  </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {librarySubcategories.length === 0 ? (
                    <div className="text-center py-6 text-blue-600">
                      <FolderIcon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-sm">No subcategories available yet</p>
                      <p className="text-xs">Create other categories with subcategories to build your library</p>
                    </div>
                  ) : (
                    librarySubcategories.map((libSub) => (
                      <div key={libSub.id} className="bg-white rounded border border-blue-200 group">
                        <div 
                          className="p-3 cursor-move hover:bg-blue-50 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, libSub, true)}
                          title="Drag to add entire subcategory (with all children) or expand to drag individual children"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: libSub.color }}
                            />
                            <span className="font-medium text-gray-900 flex-1">{libSub.name}</span>
                            <span className="text-xs text-gray-500">{getChildrenCount(libSub.id)} children</span>
                            <button
                              onClick={() => {
                                // Debug: Show what children exist for this subcategory
                                const savedCategories = localStorage.getItem('saleskik-categories');
                                if (savedCategories) {
                                  const allCategories = JSON.parse(savedCategories);
                                  allCategories.forEach((cat: any) => {
                                    const children = cat.subcategories?.filter((sub: any) => sub.parentId === libSub.id) || [];
                                    if (children.length > 0) {
                                      console.log(`Children of ${libSub.name} (${libSub.id}):`, children.map((c: any) => c.name));
                                    }
                                  });
                                }
                              }}
                              className="text-xs text-blue-600 hover:underline"
                              title="Debug: Show children in console"
                            >
                              Debug
                            </button>
                            <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              Drag whole subcategory
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLibraryExpansion(libSub.id);
                              }}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Expand to see and drag individual children"
                            >
                              {expandedLibraryItems.includes(libSub.id) ? (
                                <ChevronDownIcon className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded children */}
                        {expandedLibraryItems.includes(libSub.id) && (
                          <div className="border-t border-blue-200 p-3">
                            {(() => {
                              const children = getLibraryChildren(libSub.id);
                              return children.length > 0 ? (
                                <div className="space-y-1">
                                  {children.map((child: any) => (
                                    <div 
                                      key={child.id} 
                                      className="flex items-center gap-2 p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-move"
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, child)}
                                      title="Drag to add this subcategory"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedChildSubcategories.includes(child.id)}
                                        onChange={() => toggleChildSubcategorySelection(child.id)}
                                        className="h-3 w-3 text-green-600 border-gray-300 rounded"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: child.color }}
                                      />
                                      <span className="text-sm text-gray-900 flex-1">{child.name}</span>
                                      <span className="text-xs text-gray-400">Drag</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  No children yet
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Structure Building */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h5 className="font-medium text-gray-900">Build Structure</h5>
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="New subcategory name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addSubcategory()}
                  />
                  <button
                    onClick={() => addSubcategory()}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 hover:bg-green-50 transition-all duration-200 min-h-32"
                >
                  {getTopLevel().length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">Drop subcategories here or create new ones above</p>
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
  );
}