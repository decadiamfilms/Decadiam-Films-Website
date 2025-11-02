import React, { useState, useEffect, useRef } from 'react';
import { CameraIcon as Camera, PencilSquareIcon as Keyboard, MagnifyingGlassIcon as Search, XMarkIcon as X } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanned
}) => {
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera availability on mount
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualBarcode('');
      setScanning(false);
    }
  }, [isOpen]);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setCameraAvailable(false);
        setScanMethod('manual');
      } else {
        setCameraAvailable(true);
      }
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setCameraAvailable(false);
      setScanMethod('manual');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanning(true);
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraAvailable(false);
      setScanMethod('manual');
      alert('Camera access denied or not available. Please use manual entry.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScanned(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  // Simulated barcode scanning (in a real implementation, you'd use a library like QuaggaJS or ZXing)
  const simulateBarcodeDetection = () => {
    // This is just for demo purposes
    const mockBarcodes = ['123456789012', '987654321098', '111222333444'];
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    onScanned(randomBarcode);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Barcode">
      <div className="space-y-6">
        {/* Method Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {cameraAvailable && (
            <button
              onClick={() => setScanMethod('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
                scanMethod === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera size={20} />
              Camera
            </button>
          )}
          <button
            onClick={() => setScanMethod('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
              scanMethod === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Keyboard size={20} />
            Manual
          </button>
        </div>

        {/* Camera View */}
        {scanMethod === 'camera' && cameraAvailable && (
          <div className="space-y-4">
            {scanning ? (
              <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-48 border-2 border-white rounded-lg opacity-75">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse"></div>
                  </div>
                </div>
                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <p className="text-sm bg-white bg-opacity-90 px-3 py-1 rounded">
                    Point camera at barcode
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-lg">
                <Camera size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Point your camera at a barcode</p>
                <p className="text-sm text-gray-500 mb-6">
                  Make sure the barcode is well-lit and clearly visible
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={scanning ? stopCamera : startCamera}
                className="flex-1"
              >
                {scanning ? 'Stop Scanning' : 'Start Scanning'}
              </Button>
              {scanning && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={simulateBarcodeDetection}
                  className="px-4"
                >
                  Simulate Scan
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {scanMethod === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Barcode
              </label>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scan or type barcode..."
                className="w-full text-lg h-14 border rounded-lg px-4"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                You can scan using a barcode scanner or type the numbers manually
              </p>
            </div>
            
            <Button
              type="button"
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              className="w-full"
            >
              <Search size={20} className="mr-2" />
              Find Product
            </Button>
          </div>
        )}

        {/* Common Barcodes for Testing */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Test Barcodes</h4>
          <div className="grid grid-cols-2 gap-2">
            {['123456789012', '987654321098', '111222333444', '555666777888'].map(barcode => (
              <Button
                key={barcode}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onScanned(barcode)}
                className="text-xs"
              >
                {barcode}
              </Button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;