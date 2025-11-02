import React, { useState, useEffect } from 'react';
import {
  XMarkIcon, TruckIcon, UserIcon, MapPinIcon, PlusIcon, TrashIcon,
  CalendarIcon, ClockIcon, ExclamationTriangleIcon, CheckIcon
} from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  registration: string;
  type: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface DeliveryStop {
  id: string;
  sequenceOrder: number;
  customerName: string;
  deliveryAddress: string;
  scheduledTime?: string;
  unloadingTime: number;
  specialInstructions?: string;
  notificationType: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface DeliveryRun {
  id: string;
  runNumber: string;
  runName: string;
  plannedDate: string;
  startTime?: string;
  status: string;
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
  deliveries: DeliveryStop[];
}

interface DeliveryRunEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryRun: DeliveryRun | null;
  onSave: (updatedRun: DeliveryRun) => void;
  onDelete: (runId: string) => void;
}

const DeliveryRunEditModal: React.FC<DeliveryRunEditModalProps> = ({
  isOpen,
  onClose,
  deliveryRun,
  onSave,
  onDelete
}) => {
  const [editedRun, setEditedRun] = useState<DeliveryRun | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && deliveryRun) {
      setEditedRun({ ...deliveryRun });
      loadResources();
    }
  }, [isOpen, deliveryRun]);

  const loadResources = () => {
    // Load available vehicles
    const storedVehicles = localStorage.getItem('saleskik-vehicles');
    if (storedVehicles) {
      const vehicles = JSON.parse(storedVehicles);
      setAvailableVehicles(vehicles);
    }

    // Load available drivers
    const storedEmployees = localStorage.getItem('saleskik-employees');
    if (storedEmployees) {
      const employees = JSON.parse(storedEmployees);
      const drivers = employees
        .filter((emp: any) => emp.isDriver && emp.driverInfo)
        .map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          phone: emp.driverInfo.driverPhone
        }));
      setAvailableDrivers(drivers);
    }
  };

  const handleSave = () => {
    if (!editedRun) return;
    
    console.log('💾 Saving delivery run changes:', editedRun.runNumber);
    
    // Update the run in localStorage
    const storedRuns = localStorage.getItem('saleskik-delivery-runs');
    if (storedRuns) {
      const runs = JSON.parse(storedRuns);
      const updatedRuns = runs.map((run: any) => 
        run.id === editedRun.id ? editedRun : run
      );
      localStorage.setItem('saleskik-delivery-runs', JSON.stringify(updatedRuns));
    }
    
    onSave(editedRun);
    onClose();
    alert(`✅ Delivery run ${editedRun.runNumber} updated successfully`);
  };

  const handleDelete = () => {
    if (!editedRun) return;
    
    console.log('🗑️ Deleting delivery run:', editedRun.runNumber);
    
    // Remove from localStorage
    const storedRuns = localStorage.getItem('saleskik-delivery-runs');
    if (storedRuns) {
      const runs = JSON.parse(storedRuns);
      const updatedRuns = runs.filter((run: any) => run.id !== editedRun.id);
      localStorage.setItem('saleskik-delivery-runs', JSON.stringify(updatedRuns));
    }
    
    // Update vehicle and driver status back to available
    updateResourceStatus(editedRun.vehicle.id, editedRun.driver.id, 'AVAILABLE');
    
    onDelete(editedRun.id);
    onClose();
    alert(`✅ Delivery run ${editedRun.runNumber} deleted successfully`);
  };

  const updateResourceStatus = (vehicleId: string, driverId: string, status: string) => {
    // Update vehicle status
    const storedVehicles = localStorage.getItem('saleskik-vehicles');
    if (storedVehicles) {
      const vehicles = JSON.parse(storedVehicles);
      const updatedVehicles = vehicles.map((v: any) => 
        v.id === vehicleId ? { ...v, status: status } : v
      );
      localStorage.setItem('saleskik-vehicles', JSON.stringify(updatedVehicles));
    }

    // Update driver status
    const storedEmployees = localStorage.getItem('saleskik-employees');
    if (storedEmployees) {
      const employees = JSON.parse(storedEmployees);
      const updatedEmployees = employees.map((emp: any) => 
        emp.id === driverId ? { 
          ...emp, 
          driverInfo: {
            ...emp.driverInfo,
            driverStatus: status === 'AVAILABLE' ? 'AVAILABLE' : 'ON_DELIVERY'
          }
        } : emp
      );
      localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
    }
  };

  const addDeliveryStop = () => {
    if (!editedRun) return;
    
    const newStop: DeliveryStop = {
      id: `stop-${Date.now()}`,
      sequenceOrder: editedRun.deliveries.length + 1,
      customerName: '',
      deliveryAddress: '',
      unloadingTime: 30,
      notificationType: 'EMAIL',
      specialInstructions: ''
    };
    
    setEditedRun({
      ...editedRun,
      deliveries: [...editedRun.deliveries, newStop],
      totalStops: editedRun.deliveries.length + 1
    });
  };

  const removeDeliveryStop = (stopId: string) => {
    if (!editedRun) return;
    
    const updatedDeliveries = editedRun.deliveries.filter(stop => stop.id !== stopId);
    setEditedRun({
      ...editedRun,
      deliveries: updatedDeliveries,
      totalStops: updatedDeliveries.length
    });
  };

  const updateDeliveryStop = (stopId: string, updates: Partial<DeliveryStop>) => {
    if (!editedRun) return;
    
    const updatedDeliveries = editedRun.deliveries.map(stop =>
      stop.id === stopId ? { ...stop, ...updates } : stop
    );
    setEditedRun({
      ...editedRun,
      deliveries: updatedDeliveries
    });
  };

  if (!isOpen || !editedRun) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Delivery Run</h2>
              <p className="text-gray-600 mt-1">{editedRun.runNumber} - {editedRun.runName}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Run Name
              </label>
              <input
                type="text"
                value={editedRun.runName}
                onChange={(e) => setEditedRun({ ...editedRun, runName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Date
              </label>
              <input
                type="date"
                value={editedRun.plannedDate}
                onChange={(e) => setEditedRun({ ...editedRun, plannedDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Vehicle & Driver Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle
              </label>
              <select
                value={editedRun.vehicle.id}
                onChange={(e) => {
                  const vehicle = availableVehicles.find(v => v.id === e.target.value);
                  if (vehicle) {
                    setEditedRun({
                      ...editedRun,
                      vehicle: {
                        id: vehicle.id,
                        registration: vehicle.registration,
                        type: vehicle.type
                      }
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration} ({vehicle.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver
              </label>
              <select
                value={editedRun.driver.id}
                onChange={(e) => {
                  const driver = availableDrivers.find(d => d.id === e.target.value);
                  if (driver) {
                    setEditedRun({
                      ...editedRun,
                      driver: {
                        id: driver.id,
                        name: `${driver.firstName} ${driver.lastName}`,
                        phone: driver.phone
                      }
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableDrivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Delivery Stops */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Delivery Stops</h4>
              <button
                onClick={addDeliveryStop}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <PlusIcon className="w-4 h-4" />
                Add Stop
              </button>
            </div>

            <div className="space-y-4">
              {editedRun.deliveries.map((stop, index) => (
                <div key={stop.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Stop {stop.sequenceOrder}</h5>
                    <button
                      onClick={() => removeDeliveryStop(stop.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={stop.customerName}
                        onChange={(e) => updateDeliveryStop(stop.id, { customerName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Time
                      </label>
                      <input
                        type="time"
                        value={stop.scheduledTime || ''}
                        onChange={(e) => updateDeliveryStop(stop.id, { scheduledTime: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={stop.deliveryAddress}
                        onChange={(e) => updateDeliveryStop(stop.id, { deliveryAddress: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unloading Time (min)
                      </label>
                      <input
                        type="number"
                        value={stop.unloadingTime}
                        onChange={(e) => updateDeliveryStop(stop.id, { unloadingTime: parseInt(e.target.value) || 30 })}
                        min="5"
                        max="180"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Phone
                      </label>
                      <input
                        type="tel"
                        value={stop.customerPhone || ''}
                        onChange={(e) => updateDeliveryStop(stop.id, { customerPhone: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions
                      </label>
                      <textarea
                        value={stop.specialInstructions || ''}
                        onChange={(e) => updateDeliveryStop(stop.id, { specialInstructions: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Gate codes, access instructions, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {editedRun.deliveries.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MapPinIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">No delivery stops</p>
                  <button
                    onClick={addDeliveryStop}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add First Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Run
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Delete Delivery Run</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{editedRun.runNumber}"? This action cannot be undone.
                The vehicle and driver will be marked as available again.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryRunEditModal;