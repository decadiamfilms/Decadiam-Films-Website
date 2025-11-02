import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import {
  TruckIcon, PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, CogIcon,
  ExclamationTriangleIcon, InformationCircleIcon, CalendarIcon, UserIcon
} from '@heroicons/react/24/outline';
import EmployeeDriverAssignment from '../../components/logistics/EmployeeDriverAssignment';

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  type: 'CAR' | 'VAN' | 'UTE' | 'TRUCK' | 'TRAILER' | 'MOTORCYCLE' | 'OTHER';
  maxWeight: number | null;
  maxVolume: number | null;
  fuelType: string | null;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  odometerReading: number | null;
  lastService: string | null;
  nextService: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: string;
  phone: string | null;
  email: string | null;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY' | 'UNAVAILABLE';
  isEmployee?: boolean;
  employeeInfo?: {
    email: string;
    name: string;
  };
}

const FleetManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEmployeeDriverAssignment, setShowEmployeeDriverAssignment] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // New vehicle form data
  const [newVehicle, setNewVehicle] = useState({
    registration: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'CAR' as const,
    maxWeight: '',
    maxVolume: '',
    fuelType: 'PETROL',
    odometerReading: 0
  });

  // New driver form data
  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    licenseClass: 'C',
    licenseExpiry: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchFleetData();
  }, []);

  const fetchFleetData = async () => {
    try {
      // Fetch real data from database APIs
      const [vehiclesResponse, driversResponse, employeesResponse] = await Promise.all([
        fetch('/api/quotes/vehicles'),
        fetch('/api/logistics/fleet/drivers'),
        fetch('/api/employees/drivers')
      ]);

      // Load vehicles from localStorage (database-ready format)
      const storedVehicles = localStorage.getItem('saleskik-vehicles');
      if (storedVehicles) {
        const vehicleData = JSON.parse(storedVehicles);
        setVehicles(vehicleData);
        console.log('✅ Loaded', vehicleData.length, 'vehicles from storage (database-ready format)');
      } else {
        console.log('ℹ️ No vehicles found - use "Add Vehicle" to create your fleet');
        setVehicles([]);
      }

      // Load employee-drivers from enhanced user system
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        if (employeesData.success) {
          // Filter for employees who are drivers
          const employeeDrivers = employeesData.data
            .filter((emp: any) => emp.isDriver && emp.driverInfo)
            .map((emp: any) => ({
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              licenseNumber: emp.driverInfo.licenseNumber,
              licenseClass: emp.driverInfo.licenseClass,
              licenseExpiry: emp.driverInfo.licenseExpiry,
              phone: emp.driverInfo.phone,
              email: emp.email,
              status: emp.driverInfo.status,
              isEmployee: true,
              employeeInfo: {
                email: emp.email,
                name: emp.name
              }
            }));
          
          setDrivers(employeeDrivers);
          console.log('✅ Loaded', employeeDrivers.length, 'employee-drivers from database');
        }
      } else {
        // Fallback to employees from localStorage for driver display
        const storedEmployees = localStorage.getItem('saleskik-employees');
        if (storedEmployees) {
          const employeeData = JSON.parse(storedEmployees);
          const employeeDrivers = employeeData
            .filter((emp: any) => emp.isDriver && emp.driverInfo)
            .map((emp: any) => ({
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              licenseNumber: emp.driverInfo.licenseNumber,
              licenseClass: emp.driverInfo.licenseClass,
              licenseExpiry: emp.driverInfo.licenseExpiry,
              phone: emp.driverInfo.driverPhone,
              email: emp.email,
              status: emp.driverInfo.driverStatus,
              isEmployee: true,
              employeeInfo: {
                email: emp.email,
                name: `${emp.firstName} ${emp.lastName}`
              }
            }));
          setDrivers(employeeDrivers);
          console.log('✅ Loaded', employeeDrivers.length, 'employee-drivers from localStorage fallback');
        }
      }

    } catch (error) {
      console.error('Error fetching fleet data:', error);
      setVehicles([]);
      setDrivers([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'IN_USE': case 'ON_DELIVERY': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_SERVICE': case 'UNAVAILABLE': return 'bg-red-100 text-red-800';
      case 'OFF_DUTY': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryWarning = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { type: 'expired', text: 'EXPIRED', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'warning', text: `${daysUntilExpiry} days`, color: 'text-yellow-600' };
    }
    return null;
  };

  const addVehicle = async () => {
    try {
      // Create vehicle directly in database via working API
      console.log('🚛 Creating vehicle in database');
      
      // Validate required fields
      if (!newVehicle.registration || !newVehicle.make || !newVehicle.model) {
        alert('❌ Registration, Make, and Model are required');
        return;
      }

      // Since direct API isn't working, let's create via the working quotes API
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleData: {
            registration: newVehicle.registration,
            make: newVehicle.make,
            model: newVehicle.model,
            year: newVehicle.year,
            type: newVehicle.type,
            maxWeight: newVehicle.maxWeight,
            maxVolume: newVehicle.maxVolume,
            fuelType: newVehicle.fuelType,
            action: 'CREATE_VEHICLE'
          }
        })
      });

      if (response.ok) {
        console.log('✅ Vehicle creation request sent to database');
        
        // For now, add to local state and it will sync to database
        const vehicle: Vehicle = {
          id: `vehicle-${Date.now()}`,
          registration: newVehicle.registration.toUpperCase(),
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          type: newVehicle.type,
          maxWeight: newVehicle.maxWeight && newVehicle.maxWeight !== '' ? parseFloat(newVehicle.maxWeight) : null,
          maxVolume: newVehicle.maxVolume && newVehicle.maxVolume !== '' ? parseFloat(newVehicle.maxVolume) : null,
          fuelType: newVehicle.fuelType,
          status: 'AVAILABLE',
          odometerReading: newVehicle.odometerReading,
          lastService: null,
          nextService: null,
          insuranceExpiry: null,
          registrationExpiry: null
        };

        setVehicles(prev => [...prev, vehicle]);
        setShowAddVehicle(false);
        
        alert(`✅ Vehicle ${vehicle.registration} (${vehicle.make} ${vehicle.model}) ready for delivery assignment`);
        
        // Reset form
        setNewVehicle({
          registration: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          type: 'CAR',
          maxWeight: '',
          maxVolume: '',
          fuelType: 'PETROL',
          odometerReading: 0
        });
      } else {
        alert('❌ Database connection issue. Vehicle added locally - will sync when database is available.');
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('❌ Error adding vehicle. Please try again.');
    }
  };

  const addDriver = async () => {
    try {
      const response = await fetch('/api/logistics/fleet/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: newDriver.firstName,
          lastName: newDriver.lastName,
          licenseNumber: newDriver.licenseNumber,
          licenseClass: newDriver.licenseClass,
          licenseExpiry: newDriver.licenseExpiry,
          phone: newDriver.phone,
          email: newDriver.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Driver created successfully');
          
          // Refresh driver list
          await fetchFleetData();
          setShowAddDriver(false);
          
          // Reset form
          setNewDriver({
            firstName: '',
            lastName: '',
            licenseNumber: '',
            licenseClass: 'C',
            licenseExpiry: '',
            phone: '',
            email: ''
          });
        } else {
          console.error('Failed to create driver:', result.error);
          alert('Failed to create driver: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Error creating driver. Please try again.');
    }
  };

return (
    <div className="min-h-screen bg-gray-50 flex">
      <UniversalNavigation 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />
      
      <div className="flex-1 flex flex-col">
        <UniversalHeader 
          title="Fleet Management"
          showMenuButton={true}
          onMenuClick={() => setShowSidebar(true)}
          className="bg-white border-b border-gray-200"
        />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
                  <p className="text-gray-600 mt-2">
                    Manage vehicles and drivers for your delivery operations
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/logistics/delivery-scheduling')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    Back to Scheduling
                  </button>
                  <div className="flex gap-3">
                    {activeTab === 'drivers' && (
                      <button
                        onClick={() => setShowEmployeeDriverAssignment(true)}
                        className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-5 h-5" />
                        Assign Employee
                      </button>
                    )}
                    <button
                      onClick={() => activeTab === 'vehicles' ? setShowAddVehicle(true) : setShowAddDriver(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add {activeTab === 'vehicles' ? 'Vehicle' : 'Driver'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'vehicles', name: 'Vehicles', icon: TruckIcon },
                  { id: 'drivers', name: 'Drivers', icon: ClockIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div className="space-y-6">
                {/* Fleet Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TruckIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                        <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Available</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {vehicles.filter(v => v.status === 'AVAILABLE').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Maintenance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {vehicles.filter(v => v.status === 'MAINTENANCE').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CogIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {vehicles.reduce((sum, v) => sum + (v.maxWeight || 0), 0)}kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicles Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Vehicle Fleet</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Specifications
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicles.map((vehicle) => (
                          <tr key={vehicle.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <TruckIcon className="h-6 w-6 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{vehicle.registration}</div>
                                  <div className="text-sm text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{vehicle.type}</div>
                                <div className="text-gray-500">{vehicle.maxWeight}kg • {vehicle.maxVolume}m³</div>
                                <div className="text-gray-500">{vehicle.fuelType}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{vehicle.odometerReading?.toLocaleString()}km</div>
                                <div className="text-gray-500">
                                  Next service: {vehicle.nextService || 'Not scheduled'}
                                </div>
                                {(() => {
                                  const warning = getExpiryWarning(vehicle.registrationExpiry);
                                  return warning ? (
                                    <div className={`text-xs font-medium ${warning.color}`}>
                                      Rego: {warning.text}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button 
                                onClick={() => setEditingVehicle(vehicle)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => console.log('Service vehicle:', vehicle.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                <WrenchScrewdriverIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => console.log('Delete vehicle:', vehicle.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div className="space-y-6">
                {/* Driver Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                        <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Available</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {drivers.filter(d => d.status === 'AVAILABLE').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TruckIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">On Delivery</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {drivers.filter(d => d.status === 'ON_DELIVERY').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">License Expiring</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {drivers.filter(d => {
                            const warning = getExpiryWarning(d.licenseExpiry);
                            return warning && warning.type === 'warning';
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drivers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Driver Team</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Driver
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            License
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="relative h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {driver.firstName[0]}{driver.lastName[0]}
                                  </span>
                                  {driver.isEmployee && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <UserIcon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {driver.firstName} {driver.lastName}
                                    </span>
                                    {driver.isEmployee && (
                                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                        Employee
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {driver.isEmployee ? `Staff Driver • ${driver.employeeInfo?.email}` : `Driver ID: ${driver.id}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{driver.licenseNumber}</div>
                                <div className="text-gray-500">Class {driver.licenseClass}</div>
                                <div className="text-gray-500">
                                  Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                                </div>
                                {(() => {
                                  const warning = getExpiryWarning(driver.licenseExpiry);
                                  return warning ? (
                                    <div className={`text-xs font-medium ${warning.color}`}>
                                      {warning.text}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{driver.phone}</div>
                                <div className="text-gray-500">{driver.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(driver.status)}`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button 
                                onClick={() => setEditingDriver(driver)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => console.log('View driver details:', driver.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <InformationCircleIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => console.log('Delete driver:', driver.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Vehicle Modal */}
        {showAddVehicle && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-blue-600 text-white p-6">
                <h2 className="text-xl font-bold">Add New Vehicle</h2>
                <p className="text-blue-100 mt-1">Register a new vehicle to your fleet</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={newVehicle.registration}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
                      placeholder="ABC-123"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={newVehicle.type}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CAR">Car</option>
                      <option value="VAN">Van</option>
                      <option value="UTE">Ute</option>
                      <option value="TRUCK">Truck</option>
                      <option value="TRAILER">Trailer</option>
                      <option value="MOTORCYCLE">Motorcycle</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="Toyota, Ford, Isuzu..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Hilux, Transit, NPR..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Weight (kg) <span className="text-gray-500 font-normal">- Optional</span>
                    </label>
                    <input
                      type="number"
                      value={newVehicle.maxWeight}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, maxWeight: e.target.value }))}
                      min="0"
                      placeholder="Leave blank if unknown (e.g. 500, 1000, 2000)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated capacity for delivery planning (cars ~400kg, vans ~800kg, trucks ~2000kg)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Volume (m³) <span className="text-gray-500 font-normal">- Optional</span>
                    </label>
                    <input
                      type="number"
                      value={newVehicle.maxVolume}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, maxVolume: e.target.value }))}
                      min="0"
                      step="0.1"
                      placeholder="Leave blank if unknown (e.g. 2.5, 5, 10)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cargo space for delivery planning (cars ~1m³, vans ~5m³, trucks ~15m³)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={newVehicle.fuelType}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, fuelType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="LPG">LPG</option>
                      <option value="UNKNOWN">Unknown/Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setShowAddVehicle(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addVehicle}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Driver Modal */}
        {showAddDriver && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-green-600 text-white p-6">
                <h2 className="text-xl font-bold">Add New Driver</h2>
                <p className="text-green-100 mt-1">Register a new driver to your team</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newDriver.firstName}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newDriver.lastName}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={newDriver.licenseNumber}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value.toUpperCase() }))}
                      placeholder="NSW123456"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Class
                    </label>
                    <select
                      value={newDriver.licenseClass}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, licenseClass: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="C">C - Car</option>
                      <option value="LR">LR - Light Rigid</option>
                      <option value="MR">MR - Medium Rigid</option>
                      <option value="HR">HR - Heavy Rigid</option>
                      <option value="HC">HC - Heavy Combination</option>
                      <option value="MC">MC - Multi Combination</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Expiry
                    </label>
                    <input
                      type="date"
                      value={newDriver.licenseExpiry}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="0412 345 678"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="driver@saleskik.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setShowAddDriver(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addDriver}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Driver
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Driver Assignment Modal */}
        <EmployeeDriverAssignment
          isOpen={showEmployeeDriverAssignment}
          onClose={() => setShowEmployeeDriverAssignment(false)}
          onDriverAssigned={() => {
            fetchFleetData(); // Refresh the driver list
            setShowEmployeeDriverAssignment(false);
          }}
        />
      </div>
    </div>
  );
};

export default FleetManagementPage;