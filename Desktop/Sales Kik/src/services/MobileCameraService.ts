// Mobile Camera Service for Receipt Documentation
// Handles camera access, photo capture, compression, GPS tagging, and mobile gallery

export interface CameraPhoto {
  id: string;
  filename: string;
  originalBlob: Blob;
  compressedBlob: Blob;
  thumbnail: string; // Base64 data URL
  metadata: {
    capturedAt: Date;
    deviceInfo: string;
    gpsLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      address?: string;
    };
    cameraSettings: {
      width: number;
      height: number;
      facingMode: 'user' | 'environment';
      flash?: boolean;
    };
    compression: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      quality: number;
    };
  };
  tags?: string[];
  associatedRecords?: {
    type: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'DELIVERY_CONFIRMATION';
    recordId: string;
    recordNumber: string;
  }[];
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  hasGPS: boolean;
  maxResolution: { width: number; height: number };
  supportedFormats: string[];
  compressionSupported: boolean;
}

export interface PhotoGallery {
  id: string;
  name: string;
  description: string;
  photos: CameraPhoto[];
  createdAt: Date;
  associatedPurchaseOrder?: {
    id: string;
    purchaseOrderNumber: string;
    supplierName: string;
  };
  tags: string[];
  isPublic: boolean;
}

class MobileCameraService {
  private static instance: MobileCameraService;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private capabilities: CameraCapabilities | null = null;
  private photoGalleries: Map<string, PhotoGallery> = new Map();
  private photos: Map<string, CameraPhoto> = new Map();

  private constructor() {
    this.detectCameraCapabilities();
    this.loadPhotoGalleries();
    this.loadPhotos();
  }

  public static getInstance(): MobileCameraService {
    if (!MobileCameraService.instance) {
      MobileCameraService.instance = new MobileCameraService();
    }
    return MobileCameraService.instance;
  }

  // Detect device camera capabilities
  private async detectCameraCapabilities(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.capabilities = {
          hasCamera: false,
          hasFrontCamera: false,
          hasBackCamera: false,
          hasFlash: false,
          hasGPS: false,
          maxResolution: { width: 0, height: 0 },
          supportedFormats: [],
          compressionSupported: false
        };
        return;
      }

      // Check for available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const hasFrontCamera = videoDevices.some(device => 
        device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user')
      );
      const hasBackCamera = videoDevices.some(device => 
        device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')
      );

      // Test camera access
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const videoTrack = testStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const capabilities = videoTrack.getCapabilities();

      testStream.getTracks().forEach(track => track.stop());

      this.capabilities = {
        hasCamera: videoDevices.length > 0,
        hasFrontCamera,
        hasBackCamera,
        hasFlash: capabilities.torch !== undefined,
        hasGPS: 'geolocation' in navigator,
        maxResolution: {
          width: capabilities.width?.max || 1920,
          height: capabilities.height?.max || 1080
        },
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        compressionSupported: true
      };

      console.log('Camera capabilities detected:', this.capabilities);
    } catch (error) {
      console.error('Error detecting camera capabilities:', error);
      this.capabilities = {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        hasFlash: false,
        hasGPS: false,
        maxResolution: { width: 0, height: 0 },
        supportedFormats: [],
        compressionSupported: false
      };
    }
  }

  // Initialize camera for receipt documentation
  public async initializeCamera(
    facingMode: 'user' | 'environment' = 'environment',
    targetElement?: HTMLVideoElement
  ): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      if (!this.capabilities?.hasCamera) {
        return { success: false, error: 'No camera available on this device' };
      }

      // Stop existing stream
      if (this.mediaStream) {
        this.stopCamera();
      }

      // Request camera access with optimal settings for document photography
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' }
        } as any,
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up video element
      if (targetElement) {
        this.videoElement = targetElement;
      } else {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.setAttribute('autoplay', 'true');
        this.videoElement.setAttribute('muted', 'true');
      }

      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      console.log('Camera initialized successfully');
      return { success: true, stream: this.mediaStream };
    } catch (error) {
      console.error('Error initializing camera:', error);
      return { success: false, error: error.message };
    }
  }

  // Capture photo with compression and metadata
  public async capturePhoto(options: {
    associatedRecord?: {
      type: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'DELIVERY_CONFIRMATION';
      recordId: string;
      recordNumber: string;
    };
    tags?: string[];
    quality?: number; // 0.1 to 1.0
    includeGPS?: boolean;
    filename?: string;
  } = {}): Promise<{ success: boolean; photo?: CameraPhoto; error?: string }> {
    try {
      if (!this.videoElement || !this.mediaStream) {
        return { success: false, error: 'Camera not initialized' };
      }

      // Create canvas for capture
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
      }

      const canvas = this.canvasElement;
      const video = this.videoElement;
      const context = canvas.getContext('2d')!;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get original image blob
      const originalBlob = await this.canvasToBlob(canvas, 'image/jpeg', 1.0);
      
      // Compress image
      const quality = options.quality || 0.8;
      const compressedBlob = await this.compressImage(originalBlob, quality);
      
      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(canvas, 150, 150);

      // Get GPS location if requested
      let gpsLocation;
      if (options.includeGPS !== false && this.capabilities?.hasGPS) {
        gpsLocation = await this.getCurrentLocation();
      }

      // Create photo record
      const photo: CameraPhoto = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        filename: options.filename || `receipt_${Date.now()}.jpg`,
        originalBlob,
        compressedBlob,
        thumbnail,
        metadata: {
          capturedAt: new Date(),
          deviceInfo: navigator.userAgent,
          gpsLocation,
          cameraSettings: {
            width: canvas.width,
            height: canvas.height,
            facingMode: 'environment' // Default for receipts
          },
          compression: {
            originalSize: originalBlob.size,
            compressedSize: compressedBlob.size,
            compressionRatio: (originalBlob.size - compressedBlob.size) / originalBlob.size,
            quality
          }
        },
        tags: options.tags || ['receipt', 'documentation'],
        associatedRecords: options.associatedRecord ? [options.associatedRecord] : []
      };

      // Store photo
      this.photos.set(photo.id, photo);
      this.savePhotos();

      console.log(`Photo captured: ${photo.filename} (${this.formatFileSize(compressedBlob.size)})`);
      return { success: true, photo };
    } catch (error) {
      console.error('Error capturing photo:', error);
      return { success: false, error: error.message };
    }
  }

  // Image compression for mobile upload optimization
  private async compressImage(blob: Blob, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate optimal dimensions (max 1920x1080 for receipts)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Apply image enhancements for better document readability
        ctx.filter = 'contrast(110%) brightness(105%) saturate(90%)';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  // Generate thumbnail for gallery display
  private async generateThumbnail(canvas: HTMLCanvasElement, width: number, height: number): Promise<string> {
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d')!;
    
    thumbnailCanvas.width = width;
    thumbnailCanvas.height = height;
    
    // Calculate aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    let drawWidth = width;
    let drawHeight = height;
    
    if (aspectRatio > 1) {
      drawHeight = width / aspectRatio;
    } else {
      drawWidth = height * aspectRatio;
    }
    
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    
    ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);
    
    return thumbnailCanvas.toDataURL('image/jpeg', 0.7);
  }

  // Get current GPS location
  private async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  } | undefined> {
    if (!navigator.geolocation) return undefined;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Reverse geocoding for address (simplified)
          try {
            const address = await this.reverseGeocode(location.latitude, location.longitude);
            resolve({ ...location, address });
          } catch (error) {
            resolve(location);
          }
        },
        (error) => {
          console.warn('GPS location not available:', error);
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    // In production, use Google Maps API or similar
    // For demo, return formatted coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  // Photo gallery management
  public createPhotoGallery(
    name: string,
    description: string,
    purchaseOrderId?: string
  ): string {
    const gallery: PhotoGallery = {
      id: Date.now().toString(),
      name,
      description,
      photos: [],
      createdAt: new Date(),
      associatedPurchaseOrder: purchaseOrderId ? {
        id: purchaseOrderId,
        purchaseOrderNumber: this.getPurchaseOrderNumber(purchaseOrderId),
        supplierName: this.getSupplierName(purchaseOrderId)
      } : undefined,
      tags: ['receipt-documentation'],
      isPublic: false
    };

    this.photoGalleries.set(gallery.id, gallery);
    this.savePhotoGalleries();

    return gallery.id;
  }

  public addPhotoToGallery(galleryId: string, photoId: string): boolean {
    const gallery = this.photoGalleries.get(galleryId);
    const photo = this.photos.get(photoId);

    if (gallery && photo) {
      gallery.photos.push(photo);
      this.savePhotoGalleries();
      return true;
    }

    return false;
  }

  // Mobile photo upload with progress
  public async uploadPhotoToServer(
    photo: CameraPhoto,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Simulate upload progress
      if (onProgress) {
        for (let i = 0; i <= 100; i += 10) {
          onProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // In production, upload to secure file storage
      const formData = new FormData();
      formData.append('file', photo.compressedBlob, photo.filename);
      formData.append('metadata', JSON.stringify(photo.metadata));
      formData.append('tags', JSON.stringify(photo.tags));

      // Simulate successful upload
      const uploadUrl = `/uploads/receipts/${photo.id}/${photo.filename}`;
      
      console.log(`Photo uploaded: ${photo.filename} to ${uploadUrl}`);
      return { success: true, url: uploadUrl };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    }
  }

  // Receipt documentation workflow
  public async documentGoodsReceipt(
    purchaseOrderId: string,
    receiptData: {
      receivedBy: string;
      deliveryCondition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
      notes?: string;
    }
  ): Promise<{ success: boolean; galleryId?: string; error?: string }> {
    try {
      // Create gallery for this receipt
      const purchaseOrder = await this.getPurchaseOrder(purchaseOrderId);
      const galleryId = this.createPhotoGallery(
        `Receipt Documentation - ${purchaseOrder.purchaseOrderNumber}`,
        `Goods receipt documentation for ${purchaseOrder.supplier.supplierName}`,
        purchaseOrderId
      );

      // Provide instructions for photo capture
      const instructions = this.generatePhotoInstructions(receiptData.deliveryCondition);
      
      console.log('Receipt documentation started:', {
        purchaseOrderId,
        galleryId,
        instructions
      });

      return { success: true, galleryId };
    } catch (error) {
      console.error('Error starting receipt documentation:', error);
      return { success: false, error: error.message };
    }
  }

  private generatePhotoInstructions(condition: string): string[] {
    const baseInstructions = [
      'Ensure good lighting and clear visibility of items',
      'Capture multiple angles if items are damaged',
      'Include delivery documentation and packing slips',
      'Take photos of serial numbers or identifying marks'
    ];

    const conditionInstructions: { [key: string]: string[] } = {
      'GOOD': [
        'Take overview photo of all delivered items',
        'Capture close-up of key items for verification'
      ],
      'DAMAGED': [
        'Document all damage with close-up photos',
        'Capture packaging condition',
        'Photograph any missing protective materials'
      ],
      'PARTIAL': [
        'Photo missing items area or empty boxes',
        'Document what was actually delivered',
        'Capture delivery documentation showing discrepancy'
      ]
    };

    return [...baseInstructions, ...conditionInstructions[condition] || []];
  }

  // Stop camera and cleanup
  public stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('Camera stopped and cleaned up');
  }

  // Utility methods
  private async canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob(resolve!, mimeType, quality);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getPurchaseOrderNumber(purchaseOrderId: string): string {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const order = orders.find((o: any) => o.id === purchaseOrderId);
    return order?.purchaseOrderNumber || purchaseOrderId;
  }

  private getSupplierName(purchaseOrderId: string): string {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const order = orders.find((o: any) => o.id === purchaseOrderId);
    return order?.supplier?.supplierName || 'Unknown Supplier';
  }

  private async getPurchaseOrder(purchaseOrderId: string): Promise<any> {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    return orders.find((o: any) => o.id === purchaseOrderId);
  }

  // Storage methods
  private loadPhotoGalleries(): void {
    const saved = localStorage.getItem('saleskik-photo-galleries');
    if (saved) {
      try {
        const galleries = JSON.parse(saved);
        galleries.forEach((gallery: any) => {
          this.photoGalleries.set(gallery.id, {
            ...gallery,
            createdAt: new Date(gallery.createdAt),
            photos: gallery.photos.map((photo: any) => ({
              ...photo,
              metadata: {
                ...photo.metadata,
                capturedAt: new Date(photo.metadata.capturedAt)
              }
            }))
          });
        });
      } catch (error) {
        console.error('Error loading photo galleries:', error);
      }
    }
  }

  private loadPhotos(): void {
    const saved = localStorage.getItem('saleskik-camera-photos');
    if (saved) {
      try {
        const photos = JSON.parse(saved);
        photos.forEach((photo: any) => {
          // Note: Blobs can't be serialized, so we'd need to reconstruct them
          // In production, photos would be stored on server
          this.photos.set(photo.id, {
            ...photo,
            metadata: {
              ...photo.metadata,
              capturedAt: new Date(photo.metadata.capturedAt)
            }
          });
        });
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    }
  }

  private savePhotoGalleries(): void {
    const galleries = Array.from(this.photoGalleries.values());
    localStorage.setItem('saleskik-photo-galleries', JSON.stringify(galleries));
  }

  private savePhotos(): void {
    // Note: Can't save Blobs to localStorage in production
    // This would be handled by server upload
    const photoMetadata = Array.from(this.photos.values()).map(photo => ({
      id: photo.id,
      filename: photo.filename,
      thumbnail: photo.thumbnail,
      metadata: photo.metadata,
      tags: photo.tags,
      associatedRecords: photo.associatedRecords
    }));
    
    localStorage.setItem('saleskik-camera-photos', JSON.stringify(photoMetadata));
  }

  // Public API methods
  public getCameraCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  public getPhotoGalleries(): PhotoGallery[] {
    return Array.from(this.photoGalleries.values());
  }

  public getPhotoGallery(galleryId: string): PhotoGallery | null {
    return this.photoGalleries.get(galleryId) || null;
  }

  public getPhoto(photoId: string): CameraPhoto | null {
    return this.photos.get(photoId) || null;
  }

  public getPhotosForPurchaseOrder(purchaseOrderId: string): CameraPhoto[] {
    return Array.from(this.photos.values()).filter(photo =>
      photo.associatedRecords?.some(record => record.recordId === purchaseOrderId)
    );
  }

  public deletePhoto(photoId: string): boolean {
    const photo = this.photos.get(photoId);
    if (photo) {
      // Revoke blob URLs to free memory
      URL.revokeObjectURL(photo.thumbnail);
      
      this.photos.delete(photoId);
      this.savePhotos();
      
      // Remove from galleries
      this.photoGalleries.forEach(gallery => {
        gallery.photos = gallery.photos.filter(p => p.id !== photoId);
      });
      this.savePhotoGalleries();
      
      return true;
    }
    return false;
  }

  public getMobilePhotoStats(): {
    totalPhotos: number;
    totalSize: number;
    photosToday: number;
    averageCompressionRatio: number;
    galleriesCount: number;
    gpsTaggedPhotos: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const photos = Array.from(this.photos.values());
    const photosToday = photos.filter(photo => photo.metadata.capturedAt >= today).length;
    const totalSize = photos.reduce((sum, photo) => sum + photo.metadata.compression.compressedSize, 0);
    const avgCompression = photos.length > 0
      ? photos.reduce((sum, photo) => sum + photo.metadata.compression.compressionRatio, 0) / photos.length
      : 0;
    const gpsTagged = photos.filter(photo => photo.metadata.gpsLocation).length;

    return {
      totalPhotos: photos.length,
      totalSize,
      photosToday,
      averageCompressionRatio: avgCompression,
      galleriesCount: this.photoGalleries.size,
      gpsTaggedPhotos: gpsTagged
    };
  }

  // Cleanup old photos
  public cleanupOldPhotos(daysToKeep: number = 90): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.photos.size;
    
    for (const [photoId, photo] of this.photos) {
      if (photo.metadata.capturedAt < cutoffDate) {
        this.deletePhoto(photoId);
      }
    }

    const cleanedCount = initialCount - this.photos.size;
    console.log(`Cleaned up ${cleanedCount} old photos`);
    return cleanedCount;
  }
}

export default MobileCameraService;