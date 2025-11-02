import React, { useState, useEffect } from 'react';
import {
  XMarkIcon, MapPinIcon, ClockIcon, UserIcon, TruckIcon,
  CheckCircleIcon, ExclamationTriangleIcon, PlayIcon, PhoneIcon
} from '@heroicons/react/24/outline';

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryRun: any;
}

const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  isOpen,
  onClose,
  deliveryRun
}) => {
  const [currentLocation, setCurrentLocation] = useState('Starting from depot');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (isOpen && deliveryRun) {
      // Simulate real-time updates
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, deliveryRun]);

  if (!isOpen || !deliveryRun) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Live Delivery Tracking</h2>
              <p className="text-gray-600 mt-1">{deliveryRun.runNumber} - {deliveryRun.runName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status */}
        <div className="p-6">
          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-medium text-blue-900">Live Status</h3>
                  <p className="text-blue-700">{currentLocation}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliveryRun.status)}`}>
                  {deliveryRun.status}
                </span>
                <p className="text-xs text-blue-600 mt-1">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Driver</h4>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{deliveryRun.driver.name}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{deliveryRun.driver.phone}</span>
                  <button className="text-blue-600 hover:text-blue-800 ml-2">Call</button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <TruckIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Vehicle</h4>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{deliveryRun.vehicle.registration}</p>
                <p className="text-sm text-gray-600">{deliveryRun.vehicle.type}</p>
              </div>
            </div>
          </div>

          {/* Delivery Progress */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Delivery Progress</h4>
            
            <div className="space-y-3">
              {deliveryRun.deliveries.map((stop: any, index: number) => {
                const isCompleted = stop.status === 'COMPLETED' || stop.status === 'DELIVERED';
                const isCurrent = stop.status === 'IN_PROGRESS' || stop.status === 'ARRIVED';
                
                return (
                  <div key={stop.id} className={`border rounded-lg p-4 ${
                    isCurrent ? 'border-yellow-300 bg-yellow-50' : 
                    isCompleted ? 'border-green-300 bg-green-50' : 
                    'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted ? 'bg-green-100 text-green-600' :
                          isCurrent ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isCompleted ? <CheckCircleIcon className="w-4 h-4" /> : stop.sequenceOrder}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{stop.customerName}</h5>
                          <p className="text-sm text-gray-600">{stop.deliveryAddress}</p>
                          {stop.scheduledTime && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Scheduled: {stop.scheduledTime}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stop.status)}`}>
                          {stop.status}
                        </span>
                        {isCurrent && (
                          <div className="text-xs text-yellow-600 mt-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full inline-block animate-pulse mr-1"></div>
                            Current Stop
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.open(`tel:${deliveryRun.driver.phone}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <PhoneIcon className="w-4 h-4" />
                Call Driver
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingModal;