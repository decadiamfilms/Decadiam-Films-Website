import React, { useState, useEffect } from 'react';
import {
  UserIcon, TruckIcon, CheckCircleIcon, XCircleIcon, 
  ExclamationTriangleIcon, PlusIcon, PencilIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  isDriver: boolean;
  driverInfo?: {
    id: string;
    licenseNumber: string;
    licenseClass: string;
    licenseExpiry: string;
    phone: string;
    status: string;
  };
}

interface EmployeeDriverAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverAssigned: () => void;
}

const EmployeeDriverAssignment: React.FC<EmployeeDriverAssignmentProps> = ({
  isOpen,
  onClose,
  onDriverAssigned
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [driverForm, setDriverForm] = useState({
    licenseNumber: '',
    licenseClass: 'C',
    licenseExpiry: '',
    phone: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      // Try to fetch from the main employee management system
      const storedEmployees = localStorage.getItem('saleskik-employees');
      if (storedEmployees) {
        const employeeData = JSON.parse(storedEmployees);
        console.log('✅ Loaded employees from localStorage:', employeeData.length);
        
        // Transform to match our interface
        const transformedEmployees: Employee[] = employeeData.map((emp: any) => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          role: emp.role,
          isActive: emp.isActive,
          isDriver: emp.isDriver || false,
          driverInfo: emp.driverInfo || null
        }));
        
        setEmployees(transformedEmployees);
        return;
      }
      
      // Try API endpoint
      const response = await fetch('/api/employees/drivers');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmployees(data.data);
          console.log('✅ Loaded', data.data.length, 'employees from API');
          return;
        }
      }
      
      // No fallback - employees must come from the real employee management system
      console.log('⚠️ No employee data available - please ensure employees are set up in /admin/employees');
      setEmployees([]);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const assignEmployeeAsDriver = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      // For now, use localStorage directly since APIs are disabled
      console.log('📝 Assigning driver using localStorage method');
      
      const storedEmployees = localStorage.getItem('saleskik-employees');
      if (!storedEmployees) {
        alert('❌ No employee data found. Please check employee management system.');
        return;
      }

      // Check if license number is already in use
      const employeeData = JSON.parse(storedEmployees);
      const existingDriver = employeeData.find((emp: any) => 
        emp.isDriver && 
        emp.driverInfo?.licenseNumber === driverForm.licenseNumber.toUpperCase() &&
        emp.id !== selectedEmployee.id
      );

      if (existingDriver) {
        alert(`❌ License ${driverForm.licenseNumber} is already assigned to ${existingDriver.firstName} ${existingDriver.lastName}`);
        return;
      }

      // Update employee with driver assignment
      const updatedEmployees = employeeData.map((emp: any) => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            isDriver: true,
            driverInfo: {
              licenseNumber: driverForm.licenseNumber.toUpperCase(),
              licenseClass: driverForm.licenseClass,
              licenseExpiry: driverForm.licenseExpiry,
              driverPhone: driverForm.phone,
              driverStatus: 'AVAILABLE'
            }
          };
        }
        return emp;
      });
      
      // Save updated employee data
      localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
      
      // Refresh the employee list immediately
      await fetchEmployees();
      
      console.log('✅ Employee driver assignment completed');
      alert(`✅ ${selectedEmployee.name} has been successfully assigned as a driver with license ${driverForm.licenseNumber.toUpperCase()}`);
      
      onDriverAssigned();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('❌ Error assigning driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeDriverAssignment = async (employeeId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/employees/drivers/${employeeId}/remove-driver`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Driver assignment removed via API');
        fetchEmployees(); // Refresh list
      } else {
        // Fallback to localStorage update
        console.log('📝 API not available, removing from localStorage');
        
        const storedEmployees = localStorage.getItem('saleskik-employees');
        if (storedEmployees) {
          const employeeData = JSON.parse(storedEmployees);
          const updatedEmployees = employeeData.map((emp: any) => {
            if (emp.id === employeeId) {
              return {
                ...emp,
                isDriver: false,
                driverInfo: null
              };
            }
            return emp;
          });
          
          localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
          fetchEmployees(); // Refresh list
          
          console.log('✅ Driver assignment removed from localStorage');
          alert('✅ Driver assignment removed successfully');
        }
      }
    } catch (error) {
      console.error('Error removing driver assignment:', error);
      
      // Still try localStorage fallback
      const storedEmployees = localStorage.getItem('saleskik-employees');
      if (storedEmployees) {
        const employeeData = JSON.parse(storedEmployees);
        const updatedEmployees = employeeData.map((emp: any) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              isDriver: false,
              driverInfo: null
            };
          }
          return emp;
        });
        
        localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
        fetchEmployees();
        alert('✅ Driver assignment removed');
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setDriverForm({
      licenseNumber: '',
      licenseClass: 'C',
      licenseExpiry: '',
      phone: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Employee Driver Assignment</h2>
              <p className="text-green-100 mt-1">Assign employees as drivers for delivery operations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Employee List */}
          <div className="w-1/2 border-r border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Employees</h3>
            
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedEmployee?.id === employee.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {employee.isDriver ? (
                        <div className="flex items-center">
                          <TruckIcon className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-green-600">Driver</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not a driver</span>
                      )}
                    </div>
                  </div>

                  {/* Driver Info if assigned */}
                  {employee.isDriver && employee.driverInfo && (
                    <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 rounded p-2">
                      <div className="text-xs space-y-1">
                        <p><span className="font-medium">License:</span> {employee.driverInfo.licenseNumber} (Class {employee.driverInfo.licenseClass})</p>
                        <p><span className="font-medium">Expires:</span> {new Date(employee.driverInfo.licenseExpiry).toLocaleDateString()}</p>
                        <p><span className="font-medium">Status:</span> {employee.driverInfo.status}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDriverAssignment(employee.id, employee.driverInfo!.id);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove Driver Assignment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Driver Assignment Form */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign as Driver</h3>
            
            {selectedEmployee ? (
              selectedEmployee.isDriver ? (
                /* Employee is already a driver */
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600 mb-4" />
                  <h4 className="text-lg font-medium text-green-900 mb-2">
                    {selectedEmployee.name} is already a driver
                  </h4>
                  <p className="text-green-700 mb-4">
                    This employee is already assigned as a driver with license {selectedEmployee.driverInfo?.licenseNumber}.
                  </p>
                  <button
                    onClick={() => removeDriverAssignment(selectedEmployee.id, selectedEmployee.driverInfo!.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove Driver Assignment
                  </button>
                </div>
              ) : (
                /* Assign employee as driver */
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Assign {selectedEmployee.name} as Driver
                    </h4>
                    <p className="text-sm text-blue-700">
                      This employee will be able to be assigned to delivery runs and will receive driver-specific permissions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver's License Number
                      </label>
                      <input
                        type="text"
                        value={driverForm.licenseNumber}
                        onChange={(e) => setDriverForm(prev => ({ 
                          ...prev, 
                          licenseNumber: e.target.value.toUpperCase() 
                        }))}
                        placeholder="NSW123456"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Class
                      </label>
                      <select
                        value={driverForm.licenseClass}
                        onChange={(e) => setDriverForm(prev => ({ 
                          ...prev, 
                          licenseClass: e.target.value 
                        }))}
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
                        License Expiry Date
                      </label>
                      <input
                        type="date"
                        value={driverForm.licenseExpiry}
                        onChange={(e) => setDriverForm(prev => ({ 
                          ...prev, 
                          licenseExpiry: e.target.value 
                        }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={driverForm.phone}
                        onChange={(e) => setDriverForm(prev => ({ 
                          ...prev, 
                          phone: e.target.value 
                        }))}
                        placeholder="0412 345 678"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For delivery communications and emergency contact
                      </p>
                    </div>

                    {/* Driver Responsibilities */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-900 mb-2">Driver Responsibilities</h5>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Available for delivery run assignments</li>
                        <li>• Responsible for vehicle pre-trip inspections</li>
                        <li>• Customer communication and delivery confirmation</li>
                        <li>• Proof of delivery collection (photos, signatures)</li>
                        <li>• Real-time delivery status updates</li>
                      </ul>
                    </div>

                    <button
                      onClick={assignEmployeeAsDriver}
                      disabled={
                        loading || 
                        !driverForm.licenseNumber || 
                        !driverForm.licenseExpiry || 
                        !driverForm.phone
                      }
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <TruckIcon className="w-5 h-5" />
                          Assign as Driver
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* No employee selected */
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  Select an Employee
                </h4>
                <p className="text-gray-600">
                  Choose an employee from the list to assign them as a driver, or view existing driver assignments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned Drivers</p>
              <p className="text-2xl font-bold text-green-600">
                {employees.filter(emp => emp.isDriver).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available for Assignment</p>
              <p className="text-2xl font-bold text-blue-600">
                {employees.filter(emp => !emp.isDriver && emp.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDriverAssignment;