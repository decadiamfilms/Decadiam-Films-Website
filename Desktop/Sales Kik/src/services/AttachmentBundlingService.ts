// Attachment Bundling Service for Purchase Orders
// Handles ZIP file creation, automatic bundling, and delivery confirmation

import JSZip from 'jszip';

export interface AttachmentBundle {
  id: string;
  purchaseOrderId: string;
  bundleName: string;
  zipFileName: string;
  attachments: BundledAttachment[];
  zipFile?: Blob;
  zipUrl?: string;
  createdAt: Date;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  password?: string;
  isEncrypted: boolean;
  deliveryConfirmation?: {
    sentAt: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    downloadedAt?: Date;
    supplierEmail: string;
  };
}

export interface BundledAttachment {
  id: string;
  originalFilename: string;
  storedFilename: string;
  fileSize: number;
  fileType: string;
  includeInBundle: boolean;
  folderPath?: string; // For organizing files within ZIP
  description?: string;
  isRequired: boolean;
  lastModified: Date;
}

export interface BundlingOptions {
  includeAllAttachments: boolean;
  createFolders: boolean;
  addReadmeFile: boolean;
  encryptBundle: boolean;
  password?: string;
  expirationHours: number;
  maxDownloads: number;
  notifyOnDownload: boolean;
}

class AttachmentBundlingService {
  private static instance: AttachmentBundlingService;
  private bundles: AttachmentBundle[] = [];

  private constructor() {
    this.loadExistingBundles();
  }

  public static getInstance(): AttachmentBundlingService {
    if (!AttachmentBundlingService.instance) {
      AttachmentBundlingService.instance = new AttachmentBundlingService();
    }
    return AttachmentBundlingService.instance;
  }

  private loadExistingBundles(): void {
    const savedBundles = localStorage.getItem('saleskik-attachment-bundles');
    if (savedBundles) {
      try {
        this.bundles = JSON.parse(savedBundles).map((bundle: any) => ({
          ...bundle,
          createdAt: new Date(bundle.createdAt),
          expiresAt: new Date(bundle.expiresAt),
          deliveryConfirmation: bundle.deliveryConfirmation ? {
            ...bundle.deliveryConfirmation,
            sentAt: new Date(bundle.deliveryConfirmation.sentAt),
            deliveredAt: bundle.deliveryConfirmation.deliveredAt ? new Date(bundle.deliveryConfirmation.deliveredAt) : undefined,
            openedAt: bundle.deliveryConfirmation.openedAt ? new Date(bundle.deliveryConfirmation.openedAt) : undefined,
            downloadedAt: bundle.deliveryConfirmation.downloadedAt ? new Date(bundle.deliveryConfirmation.downloadedAt) : undefined
          } : undefined
        }));
      } catch (error) {
        console.error('Error loading attachment bundles:', error);
        this.bundles = [];
      }
    }
  }

  private saveBundles(): void {
    localStorage.setItem('saleskik-attachment-bundles', JSON.stringify(this.bundles));
  }

  // Create ZIP bundle from purchase order attachments
  public async createAttachmentBundle(
    purchaseOrderId: string,
    options: BundlingOptions = {
      includeAllAttachments: true,
      createFolders: true,
      addReadmeFile: true,
      encryptBundle: false,
      expirationHours: 168, // 7 days
      maxDownloads: 10,
      notifyOnDownload: true
    }
  ): Promise<{ success: boolean; bundleId?: string; error?: string }> {
    try {
      console.log(`Creating attachment bundle for PO: ${purchaseOrderId}`);

      // Get purchase order and attachments
      const purchaseOrder = await this.getPurchaseOrder(purchaseOrderId);
      if (!purchaseOrder) {
        return { success: false, error: 'Purchase order not found' };
      }

      const attachments = await this.getPurchaseOrderAttachments(purchaseOrderId);
      if (attachments.length === 0) {
        return { success: false, error: 'No attachments found for this purchase order' };
      }

      // Filter attachments to include
      const attachmentsToBundle = options.includeAllAttachments 
        ? attachments 
        : attachments.filter(att => att.includeInBundle);

      if (attachmentsToBundle.length === 0) {
        return { success: false, error: 'No attachments selected for bundling' };
      }

      // Create ZIP file
      const zip = new JSZip();
      const bundleId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const bundleName = `PO-${purchaseOrder.purchaseOrderNumber}-Attachments`;

      // Add README file if requested
      if (options.addReadmeFile) {
        const readmeContent = this.generateReadmeContent(purchaseOrder, attachmentsToBundle);
        zip.file('README.txt', readmeContent);
      }

      // Organize files into folders if requested
      for (const attachment of attachmentsToBundle) {
        try {
          const fileContent = await this.getAttachmentContent(attachment);
          
          if (options.createFolders) {
            const folderPath = this.determineFolderPath(attachment);
            const filePath = folderPath ? `${folderPath}/${attachment.originalFilename}` : attachment.originalFilename;
            zip.file(filePath, fileContent);
          } else {
            // Ensure unique filenames
            const uniqueFilename = this.ensureUniqueFilename(attachment.originalFilename, attachmentsToBundle);
            zip.file(uniqueFilename, fileContent);
          }
        } catch (error) {
          console.warn(`Failed to add ${attachment.originalFilename} to bundle:`, error);
        }
      }

      // Generate ZIP file
      const zipOptions: any = {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      };

      // Add password protection if requested
      if (options.encryptBundle && options.password) {
        zipOptions.encryptStrength = 3;
        zipOptions.password = options.password;
      }

      const zipBlob = await zip.generateAsync(zipOptions);
      const zipUrl = URL.createObjectURL(zipBlob);

      // Create bundle record
      const bundle: AttachmentBundle = {
        id: bundleId,
        purchaseOrderId,
        bundleName,
        zipFileName: `${bundleName}.zip`,
        attachments: attachmentsToBundle,
        zipFile: zipBlob,
        zipUrl,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + options.expirationHours * 60 * 60 * 1000),
        downloadCount: 0,
        maxDownloads: options.maxDownloads,
        password: options.password,
        isEncrypted: options.encryptBundle
      };

      this.bundles.push(bundle);
      this.saveBundles();

      console.log(`Attachment bundle created: ${bundleId} (${attachmentsToBundle.length} files, ${this.formatFileSize(zipBlob.size)})`);

      return { success: true, bundleId };
    } catch (error) {
      console.error('Error creating attachment bundle:', error);
      return { success: false, error: 'Failed to create attachment bundle' };
    }
  }

  // Automatically bundle attachments for supplier email
  public async bundleAttachmentsForSupplierEmail(purchaseOrderId: string): Promise<{
    success: boolean;
    bundleId?: string;
    downloadUrl?: string;
    attachmentCount?: number;
    bundleSize?: string;
    error?: string;
  }> {
    try {
      const bundleResult = await this.createAttachmentBundle(purchaseOrderId, {
        includeAllAttachments: false, // Only include marked attachments
        createFolders: true,
        addReadmeFile: true,
        encryptBundle: false, // Don't encrypt for supplier access
        expirationHours: 336, // 14 days for supplier access
        maxDownloads: 25, // Allow multiple downloads
        notifyOnDownload: true
      });

      if (!bundleResult.success) {
        return bundleResult;
      }

      const bundle = this.bundles.find(b => b.id === bundleResult.bundleId);
      if (!bundle) {
        return { success: false, error: 'Bundle not found after creation' };
      }

      // Generate secure download URL for supplier
      const secureDownloadUrl = await this.generateSecureDownloadUrl(bundle.id, 'supplier-access');

      return {
        success: true,
        bundleId: bundle.id,
        downloadUrl: secureDownloadUrl,
        attachmentCount: bundle.attachments.length,
        bundleSize: this.formatFileSize(bundle.zipFile?.size || 0)
      };
    } catch (error) {
      console.error('Error bundling attachments for supplier:', error);
      return { success: false, error: 'Failed to bundle attachments for supplier' };
    }
  }

  // Generate secure download URL with access control
  private async generateSecureDownloadUrl(bundleId: string, accessType: 'supplier-access' | 'internal-access'): Promise<string> {
    const securityToken = this.generateSecurityToken(bundleId, accessType);
    
    // Store access token
    const accessRecord = {
      id: Date.now().toString(),
      bundleId,
      token: securityToken,
      accessType,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      used: false,
      ipAddress: 'pending'
    };

    const existingTokens = JSON.parse(localStorage.getItem('saleskik-bundle-access-tokens') || '[]');
    existingTokens.push(accessRecord);
    localStorage.setItem('saleskik-bundle-access-tokens', JSON.stringify(existingTokens));

    return `${window.location.origin}/api/attachments/bundle/${bundleId}/download?token=${securityToken}`;
  }

  private generateSecurityToken(bundleId: string, accessType: string): string {
    const payload = {
      bundleId,
      accessType,
      timestamp: Date.now(),
      random: Math.random().toString(36)
    };
    
    // In production, use proper JWT signing
    return btoa(JSON.stringify(payload)) + '.' + Math.random().toString(36);
  }

  // Get purchase order attachments
  private async getPurchaseOrderAttachments(purchaseOrderId: string): Promise<BundledAttachment[]> {
    // Load attachments from localStorage (in production, from database)
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const purchaseOrder = purchaseOrders.find((po: any) => po.id === purchaseOrderId);
    
    if (!purchaseOrder || !purchaseOrder.attachments) {
      return [];
    }

    return purchaseOrder.attachments.map((att: any) => ({
      id: att.id,
      originalFilename: att.originalFilename || att.filename,
      storedFilename: att.storedFilename || att.filename,
      fileSize: att.fileSize || 0,
      fileType: att.fileType || 'application/octet-stream',
      includeInBundle: att.isIncludedWithSupplierOrder !== false, // Default to true
      folderPath: this.determineFolderPath(att),
      description: att.description,
      isRequired: att.isRequired || false,
      lastModified: new Date(att.uploadDate || att.createdAt || Date.now())
    }));
  }

  private async getPurchaseOrder(purchaseOrderId: string): Promise<any> {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    return purchaseOrders.find((po: any) => po.id === purchaseOrderId);
  }

  private determineFolderPath(attachment: any): string {
    // Organize files by type
    const fileExtension = attachment.originalFilename.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(fileExtension)) {
      return 'Documents';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
      return 'Images';
    } else if (['dwg', 'dxf', 'step', 'stp', 'iges', 'igs'].includes(fileExtension)) {
      return 'CAD_Files';
    } else if (['doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
      return 'Office_Documents';
    } else {
      return 'Other_Files';
    }
  }

  private ensureUniqueFilename(filename: string, attachments: BundledAttachment[]): string {
    const existingNames = attachments.map(att => att.originalFilename);
    let uniqueName = filename;
    let counter = 1;

    while (existingNames.filter(name => name === uniqueName).length > 1) {
      const nameParts = filename.split('.');
      const extension = nameParts.pop();
      const baseName = nameParts.join('.');
      uniqueName = `${baseName}_${counter}.${extension}`;
      counter++;
    }

    return uniqueName;
  }

  private generateReadmeContent(purchaseOrder: any, attachments: BundledAttachment[]): string {
    return `
PURCHASE ORDER DOCUMENTATION BUNDLE
===================================

Purchase Order: ${purchaseOrder.purchaseOrderNumber}
Supplier: ${purchaseOrder.supplier.supplierName}
Customer: ${purchaseOrder.customerName || 'Stock Replenishment'}
Total Amount: $${purchaseOrder.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
Created: ${new Date(purchaseOrder.createdAt).toLocaleString()}
Priority: ${purchaseOrder.priorityLevel}

${purchaseOrder.customerReference ? `Customer Reference: ${purchaseOrder.customerReference}\n` : ''}
${purchaseOrder.shippingInstructions ? `Shipping Instructions: ${purchaseOrder.shippingInstructions}\n` : ''}

INCLUDED ATTACHMENTS (${attachments.length} files)
=============================================

${attachments.map((att, index) => `
${index + 1}. ${att.originalFilename}
   Type: ${att.fileType}
   Size: ${this.formatFileSize(att.fileSize)}
   ${att.description ? `Description: ${att.description}` : ''}
   ${att.isRequired ? 'REQUIRED FOR ORDER FULFILLMENT' : 'Reference document'}
   Last Modified: ${att.lastModified.toLocaleDateString()}
`).join('')}

IMPORTANT NOTES
===============
• Please review all attachments before proceeding with order fulfillment
• Contact us immediately if any attachments are missing or unclear
• Required attachments must be followed for accurate delivery
• Keep this documentation for your records

CONTACT INFORMATION
==================
Company: ${purchaseOrder.supplier.supplierName}
Contact: Adam Smith (Procurement Manager)
Phone: +61 2 9876 5432
Email: adam@eccohardware.com.au

This bundle was generated automatically by SalesKik Purchase Order System.
Bundle created: ${new Date().toLocaleString()}
    `;
  }

  private async getAttachmentContent(attachment: BundledAttachment): Promise<ArrayBuffer> {
    // In production, this would fetch from secure storage
    // For demo, create mock file content
    const mockContent = `Mock content for ${attachment.originalFilename}`;
    return new TextEncoder().encode(mockContent).buffer;
  }

  // Track bundle download and delivery
  public async trackBundleDownload(
    bundleId: string, 
    downloadInfo: {
      ipAddress: string;
      userAgent: string;
      supplierEmail?: string;
    }
  ): Promise<{ allowed: boolean; reason?: string }> {
    const bundle = this.bundles.find(b => b.id === bundleId);
    if (!bundle) {
      return { allowed: false, reason: 'Bundle not found' };
    }

    // Check expiration
    if (new Date() > bundle.expiresAt) {
      return { allowed: false, reason: 'Bundle has expired' };
    }

    // Check download limits
    if (bundle.downloadCount >= bundle.maxDownloads) {
      return { allowed: false, reason: 'Maximum downloads exceeded' };
    }

    // Track download
    bundle.downloadCount++;
    
    // Update delivery confirmation
    if (!bundle.deliveryConfirmation && downloadInfo.supplierEmail) {
      bundle.deliveryConfirmation = {
        sentAt: new Date(),
        downloadedAt: new Date(),
        supplierEmail: downloadInfo.supplierEmail
      };
    } else if (bundle.deliveryConfirmation) {
      bundle.deliveryConfirmation.downloadedAt = new Date();
    }

    this.saveBundles();

    // Log download event
    this.logDownloadEvent(bundleId, downloadInfo);

    // Send notification if enabled
    if (bundle.deliveryConfirmation?.supplierEmail) {
      await this.notifyDownloadConfirmation(bundle, downloadInfo);
    }

    console.log(`Bundle downloaded: ${bundleId} (${bundle.downloadCount}/${bundle.maxDownloads})`);

    return { allowed: true };
  }

  private logDownloadEvent(bundleId: string, downloadInfo: any): void {
    const downloadLog = {
      id: Date.now().toString(),
      bundleId,
      timestamp: new Date(),
      ipAddress: downloadInfo.ipAddress,
      userAgent: downloadInfo.userAgent,
      supplierEmail: downloadInfo.supplierEmail
    };

    const existingLogs = JSON.parse(localStorage.getItem('saleskik-bundle-download-logs') || '[]');
    existingLogs.push(downloadLog);
    localStorage.setItem('saleskik-bundle-download-logs', JSON.stringify(existingLogs));
  }

  private async notifyDownloadConfirmation(bundle: AttachmentBundle, downloadInfo: any): Promise<void> {
    try {
      // Send notification to internal team about supplier download
      const purchaseOrder = await this.getPurchaseOrder(bundle.purchaseOrderId);
      
      console.log(`Supplier ${downloadInfo.supplierEmail} downloaded attachments for ${purchaseOrder.purchaseOrderNumber}`);
      
      // In production, send email notification to internal team
      const notificationData = {
        bundleId: bundle.id,
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierEmail: downloadInfo.supplierEmail,
        downloadedAt: new Date(),
        attachmentCount: bundle.attachments.length
      };

      // Store notification for dashboard display
      const notifications = JSON.parse(localStorage.getItem('saleskik-attachment-notifications') || '[]');
      notifications.push(notificationData);
      localStorage.setItem('saleskik-attachment-notifications', JSON.stringify(notifications));

    } catch (error) {
      console.error('Error sending download confirmation:', error);
    }
  }

  // Bundle management
  public getBundleForPurchaseOrder(purchaseOrderId: string): AttachmentBundle | null {
    return this.bundles.find(b => b.purchaseOrderId === purchaseOrderId) || null;
  }

  public getBundleById(bundleId: string): AttachmentBundle | null {
    return this.bundles.find(b => b.id === bundleId) || null;
  }

  public async regenerateBundle(bundleId: string, options?: Partial<BundlingOptions>): Promise<{ success: boolean; error?: string }> {
    const existingBundle = this.bundles.find(b => b.id === bundleId);
    if (!existingBundle) {
      return { success: false, error: 'Bundle not found' };
    }

    // Remove old bundle
    this.bundles = this.bundles.filter(b => b.id !== bundleId);

    // Create new bundle with updated options
    const result = await this.createAttachmentBundle(
      existingBundle.purchaseOrderId,
      { 
        includeAllAttachments: true,
        createFolders: true,
        addReadmeFile: true,
        encryptBundle: false,
        expirationHours: 168,
        maxDownloads: 10,
        notifyOnDownload: true,
        ...options 
      }
    );

    return result;
  }

  public deleteBundleById(bundleId: string): boolean {
    const bundleIndex = this.bundles.findIndex(b => b.id === bundleId);
    if (bundleIndex === -1) {
      return false;
    }

    // Revoke blob URL
    const bundle = this.bundles[bundleIndex];
    if (bundle.zipUrl) {
      URL.revokeObjectURL(bundle.zipUrl);
    }

    this.bundles.splice(bundleIndex, 1);
    this.saveBundles();

    console.log(`Bundle deleted: ${bundleId}`);
    return true;
  }

  // Attachment validation for bundling
  public validateAttachmentsForBundling(attachments: BundledAttachment[]): {
    valid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Check for required attachments
    const requiredAttachments = attachments.filter(att => att.isRequired);
    const missingRequired = requiredAttachments.filter(att => !att.includeInBundle);
    
    if (missingRequired.length > 0) {
      errors.push(`${missingRequired.length} required attachment(s) not included in bundle`);
    }

    // Check file sizes
    const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);
    const maxEmailSize = 25 * 1024 * 1024; // 25MB email limit
    
    if (totalSize > maxEmailSize) {
      warnings.push(`Bundle size (${this.formatFileSize(totalSize)}) exceeds email limits`);
      recommendations.push('Consider using secure download link instead of email attachment');
    }

    // Check for duplicate filenames
    const filenames = attachments.map(att => att.originalFilename);
    const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      warnings.push(`Duplicate filenames found: ${duplicates.join(', ')}`);
      recommendations.push('Files will be automatically renamed to avoid conflicts');
    }

    // Check for potentially problematic file types
    const executableExtensions = ['exe', 'bat', 'cmd', 'scr', 'vbs', 'js'];
    const problematicFiles = attachments.filter(att => {
      const extension = att.originalFilename.split('.').pop()?.toLowerCase();
      return executableExtensions.includes(extension || '');
    });

    if (problematicFiles.length > 0) {
      errors.push(`Potentially unsafe file types detected: ${problematicFiles.map(f => f.originalFilename).join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
      recommendations
    };
  }

  // Bundle statistics and monitoring
  public getBundleStatistics(): {
    totalBundles: number;
    activeBundles: number;
    expiredBundles: number;
    totalDownloads: number;
    averageBundleSize: number;
    mostDownloadedBundle?: string;
    recentActivity: any[];
  } {
    const now = new Date();
    const activeBundles = this.bundles.filter(b => b.expiresAt > now);
    const expiredBundles = this.bundles.filter(b => b.expiresAt <= now);
    const totalDownloads = this.bundles.reduce((sum, b) => sum + b.downloadCount, 0);
    
    const bundleSizes = this.bundles.map(b => b.zipFile?.size || 0).filter(size => size > 0);
    const averageBundleSize = bundleSizes.length > 0 
      ? bundleSizes.reduce((sum, size) => sum + size, 0) / bundleSizes.length 
      : 0;

    const mostDownloaded = this.bundles.reduce((max, bundle) => 
      bundle.downloadCount > (max?.downloadCount || 0) ? bundle : max, 
      null as AttachmentBundle | null
    );

    // Get recent activity
    const downloadLogs = JSON.parse(localStorage.getItem('saleskik-bundle-download-logs') || '[]');
    const recentActivity = downloadLogs
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalBundles: this.bundles.length,
      activeBundles: activeBundles.length,
      expiredBundles: expiredBundles.length,
      totalDownloads,
      averageBundleSize,
      mostDownloadedBundle: mostDownloaded?.bundleName,
      recentActivity
    };
  }

  // Cleanup expired bundles
  public cleanupExpiredBundles(): { cleaned: number; errors: string[] } {
    const now = new Date();
    const errors: string[] = [];
    let cleaned = 0;

    const expiredBundles = this.bundles.filter(b => b.expiresAt <= now);
    
    expiredBundles.forEach(bundle => {
      try {
        // Revoke blob URLs
        if (bundle.zipUrl) {
          URL.revokeObjectURL(bundle.zipUrl);
        }
        cleaned++;
      } catch (error) {
        errors.push(`Failed to cleanup bundle ${bundle.id}`);
      }
    });

    // Remove expired bundles from array
    this.bundles = this.bundles.filter(b => b.expiresAt > now);
    this.saveBundles();

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired attachment bundles`);
    }

    return { cleaned, errors };
  }

  // Utility methods
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Email integration helper
  public async getEmailAttachmentForBundle(bundleId: string): Promise<{
    filename: string;
    content: string; // Base64
    contentType: string;
    size: number;
  } | null> {
    const bundle = this.bundles.find(b => b.id === bundleId);
    if (!bundle || !bundle.zipFile) {
      return null;
    }

    // Convert ZIP blob to base64 for email attachment
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = (reader.result as string).split(',')[1]; // Remove data URL prefix
        resolve({
          filename: bundle.zipFileName,
          content: base64Content,
          contentType: 'application/zip',
          size: bundle.zipFile!.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(bundle.zipFile);
    });
  }

  // Secure download endpoint simulation
  public async handleSecureDownload(bundleId: string, token: string, downloadInfo: any): Promise<{
    success: boolean;
    zipBlob?: Blob;
    filename?: string;
    error?: string;
  }> {
    // Validate access token
    const accessTokens = JSON.parse(localStorage.getItem('saleskik-bundle-access-tokens') || '[]');
    const accessRecord = accessTokens.find((record: any) => 
      record.bundleId === bundleId && record.token === token && !record.used
    );

    if (!accessRecord) {
      return { success: false, error: 'Invalid or expired download token' };
    }

    // Check token expiration
    if (new Date() > new Date(accessRecord.expiresAt)) {
      return { success: false, error: 'Download link has expired' };
    }

    // Track download
    const trackResult = await this.trackBundleDownload(bundleId, downloadInfo);
    if (!trackResult.allowed) {
      return { success: false, error: trackResult.reason };
    }

    // Mark token as used for one-time downloads
    if (accessRecord.accessType === 'supplier-access') {
      accessRecord.used = true;
      accessRecord.ipAddress = downloadInfo.ipAddress;
      localStorage.setItem('saleskik-bundle-access-tokens', JSON.stringify(accessTokens));
    }

    const bundle = this.bundles.find(b => b.id === bundleId);
    if (!bundle?.zipFile) {
      return { success: false, error: 'Bundle file not available' };
    }

    return {
      success: true,
      zipBlob: bundle.zipFile,
      filename: bundle.zipFileName
    };
  }

  // Integration with purchase order workflow
  public async shouldCreateBundleForOrder(purchaseOrderId: string): Promise<boolean> {
    const attachments = await this.getPurchaseOrderAttachments(purchaseOrderId);
    
    // Create bundle if:
    // 1. There are 2 or more attachments
    // 2. Any attachment is marked as required
    // 3. Total size is reasonable for email
    
    if (attachments.length >= 2) return true;
    if (attachments.some(att => att.isRequired)) return true;
    
    const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);
    if (totalSize > 5 * 1024 * 1024) return true; // > 5MB
    
    return false;
  }
}

export default AttachmentBundlingService;