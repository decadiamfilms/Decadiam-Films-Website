import React, { useState } from 'react';
import { 
  PlusIcon, TrashIcon, BuildingOfficeIcon, 
  PhotoIcon, MapPinIcon, UserPlusIcon,
  CloudArrowUpIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
  isPrimary: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

function BusinessSetupStep({ data, onChange }: StepProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'locations' | 'employees'>('company');
  const [locations, setLocations] = useState<Location[]>(data.locations || [
    {
      id: '1',
      name: 'Main Office',
      address: '',
      city: '',
      state: '',
      postcode: '',
      phone: '',
      isPrimary: true
    }
  ]);
  const [employees, setEmployees] = useState<Employee[]>(data.employees || []);
  const [companyData, setCompanyData] = useState({
    businessName: data.businessName || '',
    tradingName: data.tradingName || '',
    website: data.website || '',
    abnAcn: data.abnAcn || '',
    gstEnabled: data.gstEnabled || false,
    gstNumber: data.gstNumber || '',
    logoFile: data.logoFile || null,
    logoPreview: data.logoPreview || null
  });

  const handleCompanyChange = (field: string, value: any) => {
    const updatedData = { ...companyData, [field]: value };
    setCompanyData(updatedData);
    onChange({ ...data, ...updatedData });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoPreview = e.target?.result as string;
        handleCompanyChange('logoFile', file);
        handleCompanyChange('logoPreview', logoPreview);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLocation = () => {
    const newLocation: Location = {
      id: Date.now().toString(),
      name: `Location ${locations.length + 1}`,
      address: '',
      city: '',
      state: '',
      postcode: '',
      phone: '',
      isPrimary: false
    };
    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    onChange({ ...data, locations: updatedLocations });
  };

  const updateLocation = (id: string, field: string, value: string | boolean) => {
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    setLocations(updatedLocations);
    onChange({ ...data, locations: updatedLocations });
  };

  const removeLocation = (id: string) => {
    if (locations.length > 1) {
      const updatedLocations = locations.filter(loc => loc.id !== id);
      setLocations(updatedLocations);
      onChange({ ...data, locations: updatedLocations });
    }
  };

  const addEmployee = () => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      email: '',
      role: 'Employee'
    };
    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    onChange({ ...data, employees: updatedEmployees });
  };

  const updateEmployee = (id: string, field: string, value: string) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    );
    setEmployees(updatedEmployees);
    onChange({ ...data, employees: updatedEmployees });
  };

  const removeEmployee = (id: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    setEmployees(updatedEmployees);
    onChange({ ...data, employees: updatedEmployees });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Business</h2>
        <p className="text-gray-600">Configure your company profile, locations, and team</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 justify-center">
          {[
            { id: 'company', label: 'Company Info', icon: BuildingOfficeIcon },
            { id: 'locations', label: 'Locations', icon: MapPinIcon },
            { id: 'employees', label: 'Team Members', icon: UserPlusIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl mx-auto">
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden">
                  {companyData.logoPreview ? (
                    <img src={companyData.logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upload your company logo</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  required
                  value={companyData.businessName}
                  onChange={(e) => handleCompanyChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Company Pty Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trading Name</label>
                <input
                  type="text"
                  value={companyData.tradingName}
                  onChange={(e) => handleCompanyChange('tradingName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={companyData.website}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ABN/ACN</label>
                <input
                  type="text"
                  value={companyData.abnAcn}
                  onChange={(e) => handleCompanyChange('abnAcn', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12 345 678 901"
                />
              </div>
            </div>

            {/* GST Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={companyData.gstEnabled}
                  onChange={(e) => handleCompanyChange('gstEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <span className="text-sm font-medium text-gray-900">GST Registered</span>
              </label>
              {companyData.gstEnabled && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={companyData.gstNumber}
                    onChange={(e) => handleCompanyChange('gstNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="GST Number"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Business Locations</h3>
              <button
                onClick={addLocation}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Location
              </button>
            </div>

            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={location.name}
                        onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                        className="font-medium text-gray-900 border-none bg-transparent p-0 focus:ring-0"
                        placeholder="Location name"
                      />
                      {location.isPrimary && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Primary</span>
                      )}
                    </div>
                    {!location.isPrimary && (
                      <button
                        onClick={() => removeLocation(location.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={location.address}
                        onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="123 Business Street"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={location.city}
                        onChange={(e) => updateLocation(location.id, 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Sydney"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        value={location.state}
                        onChange={(e) => updateLocation(location.id, 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select State</option>
                        <option value="NSW">NSW</option>
                        <option value="VIC">VIC</option>
                        <option value="QLD">QLD</option>
                        <option value="WA">WA</option>
                        <option value="SA">SA</option>
                        <option value="TAS">TAS</option>
                        <option value="ACT">ACT</option>
                        <option value="NT">NT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                      <input
                        type="text"
                        value={location.postcode}
                        onChange={(e) => updateLocation(location.id, 'postcode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="2000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={location.phone}
                        onChange={(e) => updateLocation(location.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="+61 2 1234 5678"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Invite Team Members</h3>
                <p className="text-sm text-gray-600">Add employees who will use SalesKik (optional)</p>
              </div>
              <button
                onClick={addEmployee}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Employee
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No team members added yet</p>
                <p className="text-sm text-gray-500">You can invite employees now or skip this step</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Team Member</h4>
                      <button
                        onClick={() => removeEmployee(employee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={employee.firstName}
                          onChange={(e) => updateEmployee(employee.id, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="John"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={employee.lastName}
                          onChange={(e) => updateEmployee(employee.id, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={employee.email}
                          onChange={(e) => updateEmployee(employee.id, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="john@company.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={employee.role}
                          onChange={(e) => updateEmployee(employee.id, 'role', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="Employee">Employee</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-1">Team Member Invitations</h4>
              <p className="text-sm text-blue-800">
                Invitation emails will be sent after you complete the setup process. 
                Team members can then create their passwords and access the system.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="text-center">
        <div className="flex justify-center gap-4">
          {companyData.businessName && (
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Company Info
            </div>
          )}
          {locations.some(loc => loc.address && loc.city) && (
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Locations ({locations.length})
            </div>
          )}
          {employees.length > 0 && (
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Team ({employees.length})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessSetupStep;