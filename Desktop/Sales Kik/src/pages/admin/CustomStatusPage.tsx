import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PencilIcon, PlusIcon, TrashIcon, ArrowLeftIcon,
  CheckIcon, XMarkIcon, TagIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SubStatus {
  id: string;
  name: string;
  statusId: string;
}

interface Status {
  id: string;
  name: string;
  documentType: string;
  subStatuses: SubStatus[];
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  statuses: Status[];
}

export default function CustomStatusPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Main page state
  const [currentView, setCurrentView] = useState<'main' | 'detail'>('main');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  
  // Status management modal
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  
  // Sub-status management modal
  const [showAddSubStatusModal, setShowAddSubStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [newSubStatusName, setNewSubStatusName] = useState('');
  
  // Edit modals
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  
  const [showEditSubStatusModal, setShowEditSubStatusModal] = useState(false);
  const [editingSubStatus, setEditingSubStatus] = useState<SubStatus | null>(null);
  const [editSubStatusName, setEditSubStatusName] = useState('');
  
  // Delete modals
  const [showDeleteStatusModal, setShowDeleteStatusModal] = useState(false);
  const [showDeleteSubStatusModal, setShowDeleteSubStatusModal] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);
  const [subStatusToDelete, setSubStatusToDelete] = useState<SubStatus | null>(null);

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const savedTypes = localStorage.getItem('saleskik-document-types');
      if (savedTypes) {
        setDocumentTypes(JSON.parse(savedTypes));
      } else {
        // Create default document types with their statuses
        const defaultTypes: DocumentType[] = [
          {
            id: 'quote',
            name: 'Quote',
            description: 'Quotation document statuses',
            statuses: [
              { id: 'quote-draft', name: 'Draft', documentType: 'quote', subStatuses: [] },
              { id: 'quote-confirmed', name: 'Confirmed', documentType: 'quote', subStatuses: [] },
              { id: 'quote-edit', name: 'Edit', documentType: 'quote', subStatuses: [] },
              { id: 'quote-partially-ordered', name: 'Partially Ordered', documentType: 'quote', subStatuses: [] },
              { id: 'quote-completed', name: 'Completed', documentType: 'quote', subStatuses: [] }
            ]
          },
          {
            id: 'order',
            name: 'Order',
            description: 'Order document statuses',
            statuses: [
              { id: 'order-draft', name: 'Draft', documentType: 'order', subStatuses: [] },
              { id: 'order-confirmed', name: 'Confirmed', documentType: 'order', subStatuses: [] },
              { id: 'order-edit', name: 'Edit', documentType: 'order', subStatuses: [] },
              { id: 'order-completed', name: 'Completed', documentType: 'order', subStatuses: [] }
            ]
          },
          {
            id: 'purchase-order',
            name: 'Purchase Order',
            description: 'Purchase order document statuses',
            statuses: [
              { id: 'po-draft', name: 'Draft', documentType: 'purchase-order', subStatuses: [] },
              { id: 'po-confirmed', name: 'Confirmed', documentType: 'purchase-order', subStatuses: [] },
              { id: 'po-edit', name: 'Edit', documentType: 'purchase-order', subStatuses: [] },
              { id: 'po-partially-received', name: 'Partially Received', documentType: 'purchase-order', subStatuses: [] },
              { id: 'po-received', name: 'Received', documentType: 'purchase-order', subStatuses: [] }
            ]
          },
          {
            id: 'invoice',
            name: 'Invoice',
            description: 'Invoice document statuses',
            statuses: [
              { id: 'invoice-draft', name: 'Draft', documentType: 'invoice', subStatuses: [] },
              { id: 'invoice-confirmed', name: 'Confirmed', documentType: 'invoice', subStatuses: [] },
              { id: 'invoice-paid', name: 'Paid', documentType: 'invoice', subStatuses: [] },
              { id: 'invoice-payable', name: 'Payable', documentType: 'invoice', subStatuses: [] }
            ]
          },
          {
            id: 'invoice-supply',
            name: 'Invoice Supply',
            description: 'Invoice supply statuses',
            statuses: [
              { id: 'supply-supplied', name: 'Supplied', documentType: 'invoice-supply', subStatuses: [] },
              { id: 'supply-not-fully-supplied', name: 'Not Fully Supplied', documentType: 'invoice-supply', subStatuses: [] }
            ]
          }
        ];
        setDocumentTypes(defaultTypes);
        localStorage.setItem('saleskik-document-types', JSON.stringify(defaultTypes));
      }
    } catch (error) {
      console.error('Failed to load document types:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDocumentTypes = (updatedTypes: DocumentType[]) => {
    setDocumentTypes(updatedTypes);
    localStorage.setItem('saleskik-document-types', JSON.stringify(updatedTypes));
    
    // Notify other components that statuses have been updated
    window.dispatchEvent(new CustomEvent('customStatusUpdated'));
  };

  const handleEditDocumentType = (docType: DocumentType) => {
    setSelectedDocumentType(docType);
    setCurrentView('detail');
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim() || !selectedDocumentType) return;

    const newStatus: Status = {
      id: `${selectedDocumentType.id}-${Date.now()}`,
      name: newStatusName.trim(),
      documentType: selectedDocumentType.id,
      subStatuses: []
    };

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? { ...type, statuses: [...type.statuses, newStatus] }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setNewStatusName('');
    setShowAddStatusModal(false);
  };

  const handleAddSubStatus = () => {
    if (!newSubStatusName.trim() || !selectedStatus || !selectedDocumentType) return;

    const newSubStatus: SubStatus = {
      id: `${selectedStatus.id}-sub-${Date.now()}`,
      name: newSubStatusName.trim(),
      statusId: selectedStatus.id
    };

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? {
            ...type,
            statuses: type.statuses.map(status =>
              status.id === selectedStatus.id
                ? { ...status, subStatuses: [...status.subStatuses, newSubStatus] }
                : status
            )
          }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setNewSubStatusName('');
    setShowAddSubStatusModal(false);
    setSelectedStatus(null);
  };

  const handleEditStatus = (status: Status) => {
    setEditingStatus(status);
    setEditStatusName(status.name);
    setShowEditStatusModal(true);
  };

  const handleUpdateStatus = () => {
    if (!editStatusName.trim() || !editingStatus || !selectedDocumentType) return;

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? {
            ...type,
            statuses: type.statuses.map(status =>
              status.id === editingStatus.id
                ? { ...status, name: editStatusName.trim() }
                : status
            )
          }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setEditingStatus(null);
    setEditStatusName('');
    setShowEditStatusModal(false);
  };

  const handleEditSubStatus = (subStatus: SubStatus) => {
    setEditingSubStatus(subStatus);
    setEditSubStatusName(subStatus.name);
    setShowEditSubStatusModal(true);
  };

  const handleUpdateSubStatus = () => {
    if (!editSubStatusName.trim() || !editingSubStatus || !selectedDocumentType) return;

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? {
            ...type,
            statuses: type.statuses.map(status => ({
              ...status,
              subStatuses: status.subStatuses.map(subStatus =>
                subStatus.id === editingSubStatus.id
                  ? { ...subStatus, name: editSubStatusName.trim() }
                  : subStatus
              )
            }))
          }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setEditingSubStatus(null);
    setEditSubStatusName('');
    setShowEditSubStatusModal(false);
  };

  const handleDeleteStatus = (status: Status) => {
    setStatusToDelete(status);
    setShowDeleteStatusModal(true);
  };

  const confirmDeleteStatus = () => {
    if (!statusToDelete || !selectedDocumentType) return;

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? {
            ...type,
            statuses: type.statuses.filter(status => status.id !== statusToDelete.id)
          }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setStatusToDelete(null);
    setShowDeleteStatusModal(false);
  };

  const handleDeleteSubStatus = (subStatus: SubStatus) => {
    setSubStatusToDelete(subStatus);
    setShowDeleteSubStatusModal(true);
  };

  const confirmDeleteSubStatus = () => {
    if (!subStatusToDelete || !selectedDocumentType) return;

    const updatedTypes = documentTypes.map(type =>
      type.id === selectedDocumentType.id
        ? {
            ...type,
            statuses: type.statuses.map(status => ({
              ...status,
              subStatuses: status.subStatuses.filter(subStatus => subStatus.id !== subStatusToDelete.id)
            }))
          }
        : type
    );

    saveDocumentTypes(updatedTypes);
    setSelectedDocumentType(updatedTypes.find(t => t.id === selectedDocumentType.id) || null);
    setSubStatusToDelete(null);
    setShowDeleteSubStatusModal(false);
  };

  const getStatusColor = (docType: string) => {
    const colors = {
      'Quote': 'bg-blue-100 text-blue-700',
      'Order': 'bg-purple-100 text-purple-700',
      'Purchase Order': 'bg-orange-100 text-orange-700',
      'Invoice': 'bg-green-100 text-green-700',
      'Invoice Supply': 'bg-red-100 text-red-700'
    };
    return colors[docType as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="Custom Status"
        userPlan="SMALL_BUSINESS"
        userRole="ADMIN"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <main className="flex-1 overflow-hidden">
        {currentView === 'main' ? (
          <>
            {/* Main Header Section */}
            <div className="bg-gradient-to-r from-white via-purple-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">Manage Status</h1>
                  <TagIcon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Configure and customize status workflows for your business documents. Define the lifecycle stages 
                  for quotes, orders, invoices, and other documents to match your business processes.
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Document Types Table */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Document Types</h3>
                  <p className="text-sm text-gray-600 mt-1">Click edit to manage statuses for each document type</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documentTypes.map((docType) => (
                        <tr key={docType.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(docType.name)}`}>
                                {docType.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                ({docType.statuses.length} statuses)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <button 
                              onClick={() => handleEditDocumentType(docType)}
                              className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                              title="Manage statuses"
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Detail Header Section */}
            <div className="bg-gradient-to-r from-white via-purple-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCurrentView('main')}
                      className="text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Manage Status for {selectedDocumentType?.name}
                    </h1>
                  </div>
                  <p className="mt-1 text-gray-600">
                    Configure statuses and sub-statuses for {selectedDocumentType?.name.toLowerCase()} documents
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStatusModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Status
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Status Management Table */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDocumentType?.statuses.map((status) => (
                        <tr key={status.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-800">
                              {status.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {status.subStatuses.map((subStatus) => (
                                <div key={subStatus.id} className="flex items-center space-x-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {subStatus.name}
                                  </span>
                                  <button
                                    onClick={() => handleEditSubStatus(subStatus)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit sub-status"
                                  >
                                    <PencilIcon className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubStatus(subStatus)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete sub-status"
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {status.subStatuses.length === 0 && (
                                <span className="text-sm text-gray-400">No sub-statuses</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => handleEditStatus(status)}
                                className="text-amber-600 hover:text-amber-900"
                                title="Rename status"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStatus(status);
                                  setShowAddSubStatusModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                title="Add sub-status"
                              >
                                <PlusIcon className="w-4 h-4" />
                                <span className="text-xs">Sub</span>
                              </button>
                              <button
                                onClick={() => handleDeleteStatus(status)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete status"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Status Modal */}
      <Modal
        isOpen={showAddStatusModal}
        onClose={() => {
          setShowAddStatusModal(false);
          setNewStatusName('');
        }}
        title="Add Status"
        subtitle={`Add a new status for ${selectedDocumentType?.name}`}
        size="md"
      >
        <div className="p-1">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Status Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              placeholder="e.g., In Progress, Pending Review"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowAddStatusModal(false);
              setNewStatusName('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStatus}
            disabled={!newStatusName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Add Sub-Status Modal */}
      <Modal
        isOpen={showAddSubStatusModal}
        onClose={() => {
          setShowAddSubStatusModal(false);
          setNewSubStatusName('');
          setSelectedStatus(null);
        }}
        title="Add Sub-Status"
        subtitle={`Add a sub-status for "${selectedStatus?.name}"`}
        size="md"
      >
        <div className="p-1">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sub-Status Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newSubStatusName}
              onChange={(e) => setNewSubStatusName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="e.g., Awaiting Approval, Partial Payment"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowAddSubStatusModal(false);
              setNewSubStatusName('');
              setSelectedStatus(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSubStatus}
            disabled={!newSubStatusName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        isOpen={showEditStatusModal}
        onClose={() => {
          setShowEditStatusModal(false);
          setEditingStatus(null);
          setEditStatusName('');
        }}
        title="Edit Status"
        subtitle="Update status name"
        size="md"
      >
        <div className="p-1">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Status Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editStatusName}
              onChange={(e) => setEditStatusName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowEditStatusModal(false);
              setEditingStatus(null);
              setEditStatusName('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateStatus}
            disabled={!editStatusName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300"
          >
            Update
          </button>
        </div>
      </Modal>

      {/* Edit Sub-Status Modal */}
      <Modal
        isOpen={showEditSubStatusModal}
        onClose={() => {
          setShowEditSubStatusModal(false);
          setEditingSubStatus(null);
          setEditSubStatusName('');
        }}
        title="Edit Sub-Status"
        subtitle="Update sub-status name"
        size="md"
      >
        <div className="p-1">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sub-Status Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editSubStatusName}
              onChange={(e) => setEditSubStatusName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowEditSubStatusModal(false);
              setEditingSubStatus(null);
              setEditSubStatusName('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateSubStatus}
            disabled={!editSubStatusName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            Update
          </button>
        </div>
      </Modal>

      {/* Delete Status Confirmation */}
      <Modal
        isOpen={showDeleteStatusModal}
        onClose={() => {
          setShowDeleteStatusModal(false);
          setStatusToDelete(null);
        }}
        title="Delete Status"
        subtitle="This action cannot be undone"
        size="md"
      >
        <div className="p-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete this status?
              </p>
              {statusToDelete && (
                <p className="text-xs text-gray-500 mt-1">
                  {statusToDelete.name} (and all its sub-statuses)
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowDeleteStatusModal(false);
              setStatusToDelete(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteStatus}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Delete Sub-Status Confirmation */}
      <Modal
        isOpen={showDeleteSubStatusModal}
        onClose={() => {
          setShowDeleteSubStatusModal(false);
          setSubStatusToDelete(null);
        }}
        title="Delete Sub-Status"
        subtitle="This action cannot be undone"
        size="md"
      >
        <div className="p-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete this sub-status?
              </p>
              {subStatusToDelete && (
                <p className="text-xs text-gray-500 mt-1">
                  {subStatusToDelete.name}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowDeleteSubStatusModal(false);
              setSubStatusToDelete(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteSubStatus}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete Sub-Status
          </button>
        </div>
      </Modal>
    </div>
  );
}