import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { DragDropScheduler } from './DragDropScheduler';
import { CrewManagement } from './CrewManagement';
import { PerformanceAnalytics } from './PerformanceAnalytics';

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  status: 'PLANNED' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  estimatedDuration?: number;
  address?: any;
  skillsRequired: string[];
  equipmentRequired: string[];
  completionPercentage: number;
  tasksCount: number;
  timeEntriesCount: number;
  messagesCount: number;
  crewAssigned?: string[];
}

interface CrewMember {
  id: string;
  name: string;
  skills: string[];
  isActive: boolean;
  currentJob?: string;
}

interface ScheduleEvent {
  id: string;
  jobId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedCrewIds: string[];
  job: {
    title: string;
    customer: { name: string };
  };
}

export function JobSchedulingDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scheduler' | 'jobs' | 'crew' | 'reports'>('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobs([
        {
          id: '1',
          jobNumber: 'JOB-2024-0001',
          title: 'Kitchen Installation - Smith Residence',
          customer: {
            id: 'cust1',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '0412 345 678'
          },
          status: 'SCHEDULED',
          priority: 'HIGH',
          scheduledStartDate: new Date(2024, 8, 25, 9, 0),
          scheduledEndDate: new Date(2024, 8, 25, 17, 0),
          estimatedDuration: 480,
          skillsRequired: ['plumbing', 'electrical', 'carpentry'],
          equipmentRequired: ['drill', 'saw', 'measuring tools'],
          completionPercentage: 0,
          tasksCount: 8,
          timeEntriesCount: 0,
          messagesCount: 3,
          crewAssigned: ['crew1', 'crew2']
        },
        {
          id: '2',
          jobNumber: 'JOB-2024-0002',
          title: 'Bathroom Renovation - Jones Property',
          customer: {
            id: 'cust2',
            name: 'Sarah Jones',
            email: 'sarah@example.com',
            phone: '0423 456 789'
          },
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          scheduledStartDate: new Date(2024, 8, 24, 8, 0),
          scheduledEndDate: new Date(2024, 8, 26, 16, 0),
          estimatedDuration: 1440,
          skillsRequired: ['plumbing', 'tiling'],
          equipmentRequired: ['tile cutter', 'grout tools'],
          completionPercentage: 45,
          tasksCount: 12,
          timeEntriesCount: 8,
          messagesCount: 7,
          crewAssigned: ['crew3']
        }
      ]);

      setCrewMembers([
        {
          id: 'crew1',
          name: 'Mike Johnson',
          skills: ['plumbing', 'electrical'],
          isActive: true,
          currentJob: '1'
        },
        {
          id: 'crew2',
          name: 'Tom Wilson',
          skills: ['carpentry', 'general'],
          isActive: true,
          currentJob: '1'
        },
        {
          id: 'crew3',
          name: 'Dave Brown',
          skills: ['plumbing', 'tiling'],
          isActive: true,
          currentJob: '2'
        },
        {
          id: 'crew4',
          name: 'Steve Davis',
          skills: ['electrical', 'general'],
          isActive: true
        }
      ]);

      setTodayEvents([
        {
          id: 'event1',
          jobId: '2',
          title: 'Continue Bathroom Renovation',
          startTime: new Date(2024, 8, 24, 8, 0),
          endTime: new Date(2024, 8, 24, 16, 0),
          status: 'IN_PROGRESS',
          assignedCrewIds: ['crew3'],
          job: {
            title: 'Bathroom Renovation - Jones Property',
            customer: { name: 'Sarah Jones' }
          }
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600';
      case 'NORMAL': return 'text-blue-600';
      case 'HIGH': return 'text-orange-600';
      case 'URGENT': return 'text-red-600';
      case 'EMERGENCY': return 'text-red-800 font-bold';
      default: return 'text-gray-600';
    }
  };

  const getStatsData = () => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const activeJobs = jobs.filter(j => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(j.status)).length;
    const overdueJobs = jobs.filter(j => 
      j.scheduledEndDate && 
      new Date(j.scheduledEndDate) < new Date() && 
      j.status !== 'COMPLETED'
    ).length;
    const activeCrew = crewMembers.filter(c => c.isActive && c.currentJob).length;
    const availableCrew = crewMembers.filter(c => c.isActive && !c.currentJob).length;

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      overdueJobs,
      activeCrew,
      availableCrew,
      completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0
    };
  };

  const stats = getStatsData();

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Active Jobs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeJobs}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Active Crew</div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeCrew}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Completion Rate</div>
              <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Overdue Jobs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.overdueJobs}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
        </div>
        <div className="p-6">
          {todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs scheduled for today</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by scheduling a job.</p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Schedule Job
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{event.job.title}</h4>
                      <p className="text-sm text-gray-500">{event.job.customer.name}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.replace('_', ' ')}
                      </span>
                      <div className="mt-2 text-sm text-gray-500">
                        Crew: {event.assignedCrewIds.length} members
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
            <button
              onClick={() => setActiveTab('jobs')}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all <ArrowRightIcon className="inline h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.slice(0, 5).map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.jobNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${job.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{job.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.scheduledStartDate ? 
                      job.scheduledStartDate.toLocaleDateString() : 
                      'Not scheduled'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <button
              onClick={() => navigate('/jobs/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Job
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.jobNumber}</div>
                      <div className="text-xs text-gray-400">
                        Tasks: {job.tasksCount} | Time entries: {job.timeEntriesCount}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{job.customer.name}</div>
                      {job.customer.phone && (
                        <div className="text-sm text-gray-500">{job.customer.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 w-16">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${job.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{job.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.scheduledStartDate ? (
                      <div>
                        <div>{job.scheduledStartDate.toLocaleDateString()}</div>
                        <div className="text-xs">{job.scheduledStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ) : (
                      'Not scheduled'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.crewAssigned && job.crewAssigned.length > 0 ? (
                      <div className="text-sm text-gray-900">
                        {job.crewAssigned.length} assigned
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <UniversalHeader
          title="Job Scheduling"
          subtitle="Manage field operations and crew scheduling"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                  { id: 'scheduler', name: 'Scheduler', icon: CalendarIcon },
                  { id: 'jobs', name: 'Jobs', icon: MapPinIcon },
                  { id: 'crew', name: 'Crew Management', icon: UserGroupIcon },
                  { id: 'reports', name: 'Reports', icon: ChartBarIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              <DragDropScheduler
                onEventUpdate={(event) => {
                  console.log('Event updated:', event);
                  // TODO: Call API to update event
                }}
                onEventCreate={(event) => {
                  console.log('Event created:', event);
                  // TODO: Call API to create event
                }}
                onEventDelete={(eventId) => {
                  console.log('Event deleted:', eventId);
                  // TODO: Call API to delete event
                }}
              />
            </div>
          )}
          {activeTab === 'crew' && (
            <CrewManagement
              onCrewUpdate={(crew) => {
                console.log('Crew updated:', crew);
                // TODO: Call API to update crew member
              }}
              onCrewCreate={(crew) => {
                console.log('Crew created:', crew);
                // TODO: Call API to create crew member
              }}
              onCrewDelete={(crewId) => {
                console.log('Crew deleted:', crewId);
                // TODO: Call API to delete crew member
              }}
            />
          )}
          {activeTab === 'reports' && <PerformanceAnalytics />}
        </main>
      </div>
    </div>
  );
}