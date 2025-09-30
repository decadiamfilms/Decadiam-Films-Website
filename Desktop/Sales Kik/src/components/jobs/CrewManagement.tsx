import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  CogIcon,
  EyeIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { format, addDays, parseISO } from 'date-fns';

interface CrewMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  certifications: Certification[];
  licenseNumber?: string;
  licenseExpiry?: Date;
  workingHours: WorkingHours;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  vehicleType?: string;
  vehicleCapacity?: any;
  equipmentAccess: string[];
  productivityRate: number;
  qualityRating: number;
  customerRating: number;
  isActive: boolean;
  hireDate?: Date;
  currentJob?: {
    id: string;
    title: string;
    endTime: Date;
  };
  upcomingJobs: number;
  totalHoursThisWeek: number;
}

interface Certification {
  name: string;
  issuer: string;
  expiryDate: Date;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED';
}

interface WorkingHours {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

interface CrewManagementProps {
  onCrewUpdate?: (crew: CrewMember) => void;
  onCrewCreate?: (crew: Partial<CrewMember>) => void;
  onCrewDelete?: (crewId: string) => void;
}

export function CrewManagement({ onCrewUpdate, onCrewCreate, onCrewDelete }: CrewManagementProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [filteredCrew, setFilteredCrew] = useState<CrewMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'available' | 'busy'>('all');
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableSkills] = useState([
    'plumbing', 'electrical', 'carpentry', 'painting', 'tiling', 'roofing', 
    'HVAC', 'landscaping', 'general', 'glazing', 'welding', 'demolition'
  ]);

  // Mock data - in production this would come from API
  useEffect(() => {
    const mockCrewMembers: CrewMember[] = [
      {
        id: 'crew1',
        name: 'Mike Johnson',
        email: 'mike@company.com',
        phone: '0412 345 678',
        skills: ['plumbing', 'electrical'],
        certifications: [
          {
            name: 'Electrical License',
            issuer: 'ESV',
            expiryDate: new Date(2025, 5, 15),
            status: 'VALID'
          },
          {
            name: 'Plumbing Certificate',
            issuer: 'PVC',
            expiryDate: new Date(2024, 11, 30),
            status: 'EXPIRING'
          }
        ],
        licenseNumber: 'EL12345',
        licenseExpiry: new Date(2025, 5, 15),
        workingHours: {
          monday: { start: '07:00', end: '17:00', available: true },
          tuesday: { start: '07:00', end: '17:00', available: true },
          wednesday: { start: '07:00', end: '17:00', available: true },
          thursday: { start: '07:00', end: '17:00', available: true },
          friday: { start: '07:00', end: '15:00', available: true },
          saturday: { start: '08:00', end: '12:00', available: false },
          sunday: { start: '00:00', end: '00:00', available: false }
        },
        maxHoursPerDay: 10,
        maxHoursPerWeek: 40,
        vehicleType: 'Van',
        equipmentAccess: ['drill', 'saw', 'multimeter', 'pipe wrench'],
        productivityRate: 1.2,
        qualityRating: 4.8,
        customerRating: 4.9,
        isActive: true,
        hireDate: new Date(2020, 2, 15),
        currentJob: {
          id: 'job1',
          title: 'Kitchen Installation - Smith Residence',
          endTime: new Date(2024, 8, 25, 17, 0)
        },
        upcomingJobs: 3,
        totalHoursThisWeek: 32
      },
      {
        id: 'crew2',
        name: 'Tom Wilson',
        email: 'tom@company.com',
        phone: '0423 456 789',
        skills: ['carpentry', 'general', 'painting'],
        certifications: [
          {
            name: 'Working at Heights',
            issuer: 'SafeWork',
            expiryDate: new Date(2024, 10, 20),
            status: 'EXPIRING'
          }
        ],
        workingHours: {
          monday: { start: '06:00', end: '16:00', available: true },
          tuesday: { start: '06:00', end: '16:00', available: true },
          wednesday: { start: '06:00', end: '16:00', available: true },
          thursday: { start: '06:00', end: '16:00', available: true },
          friday: { start: '06:00', end: '14:00', available: true },
          saturday: { start: '08:00', end: '16:00', available: true },
          sunday: { start: '00:00', end: '00:00', available: false }
        },
        maxHoursPerDay: 10,
        maxHoursPerWeek: 45,
        vehicleType: 'Truck',
        equipmentAccess: ['saw', 'nail gun', 'sanders', 'measuring tools'],
        productivityRate: 1.1,
        qualityRating: 4.6,
        customerRating: 4.7,
        isActive: true,
        hireDate: new Date(2019, 8, 10),
        upcomingJobs: 2,
        totalHoursThisWeek: 28
      },
      {
        id: 'crew3',
        name: 'Dave Brown',
        email: 'dave@company.com',
        phone: '0434 567 890',
        skills: ['plumbing', 'tiling', 'general'],
        certifications: [
          {
            name: 'Plumbing License',
            issuer: 'PVC',
            expiryDate: new Date(2026, 3, 10),
            status: 'VALID'
          },
          {
            name: 'First Aid',
            issuer: 'Red Cross',
            expiryDate: new Date(2024, 0, 15),
            status: 'EXPIRED'
          }
        ],
        workingHours: {
          monday: { start: '08:00', end: '16:00', available: true },
          tuesday: { start: '08:00', end: '16:00', available: true },
          wednesday: { start: '08:00', end: '16:00', available: true },
          thursday: { start: '08:00', end: '16:00', available: true },
          friday: { start: '08:00', end: '16:00', available: true },
          saturday: { start: '00:00', end: '00:00', available: false },
          sunday: { start: '00:00', end: '00:00', available: false }
        },
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        vehicleType: 'Car',
        equipmentAccess: ['tile cutter', 'grout tools', 'pipe cutter'],
        productivityRate: 0.9,
        qualityRating: 4.9,
        customerRating: 4.8,
        isActive: true,
        hireDate: new Date(2021, 1, 20),
        currentJob: {
          id: 'job2',
          title: 'Bathroom Renovation - Jones Property',
          endTime: new Date(2024, 8, 24, 16, 0)
        },
        upcomingJobs: 1,
        totalHoursThisWeek: 40
      }
    ];

    setCrewMembers(mockCrewMembers);
    setFilteredCrew(mockCrewMembers);
  }, []);

  // Filter crew members
  useEffect(() => {
    let filtered = crewMembers.filter(crew => {
      const matchesSearch = crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           crew.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           crew.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSkill = !skillFilter || crew.skills.includes(skillFilter);
      
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'active' && crew.isActive) ||
                           (statusFilter === 'inactive' && !crew.isActive) ||
                           (statusFilter === 'available' && crew.isActive && !crew.currentJob) ||
                           (statusFilter === 'busy' && crew.isActive && crew.currentJob);
      
      return matchesSearch && matchesSkill && matchesStatus;
    });

    setFilteredCrew(filtered);
  }, [crewMembers, searchTerm, skillFilter, statusFilter]);

  const getAvailabilityStatus = (crew: CrewMember) => {
    if (!crew.isActive) return { status: 'inactive', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (crew.currentJob) return { status: 'busy', color: 'text-red-600', bg: 'bg-red-100' };
    if (crew.totalHoursThisWeek >= crew.maxHoursPerWeek) return { status: 'maxed', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'available', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getCertificationStatus = (certifications: Certification[]) => {
    const expired = certifications.filter(c => c.status === 'EXPIRED').length;
    const expiring = certifications.filter(c => c.status === 'EXPIRING').length;
    
    if (expired > 0) return { status: 'expired', color: 'text-red-600', icon: ExclamationTriangleIcon };
    if (expiring > 0) return { status: 'expiring', color: 'text-orange-600', icon: ExclamationTriangleIcon };
    return { status: 'valid', color: 'text-green-600', icon: CheckBadgeIcon };
  };

  const renderCrewCard = (crew: CrewMember) => {
    const availability = getAvailabilityStatus(crew);
    const certStatus = getCertificationStatus(crew.certifications);
    const StatusIcon = certStatus.icon;

    return (
      <div key={crew.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {crew.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{crew.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {crew.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      {crew.email}
                    </div>
                  )}
                  {crew.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {crew.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availability.bg} ${availability.color}`}>
                {availability.status}
              </span>
              <button
                onClick={() => setSelectedCrew(crew)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <StatusIcon className={`w-4 h-4 mr-1 ${certStatus.color}`} />
                <span className={certStatus.color}>
                  {crew.certifications.length} certifications
                </span>
              </div>
              <div className="flex items-center text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                {crew.totalHoursThisWeek}h / {crew.maxHoursPerWeek}h this week
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Skills:</div>
              <div className="flex flex-wrap gap-1">
                {crew.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {crew.currentJob && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                <div className="text-sm font-medium text-yellow-800">Currently working on:</div>
                <div className="text-sm text-yellow-700">{crew.currentJob.title}</div>
                <div className="text-xs text-yellow-600">
                  Until {format(crew.currentJob.endTime, 'MMM d, HH:mm')}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 mr-1 text-yellow-400" />
                  {crew.qualityRating.toFixed(1)} quality
                </div>
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 mr-1 text-yellow-400" />
                  {crew.customerRating.toFixed(1)} customer
                </div>
                <div>
                  {crew.upcomingJobs} upcoming jobs
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedCrew(crew);
                    setShowCrewModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to deactivate ${crew.name}?`)) {
                      // Handle deactivation
                    }
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCrewDetailModal = () => {
    if (!selectedCrew) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCrew.name} - Details
              </h2>
              <button
                onClick={() => setSelectedCrew(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span>{selectedCrew.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span>{selectedCrew.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span>Hired: {selectedCrew.hireDate ? format(selectedCrew.hireDate, 'MMM d, yyyy') : 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Productivity Rate:</span>
                    <span className="font-medium">{selectedCrew.productivityRate.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Rating:</span>
                    <span className="font-medium">{selectedCrew.qualityRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Rating:</span>
                    <span className="font-medium">{selectedCrew.customerRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hours this week:</span>
                    <span className="font-medium">{selectedCrew.totalHoursThisWeek}h / {selectedCrew.maxHoursPerWeek}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills and Equipment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Equipment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrew.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Equipment Access:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrew.equipmentAccess.map((equipment, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications & Licenses</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {selectedCrew.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-sm text-gray-600">Issued by: {cert.issuer}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          cert.status === 'VALID' ? 'text-green-600' :
                          cert.status === 'EXPIRING' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {cert.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          Expires: {format(cert.expiryDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-7 gap-2 text-center">
                  {Object.entries(selectedCrew.workingHours).map(([day, hours]) => (
                    <div key={day} className="p-2">
                      <div className="text-sm font-medium text-gray-700 capitalize mb-1">
                        {day.substring(0, 3)}
                      </div>
                      {hours.available ? (
                        <div className="text-xs text-gray-600">
                          {hours.start} - {hours.end}
                        </div>
                      ) : (
                        <div className="text-xs text-red-600">Unavailable</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setSelectedCrew(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowCrewModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Crew Management</h2>
            <p className="text-gray-600">Manage team members, skills, and availability</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Add Crew Member
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search crew members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Skills</option>
              {availableSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredCrew.length} of {crewMembers.length} crew members
          </div>
        </div>
      </div>

      {/* Crew Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrew.map(crew => renderCrewCard(crew))}
      </div>

      {/* Crew Detail Modal */}
      {selectedCrew && renderCrewDetailModal()}

      {/* Empty State */}
      {filteredCrew.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No crew members found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || skillFilter || statusFilter !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first crew member.'
            }
          </p>
          {(!searchTerm && !skillFilter && statusFilter === 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add First Crew Member
            </button>
          )}
        </div>
      )}
    </div>
  );
}