import React, { useState, useEffect } from 'react';
import { 
  ArchiveBoxIcon, DocumentTextIcon, CheckCircleIcon, XMarkIcon,
  FolderIcon, ArrowDownTrayIcon, EyeIcon, ClockIcon,
  ExclamationTriangleIcon, InformationCircleIcon, CogIcon,
  ShieldCheckIcon, DocumentArrowDownIcon, PlusIcon,
  TrashIcon, ArrowPathIcon, LockClosedIcon, KeyIcon
} from '@heroicons/react/24/outline';
import AttachmentBundlingService from '../../services/AttachmentBundlingService';

interface AttachmentBundleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
}

export default function AttachmentBundleManager({ isOpen, onClose, purchaseOrderId }: AttachmentBundleManagerProps) {
  const [bundle, setBundle] = useState<any>(null);
  const [bundleStats, setBundleStats] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [bundlingOptions, setBundlingOptions] = useState({
    includeAllAttachments: true,
    createFolders: true,
    addReadmeFile: true,
    encryptBundle: false,
    password: '',
    expirationHours: 168, // 7 days
    maxDownloads: 10,
    notifyOnDownload: true
  });
  const [creating, setCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBundleData();
    }
  }, [isOpen, purchaseOrderId]);

  const loadBundleData = async () => {
    try {
      const bundlingService = AttachmentBundlingService.getInstance();
      
      // Load existing bundle for this purchase order
      const existingBundle = bundlingService.getBundleForPurchaseOrder(purchaseOrderId);
      setBundle(existingBundle);
      
      // Load bundle statistics
      const stats = bundlingService.getBundleStatistics();
      setBundleStats(stats);
      
      // Load attachments (mock data for demo)
      const mockAttachments = [
        {
          id: '1',
          originalFilename: 'technical-drawings.pdf',
          fileSize: 2500000,
          fileType: 'application/pdf',
          includeInBundle: true,
          isRequired: true,
          description: 'Technical specifications and measurements'
        },
        {
          id: '2',
          originalFilename: 'site-specifications.dwg',
          fileSize: 1800000,
          fileType: 'application/dwg',
          includeInBundle: true,
          isRequired: true,
          description: 'CAD drawings for custom glass installation'
        },
        {
          id: '3',
          originalFilename: 'delivery-instructions.docx',
          fileSize: 45000,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          includeInBundle: true,
          isRequired: false,
          description: 'Special delivery and installation instructions'
        }
      ];
      setAttachments(mockAttachments);
    } catch (error) {
      console.error('Error loading bundle data:', error);
    }
  };

  const createNewBundle = async () => {
    setCreating(true);
    
    try {
      const bundlingService = AttachmentBundlingService.getInstance();
      const result = await bundlingService.createAttachmentBundle(purchaseOrderId, bundlingOptions);
      
      if (result.success) {
        const newBundle = bundlingService.getBundleForPurchaseOrder(purchaseOrderId);
        setBundle(newBundle);
        alert('Attachment bundle created successfully!');
      } else {
        alert(`Error creating bundle: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
      alert('Failed to create attachment bundle');
    } finally {
      setCreating(false);
    }
  };

  const regenerateBundle = async () => {
    if (!bundle) return;

    setCreating(true);
    
    try {
      const bundlingService = AttachmentBundlingService.getInstance();
      const result = await bundlingService.regenerateBundle(bundle.id, bundlingOptions);
      
      if (result.success) {
        const updatedBundle = bundlingService.getBundleForPurchaseOrder(purchaseOrderId);
        setBundle(updatedBundle);
        alert('Bundle regenerated successfully!');
      } else {
        alert(`Error regenerating bundle: ${result.error}`);
      }
    } catch (error) {
      console.error('Error regenerating bundle:', error);
      alert('Failed to regenerate bundle');
    } finally {
      setCreating(false);
    }
  };

  const downloadBundle = async () => {
    if (!bundle?.zipFile) return;

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = bundle.zipUrl;
      link.download = bundle.zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download
      const bundlingService = AttachmentBundlingService.getInstance();
      await bundlingService.trackBundleDownload(bundle.id, {
        ipAddress: 'admin-download',
        userAgent: navigator.userAgent,
        supplierEmail: 'internal-download'
      });

      loadBundleData(); // Refresh data
    } catch (error) {
      console.error('Error downloading bundle:', error);
      alert('Failed to download bundle');
    }
  };

  const deleteBundle = async () => {
    if (!bundle || !confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const bundlingService = AttachmentBundlingService.getInstance();
      const deleted = bundlingService.deleteBundleById(bundle.id);
      
      if (deleted) {
        setBundle(null);
        alert('Bundle deleted successfully');
      } else {
        alert('Failed to delete bundle');
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
      alert('Failed to delete bundle');
    }
  };

  const toggleAttachmentInclusion = (attachmentId: string) => {
    setAttachments(prev => prev.map(att => 
      att.id === attachmentId 
        ? { ...att, includeInBundle: !att.includeInBundle }
        : att
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <div className="w-6 h-6 bg-blue-100 rounded text-xs font-bold text-blue-600 flex items-center justify-center">IMG</div>;
    }
    if (fileType === 'application/pdf') {
      return <div className="w-6 h-6 bg-red-100 rounded text-xs font-bold text-red-600 flex items-center justify-center">PDF</div>;
    }
    if (['dwg', 'dxf'].includes(extension || '')) {
      return <div className="w-6 h-6 bg-purple-100 rounded text-xs font-bold text-purple-600 flex items-center justify-center">CAD</div>;
    }
    return <DocumentTextIcon className="w-6 h-6 text-gray-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <ArchiveBoxIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Attachment Bundle Manager</h3>
              <p className="text-gray-600">Create and manage ZIP bundles for supplier delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Current Bundle Status */}
          {bundle ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Bundle Ready</h4>
                    <p className="text-sm text-green-700">
                      {bundle.zipFileName} • {bundle.attachments.length} files • 
                      {formatFileSize(bundle.zipFile?.size || 0)} • 
                      {bundle.downloadCount}/{bundle.maxDownloads} downloads
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadBundle}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={regenerateBundle}
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteBundle}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Bundle Details */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-900">{bundle.attachments.length}</div>
                  <div className="text-sm text-green-700">Files Included</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">{formatFileSize(bundle.zipFile?.size || 0)}</div>
                  <div className="text-sm text-blue-700">Bundle Size</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-900">{bundle.downloadCount}</div>
                  <div className="text-sm text-purple-700">Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-900">
                    {Math.ceil((bundle.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                  </div>
                  <div className="text-sm text-orange-700">Days Left</div>
                </div>
              </div>

              {/* Delivery Confirmation */}
              {bundle.deliveryConfirmation && (
                <div className="mt-4 p-3 bg-white border border-green-200 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Delivery Confirmation</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Sent to:</span> {bundle.deliveryConfirmation.supplierEmail}
                    </div>
                    <div>
                      <span className="text-green-700">Sent at:</span> {bundle.deliveryConfirmation.sentAt.toLocaleString()}
                    </div>
                    {bundle.deliveryConfirmation.downloadedAt && (
                      <>
                        <div>
                          <span className="text-green-700">Downloaded:</span> {bundle.deliveryConfirmation.downloadedAt.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Confirmed Delivery</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">No Bundle Created</h4>
                  <p className="text-sm text-blue-700">
                    Create an attachment bundle to deliver all files to the supplier as a single ZIP package
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Available Attachments</h4>
              <p className="text-sm text-gray-600">Select which attachments to include in the supplier bundle</p>
            </div>
            
            {attachments.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No attachments available</p>
                <p className="text-sm text-gray-500">Add attachments to the purchase order to bundle them</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {attachments.map((attachment, index) => (
                  <div key={attachment.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      
                      {/* Include Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={attachment.includeInBundle}
                          onChange={() => toggleAttachmentInclusion(attachment.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      {/* File Icon & Info */}
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(attachment.fileType, attachment.originalFilename)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{attachment.originalFilename}</div>
                          <div className="text-sm text-gray-600">
                            {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                          </div>
                          {attachment.description && (
                            <div className="text-sm text-gray-500 mt-1">{attachment.description}</div>
                          )}
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-2">
                        {attachment.isRequired && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Required
                          </span>
                        )}
                        {attachment.includeInBundle && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Included
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bundling Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Bundling Options</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <CogIcon className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bundlingOptions.createFolders}
                  onChange={(e) => setBundlingOptions(prev => ({ ...prev, createFolders: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Organize in folders</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bundlingOptions.addReadmeFile}
                  onChange={(e) => setBundlingOptions(prev => ({ ...prev, addReadmeFile: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Include README file</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bundlingOptions.notifyOnDownload}
                  onChange={(e) => setBundlingOptions(prev => ({ ...prev, notifyOnDownload: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Notify on download</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bundlingOptions.encryptBundle}
                  onChange={(e) => setBundlingOptions(prev => ({ ...prev, encryptBundle: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Password protect</span>
              </label>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration (hours)</label>
                  <input
                    type="number"
                    value={bundlingOptions.expirationHours}
                    onChange={(e) => setBundlingOptions(prev => ({ ...prev, expirationHours: parseInt(e.target.value) || 168 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Downloads</label>
                  <input
                    type="number"
                    value={bundlingOptions.maxDownloads}
                    onChange={(e) => setBundlingOptions(prev => ({ ...prev, maxDownloads: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {bundlingOptions.encryptBundle && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={bundlingOptions.password}
                      onChange={(e) => setBundlingOptions(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password for ZIP encryption"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bundle Statistics */}
          {bundleStats && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">System Statistics</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{bundleStats.totalBundles}</div>
                  <div className="text-sm text-gray-600">Total Bundles</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{bundleStats.activeBundles}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{bundleStats.totalDownloads}</div>
                  <div className="text-sm text-gray-600">Downloads</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{formatFileSize(bundleStats.averageBundleSize)}</div>
                  <div className="text-sm text-gray-600">Avg Size</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Actions Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {attachments.filter(att => att.includeInBundle).length} of {attachments.length} attachments selected
              {attachments.some(att => att.isRequired && !att.includeInBundle) && (
                <span className="text-red-600 ml-2">⚠ Required attachments not included</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {!bundle ? (
                <button
                  onClick={createNewBundle}
                  disabled={creating || attachments.filter(att => att.includeInBundle).length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {creating ? 'Creating...' : 'Create Bundle'}
                </button>
              ) : (
                <button
                  onClick={regenerateBundle}
                  disabled={creating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {creating ? 'Regenerating...' : 'Regenerate Bundle'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}