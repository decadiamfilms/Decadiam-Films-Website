import React, { useState, useEffect } from 'react';
import {
  TruckIcon, MapIcon, ClockIcon, PlusIcon, UserIcon,
  ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon,
  PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import OrderSelectionModal from './OrderSelectionModal';

interface Vehicle {
  id: string;
  registration: string;
  type: string;
  maxWeight: number;
  maxVolume: number;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  deliveryAddress: string;
}

interface DeliveryStop {
  id: string;
  customerId: string;
  customerName: string;
  deliveryAddress: string;
  scheduledTime?: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  unloadingTime: number;
  specialInstructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    weight: number;
    volume: number;
  }>;
  notificationType: 'SMS' | 'EMAIL' | 'BOTH' | 'NONE';
  customerPhone?: string;
  customerEmail?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  deliveryAddress: string;
  orderDate: string;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    volume?: number;
  }>;
}

interface DeliveryRunCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated: (run: any) => void;
}

const DeliveryRunCreationWizard: React.FC<DeliveryRunCreationWizardProps> = ({
  isOpen,
  onClose,
  onRunCreated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [creationMethod, setCreationMethod] = useState<'orders' | 'manual'>('orders');
  const [showOrderSelection, setShowOrderSelection] = useState(false);

  // Run Details
  const [runName, setRunName] = useState('');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [startingLocation, setStartingLocation] = useState({
    lat: -33.8688,
    lng: 151.2093,
    address: 'Business Location (Default)'
  });

  // Delivery Stops
  const [deliveryStops, setDeliveryStops] = useState<DeliveryStop[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchResources();
    }
  }, [isOpen]);

  const fetchResources = async () => {
    try {
      // Debug: Check all localStorage keys
      console.log('🔍 Debug: All localStorage keys:', Object.keys(localStorage));
      console.log('🔍 Debug: saleskik-vehicles key exists:', !!localStorage.getItem('saleskik-vehicles'));
      console.log('🔍 Debug: saleskik-employees key exists:', !!localStorage.getItem('saleskik-employees'));
      
      // Load real vehicles from localStorage (working method)
      const storedVehicles = localStorage.getItem('saleskik-vehicles');
      console.log('🔍 Debug: Vehicle data raw:', storedVehicles);
      
      if (storedVehicles) {
        const vehicleData = JSON.parse(storedVehicles);
        console.log('🔍 Debug: Found raw vehicle data:', vehicleData);
        
        // Don't filter by status for now - show all vehicles
        setVehicles(vehicleData);
        console.log('✅ Loaded', vehicleData.length, 'vehicles for delivery run creation');
      } else {
        console.log('⚠️ Debug: No vehicles in localStorage - check saleskik-vehicles key');
        setVehicles([]);
      }

      // Load real employee-drivers
      const storedEmployees = localStorage.getItem('saleskik-employees');
      console.log('🔍 Debug: Checking for employee-drivers in localStorage...');
      
      if (storedEmployees) {
        const employeeData = JSON.parse(storedEmployees);
        console.log('🔍 Debug: Found employee data:', employeeData.length, 'employees');
        
        const driversWithInfo = employeeData.filter((emp: any) => emp.isDriver && emp.driverInfo);
        console.log('🔍 Debug: Employees with driver info:', driversWithInfo.length);
        
        const employeeDrivers = driversWithInfo.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          phone: emp.driverInfo.driverPhone || emp.phone || 'No phone',
          status: emp.driverInfo.driverStatus || 'AVAILABLE'
        }));
        
        setDrivers(employeeDrivers);
        console.log('✅ Loaded', employeeDrivers.length, 'employee-drivers for delivery run creation');
      } else {
        console.log('⚠️ Debug: No employees in localStorage - check saleskik-employees key');
        setDrivers([]);
      }

      // Load available orders (mock data for now)  
      const mockOrders: Order[] = [
          {
            id: 'order-001',
            orderNumber: 'ORD-20250102-001',
            customerName: 'ABC Hardware',
            customerId: 'customer-001',
            deliveryAddress: '123 Main St, Chatswood NSW 2067',
            orderDate: '2025-01-02',
            total: 2450.00,
            status: 'CONFIRMED',
            items: [
              { name: 'Glass Panel 12mm', quantity: 5, weight: 50, volume: 0.5 },
              { name: 'Steel Frame', quantity: 10, weight: 80, volume: 1.2 }
            ]
          },
          {
            id: 'order-002',
            orderNumber: 'ORD-20250102-002',
            customerName: 'XYZ Building Supplies',
            customerId: 'customer-002',
            deliveryAddress: '456 Pacific Hwy, North Sydney NSW 2060',
            orderDate: '2025-01-02',
            total: 1850.00,
            status: 'CONFIRMED',
            items: [
              { name: 'Aluminum Posts', quantity: 15, weight: 45, volume: 0.8 }
            ]
          },
          {
            id: 'order-003',
            orderNumber: 'ORD-20250103-001',
            customerName: 'Pro Construction Co',
            customerId: 'customer-003',
            deliveryAddress: '789 George St, Sydney NSW 2000',
            orderDate: '2025-01-03',
            total: 3200.00,
            status: 'CONFIRMED',
            items: [
              { name: 'Concrete Panels', quantity: 8, weight: 120, volume: 2.0 },
              { name: 'Reinforcement Bar', quantity: 20, weight: 100, volume: 1.5 }
            ]
          }
        ];

        setAvailableOrders(mockOrders);

        // Mock customer data for manual entry
        setCustomers([
          {
            id: '1',
            name: 'ABC Hardware',
            phone: '0412 345 678',
            email: 'orders@abchardware.com',
            deliveryAddress: '123 Main St, Chatswood NSW 2067'
          },
          {
            id: '2',
            name: 'XYZ Building Supplies',
            phone: '0423 456 789',
            email: 'deliveries@xyzbuild.com.au',
            deliveryAddress: '456 Pacific Hwy, North Sydney NSW 2060'
          },
          {
            id: '3',
            name: 'Pro Construction Co',
            phone: '0434 567 890',
            email: 'logistics@proconstruction.com.au',
            deliveryAddress: '789 George St, Sydney NSW 2000'
          }
        ]);

    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const addDeliveryStop = () => {
    const newStop: DeliveryStop = {
      id: Date.now().toString(),
      customerId: '',
      customerName: '',
      deliveryAddress: '',
      unloadingTime: 30,
      items: [],
      notificationType: 'EMAIL'
    };
    setDeliveryStops([...deliveryStops, newStop]);
  };

  const toggleOrderSelection = (order: Order) => {
    const isSelected = selectedOrders.find(o => o.id === order.id);
    if (isSelected) {
      setSelectedOrders(prev => prev.filter(o => o.id !== order.id));
    } else {
      setSelectedOrders(prev => [...prev, order]);
    }
  };

  const convertOrdersToDeliveryStops = () => {
    const stops: DeliveryStop[] = selectedOrders.map(order => ({
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      scheduledTime: '', // User can set this later
      unloadingTime: Math.max(30, Math.min(60, order.items.length * 10)), // Smart default based on items
      items: order.items,
      notificationType: 'EMAIL' as const,
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      specialInstructions: `Order ${order.orderNumber} - ${order.items.length} items`
    }));
    setDeliveryStops(stops);
    console.log(`✅ Converted ${selectedOrders.length} orders to delivery stops`);
  };

  const updateDeliveryStop = (id: string, updates: Partial<DeliveryStop>) => {
    setDeliveryStops(prev => prev.map(stop => 
      stop.id === id ? { ...stop, ...updates } : stop
    ));
  };

  const removeDeliveryStop = (id: string) => {
    setDeliveryStops(prev => prev.filter(stop => stop.id !== id));
  };

  const optimizeRoute = async () => {
    if (deliveryStops.length < 2) return;

    setLoading(true);
    try {
      const deliveryData = deliveryStops.map(stop => ({
        coordinates: {
          lat: -33.8688 + (Math.random() - 0.5) * 0.1, // Mock coordinates
          lng: 151.2093 + (Math.random() - 0.5) * 0.1
        },
        timeWindow: stop.timeWindowStart && stop.timeWindowEnd ? {
          start: stop.timeWindowStart,
          end: stop.timeWindowEnd
        } : null,
        unloadingTime: stop.unloadingTime
      }));

      // Mock optimization results for now
      const mockOptimization = {
        originalOrder: deliveryStops.map((_, index) => index),
        optimizedOrder: [...Array(deliveryStops.length)].map((_, i) => i).sort(() => Math.random() - 0.5),
        totalDistance: Math.round(deliveryStops.length * 8.5 + Math.random() * 10),
        totalDuration: Math.round(deliveryStops.length * 45 + Math.random() * 30),
        estimatedSavings: {
          distance: Math.round(Math.random() * 5 + 2),
          time: Math.round(Math.random() * 20 + 10)
        }
      };

      setRouteOptimization(mockOptimization);
      
      // Reorder delivery stops based on optimization
      const reorderedStops = mockOptimization.optimizedOrder.map(index => deliveryStops[index]);
      setDeliveryStops(reorderedStops);

    } catch (error) {
      console.error('Route optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDeliveryRun = async () => {
    if (!selectedVehicle || !selectedDriver || deliveryStops.length === 0) {
      alert('❌ Please select a vehicle, driver, and at least one delivery stop');
      return;
    }

    setLoading(true);
    try {
      // Create delivery run with working data structure
      const deliveryRun = {
        id: `dr-${Date.now()}`,
        runNumber: `DR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        runName: runName || `Delivery Run - ${plannedDate}`,
        plannedDate,
        startTime: '08:00', // Default start time
        vehicle: {
          id: selectedVehicle.id,
          registration: selectedVehicle.registration,
          type: selectedVehicle.type
        },
        driver: {
          id: selectedDriver.id,
          name: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
          phone: selectedDriver.phone
        },
        totalStops: deliveryStops.length,
        totalDistance: deliveryStops.length * 8.5 + Math.random() * 10, // Estimated
        estimatedDuration: deliveryStops.length * 45 + Math.random() * 30, // Estimated
        status: 'PLANNED',
        deliveries: deliveryStops.map((stop, index) => ({
          id: `del-${Date.now()}-${index}`,
          sequenceOrder: index + 1,
          customerName: stop.customerName,
          deliveryAddress: stop.deliveryAddress,
          scheduledTime: stop.scheduledTime,
          unloadingTime: stop.unloadingTime,
          specialInstructions: stop.specialInstructions,
          status: 'PLANNED',
          notificationType: stop.notificationType,
          customerPhone: stop.customerPhone,
          customerEmail: stop.customerEmail
        }))
      };

      // Save delivery run to localStorage (database-ready structure)
      const storedRuns = localStorage.getItem('saleskik-delivery-runs') || '[]';
      const runs = JSON.parse(storedRuns);
      const updatedRuns = [deliveryRun, ...runs];
      localStorage.setItem('saleskik-delivery-runs', JSON.stringify(updatedRuns));

      console.log('✅ Delivery run created successfully:', deliveryRun.runNumber);
      alert(`✅ Delivery run ${deliveryRun.runNumber} created successfully with ${deliveryRun.totalStops} stops`);

      // Update vehicle and driver status to IN_USE
      updateResourceStatus(selectedVehicle.id, selectedDriver.id, 'IN_USE');

      onRunCreated(deliveryRun);
      resetForm();
      onClose();

    } catch (error) {
      console.error('Error creating delivery run:', error);
      alert('❌ Error creating delivery run. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateResourceStatus = (vehicleId: string, driverId: string, status: string) => {
    // Update vehicle status
    const storedVehicles = localStorage.getItem('saleskik-vehicles');
    if (storedVehicles) {
      const vehicles = JSON.parse(storedVehicles);
      const updatedVehicles = vehicles.map((v: any) => 
        v.id === vehicleId ? { ...v, status: status === 'IN_USE' ? 'IN_USE' : 'AVAILABLE' } : v
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
            driverStatus: status === 'IN_USE' ? 'ON_DELIVERY' : 'AVAILABLE'
          }
        } : emp
      );
      localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setRunName('');
    setPlannedDate(new Date().toISOString().split('T')[0]);
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setDeliveryStops([]);
    setRouteOptimization(null);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return runName && plannedDate && selectedVehicle && selectedDriver;
      case 2: 
        if (creationMethod === 'orders') {
          return selectedOrders.length > 0;
        } else {
          return deliveryStops.length > 0 && deliveryStops.every(stop => 
            stop.customerId && stop.deliveryAddress && stop.unloadingTime > 0
          );
        }
      case 3: return deliveryStops.length > 0; // After orders converted to stops
      case 4: return true; // Final review step
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header - Consistent with site style */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Delivery Run</h2>
              <p className="text-gray-600 mt-1">Optimize routes and schedule deliveries</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps - Site Style */}
          <div className="flex items-center justify-center mt-4 space-x-8">
            {[
              { num: 1, name: 'Setup' },
              { num: 2, name: 'Orders' },
              { num: 3, name: 'Details' },
              { num: 4, name: 'Review' }
            ].map((step) => (
              <div key={step.num} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                  currentStep === step.num 
                    ? 'bg-blue-50 text-blue-600 border-blue-600' 
                    : currentStep > step.num 
                      ? 'bg-green-50 text-green-600 border-green-600' 
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                }`}>
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === step.num ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Step 1: Run Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Run Setup</h3>
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Run Name
                  </label>
                  <input
                    type="text"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    placeholder="North Shore Route, City Deliveries, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Vehicle
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.length === 0 ? (
                    <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800">No vehicles available. Add vehicles in Fleet Management first.</span>
                      </div>
                    </div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedVehicle?.id === vehicle.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <TruckIcon className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="font-medium text-gray-900">{vehicle.registration}</span>
                        </div>
                        <p className="text-sm text-gray-600">{vehicle.type}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {vehicle.maxWeight}kg • {vehicle.maxVolume}m³
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Driver Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Driver
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers.length === 0 ? (
                    <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800">No drivers available. Add drivers in Driver Management first.</span>
                      </div>
                    </div>
                  ) : (
                    drivers.map((driver) => (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriver(driver)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedDriver?.id === driver.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{driver.phone}</p>
                        <p className="text-xs text-green-600 mt-1">Available</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Delivery Stops */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Stops</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOrderSelection(true)}
                    className="px-4 py-2 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Add from Orders
                  </button>
                  <button
                    onClick={addDeliveryStop}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Manual Stop
                  </button>
                </div>
              </div>

              {deliveryStops.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery stops</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your first delivery stop to get started.</p>
                  <button
                    onClick={addDeliveryStop}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add First Stop
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveryStops.map((stop, index) => (
                    <div key={stop.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">Stop {index + 1}</h4>
                        <button
                          onClick={() => removeDeliveryStop(stop.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer
                          </label>
                          <select
                            value={stop.customerId}
                            onChange={(e) => {
                              const customer = customers.find(c => c.id === e.target.value);
                              updateDeliveryStop(stop.id, {
                                customerId: e.target.value,
                                customerName: customer?.name || '',
                                deliveryAddress: customer?.deliveryAddress || '',
                                customerPhone: customer?.phone,
                                customerEmail: customer?.email
                              });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select customer...</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Address
                          </label>
                          <input
                            type="text"
                            value={stop.deliveryAddress}
                            onChange={(e) => updateDeliveryStop(stop.id, { deliveryAddress: e.target.value })}
                            placeholder="Enter delivery address"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Scheduled Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scheduled Time
                          </label>
                          <input
                            type="time"
                            value={stop.scheduledTime || ''}
                            onChange={(e) => updateDeliveryStop(stop.id, { scheduledTime: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Unloading Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unloading Time (minutes)
                          </label>
                          <input
                            type="number"
                            value={stop.unloadingTime}
                            onChange={(e) => updateDeliveryStop(stop.id, { unloadingTime: parseInt(e.target.value) || 30 })}
                            min="5"
                            max="180"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Notification Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Notification
                          </label>
                          <select
                            value={stop.notificationType}
                            onChange={(e) => updateDeliveryStop(stop.id, { 
                              notificationType: e.target.value as 'SMS' | 'EMAIL' | 'BOTH' | 'NONE' 
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="EMAIL">Email Only</option>
                            <option value="SMS">SMS Only</option>
                            <option value="BOTH">Both Email & SMS</option>
                            <option value="NONE">No Notification</option>
                          </select>
                        </div>

                        {/* Special Instructions */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Instructions
                          </label>
                          <input
                            type="text"
                            value={stop.specialInstructions || ''}
                            onChange={(e) => updateDeliveryStop(stop.id, { specialInstructions: e.target.value })}
                            placeholder="Gate codes, access instructions, etc."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Route Optimization Button */}
              {deliveryStops.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Route Optimization</h4>
                      <p className="text-sm text-blue-700">Optimize delivery order for minimum travel time</p>
                    </div>
                    <button
                      onClick={optimizeRoute}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <MapIcon className="w-5 h-5" />
                      {loading ? 'Optimizing...' : 'Optimize Route'}
                    </button>
                  </div>
                  
                  {routeOptimization && (
                    <div className="mt-4 bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center text-green-600 mb-2">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Route Optimized!
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <span className="ml-1 font-medium">{routeOptimization.totalDistance}km</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-1 font-medium">{Math.round(routeOptimization.totalDuration / 60)}h {routeOptimization.totalDuration % 60}m</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Savings:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {routeOptimization.estimatedSavings.distance}km, {routeOptimization.estimatedSavings.time}min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review Delivery Run</h3>
              
              {/* Run Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Run Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Run Name:</span>
                    <p className="font-medium">{runName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Date:</span>
                    <p className="font-medium">{plannedDate}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Vehicle:</span>
                    <p className="font-medium">{selectedVehicle?.registration}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Driver:</span>
                    <p className="font-medium">{selectedDriver?.firstName} {selectedDriver?.lastName}</p>
                  </div>
                </div>
                
                {routeOptimization && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Total Distance:</span>
                        <p className="font-medium text-lg">{routeOptimization.totalDistance}km</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Est. Duration:</span>
                        <p className="font-medium text-lg">{Math.round(routeOptimization.totalDuration / 60)}h {routeOptimization.totalDuration % 60}m</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Stops:</span>
                        <p className="font-medium text-lg">{deliveryStops.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Schedule */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Delivery Schedule</h4>
                <div className="space-y-3">
                  {deliveryStops.map((stop, index) => (
                    <div key={stop.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{stop.customerName}</h5>
                            <p className="text-sm text-gray-600">{stop.deliveryAddress}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {stop.scheduledTime || 'Flexible timing'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stop.unloadingTime}min unloading
                          </p>
                        </div>
                      </div>
                      
                      {stop.specialInstructions && (
                        <div className="mt-2 text-sm text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          📝 {stop.specialInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNext()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={createDeliveryRun}
                  disabled={loading || !canProceedToNext()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Create Delivery Run
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Selection Modal */}
        <OrderSelectionModal
          isOpen={showOrderSelection}
          onClose={() => setShowOrderSelection(false)}
          onOrdersSelected={(orders) => {
            setSelectedOrders(orders);
            setShowOrderSelection(false);
            if (orders.length > 0) {
              convertOrdersToDeliveryStops();
              setCurrentStep(3); // Move to delivery details step
            }
          }}
          selectedOrders={selectedOrders}
        />
      </div>
    </div>
  );
};

export default DeliveryRunCreationWizard;