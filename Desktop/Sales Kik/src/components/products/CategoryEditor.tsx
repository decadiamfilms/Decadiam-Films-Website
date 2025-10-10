import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, XMarkIcon, TrashIcon, TagIcon, CheckIcon,
  FolderIcon, LinkIcon, ChevronDownIcon, ChevronRightIcon,
  EyeIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api.service';

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
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [copiedSubcategories, setCopiedSubcategories] = useState<Subcategory[]>([]);
  const [history, setHistory] = useState<MainCategory[]>([category]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragHoverId, setDragHoverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [originalCategory] = useState<MainCategory>(JSON.parse(JSON.stringify(category)));
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  // Save state to history
  const saveToHistory = (newState: MainCategory) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    setHistory(newHistory);
    setEditedCategory(newState);
  };

  // Undo/Redo functions
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedCategory(history[newIndex]);
      setSelectedSubcategories([]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedCategory(history[newIndex]);
      setSelectedSubcategories([]);
    }
  };

  // Keyboard shortcuts
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

  // Helper functions
  const getChildren = (parentId: string) => {
    const children = editedCategory.subcategories
      .filter(sub => sub.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    if (children.length > 0) {
      console.log(`🔍 CategoryEditor: Children of ${parentId}:`, children.map(c => `${c.name} (level ${c.level})`));
    }
    return children;
  };

  const getTopLevel = () => {
    const topLevel = editedCategory.subcategories
      .filter(sub => !sub.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    console.log('🔍 CategoryEditor: Top level subcategories:', topLevel.map(t => `${t.name} (level ${t.level})`));
    return topLevel;
  };

  // Add subcategory
  const addSubcategory = async (parentId?: string) => {
    const name = newSubcategoryName.trim() || 'New Subcategory';
    const newId = Date.now().toString();
    let parentLevel = -1;
    let subcategoryColor = editedCategory.color;
    
    if (parentId) {
      // Child subcategory - inherit parent color
      const parent = editedCategory.subcategories.find(s => s.id === parentId);
      if (parent) {
        parentLevel = parent.level;
        subcategoryColor = parent.color;
        console.log('🎨 Child subcategory inheriting color:', subcategoryColor, 'from parent:', parent.name);
      }
    } else {
      // Top-level subcategory - assign bright color from array
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
      const topLevelCount = editedCategory.subcategories.filter(s => !s.parentId).length;
      subcategoryColor = colors[topLevelCount % colors.length];
      console.log('🎨 Top-level subcategory assigned color:', subcategoryColor, 'index:', topLevelCount);
    }

    // Calculate proper sort order based on siblings
    let sortOrder;
    if (parentId) {
      // For sub-categories, get next sort order within the parent
      const siblings = editedCategory.subcategories.filter(s => s.parentId === parentId);
      sortOrder = Math.max(0, ...siblings.map(s => s.sortOrder)) + 1;
    } else {
      // For main subcategories, get next sort order at top level
      const topLevelSiblings = editedCategory.subcategories.filter(s => !s.parentId);
      sortOrder = Math.max(0, ...topLevelSiblings.map(s => s.sortOrder)) + 1;
    }

    const newSubcategory: Subcategory = {
      id: newId,
      name: name,
      categoryId: editedCategory.id,
      parentId: parentId,
      color: subcategoryColor,
      isVisible: true,
      sortOrder: sortOrder,
      options: [],
      linkedFinalProducts: [],
      level: parentLevel + 1
    };
    
    // Update local state immediately for responsive UI
    const newState = {
      ...editedCategory,
      subcategories: [...editedCategory.subcategories, newSubcategory]
    };
    saveToHistory(newState);
    setNewSubcategoryName('');
    
    // Note: Individual subcategory saving disabled - only complete structure save is used
    console.log('✅ Subcategory added to local state - will save with complete structure');
    
    // Only open edit mode for sub-sub-categories (when parentId exists)
    // Main subcategories from sidebar already have typed names
    if (parentId) {
      setEditingSubcategoryId(newId);
      setTempSubcategoryName(name);
    }
  };

  // Get all subcategories in display order for shift-click
  const getAllSubcategoriesInOrder = (): Subcategory[] => {
    const result: Subcategory[] = [];
    const addSubcategoryAndChildren = (subcategory: Subcategory) => {
      result.push(subcategory);
      const children = getChildren(subcategory.id).sort((a, b) => a.sortOrder - b.sortOrder);
      children.forEach(child => addSubcategoryAndChildren(child));
    };
    const topLevel = getTopLevel();
    topLevel.forEach(sub => addSubcategoryAndChildren(sub));
    return result;
  };

  // Enhanced selection with shift-click support
  const handleSubcategoryClick = (subcategoryId: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedId) {
      // Shift-click: select range
      const allSubcategories = getAllSubcategoriesInOrder();
      const startIndex = allSubcategories.findIndex(sub => sub.id === lastClickedId);
      const endIndex = allSubcategories.findIndex(sub => sub.id === subcategoryId);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const rangeStart = Math.min(startIndex, endIndex);
        const rangeEnd = Math.max(startIndex, endIndex);
        const rangeIds = allSubcategories.slice(rangeStart, rangeEnd + 1).map(sub => sub.id);
        
        setSelectedSubcategories(prev => {
          const newSelection = [...prev];
          rangeIds.forEach(id => {
            if (!newSelection.includes(id)) {
              newSelection.push(id);
            }
          });
          return newSelection;
        });
      }
      setLastClickedId(subcategoryId);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl-click: toggle individual item
      toggleSubcategorySelection(subcategoryId);
      setLastClickedId(subcategoryId);
    } else {
      // Normal click: toggle individual item (like a normal checkbox)
      toggleSubcategorySelection(subcategoryId);
      setLastClickedId(subcategoryId);
    }
  };

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

  const selectAllInCategory = (categoryId: string) => {
    const categoryChildren = getChildren(categoryId);
    const childIds = categoryChildren.map(child => child.id);
    setSelectedSubcategories(prev => {
      const newSelection = [...prev];
      childIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const deselectAllInCategory = (categoryId: string) => {
    const categoryChildren = getChildren(categoryId);
    const childIds = categoryChildren.map(child => child.id);
    setSelectedSubcategories(prev => 
      prev.filter(id => !childIds.includes(id))
    );
  };

  const getCategorySelectionState = (categoryId: string) => {
    const categoryChildren = getChildren(categoryId);
    const childIds = categoryChildren.map(child => child.id);
    const selectedInCategory = childIds.filter(id => selectedSubcategories.includes(id));
    
    if (selectedInCategory.length === 0) return 'none';
    if (selectedInCategory.length === childIds.length) return 'all';
    return 'partial';
  };

  const clearSelection = () => {
    setSelectedSubcategories([]);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(editedCategory) !== JSON.stringify(originalCategory);
  };

  // Cancel confirmation handlers
  const handleCancelClick = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = (shouldSave: boolean) => {
    setShowCancelConfirm(false);
    if (shouldSave) {
      onSave(editedCategory);
    } else {
      onCancel();
    }
  };

  // Change subcategory color
  const changeSubcategoryColor = (subcategoryId: string, newColor: string) => {
    const updatedSubcategories = editedCategory.subcategories.map(sub => {
      if (sub.id === subcategoryId) {
        return { ...sub, color: newColor };
      }
      // Also update children to inherit the new color
      if (sub.parentId === subcategoryId) {
        return { ...sub, color: newColor };
      }
      return sub;
    });
    
    const newState = {
      ...editedCategory,
      subcategories: updatedSubcategories
    };
    saveToHistory(newState);
    setColorPickerId(null);
  };

  // Copy/Paste functions
  const copySelected = () => {
    if (selectedSubcategories.length === 0) return;
    
    // Get selected items and their children recursively
    const getAllChildren = (parentId: string): Subcategory[] => {
      const children = editedCategory.subcategories.filter(s => s.parentId === parentId);
      const result = [...children];
      children.forEach(child => {
        result.push(...getAllChildren(child.id));
      });
      return result;
    };
    
    const selectedItems: Subcategory[] = [];
    selectedSubcategories.forEach(id => {
      const item = editedCategory.subcategories.find(s => s.id === id);
      if (item) {
        selectedItems.push(item);
        // Also add all children recursively
        selectedItems.push(...getAllChildren(item.id));
      }
    });
    
    // Remove duplicates
    const uniqueItems = selectedItems.filter((item, index, self) => 
      self.findIndex(s => s.id === item.id) === index
    );
    
    setCopiedSubcategories(uniqueItems);
    setSelectedSubcategories([]); // Clear selection after copying
    console.log(`Copied ${uniqueItems.length} items (including children)`);
  };

  const pasteToSubcategory = (targetParentId: string) => {
    if (copiedSubcategories.length === 0) return;
    
    const targetParent = editedCategory.subcategories.find(s => s.id === targetParentId);
    if (!targetParent) return;
    
    // Get current children count for proper sort order
    const currentChildren = editedCategory.subcategories.filter(s => s.parentId === targetParentId);
    let nextSortOrder = Math.max(0, ...currentChildren.map(s => s.sortOrder)) + 1;
    
    // Map old IDs to new IDs to maintain relationships
    const idMapping = new Map<string, string>();
    const newSubcategories: Subcategory[] = [];
    
    // First pass: create new IDs for all items
    copiedSubcategories.forEach((item, index) => {
      const newId = Date.now().toString() + Math.random() + index;
      idMapping.set(item.id, newId);
    });
    
    // Second pass: create new items with proper relationships
    copiedSubcategories.forEach((item) => {
      const newId = idMapping.get(item.id)!;
      
      // Determine new parentId and level
      let newParentId: string | undefined;
      let newLevel: number;
      let newColor: string;
      
      if (item.parentId && idMapping.has(item.parentId)) {
        // Parent is also being copied - maintain relationship
        newParentId = idMapping.get(item.parentId);
        const originalParent = copiedSubcategories.find(s => s.id === item.parentId);
        newLevel = originalParent ? originalParent.level + 1 : targetParent.level + 1;
        newColor = item.color; // Keep original color for nested items
      } else {
        // Parent not being copied - attach to target
        newParentId = targetParentId;
        newLevel = targetParent.level + 1;
        newColor = targetParent.color;
      }
      
      const newItem: Subcategory = {
        ...item,
        id: newId,
        parentId: newParentId,
        level: newLevel,
        color: newColor,
        sortOrder: nextSortOrder++
      };
      
      newSubcategories.push(newItem);
    });
    
    const newState = {
      ...editedCategory,
      subcategories: [...editedCategory.subcategories, ...newSubcategories]
    };
    saveToHistory(newState);
    setCopiedSubcategories([]);
    console.log(`Pasted ${newSubcategories.length} items with relationships preserved`);
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const buffer = 20;
    
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
    
    // Handle main subcategory reordering
    if (draggedData.isMainSubcategory) {
      const targetIndex = getTopLevel().findIndex(sub => sub.id === targetSubcategoryId);
      const draggedIndex = getTopLevel().findIndex(sub => sub.id === draggedData.id);
      
      if (targetIndex !== -1 && draggedIndex !== -1 && targetIndex !== draggedIndex) {
        const topLevelSubs = [...getTopLevel()];
        const [draggedItem] = topLevelSubs.splice(draggedIndex, 1);
        topLevelSubs.splice(targetIndex, 0, draggedItem);
        
        // Update sort orders to reflect new positions
        const updatedSubcategories = editedCategory.subcategories.map(sub => {
          if (sub.level === 0) {
            const newIndex = topLevelSubs.findIndex(topSub => topSub.id === sub.id);
            console.log(`Updating ${sub.name} sortOrder from ${sub.sortOrder} to ${newIndex}`);
            return { ...sub, sortOrder: newIndex };
          }
          return sub;
        });
        
        const newState = {
          ...editedCategory,
          subcategories: updatedSubcategories
        };
        saveToHistory(newState);
      }
      return;
    }
    
    const targetSubcategory = editedCategory.subcategories.find(s => s.id === targetSubcategoryId);
    if (!targetSubcategory) return;

    if (draggedData.isMultiDrag) {
      // Multi-drop
      const containsSelf = draggedData.selectedItems.some((item: any) => item.id === targetSubcategoryId);
      if (containsSelf) return;
      
      // Get current children of target to determine new sort order
      const currentTargetChildren = editedCategory.subcategories.filter(sub => sub.parentId === targetSubcategoryId);
      let nextSortOrder = Math.max(0, ...currentTargetChildren.map(sub => sub.sortOrder)) + 1;
      
      const updatedSubcategories = editedCategory.subcategories.map(sub => {
        const isSelected = draggedData.selectedItems.some((item: any) => item.id === sub.id);
        if (isSelected) {
          return {
            ...sub,
            parentId: targetSubcategoryId,
            level: targetSubcategory.level + 1,
            color: targetSubcategory.color,
            sortOrder: nextSortOrder++
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
      
      const draggedItem = editedCategory.subcategories.find(sub => sub.id === draggedData.id);
      if (!draggedItem) return;
      
      // Check if dropping within same parent (reordering) or moving to new parent
      if (draggedItem.parentId === targetSubcategory.parentId) {
        // Within-column reordering
        console.log(`Within-column reordering: ${draggedItem.name} → ${targetSubcategory.name}`);
        
        const siblings = editedCategory.subcategories
          .filter(sub => sub.parentId === targetSubcategory.parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        
        console.log('Current sibling order:', siblings.map(s => `${s.name}(${s.sortOrder})`));
        
        const draggedIndex = siblings.findIndex(sub => sub.id === draggedData.id);
        const targetIndex = siblings.findIndex(sub => sub.id === targetSubcategoryId);
        
        console.log(`Dragged index: ${draggedIndex}, Target index: ${targetIndex}`);
        
        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
          // Remove dragged item and insert at target position
          const reorderedSiblings = [...siblings];
          const [movedItem] = reorderedSiblings.splice(draggedIndex, 1);
          reorderedSiblings.splice(targetIndex, 0, movedItem);
          
          console.log('New sibling order:', reorderedSiblings.map(s => s.name));
          
          // Update sort orders for all siblings
          const updatedSubcategories = editedCategory.subcategories.map(sub => {
            const siblingIndex = reorderedSiblings.findIndex(sibling => sibling.id === sub.id);
            if (siblingIndex !== -1) {
              console.log(`Reordering ${sub.name} sortOrder from ${sub.sortOrder} to ${siblingIndex}`);
              return { ...sub, sortOrder: siblingIndex };
            }
            return sub;
          });
          
          const newState = {
            ...editedCategory,
            subcategories: updatedSubcategories
          };
          saveToHistory(newState);
        } else {
          console.log('Reordering failed - invalid indices or same position');
        }
      } else {
        // Moving to different parent
        const currentTargetChildren = editedCategory.subcategories.filter(sub => sub.parentId === targetSubcategoryId);
        const nextSortOrder = Math.max(0, ...currentTargetChildren.map(sub => sub.sortOrder)) + 1;
        
        const updatedSubcategories = editedCategory.subcategories.map(sub => {
          if (sub.id === draggedData.id) {
            return {
              ...sub,
              parentId: targetSubcategoryId,
              level: targetSubcategory.level + 1,
              color: targetSubcategory.color,
              sortOrder: nextSortOrder
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
    }
  };

  // Remove subcategory
  const removeSubcategory = (subcategoryId: string) => {
    const subcategory = editedCategory.subcategories.find(s => s.id === subcategoryId);
    if (!subcategory) return;
    
    const hasChildren = editedCategory.subcategories.some(s => s.parentId === subcategoryId);
    if (hasChildren && !confirm(`Delete "${subcategory.name}" and all its Sub Categories?`)) {
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

  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleCancelClick} className="p-3 hover:bg-gray-100 rounded-xl">
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div className="w-8 h-8 rounded-full shadow-md" style={{ backgroundColor: editedCategory.color }} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Category: {editedCategory.name}</h1>
              <p className="text-gray-600">3-column grid layout</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700 bg-white px-4 py-3 rounded-xl border shadow-sm">
              <span className="font-bold">{editedCategory.subcategories.length}</span> subcategories
              {selectedSubcategories.length > 0 && (
                <span className="ml-2">• <span className="font-bold text-blue-600">{selectedSubcategories.length}</span> selected</span>
              )}
            </div>
            
            {selectedSubcategories.length > 0 && (
              <button onClick={copySelected} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium">
                📋 Copy {selectedSubcategories.length}
              </button>
            )}
            
            {copiedSubcategories.length > 0 && (
              <button onClick={() => setCopiedSubcategories([])} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">
                ✗ Clear Clipboard
              </button>
            )}
            
            <div className="flex gap-2">
              <button onClick={undo} disabled={historyIndex === 0} className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">↶</button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">↷</button>
            </div>
            
            <button onClick={() => {
              console.log('Saving category with subcategories:', editedCategory.subcategories.map(sub => ({
                name: sub.name,
                level: sub.level,
                sortOrder: sub.sortOrder,
                parentId: sub.parentId
              })));
              onSave(editedCategory);
            }} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold">Save</button>
            <button onClick={handleCancelClick} className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Subcategory</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Enter subcategory name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubcategory();
                  }
                }}
              />
              <button
                onClick={() => addSubcategory()}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Add Main Subcategory
              </button>
            </div>
          </div>

          {copiedSubcategories.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-amber-900">📋 Clipboard</h4>
                <button
                  onClick={() => setCopiedSubcategories([])}
                  className="text-xs text-amber-700 hover:text-red-600 font-medium underline"
                  title="Clear clipboard"
                >
                  ✗ Clear
                </button>
              </div>
              <p className="text-sm text-amber-700">{copiedSubcategories.length} Sub Categories ready to paste</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={editedCategory.name}
                onChange={(e) => setEditedCategory({...editedCategory, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
              <input
                type="color"
                value={editedCategory.color}
                onChange={(e) => setEditedCategory({...editedCategory, color: e.target.value})}
                className="w-full h-12 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Main 3-Column Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-8 auto-rows-max mb-32">
            {getTopLevel().map((mainSubcategory) => {
              const children = getChildren(mainSubcategory.id);
              const isSelected = selectedSubcategories.includes(mainSubcategory.id);
              
              return (
                <div key={mainSubcategory.id} className="h-auto min-h-96">
                  <div 
                    className={`bg-white rounded-2xl border-2 shadow-xl h-full overflow-hidden transition-all duration-200 ${
                      editingSubcategoryId ? 'cursor-default' : 'cursor-move'
                    } ${
                      dragHoverId === mainSubcategory.id ? 'ring-4 ring-blue-400 shadow-2xl transform scale-105' : 'hover:shadow-2xl'
                    }`}
                    draggable={!editingSubcategoryId}
                    onDragStart={(e) => {
                      if (editingSubcategoryId) {
                        e.preventDefault();
                        return;
                      }
                      const dragData = {
                        ...mainSubcategory,
                        isMainSubcategory: true
                      };
                      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                      setIsDragging(true);
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(mainSubcategory.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnSubcategory(e, mainSubcategory.id)}
                  >
                    {/* Drop Preview for Column Reordering */}
                    {dragHoverId === mainSubcategory.id && isDragging && (
                      <div className="absolute -top-3 left-0 right-0 bg-blue-500 text-white text-sm px-3 py-2 rounded-t-2xl z-20 text-center font-bold">
                        🔄 Drop here to reorder columns
                      </div>
                    )}
                    
                    {/* Column Header */}
                    <div 
                      className="p-6 border-b border-gray-200 text-center relative"
                      style={{ 
                        background: `linear-gradient(135deg, ${mainSubcategory.color}15, ${mainSubcategory.color}05)`,
                        borderTopColor: mainSubcategory.color,
                        borderTopWidth: '4px',
                        borderTopStyle: 'solid'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSubcategoryClick(mainSubcategory.id, e)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded cursor-pointer mb-3"
                      />
                      <div className="relative">
                        <button
                          onClick={() => setColorPickerId(colorPickerId === mainSubcategory.id ? null : mainSubcategory.id)}
                          className="w-12 h-12 rounded-full shadow-lg mx-auto mb-3 border-2 border-white hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: mainSubcategory.color }}
                          title="Click to change color"
                        />
                        {colorPickerId === mainSubcategory.id && (
                          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                            <input
                              type="color"
                              value={mainSubcategory.color}
                              onChange={(e) => changeSubcategoryColor(mainSubcategory.id, e.target.value)}
                              className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <div className="text-xs text-gray-500 mt-1 text-center">Pick Color</div>
                          </div>
                        )}
                      </div>
                      {editingSubcategoryId === mainSubcategory.id ? (
                        <input
                          type="text"
                          value={tempSubcategoryName}
                          onChange={(e) => setTempSubcategoryName(e.target.value)}
                          onBlur={() => {
                            const updatedSubcategories = editedCategory.subcategories.map(sub => 
                              sub.id === mainSubcategory.id 
                                ? { ...sub, name: tempSubcategoryName }
                                : sub
                            );
                            const newState = {
                              ...editedCategory,
                              subcategories: updatedSubcategories
                            };
                            saveToHistory(newState);
                            setEditingSubcategoryId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const updatedSubcategories = editedCategory.subcategories.map(sub => 
                                sub.id === mainSubcategory.id 
                                  ? { ...sub, name: tempSubcategoryName }
                                  : sub
                              );
                              const newState = {
                                ...editedCategory,
                                subcategories: updatedSubcategories
                              };
                              saveToHistory(newState);
                              setEditingSubcategoryId(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingSubcategoryId(null);
                              setTempSubcategoryName('');
                            }
                          }}
                          className="w-full text-center text-xl font-bold text-gray-900 bg-white border border-blue-300 rounded px-3 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSubcategoryId(mainSubcategory.id);
                            setTempSubcategoryName(mainSubcategory.name);
                          }}
                          className="w-full text-center text-xl font-bold text-gray-900 hover:bg-blue-50 rounded px-3 py-1 mb-2 transition-colors"
                        >
                          {mainSubcategory.name}
                        </button>
                      )}
                      <p className="text-gray-600">{children.length} Sub Categories</p>
                      
                      {children.length > 0 && (() => {
                        const selectionState = getCategorySelectionState(mainSubcategory.id);
                        if (selectionState === 'none') {
                          return (
                            <button
                              onClick={() => selectAllInCategory(mainSubcategory.id)}
                              className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              ✓ Select All
                            </button>
                          );
                        } else if (selectionState === 'all') {
                          return (
                            <button
                              onClick={() => deselectAllInCategory(mainSubcategory.id)}
                              className="mt-2 w-full px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                              ✗ Deselect All
                            </button>
                          );
                        } else {
                          return (
                            <div className="mt-2 flex gap-1">
                              <button
                                onClick={() => selectAllInCategory(mainSubcategory.id)}
                                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                              >
                                ✓ All
                              </button>
                              <button
                                onClick={() => deselectAllInCategory(mainSubcategory.id)}
                                className="flex-1 px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                              >
                                ✗ None
                              </button>
                            </div>
                          );
                        }
                      })()}
                      
                      {copiedSubcategories.length > 0 && (
                        <button
                          onClick={() => pasteToSubcategory(mainSubcategory.id)}
                          className="mt-3 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                        >
                          📋 Paste {copiedSubcategories.length}
                        </button>
                      )}
                      
                      <div className="flex gap-2 mt-4 justify-center">
                        <button
                          onClick={() => addSubcategory(mainSubcategory.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const duplicatedSubcategory: Subcategory = {
                              ...mainSubcategory,
                              id: Date.now().toString() + Math.random(),
                              name: `${mainSubcategory.name} (Copy)`,
                              parentId: mainSubcategory.parentId,
                              level: mainSubcategory.level
                            };
                            const newState = {
                              ...editedCategory,
                              subcategories: [...editedCategory.subcategories, duplicatedSubcategory]
                            };
                            saveToHistory(newState);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSubcategory(mainSubcategory.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="p-6 h-96 overflow-y-auto">
                      {children.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No Sub Categories yet</p>
                          <p className="text-xs">Click + above to add</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {children.map((child) => {
                            const childSelected = selectedSubcategories.includes(child.id);
                            const grandChildren = getChildren(child.id);
                            
                            return (
                              <div key={child.id}>
                                <div 
                                  className={`p-4 rounded-lg border-2 transition-colors ${
                                    editingSubcategoryId ? 'cursor-default' : 'cursor-move'
                                  } ${
                                    childSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-gray-200 hover:border-gray-300'
                                  } ${
                                    dragHoverId === child.id ? 'ring-4 ring-green-400 bg-green-100 border-green-500 shadow-xl transform scale-105' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: childSelected ? `${child.color}15` : `${child.color}05`,
                                  }}
                                  draggable={!editingSubcategoryId}
                                  onDragStart={(e) => {
                                    if (editingSubcategoryId) {
                                      e.preventDefault();
                                      return;
                                    }
                                    handleDragStart(e, child);
                                  }}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={handleDragOver}
                                  onDragEnter={() => handleDragEnter(child.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDropOnSubcategory(e, child.id)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <input
                                      type="checkbox"
                                      checked={childSelected}
                                      onChange={(e) => handleSubcategoryClick(child.id, e)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => addSubcategory(child.id)}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      >
                                        <PlusIcon className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const duplicatedSubcategory: Subcategory = {
                                            ...child,
                                            id: Date.now().toString() + Math.random(),
                                            name: `${child.name} (Copy)`,
                                            parentId: child.parentId,
                                            level: child.level
                                          };
                                          const newState = {
                                            ...editedCategory,
                                            subcategories: [...editedCategory.subcategories, duplicatedSubcategory]
                                          };
                                          saveToHistory(newState);
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      >
                                        <DocumentDuplicateIcon className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => removeSubcategory(child.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <TrashIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    {editingSubcategoryId === child.id ? (
                                      <input
                                        type="text"
                                        value={tempSubcategoryName}
                                        onChange={(e) => setTempSubcategoryName(e.target.value)}
                                        onBlur={() => {
                                          const updatedSubcategories = editedCategory.subcategories.map(sub => 
                                            sub.id === child.id 
                                              ? { ...sub, name: tempSubcategoryName }
                                              : sub
                                          );
                                          const newState = {
                                            ...editedCategory,
                                            subcategories: updatedSubcategories
                                          };
                                          saveToHistory(newState);
                                          setEditingSubcategoryId(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const updatedSubcategories = editedCategory.subcategories.map(sub => 
                                              sub.id === child.id 
                                                ? { ...sub, name: tempSubcategoryName }
                                                : sub
                                            );
                                            const newState = {
                                              ...editedCategory,
                                              subcategories: updatedSubcategories
                                            };
                                            saveToHistory(newState);
                                            setEditingSubcategoryId(null);
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingSubcategoryId(null);
                                            setTempSubcategoryName('');
                                          }
                                        }}
                                        className="w-full text-center font-medium text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingSubcategoryId(child.id);
                                          setTempSubcategoryName(child.name);
                                        }}
                                        className="w-full text-center font-medium text-gray-900 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                                      >
                                        {child.name}
                                      </button>
                                    )}
                                    
                                    {grandChildren.length > 0 ? (
                                      <div className="mt-2 text-xs text-gray-500">
                                        +{grandChildren.length} sub-children
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => addSubcategory(child.id)}
                                        className="mt-2 w-full flex items-center justify-center gap-1 p-1 border border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-500 hover:text-blue-600"
                                      >
                                        <PlusIcon className="w-3 h-3" />
                                        Add Sub-subcategory
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Sub-sub-subcategories with full management */}
                                {grandChildren.length > 0 && (
                                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                    <div className="text-xs text-gray-500 mb-2 font-medium">Sub-subcategories:</div>
                                    <div className="space-y-2">
                                      {grandChildren.map((grandChild) => {
                                        const grandSelected = selectedSubcategories.includes(grandChild.id);
                                        return (
                                          <div 
                                            key={grandChild.id}
                                            className={`flex items-center justify-between p-2 rounded border transition-all ${
                                              editingSubcategoryId ? 'cursor-default' : 'cursor-move'
                                            } ${
                                              grandSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                            } ${
                                              dragHoverId === grandChild.id ? 'ring-2 ring-blue-400 bg-blue-100 border-blue-400 shadow-lg transform scale-105' : ''
                                            }`}
                                            draggable={!editingSubcategoryId}
                                            onDragStart={(e) => {
                                              if (editingSubcategoryId) {
                                                e.preventDefault();
                                                return;
                                              }
                                              handleDragStart(e, grandChild);
                                            }}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDragEnter={() => handleDragEnter(grandChild.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDropOnSubcategory(e, grandChild.id)}
                                          >
                                            <div className="flex items-center gap-2 flex-1">
                                              <input
                                                type="checkbox"
                                                checked={grandSelected}
                                                onChange={(e) => handleSubcategoryClick(grandChild.id, e)}
                                                className="h-3 w-3 text-blue-600 border-gray-300 rounded cursor-pointer"
                                              />
                                              {editingSubcategoryId === grandChild.id ? (
                                                <input
                                                  type="text"
                                                  value={tempSubcategoryName}
                                                  onChange={(e) => setTempSubcategoryName(e.target.value)}
                                                  onBlur={() => {
                                                    const updatedSubcategories = editedCategory.subcategories.map(sub => 
                                                      sub.id === grandChild.id 
                                                        ? { ...sub, name: tempSubcategoryName }
                                                        : sub
                                                    );
                                                    const newState = {
                                                      ...editedCategory,
                                                      subcategories: updatedSubcategories
                                                    };
                                                    saveToHistory(newState);
                                                    setEditingSubcategoryId(null);
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      const updatedSubcategories = editedCategory.subcategories.map(sub => 
                                                        sub.id === grandChild.id 
                                                          ? { ...sub, name: tempSubcategoryName }
                                                          : sub
                                                      );
                                                      const newState = {
                                                        ...editedCategory,
                                                        subcategories: updatedSubcategories
                                                      };
                                                      saveToHistory(newState);
                                                      setEditingSubcategoryId(null);
                                                    }
                                                    if (e.key === 'Escape') {
                                                      setEditingSubcategoryId(null);
                                                      setTempSubcategoryName('');
                                                    }
                                                  }}
                                                  className="flex-1 text-xs bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                  autoFocus
                                                />
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setEditingSubcategoryId(grandChild.id);
                                                    setTempSubcategoryName(grandChild.name);
                                                  }}
                                                  className="flex-1 text-left text-xs text-gray-700 hover:text-blue-600"
                                                >
                                                  {grandChild.name}
                                                </button>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => removeSubcategory(grandChild.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                              >
                                                <TrashIcon className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Add new sub-sub-category button */}
                                      <button
                                        onClick={() => addSubcategory(child.id)}
                                        className="w-full flex items-center justify-center gap-1 p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-600 hover:text-blue-600"
                                      >
                                        <PlusIcon className="w-3 h-3" />
                                        Add Sub-subcategory
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty State */}
            {getTopLevel().length === 0 && (
              <div className="col-span-3">
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                  <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subcategories Yet</h3>
                  <p className="text-gray-600">Create your first subcategory using the sidebar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] bg-white bg-opacity-95 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Are you sure you want to cancel?</h3>
              <p className="text-gray-600 mb-8">Any unsaved changes will be lost. What would you like to do?</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleConfirmCancel(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex-1"
                >
                  Save & Exit
                </button>
                <button
                  onClick={() => handleConfirmCancel(false)}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold flex-1"
                >
                  Exit Without Saving
                </button>
              </div>
              
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="mt-4 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}1