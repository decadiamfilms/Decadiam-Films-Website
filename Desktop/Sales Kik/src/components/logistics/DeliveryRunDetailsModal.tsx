import React from 'react';
import {
  XMarkIcon, TruckIcon, UserIcon, MapPinIcon, ClockIcon,
  CalendarIcon, PhoneIcon, EnvelopeIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DeliveryRun {
  id: string;
  runNumber: string;
  runName: string;
  plannedDate: string;
  startTime?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    id: string;
    registration: string;
    type: string;
  };
  totalStops: number;
  totalDistance: number;
  estimatedDuration: number;
  deliveries: Array<{
    id: string;
    sequenceOrder: number;
    customerName: string;
    deliveryAddress: string;
    scheduledTime?: string;
    unloadingTime: number;
    status: string;
    specialInstructions?: string;
    notificationType?: string;
    customerPhone?: string;
    customerEmail?: string;
  }>;
}

interface DeliveryRunDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryRun: DeliveryRun | null;
  onEdit?: (runId: string) => void;
  onTrack?: (runId: string) => void;
}

const DeliveryRunDetailsModal: React.FC<DeliveryRunDetailsModalProps> = ({
  isOpen,
  onClose,
  deliveryRun,
  onEdit,
  onTrack
}) => {
  if (!isOpen || !deliveryRun) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delivery Run Details</h2>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Run Overview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Run Overview</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(deliveryRun.status)}`}>
                {deliveryRun.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Planned Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(deliveryRun.plannedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-medium text-gray-900">{deliveryRun.startTime || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="font-medium text-gray-900">{deliveryRun.totalDistance.toFixed(1)}km</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">{formatDuration(deliveryRun.estimatedDuration)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Assigned Driver</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{deliveryRun.driver.name}</span>
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{deliveryRun.driver.phone}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <TruckIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Assigned Vehicle</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{deliveryRun.vehicle.registration}</span>
                </p>
                <p className="text-sm text-gray-600">{deliveryRun.vehicle.type}</p>
              </div>
            </div>
          </div>

          {/* Delivery Stops */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Delivery Stops ({deliveryRun.deliveries.length})
            </h4>
            
            {deliveryRun.deliveries.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <MapPinIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No delivery stops defined</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryRun.deliveries.map((stop, index) => (
                  <div key={stop.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {stop.sequenceOrder}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{stop.customerName}</h5>
                          <p className="text-sm text-gray-600 mt-1">{stop.deliveryAddress}</p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {stop.scheduledTime && (
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {stop.scheduledTime}
                              </div>
                            )}
                            <div>Unloading: {stop.unloadingTime}min</div>
                            {stop.customerPhone && (
                              <div className="flex items-center">
                                <PhoneIcon className="w-4 h-4 mr-1" />
                                {stop.customerPhone}
                              </div>
                            )}
                          </div>

                          {stop.specialInstructions && (
                            <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                              <InformationCircleIcon className="w-4 h-4 inline mr-1" />
                              {stop.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stop.status)}`}>
                        {stop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            
            <div className="flex space-x-3">
              {onTrack && (
                <button
                  onClick={() => onTrack(deliveryRun.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <MapPinIcon className="w-4 h-4" />
                  Track Run
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(deliveryRun.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Edit Run
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRunDetailsModal;