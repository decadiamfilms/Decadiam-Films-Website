import React, { useState, useEffect } from 'react';
import { 
  CloudArrowUpIcon, DocumentTextIcon, XMarkIcon, EyeIcon,
  PhotoIcon, DocumentArrowDownIcon, TrashIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InformationCircleIcon, FolderOpenIcon,
  PaperClipIcon, ArrowDownTrayIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Attachment {
  id: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: Date;
  isIncludedWithSupplierOrder: boolean;
  file?: File; // For new uploads
}

interface AttachmentManagerProps {
  purchaseOrderId: string;
  attachments: Attachment[];
  onAttachmentsUpdate: (attachments: Attachment[]) => void;
  readOnly?: boolean;
}

export default function AttachmentManager({ 
  purchaseOrderId, 
  attachments, 
  onAttachmentsUpdate, 
  readOnly = false 
}: AttachmentManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  const allowedFileTypes = [
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.dwg', '.dxf', '.step', '.stp', '.iges', '.igs',
    '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedFileTypes.includes(fileExtension)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = (files: File[]) => {
    files.forEach(file => {
      const newAttachment: Attachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalFilename: file.name,
        storedFilename: `${Date.now()}_${file.name}`,
        filePath: `/uploads/purchase-orders/${purchaseOrderId}/${Date.now()}_${file.name}`,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedBy: 'current-user', // Replace with actual user
        uploadDate: new Date(),
        isIncludedWithSupplierOrder: true,
        file
      };

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Add to attachments list
          const updatedAttachments = [...attachments, newAttachment];
          onAttachmentsUpdate(updatedAttachments);
          
          // Clear progress
          setTimeout(() => {
            setUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[file.name];
              return updated;
            });
          }, 1000);
        }
      }, 100);
    });
  };

  const removeAttachment = (attachmentId: string) => {
    if (confirm('Are you sure you want to remove this attachment?')) {
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      onAttachmentsUpdate(updatedAttachments);
    }
  };

  const toggleIncludeWithOrder = (attachmentId: string) => {
    const updatedAttachments = attachments.map(att =>
      att.id === attachmentId 
        ? { ...att, isIncludedWithSupplierOrder: !att.isIncludedWithSupplierOrder }
        : att
    );
    onAttachmentsUpdate(updatedAttachments);
  };

  const downloadAttachment = (attachment: Attachment) => {
    // In production, this would download from secure storage
    if (attachment.file) {
      const url = URL.createObjectURL(attachment.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('File download functionality would be implemented in production');
    }
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return <PhotoIcon className="w-6 h-6 text-blue-600" />;
    }
    
    if (fileType === 'application/pdf' || extension === 'pdf') {
      return <DocumentTextIcon className="w-6 h-6 text-red-600" />;
    }
    
    if (['dwg', 'dxf', 'step', 'stp', 'iges', 'igs'].includes(extension || '')) {
      return <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs font-bold text-purple-600">CAD</div>;
    }
    
    return <DocumentTextIcon className="w-6 h-6 text-gray-600" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      
      {/* Upload Area */}
      {!readOnly && (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={allowedFileTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            id={`file-upload-${purchaseOrderId}`}
          />
          <label htmlFor={`file-upload-${purchaseOrderId}`} className="cursor-pointer">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base text-gray-600 mb-2">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">
              Technical drawings, specifications, CAD files, images, documents
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported: PDF, Images, CAD (.dwg, .dxf), Office documents • Max 10MB per file
            </p>
          </label>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Uploading Files</h4>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 truncate">{fileName}</span>
                  <span className="text-blue-600 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Technical Documentation ({attachments.length})
              </h4>
              {!readOnly && (
                <div className="text-sm text-gray-600">
                  {attachments.filter(att => att.isIncludedWithSupplierOrder).length} included with supplier order
                </div>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {attachments.map(attachment => (
              <div key={attachment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  
                  {/* File Icon & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.fileType, attachment.originalFilename)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{attachment.originalFilename}</div>
                      <div className="text-sm text-gray-600">
                        {formatFileSize(attachment.fileSize)} • 
                        Uploaded {attachment.uploadDate.toLocaleDateString()} • 
                        {attachment.uploadedBy}
                      </div>
                      {attachment.isIncludedWithSupplierOrder && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Included with supplier order
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewFile(attachment)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => downloadAttachment(attachment)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                    </button>
                    
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => toggleIncludeWithOrder(attachment.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            attachment.isIncludedWithSupplierOrder
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={attachment.isIncludedWithSupplierOrder ? 'Included with order' : 'Include with order'}
                        >
                          <PaperClipIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            All files are securely stored and encrypted. Only authorized users can access these documents.
          </span>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {getFileIcon(previewFile.fileType, previewFile.originalFilename)}
                <div>
                  <h3 className="font-medium text-gray-900">{previewFile.originalFilename}</h3>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(previewFile.fileSize)} • {previewFile.uploadDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAttachment(previewFile)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Download
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 text-center">
              {previewFile.fileType.startsWith('image/') ? (
                <div className="max-h-96 overflow-auto">
                  {previewFile.file ? (
                    <img 
                      src={URL.createObjectURL(previewFile.file)} 
                      alt={previewFile.originalFilename}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-12">
                      <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Image preview not available</p>
                      <p className="text-sm text-gray-500">Download to view file</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-12">
                  <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <p className="text-sm text-gray-500">Download the file to view its contents</p>
                  <button
                    onClick={() => downloadAttachment(previewFile)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {attachments.length === 0 && !readOnly && (
        <div className="text-center py-4">
          <FolderOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No attachments yet</p>
          <p className="text-sm text-gray-500">
            Add technical drawings, specifications, or other documentation
          </p>
        </div>
      )}

      {/* Attachment Guidelines */}
      {!readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Attachment Guidelines</h5>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span>Technical drawings and specifications help ensure accurate fulfillment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span>CAD files (.dwg, .dxf) are automatically included with custom glass orders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span>Images and PDFs provide visual reference for complex requirements</span>
            </div>
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-600" />
              <span>Files marked as "Include with order" are sent to the supplier</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Standalone Attachment Viewer Component
interface AttachmentViewerProps {
  attachments: Attachment[];
  title?: string;
}

export function AttachmentViewer({ attachments, title = "Attachments" }: AttachmentViewerProps) {
  return (
    <AttachmentManager
      purchaseOrderId="readonly"
      attachments={attachments}
      onAttachmentsUpdate={() => {}}
      readOnly={true}
    />
  );
}