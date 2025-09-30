import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  MapIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { format, differenceInMinutes, isToday, addHours } from 'date-fns';

interface JobTask {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  estimatedMinutes: number;
  actualMinutes?: number;
  requiredSkills: string[];
  startedAt?: Date;
  completedAt?: Date;
  photos: string[];
  notes?: string;
}

interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  breakDuration?: number;
  isActive: boolean;
}

interface TodayJob {
  id: string;
  title: string;
  jobNumber: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
  address: {
    street: string;
    suburb: string;
    postcode: string;
    instructions?: string;
    gateCodes?: string;
    parking?: string;
  };
  scheduledStart: Date;
  scheduledEnd: Date;
  estimatedDuration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  tasks: JobTask[];
  specialInstructions?: string;
  equipmentRequired: string[];
  safetyNotes?: string;
  completionPercentage: number;
}

export function FieldWorkerDashboard() {
  const navigate = useNavigate();
  const [todayJobs, setTodayJobs] = useState<TodayJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TodayJob | null>(null);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [currentView, setCurrentView] = useState<'today' | 'job-detail' | 'time-tracking'>('today');
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Mock data for field worker
  useEffect(() => {
    const mockJobs: TodayJob[] = [
      {
        id: 'job1',
        title: 'Kitchen Installation - Smith Residence',
        jobNumber: 'JOB-2024-0001',
        customer: {
          name: 'John Smith',
          phone: '0412 345 678',
          email: 'john.smith@email.com'
        },
        address: {
          street: '123 Main Street',
          suburb: 'Northcote',
          postcode: '3070',
          instructions: 'Ring doorbell twice. Dog friendly - Golden Retriever named Max.',
          gateCodes: 'Front gate: 1234',
          parking: 'Park in driveway. Avoid blocking garage.'
        },
        scheduledStart: new Date(2024, 8, 25, 9, 0),
        scheduledEnd: new Date(2024, 8, 25, 17, 0),
        estimatedDuration: 480,
        status: 'CONFIRMED',
        priority: 'HIGH',
        tasks: [
          {
            id: 'task1',
            title: 'Remove existing cabinets',
            description: 'Carefully remove old kitchen cabinets and dispose of properly',
            status: 'PENDING',
            estimatedMinutes: 120,
            requiredSkills: ['general', 'demolition'],
            photos: []
          },
          {
            id: 'task2',
            title: 'Install plumbing connections',
            description: 'Connect water supply and drainage for new sink location',
            status: 'PENDING',
            estimatedMinutes: 90,
            requiredSkills: ['plumbing'],
            photos: []
          },
          {
            id: 'task3',
            title: 'Install electrical outlets',
            description: 'Add new power points for kitchen appliances',
            status: 'PENDING',
            estimatedMinutes: 60,
            requiredSkills: ['electrical'],
            photos: []
          },
          {
            id: 'task4',
            title: 'Install base cabinets',
            description: 'Mount and align new base kitchen cabinets',
            status: 'PENDING',
            estimatedMinutes: 150,
            requiredSkills: ['carpentry'],
            photos: []
          },
          {
            id: 'task5',
            title: 'Install countertops',
            description: 'Measure, cut and install stone countertops',
            status: 'PENDING',
            estimatedMinutes: 120,
            requiredSkills: ['stone work'],
            photos: []
          }
        ],
        specialInstructions: 'Customer works from home. Please keep noise to minimum before 9am and after 5pm.',
        equipmentRequired: ['drill', 'saw', 'level', 'measuring tape', 'safety equipment'],
        safetyNotes: 'Asbestos check completed - all clear. Wear safety glasses when cutting.',
        completionPercentage: 0
      }
    ];

    setTodayJobs(mockJobs);
    setSelectedJob(mockJobs[0]);
    setLoading(false);
  }, []);

  // Get current location (mock for now)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  const startTimeTracking = (job: TodayJob) => {
    const newTimeEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      startTime: new Date(),
      isActive: true
    };
    setActiveTimeEntry(newTimeEntry);
  };

  const stopTimeTracking = () => {
    if (activeTimeEntry) {
      setActiveTimeEntry({
        ...activeTimeEntry,
        endTime: new Date(),
        isActive: false
      });
    }
  };

  const markTaskComplete = (taskId: string) => {
    if (selectedJob) {
      const updatedTasks = selectedJob.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              status: 'COMPLETED' as const,
              completedAt: new Date(),
              actualMinutes: task.estimatedMinutes // Mock actual time
            }
          : task
      );
      
      const completedTasks = updatedTasks.filter(t => t.status === 'COMPLETED').length;
      const completionPercentage = Math.round((completedTasks / updatedTasks.length) * 100);
      
      const updatedJob = {
        ...selectedJob,
        tasks: updatedTasks,
        completionPercentage
      };
      
      setSelectedJob(updatedJob);
      setTodayJobs(prev => prev.map(job => job.id === selectedJob.id ? updatedJob : job));
    }
  };

  const startTask = (taskId: string) => {
    if (selectedJob) {
      const updatedTasks = selectedJob.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              status: 'IN_PROGRESS' as const,
              startedAt: new Date()
            }
          : task
      );
      
      setSelectedJob({
        ...selectedJob,
        tasks: updatedTasks
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'SKIPPED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'border-l-green-500';
      case 'NORMAL': return 'border-l-blue-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'URGENT': return 'border-l-red-500';
      case 'EMERGENCY': return 'border-l-red-700';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Today's Jobs View
  if (currentView === 'today') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Today's Jobs</h1>
              <p className="text-sm text-gray-600">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {todayJobs.length} job{todayJobs.length !== 1 ? 's' : ''}
              </div>
              {activeTimeEntry && (
                <div className="text-sm font-medium text-green-600">
                  Timer Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="p-4 space-y-4">
          {todayJobs.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <ClockIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs scheduled today</h3>
              <p className="text-gray-500">Enjoy your day off or check with dispatch for updates.</p>
            </div>
          ) : (
            todayJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setCurrentView('job-detail');
                }}
                className={`bg-white rounded-lg border-l-4 ${getPriorityColor(job.priority)} shadow-sm p-4 active:bg-gray-50 cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.customer.name}</p>
                    <p className="text-sm text-gray-500">{job.jobNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {job.priority} Priority
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="flex-1">
                    {job.address.street}, {job.address.suburb} {job.address.postcode}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>
                    {format(job.scheduledStart, 'h:mm a')} - {format(job.scheduledEnd, 'h:mm a')}
                    {' '}({Math.round(job.estimatedDuration / 60)}h estimated)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <ListBulletIcon className="w-4 h-4 mr-2" />
                    <span>
                      {job.tasks.filter(t => t.status === 'COMPLETED').length} / {job.tasks.length} tasks
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${job.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{job.completionPercentage}%</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${job.customer.phone}`, '_self');
                    }}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    disabled={!job.customer.phone}
                  >
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    Call Customer
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const address = `${job.address.street}, ${job.address.suburb} ${job.address.postcode}`;
                      const encodedAddress = encodeURIComponent(address);
                      window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
                    }}
                    className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    <MapIcon className="w-4 h-4 mr-1" />
                    Get Directions
                  </button>
                  
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Time Tracking Widget (if active) */}
        {activeTimeEntry && (
          <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Timer Active</div>
                <div className="text-xs opacity-90">
                  Started: {format(activeTimeEntry.startTime, 'h:mm a')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {differenceInMinutes(new Date(), activeTimeEntry.startTime)}m
                </div>
                <button
                  onClick={() => {
                    stopTimeTracking();
                    setCurrentView('time-tracking');
                  }}
                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded"
                >
                  Stop Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Job Detail View
  if (currentView === 'job-detail' && selectedJob) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentView('today')}
              className="text-blue-600 text-sm font-medium"
            >
              ← Back to Jobs
            </button>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
              {selectedJob.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{selectedJob.title}</h1>
            <p className="text-sm text-gray-600">{selectedJob.jobNumber}</p>
          </div>
        </div>

        {/* Job Info */}
        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Details</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">Name:</span>
                <span className="text-sm text-gray-900">{selectedJob.customer.name}</span>
              </div>
              {selectedJob.customer.phone && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">Phone:</span>
                  <button
                    onClick={() => window.open(`tel:${selectedJob.customer.phone}`, '_self')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedJob.customer.phone}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Location</h3>
              <button
                onClick={() => {
                  const address = `${selectedJob.address.street}, ${selectedJob.address.suburb} ${selectedJob.address.postcode}`;
                  const encodedAddress = encodeURIComponent(address);
                  window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Get Directions →
              </button>
            </div>
            <div className="text-sm text-gray-900 mb-2">
              {selectedJob.address.street}<br />
              {selectedJob.address.suburb} {selectedJob.address.postcode}
            </div>
            
            {selectedJob.address.instructions && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <div className="font-medium mb-1">Access Instructions:</div>
                    <div>{selectedJob.address.instructions}</div>
                  </div>
                </div>
              </div>
            )}

            {selectedJob.address.gateCodes && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-md">
                <div className="text-sm text-yellow-700">
                  <div className="font-medium">Gate Codes:</div>
                  <div>{selectedJob.address.gateCodes}</div>
                </div>
              </div>
            )}

            {selectedJob.address.parking && (
              <div className="mt-2 p-3 bg-green-50 rounded-md">
                <div className="text-sm text-green-700">
                  <div className="font-medium">Parking:</div>
                  <div>{selectedJob.address.parking}</div>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">Start:</span>
                <span className="text-sm text-gray-900">{format(selectedJob.scheduledStart, 'h:mm a')}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">End:</span>
                <span className="text-sm text-gray-900">{format(selectedJob.scheduledEnd, 'h:mm a')}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">Duration:</span>
                <span className="text-sm text-gray-900">{Math.round(selectedJob.estimatedDuration / 60)}h estimated</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {(selectedJob.specialInstructions || selectedJob.safetyNotes) && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Important Notes</h3>
              
              {selectedJob.specialInstructions && (
                <div className="mb-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <div className="font-medium mb-1">Special Instructions:</div>
                      <div>{selectedJob.specialInstructions}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.safetyNotes && (
                <div className="p-3 bg-red-50 rounded-md">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <div className="font-medium mb-1">Safety Notes:</div>
                      <div>{selectedJob.safetyNotes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks List */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Tasks</h3>
              <div className="text-xs text-gray-500">
                {selectedJob.tasks.filter(t => t.status === 'COMPLETED').length} / {selectedJob.tasks.length} completed
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedJob.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-3 ${
                    task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {index + 1}. {task.title}
                        </span>
                        {task.status === 'COMPLETED' && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {task.estimatedMinutes}min estimated
                        {task.actualMinutes && (
                          <span className="ml-2">• {task.actualMinutes}min actual</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1 ml-3">
                      {task.status === 'PENDING' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startTask(task.id);
                          }}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markTaskComplete(task.id);
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                        >
                          Complete
                        </button>
                      )}
                      {task.photos.length > 0 && (
                        <div className="text-xs text-gray-500 text-center">
                          {task.photos.length} photo{task.photos.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            {!activeTimeEntry ? (
              <button
                onClick={() => startTimeTracking(selectedJob)}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Start Work Timer
              </button>
            ) : (
              <button
                onClick={() => {
                  stopTimeTracking();
                  setCurrentView('time-tracking');
                }}
                className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Stop Timer & Log Time
              </button>
            )}
            
            <button
              onClick={() => setCurrentView('time-tracking')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              View Time Entries
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg font-medium">
                <PhotoIcon className="w-5 h-5 mr-2" />
                Add Photos
              </button>
              <button className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg font-medium">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Message Office
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Time Tracking View
  if (currentView === 'time-tracking') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('job-detail')}
              className="text-blue-600 text-sm font-medium"
            >
              ← Back to Job
            </button>
            <h1 className="text-lg font-bold text-gray-900">Time Tracking</h1>
            <div></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Timer */}
          {activeTimeEntry && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Current Session</div>
                  <div className="text-xs text-green-600">
                    Started: {format(activeTimeEntry.startTime, 'h:mm a')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-800">
                    {differenceInMinutes(new Date(), activeTimeEntry.startTime)}m
                  </div>
                  <button
                    onClick={stopTimeTracking}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Stop Timer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg">
                <PlayIcon className="w-4 h-4 mr-2" />
                Start Break
              </button>
              <button className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg">
                <PauseIcon className="w-4 h-4 mr-2" />
                Pause Work
              </button>
            </div>
          </div>

          {/* Time Summary */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Work Time:</span>
                <span className="font-medium text-gray-900">6h 45m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Break Time:</span>
                <span className="font-medium text-gray-900">45m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Travel Time:</span>
                <span className="font-medium text-gray-900">30m</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Total Hours:</span>
                <span className="font-bold text-gray-900">8h 0m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}