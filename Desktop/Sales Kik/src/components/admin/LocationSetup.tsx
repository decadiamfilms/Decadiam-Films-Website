import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { dataService } from '../../services/api.service';
import { 
  PlusIcon, MapPinIcon, BuildingOffice2Icon, PencilIcon,
  TrashIcon, CheckIcon, XMarkIcon, HomeIcon,
  TruckIcon, ArchiveBoxIcon, CubeIcon, UsersIcon
} from '@heroicons/react/24/outline';

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'workshop' | 'storage' | 'showroom' | 'office';
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  isDefault: boolean;
  capacity: number; // Storage capacity in square meters
  currentUtilization: number; // Percentage used
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function LocationSetup() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      // Try API first for multi-user support, fallback to localStorage (NON-DISRUPTIVE)
      const locationsData = await dataService.locations.getAll();
      const parsedLocations = locationsData.map((location: any) => ({
        ...location,
        createdAt: new Date(location.createdAt),
        updatedAt: new Date(location.updatedAt)
      }));
      setLocations(parsedLocations);
      
      // Sync successful API data to localStorage for offline capability
      if (parsedLocations.length > 0) {
        localStorage.setItem('saleskik-locations', JSON.stringify(parsedLocations));
      }
    } catch (error) {
      // If API fails, use localStorage (preserves existing behavior)
      console.warn('API unavailable, using localStorage fallback');
      const savedLocations = localStorage.getItem('saleskik-locations');
      if (savedLocations) {
        const parsedLocations = JSON.parse(savedLocations).map((location: any) => ({
          ...location,
          createdAt: new Date(location.createdAt),
          updatedAt: new Date(location.updatedAt)
        }));
        setLocations(parsedLocations);
      } else {
        // Create default locations
        const defaultLocations: Location[] = [
          {
            id: '1',
            name: 'Main Warehouse',
            type: 'warehouse',
            address: '123 Industrial Drive',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2000',
            country: 'Australia',
            contactPerson: 'John Smith',
            contactPhone: '+61 2 1234 5678',
            contactEmail: 'warehouse@company.com',
            isActive: true,
            isDefault: true,
            capacity: 1000,
            currentUtilization: 65,
            notes: 'Primary storage facility with loading dock',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Workshop A',
            type: 'workshop',
            address: '456 Factory Street',
            city: 'Melbourne',
            state: 'VIC',
            postalCode: '3000',
            country: 'Australia',
            contactPerson: 'Sarah Wilson',
            contactPhone: '+61 3 8765 4321',
            contactEmail: 'workshop@company.com',
            isActive: true,
            isDefault: false,
            capacity: 500,
            currentUtilization: 80,
            notes: 'Glass cutting and processing facility',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setLocations(defaultLocations);
        localStorage.setItem('saleskik-locations', JSON.stringify(defaultLocations));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveLocations = async (updatedLocations: Location[]) => {
    setLocations(updatedLocations);
    // Save with hybrid approach (API + localStorage fallback)
    await dataService.locations.save(updatedLocations);
  };

  const deleteLocation = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (location?.isDefault) {
      alert('Cannot delete the default location');
      return;
    }
    
    if (confirm(`Delete "${location?.name}"? This cannot be undone.`)) {
      const updatedLocations = locations.filter(l => l.id !== locationId);
      saveLocations(updatedLocations);
    }
  };

  const setDefaultLocation = (locationId: string) => {
    const updatedLocations = locations.map(location => ({
      ...location,
      isDefault: location.id === locationId
    }));
    saveLocations(updatedLocations);
  };

  const toggleLocationStatus = (locationId: string) => {
    const updatedLocations = locations.map(location => 
      location.id === locationId 
        ? { ...location, isActive: !location.isActive }
        : location
    );
    saveLocations(updatedLocations);
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return ArchiveBoxIcon;
      case 'workshop': return CubeIcon;
      case 'storage': return BuildingOffice2Icon;
      case 'showroom': return HomeIcon;
      case 'office': return UsersIcon;
      default: return MapPinIcon;
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'warehouse': return 'blue';
      case 'workshop': return 'green';
      case 'storage': return 'purple';
      case 'showroom': return 'orange';
      case 'office': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return <div className="p-8">Loading locations...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="admin" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Location Setup"
        subtitle="Manage warehouses, workshops, and storage facilities"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              ADMIN ONLY
            </span>
            <button
              onClick={() => {
                setEditingLocation(null);
                setShowLocationForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Location
            </button>
          </div>
        }
        summaryCards={
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Locations</p>
                  <p className="text-2xl font-bold text-blue-900">{locations.length}</p>
                </div>
                <MapPinIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Locations</p>
                  <p className="text-2xl font-bold text-green-900">{locations.filter(l => l.isActive).length}</p>
                </div>
                <CheckIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Avg Utilization</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {Math.round(locations.reduce((sum, l) => sum + l.currentUtilization, 0) / locations.length || 0)}%
                  </p>
                </div>
                <ArchiveBoxIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Capacity</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {locations.reduce((sum, l) => sum + l.capacity, 0).toLocaleString()} sqm
                  </p>
                </div>
                <BuildingOffice2Icon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Location Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => {
            const IconComponent = getLocationTypeIcon(location.type);
            const colorClass = getLocationTypeColor(location.type);
            
            return (
              <div key={location.id} className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow ${
                !location.isActive ? 'opacity-60' : ''
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      colorClass === 'blue' ? 'bg-blue-100' :
                      colorClass === 'green' ? 'bg-green-100' :
                      colorClass === 'purple' ? 'bg-purple-100' :
                      colorClass === 'orange' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        colorClass === 'blue' ? 'text-blue-600' :
                        colorClass === 'green' ? 'text-green-600' :
                        colorClass === 'purple' ? 'text-purple-600' :
                        colorClass === 'orange' ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        {location.name}
                        {location.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingLocation(location);
                        setShowLocationForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit location"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    {!location.isDefault && (
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete location"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <div className="text-sm text-gray-900">
                    {location.address}
                  </div>
                  <div className="text-sm text-gray-600">
                    {location.city}, {location.state} {location.postalCode}
                  </div>
                </div>

                {/* Capacity & Utilization */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Capacity Utilization</span>
                    <span>{location.currentUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        location.currentUtilization > 90 ? 'bg-red-500' :
                        location.currentUtilization > 75 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${location.currentUtilization}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {location.capacity} sqm total capacity
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 text-sm">
                  <div className="text-gray-900 font-medium">{location.contactPerson}</div>
                  <div className="text-gray-600">{location.contactPhone}</div>
                  <div className="text-gray-600">{location.contactEmail}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleLocationStatus(location.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {location.isActive ? 'Active' : 'Inactive'}
                  </button>
                  {!location.isDefault && (
                    <button
                      onClick={() => setDefaultLocation(location.id)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                    >
                      Set Default
                    </button>
                  )}
                </div>

                {/* Notes */}
                {location.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{location.notes}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Location Card */}
          <div 
            onClick={() => {
              setEditingLocation(null);
              setShowLocationForm(true);
            }}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center"
          >
            <div className="text-center">
              <PlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Add New Location</h4>
              <p className="text-sm text-gray-600">Create a new warehouse, workshop, or storage facility</p>
            </div>
          </div>
        </div>

        {/* Location Usage Analytics */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Location Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Location Types */}
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <ArchiveBoxIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-900">
                {locations.filter(l => l.type === 'warehouse').length}
              </div>
              <div className="text-sm text-blue-700">Warehouses</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <CubeIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-900">
                {locations.filter(l => l.type === 'workshop').length}
              </div>
              <div className="text-sm text-green-700">Workshops</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <BuildingOffice2Icon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-900">
                {locations.filter(l => l.type === 'storage').length}
              </div>
              <div className="text-sm text-purple-700">Storage Areas</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <HomeIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-900">
                {locations.filter(l => l.type === 'showroom').length}
              </div>
              <div className="text-sm text-orange-700">Showrooms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Form Modal */}
      {showLocationForm && (
        <LocationForm
          location={editingLocation}
          onSave={(location) => {
            if (editingLocation) {
              // Update existing
              const updatedLocations = locations.map(l => 
                l.id === editingLocation.id 
                  ? { ...location, id: editingLocation.id, createdAt: editingLocation.createdAt, updatedAt: new Date() }
                  : l
              );
              saveLocations(updatedLocations);
            } else {
              // Create new
              const newLocation = {
                ...location,
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              saveLocations([...locations, newLocation]);
            }
            setShowLocationForm(false);
            setEditingLocation(null);
          }}
          onCancel={() => {
            setShowLocationForm(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
}

// Location Form Component
function LocationForm({ location, onSave, onCancel }: {
  location: Location | null;
  onSave: (location: Partial<Location>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || 'warehouse' as Location['type'],
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    postalCode: location?.postalCode || '',
    country: location?.country || 'Australia',
    contactPerson: location?.contactPerson || '',
    contactPhone: location?.contactPhone || '',
    contactEmail: location?.contactEmail || '',
    capacity: location?.capacity || 100,
    currentUtilization: location?.currentUtilization || 0,
    notes: location?.notes || '',
    isActive: location?.isActive ?? true,
    isDefault: location?.isDefault || false
  });

  const handleSave = () => {
    if (!formData.name || !formData.address || !formData.city) {
      alert('Please fill in required fields: Name, Address, and City');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {location ? 'Edit Location' : 'Add New Location'}
                </h3>
                <p className="text-gray-600 mt-1">Configure warehouse, workshop, or storage facility</p>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Main Warehouse, Workshop A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Location['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="workshop">Workshop</option>
                      <option value="storage">Storage</option>
                      <option value="showroom">Showroom</option>
                      <option value="office">Office</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Address</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Industrial Drive"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Sydney"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="NSW"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="2000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Manager name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+61 2 1234 5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="location@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Capacity & Settings */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Storage Capacity (sqm)</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Utilization (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.currentUtilization}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentUtilization: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="65"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this location..."
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Location is active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Set as default location</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {location ? 'Update Location' : 'Save Location'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}