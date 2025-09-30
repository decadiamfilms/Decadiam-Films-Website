import React, { useState, useEffect, useRef } from 'react';
import { 
  CameraIcon, XMarkIcon, CheckCircleIcon, PhotoIcon,
  MapPinIcon, ClockIcon, InformationCircleIcon,
  ArrowPathIcon, SunIcon, MoonIcon, ZoomInIcon,
  ZoomOutIcon, ViewfinderCircleIcon, DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import MobileCameraService from '../../services/MobileCameraService';

interface MobileCameraInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCaptured: (photos: any[]) => void;
  associatedRecord?: {
    type: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'DELIVERY_CONFIRMATION';
    recordId: string;
    recordNumber: string;
  };
  mode?: 'RECEIPT_DOCUMENTATION' | 'DELIVERY_CONFIRMATION' | 'DAMAGE_REPORT';
}

export default function MobileCameraInterface({ 
  isOpen, 
  onClose, 
  onPhotosCaptured,
  associatedRecord,
  mode = 'RECEIPT_DOCUMENTATION'
}: MobileCameraInterfaceProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<any[]>([]);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [capturing, setCapturing] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      loadInstructions();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen]);

  const initializeCamera = async () => {
    try {
      const cameraService = MobileCameraService.getInstance();
      const caps = cameraService.getCameraCapabilities();
      setCapabilities(caps);

      if (!caps?.hasCamera) {
        alert('Camera not available on this device');
        return;
      }

      const result = await cameraService.initializeCamera(currentFacingMode, videoRef.current!);
      
      if (result.success) {
        setCameraActive(true);
      } else {
        alert(`Camera initialization failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error initializing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const loadInstructions = () => {
    const modeInstructions: { [mode: string]: string[] } = {
      'RECEIPT_DOCUMENTATION': [
        '📦 Capture overview of all delivered items',
        '🔍 Take close-up photos of serial numbers or identifying marks',
        '📋 Include delivery documentation and packing slips',
        '⚠️ Document any damage or missing items clearly'
      ],
      'DELIVERY_CONFIRMATION': [
        '✅ Photo of completed delivery at destination',
        '📍 Include delivery address or site markers',
        '👤 Capture delivery receipt signature if available',
        '⏰ Timestamp with delivery confirmation'
      ],
      'DAMAGE_REPORT': [
        '💥 Clear photos of all damage from multiple angles',
        '📏 Include reference objects for scale',
        '📦 Capture packaging condition and protection',
        '📋 Document shipping labels and handling instructions'
      ]
    };

    setInstructions(modeInstructions[mode] || modeInstructions['RECEIPT_DOCUMENTATION']);
  };

  const capturePhoto = async () => {
    if (!cameraActive || capturing) return;

    setCapturing(true);

    try {
      const cameraService = MobileCameraService.getInstance();
      
      const result = await cameraService.capturePhoto({
        associatedRecord,
        tags: [mode.toLowerCase().replace('_', '-'), 'mobile-capture'],
        quality: compressionQuality,
        includeGPS: gpsEnabled,
        filename: `${mode}_${Date.now()}.jpg`
      });

      if (result.success && result.photo) {
        setCapturedPhotos(prev => [...prev, result.photo]);
        
        // Provide haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
      } else {
        alert(`Photo capture failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
    
    if (cameraActive) {
      cleanup();
      setTimeout(() => {
        setCurrentFacingMode(newFacingMode);
        initializeCamera();
      }, 100);
    }
  };

  const deletePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    
    const cameraService = MobileCameraService.getInstance();
    cameraService.deletePhoto(photoId);
  };

  const finishDocumentation = () => {
    onPhotosCaptured(capturedPhotos);
    onClose();
  };

  const cleanup = () => {
    const cameraService = MobileCameraService.getInstance();
    cameraService.stopCamera();
    setCameraActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      
      {/* Mobile Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CameraIcon className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Receipt Documentation</h3>
            <p className="text-sm text-gray-300">
              {associatedRecord?.recordNumber || 'Mobile Camera'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-blue-600 px-2 py-1 rounded">
            {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Controls */}
      {cameraActive && (
        <div className="bg-gray-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {capabilities?.hasFrontCamera && capabilities?.hasBackCamera && (
                <button
                  onClick={switchCamera}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Switch Camera"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              )}
              
              <div className="text-sm">
                <div>Quality: {Math.round(compressionQuality * 100)}%</div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.1"
                  value={compressionQuality}
                  onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {capabilities?.hasGPS && (
                <button
                  onClick={() => setGpsEnabled(!gpsEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    gpsEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  title="GPS Location"
                >
                  <MapPinIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />
            
            {/* Camera Overlay */}
            <div className="absolute inset-0 flex flex-col">
              {/* Instructions Overlay */}
              <div className="bg-gradient-to-b from-black/50 to-transparent p-4">
                <div className="bg-black/70 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-2">Photo Instructions:</h4>
                  <div className="space-y-1">
                    {instructions.map((instruction, index) => (
                      <div key={index} className="text-sm text-white/90">
                        {instruction}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Viewfinder */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-64 h-48 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ViewfinderCircleIcon className="w-8 h-8 text-white/50" />
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="bg-gradient-to-t from-black/50 to-transparent p-6">
                <div className="flex items-center justify-center">
                  <button
                    onClick={capturePhoto}
                    disabled={capturing}
                    className={`w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-all ${
                      capturing ? 'animate-pulse' : ''
                    }`}
                  >
                    <CameraIcon className="w-8 h-8 text-white mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <CameraIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold mb-2">Camera Access Required</h3>
              <p className="text-gray-300 mb-4">
                Allow camera access to document goods receipts
              </p>
              <button
                onClick={initializeCamera}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery Strip */}
      {capturedPhotos.length > 0 && (
        <div className="bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PhotoIcon className="w-5 h-5 text-white" />
            <span className="text-white font-medium">
              Captured Photos ({capturedPhotos.length})
            </span>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {capturedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative flex-shrink-0">
                <img
                  src={photo.thumbnail}
                  alt={`Captured ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-600"
                />
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                
                {/* GPS indicator */}
                {photo.metadata.gpsLocation && (
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={finishDocumentation}
              disabled={capturedPhotos.length === 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Complete Documentation ({capturedPhotos.length})
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-gray-800 text-white p-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span>GPS Location:</span>
            <button
              onClick={() => setGpsEnabled(!gpsEnabled)}
              className={`px-2 py-1 rounded text-xs ${
                gpsEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {gpsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Camera:</span>
            <span className="text-xs text-gray-300">
              {currentFacingMode === 'environment' ? 'Back' : 'Front'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Quality:</span>
            <span className="text-xs text-gray-300">
              {Math.round(compressionQuality * 100)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Mode:</span>
            <span className="text-xs text-gray-300">
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}