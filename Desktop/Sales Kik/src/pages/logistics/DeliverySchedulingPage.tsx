import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import {
  TruckIcon, MapIcon, ClockIcon, PlusIcon, CalendarIcon,
  UserGroupIcon, CogIcon, ExclamationTriangleIcon,
  CheckCircleIcon, XCircleIcon, BuildingOfficeIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import DeliveryRunCreationWizard from '../../components/logistics/DeliveryRunCreationWizard';
import DeliveryCalendar from '../../components/logistics/DeliveryCalendar';
import DeliveryRunDetailsModal from '../../components/logistics/DeliveryRunDetailsModal';
import DeliveryTrackingModal from '../../components/logistics/DeliveryTrackingModal';
import DeliveryRunEditModal from '../../components/logistics/DeliveryRunEditModal';

interface DeliveryRun {
  id: string;
  runNumber: string;
  runName: string;
  plannedDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    registration: string;
    type: string;
  };
  totalStops: number;
  totalDistance: number;
  estimatedDuration: number;
  startTime?: string;
  deliveries: DeliveryStop[];
}

interface DeliveryStop {
  id: string;
  sequenceOrder: number;
  customerName: string;
  deliveryAddress: string;
  scheduledTime?: string;
  estimatedArrival?: string;
  unloadingTime: number;
  status: 'PLANNED' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'FAILED';
  specialInstructions?: string;
}

const DeliverySchedulingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'calendar'>('overview');
  const [loading, setLoading] = useState(false);
  const [deliveryRuns, setDeliveryRuns] = useState<DeliveryRun[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<DeliveryRun | null>(null);

  // Load real delivery runs from localStorage
  useEffect(() => {
    const storedRuns = localStorage.getItem('saleskik-delivery-runs');
    if (storedRuns) {
      const runs = JSON.parse(storedRuns);
      setDeliveryRuns(runs);
      console.log('✅ Loaded', runs.length, 'delivery runs from storage');
    } else {
      // Start with empty runs
      setDeliveryRuns([]);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'EN_ROUTE': return 'bg-purple-100 text-purple-800';
      case 'ARRIVED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const viewDeliveryRun = (runId: string) => {
    const run = deliveryRuns.find(r => r.id === runId);
    if (run) {
      setSelectedRun(run);
      setShowDetailsModal(true);
      console.log('📋 Opening delivery run details for:', run.runNumber);
    }
  };

  const trackDeliveryRun = (runId: string) => {
    const run = deliveryRuns.find(r => r.id === runId);
    if (run) {
      setSelectedRun(run);
      setShowTrackingModal(true);
      console.log('🗺️ Opening delivery tracking for:', run.runNumber);
    }
  };

  const editDeliveryRun = (runId: string) => {
    const run = deliveryRuns.find(r => r.id === runId);
    if (run) {
      setSelectedRun(run);
      setShowEditModal(true);
      console.log('✏️ Opening edit modal for:', run.runNumber);
    }
  };

  const deleteDeliveryRun = (runId: string) => {
    const updatedRuns = deliveryRuns.filter(r => r.id !== runId);
    setDeliveryRuns(updatedRuns);
    
    // Update localStorage
    const storedRuns = localStorage.getItem('saleskik-delivery-runs');
    if (storedRuns) {
      localStorage.setItem('saleskik-delivery-runs', JSON.stringify(updatedRuns));
    }
    
    console.log('🗑️ Delivery run deleted');
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
          title="Delivery Scheduling"
          showMenuButton={true}
          onMenuClick={() => setShowSidebar(true)}
          className="bg-white border-b border-gray-200"
        />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header with Actions */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Delivery Scheduling</h1>
                  <p className="text-gray-600 mt-2">
                    Optimize routes, schedule deliveries, and track performance
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/logistics/fleet-management')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <TruckIcon className="w-5 h-5" />
                    Manage Fleet
                  </button>
                  <button
                    onClick={() => setShowCreateWizard(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    New Delivery Run
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                  { id: 'runs', name: 'Delivery Runs', icon: TruckIcon },
                  { id: 'calendar', name: 'Calendar View', icon: CalendarIcon }
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

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TruckIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Runs</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {deliveryRuns.filter(run => run.status === 'IN_PROGRESS').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Planned Today</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {deliveryRuns.filter(run => run.status === 'PLANNED').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MapIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Distance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {deliveryRuns.reduce((sum, run) => sum + run.totalDistance, 0).toFixed(1)}km
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-8 w-8 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Est. Duration</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(deliveryRuns.reduce((sum, run) => sum + run.estimatedDuration, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Runs Quick View */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Today's Delivery Runs</h3>
                  </div>
                  <div className="p-6">
                    {deliveryRuns.length === 0 ? (
                      <div className="text-center py-8">
                        <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery runs scheduled</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first delivery run.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowCreateWizard(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            New Delivery Run
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deliveryRuns.map((run) => (
                          <div key={run.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <TruckIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{run.runName}</h4>
                                  <p className="text-sm text-gray-500">{run.runNumber}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status)}`}>
                                  {run.status}
                                </span>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">{run.totalStops} stops</p>
                                  <p className="text-sm text-gray-500">{run.totalDistance}km • {formatDuration(run.estimatedDuration)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Runs Tab */}
            {activeTab === 'runs' && (
              <div className="space-y-6">
                {/* Date Filter */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Filter by Date</h3>
                      <p className="text-sm text-gray-500">View delivery runs for specific dates</p>
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Delivery Runs List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Delivery Runs</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Run Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Driver & Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Route Info
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
                        {deliveryRuns.map((run) => (
                          <tr key={run.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{run.runName}</div>
                                <div className="text-sm text-gray-500">{run.runNumber}</div>
                                <div className="text-sm text-gray-500">Start: {run.startTime}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{run.driver.name}</div>
                                <div className="text-sm text-gray-500">{run.driver.phone}</div>
                                <div className="text-sm text-gray-500">{run.vehicle.registration} ({run.vehicle.type})</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm text-gray-900">{run.totalStops} stops</div>
                                <div className="text-sm text-gray-500">{run.totalDistance}km</div>
                                <div className="text-sm text-gray-500">{formatDuration(run.estimatedDuration)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status)}`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => viewDeliveryRun(run.id)}
                                  className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm rounded hover:bg-blue-50"
                                >
                                  View
                                </button>
                                <button 
                                  onClick={() => trackDeliveryRun(run.id)}
                                  className="text-green-600 hover:text-green-900 px-2 py-1 text-sm rounded hover:bg-green-50"
                                >
                                  Track
                                </button>
                                <button 
                                  onClick={() => editDeliveryRun(run.id)}
                                  className="text-amber-600 hover:text-amber-900 px-2 py-1 text-sm rounded hover:bg-amber-50"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Delete delivery run ${run.runNumber}? This cannot be undone.`)) {
                                      deleteDeliveryRun(run.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 px-2 py-1 text-sm rounded hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <DeliveryCalendar
                  onCreateNewRun={(date) => {
                    setPlannedDate(date);
                    setShowCreateWizard(true);
                  }}
                  onViewRun={(runId) => {
                    viewDeliveryRun(runId);
                  }}
                  key={deliveryRuns.length} // Force refresh when runs change
                />
              </div>
            )}

            
          </div>
        </div>

        {/* Delivery Run Creation Wizard */}
        <DeliveryRunCreationWizard
          isOpen={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          onRunCreated={(newRun) => {
            setDeliveryRuns(prev => [newRun, ...prev]);
            setShowCreateWizard(false);
          }}
        />

        {/* Delivery Run Details Modal */}
        <DeliveryRunDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRun(null);
          }}
          deliveryRun={selectedRun}
          onEdit={(runId) => {
            setShowDetailsModal(false);
            editDeliveryRun(runId);
          }}
          onTrack={(runId) => {
            setShowDetailsModal(false);
            trackDeliveryRun(runId);
          }}
        />

        {/* Delivery Tracking Modal */}
        <DeliveryTrackingModal
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedRun(null);
          }}
          deliveryRun={selectedRun}
        />

        {/* Delivery Run Edit Modal */}
        <DeliveryRunEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRun(null);
          }}
          deliveryRun={selectedRun}
          onSave={(updatedRun) => {
            const updatedRuns = deliveryRuns.map(r => 
              r.id === updatedRun.id ? updatedRun : r
            );
            setDeliveryRuns(updatedRuns);
            setShowEditModal(false);
            setSelectedRun(null);
          }}
          onDelete={(runId) => {
            deleteDeliveryRun(runId);
            setShowEditModal(false);
            setSelectedRun(null);
          }}
        />
      </div>
    </div>
  );
};

export default DeliverySchedulingPage;