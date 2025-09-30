import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  CalendarIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: any;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customer: Customer;
  status: string;
  total: number;
  lineItems: any[];
}

interface JobFormData {
  customerId: string;
  quoteId?: string;
  title: string;
  description: string;
  address: any;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  estimatedDuration?: number;
  skillsRequired: string[];
  equipmentRequired: string[];
  accessRequirements: any;
  permitRequired: boolean;
  permitDetails?: string;
  notes?: string;
  internalNotes?: string;
  tasks: JobTask[];
}

interface JobTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  requiredSkills: string[];
  sortOrder: number;
}

export default function NewJobPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableQuotes, setAvailableQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    customerId: '',
    title: '',
    description: '',
    address: {},
    priority: 'NORMAL',
    skillsRequired: [],
    equipmentRequired: [],
    accessRequirements: {},
    permitRequired: false,
    tasks: []
  });

  const availableSkills = [
    'plumbing', 'electrical', 'carpentry', 'painting', 'tiling', 'roofing',
    'HVAC', 'landscaping', 'general', 'glazing', 'welding', 'demolition'
  ];

  const availableEquipment = [
    'drill', 'saw', 'hammer', 'screwdriver', 'measuring tape', 'level',
    'multimeter', 'pipe wrench', 'tile cutter', 'nail gun', 'ladder', 'safety equipment'
  ];

  // Mock data - in production this would come from API
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: 'cust1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '0412 345 678',
        address: {
          street: '123 Main Street',
          suburb: 'Northcote',
          postcode: '3070',
          state: 'VIC'
        }
      },
      {
        id: 'cust2',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        phone: '0423 456 789',
        address: {
          street: '456 Oak Avenue',
          suburb: 'Richmond',
          postcode: '3121',
          state: 'VIC'
        }
      }
    ];

    const mockQuotes: Quote[] = [
      {
        id: 'quote1',
        quoteNumber: 'Q-2024-001',
        customer: mockCustomers[0],
        status: 'ACCEPTED',
        total: 15500,
        lineItems: [
          { id: 'line1', description: 'Kitchen cabinets installation', quantity: 1, unitPrice: 8500 },
          { id: 'line2', description: 'Plumbing work', quantity: 1, unitPrice: 2500 },
          { id: 'line3', description: 'Electrical work', quantity: 1, unitPrice: 1800 },
          { id: 'line4', description: 'Painting and finishing', quantity: 1, unitPrice: 2700 }
        ]
      }
    ];

    setCustomers(mockCustomers);
    setAvailableQuotes(mockQuotes);
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setFormData(prev => ({ ...prev, customerId }));
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        address: customer.address,
        title: prev.title || `Service for ${customer.name}`
      }));
    }
    
    // Filter quotes for selected customer
    const customerQuotes = availableQuotes.filter(q => q.customer.id === customerId);
    if (customerQuotes.length === 1) {
      handleQuoteSelection(customerQuotes[0]);
    }
  };

  const handleQuoteSelection = (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData(prev => ({
      ...prev,
      quoteId: quote.id,
      customerId: quote.customer.id,
      title: `Job for Quote ${quote.quoteNumber}`,
      description: `Work based on accepted quote ${quote.quoteNumber}`,
      address: quote.customer.address,
      tasks: quote.lineItems.map((item, index) => ({
        id: `task-${index}`,
        title: item.description,
        description: `Quantity: ${item.quantity} @ $${item.unitPrice}`,
        estimatedMinutes: 120, // Default 2 hours per line item
        requiredSkills: determineSkillsFromDescription(item.description),
        sortOrder: index
      }))
    }));
  };

  const determineSkillsFromDescription = (description: string): string[] => {
    const desc = description.toLowerCase();
    const skills = [];
    
    if (desc.includes('plumbing') || desc.includes('pipe') || desc.includes('drain')) skills.push('plumbing');
    if (desc.includes('electrical') || desc.includes('power') || desc.includes('wiring')) skills.push('electrical');
    if (desc.includes('cabinet') || desc.includes('carpentry') || desc.includes('timber')) skills.push('carpentry');
    if (desc.includes('painting') || desc.includes('paint')) skills.push('painting');
    if (desc.includes('tile') || desc.includes('tiling')) skills.push('tiling');
    if (desc.includes('roof')) skills.push('roofing');
    
    return skills.length > 0 ? skills : ['general'];
  };

  const addSkill = (skill: string) => {
    if (!formData.skillsRequired.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill)
    }));
  };

  const addEquipment = (equipment: string) => {
    if (!formData.equipmentRequired.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        equipmentRequired: [...prev.equipmentRequired, equipment]
      }));
    }
  };

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentRequired: prev.equipmentRequired.filter(e => e !== equipment)
    }));
  };

  const addTask = () => {
    const newTask: JobTask = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      estimatedMinutes: 60,
      requiredSkills: [],
      sortOrder: formData.tasks.length
    };
    
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (taskId: string, updates: Partial<JobTask>) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Call API to create job
      console.log('Creating job:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to jobs list
      navigate('/inventory/job-scheduling');
    } catch (error) {
      console.error('Error creating job:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <UniversalHeader
          title="Create New Job"
          subtitle="Convert quote to job or create standalone job"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Back Button */}
            <div>
              <button
                type="button"
                onClick={() => navigate('/inventory/job-scheduling')}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Job Scheduling
              </button>
            </div>

            {/* Quote Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Job Source</h2>
              
              {availableQuotes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Create from accepted quote (optional)
                  </label>
                  <select
                    value={selectedQuote?.id || ''}
                    onChange={(e) => {
                      const quote = availableQuotes.find(q => q.id === e.target.value);
                      if (quote) {
                        handleQuoteSelection(quote);
                      } else {
                        setSelectedQuote(null);
                        setFormData(prev => ({ ...prev, quoteId: undefined, tasks: [] }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Create standalone job</option>
                    {availableQuotes.map(quote => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quoteNumber} - {quote.customer.name} - ${quote.total.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Kitchen Installation - Smith Residence"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the work to be performed..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledStartDate ? 
                        formData.scheduledStartDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        scheduledStartDate: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Duration (hours)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.estimatedDuration ? formData.estimatedDuration / 60 : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        estimatedDuration: e.target.value ? parseFloat(e.target.value) * 60 : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Required */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Skills Required</h2>
              
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addSkill(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Add a skill requirement...</option>
                  {availableSkills
                    .filter(skill => !formData.skillsRequired.includes(skill))
                    .map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skillsRequired.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Equipment Required */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Equipment Required</h2>
              
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addEquipment(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Add equipment requirement...</option>
                  {availableEquipment
                    .filter(equipment => !formData.equipmentRequired.includes(equipment))
                    .map(equipment => (
                      <option key={equipment} value={equipment}>{equipment}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.equipmentRequired.map(equipment => (
                  <span
                    key={equipment}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {equipment}
                    <button
                      type="button"
                      onClick={() => removeEquipment(equipment)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Job Tasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Job Tasks</h2>
                <button
                  type="button"
                  onClick={addTask}
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Task
                </button>
              </div>

              <div className="space-y-4">
                {formData.tasks.map((task, index) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Task {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Install kitchen cabinets"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          step="15"
                          value={task.estimatedMinutes}
                          onChange={(e) => updateTask(task.id, { estimatedMinutes: parseInt(e.target.value) || 60 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Required Skills
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const currentSkills = task.requiredSkills || [];
                              if (!currentSkills.includes(e.target.value)) {
                                updateTask(task.id, { 
                                  requiredSkills: [...currentSkills, e.target.value] 
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Add skill...</option>
                          {availableSkills.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                        
                        {task.requiredSkills && task.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.requiredSkills.map(skill => (
                              <span
                                key={skill}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateTask(task.id, {
                                      requiredSkills: task.requiredSkills.filter(s => s !== skill)
                                    });
                                  }}
                                  className="ml-1 text-purple-600 hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Description
                        </label>
                        <textarea
                          value={task.description}
                          onChange={(e) => updateTask(task.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Detailed description of the task..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.tasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks added</h3>
                    <p className="text-gray-500 mb-4">Break down the job into manageable tasks for better tracking.</p>
                    <button
                      type="button"
                      onClick={addTask}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Add First Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="permitRequired"
                    checked={formData.permitRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, permitRequired: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="permitRequired" className="ml-2 block text-sm text-gray-900">
                    Permit required for this job
                  </label>
                </div>

                {formData.permitRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permit Details
                    </label>
                    <textarea
                      value={formData.permitDetails || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, permitDetails: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the permits required..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notes visible to customer..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.internalNotes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Internal notes for crew and management..."
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {(formData.skillsRequired.length > 0 || formData.equipmentRequired.length > 0 || formData.tasks.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Job Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="font-medium text-blue-800 mb-2">Skills Required:</div>
                    <div className="text-blue-700">
                      {formData.skillsRequired.length > 0 ? formData.skillsRequired.join(', ') : 'None specified'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-blue-800 mb-2">Equipment Needed:</div>
                    <div className="text-blue-700">
                      {formData.equipmentRequired.length > 0 ? formData.equipmentRequired.join(', ') : 'None specified'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-blue-800 mb-2">Total Tasks:</div>
                    <div className="text-blue-700">
                      {formData.tasks.length} task{formData.tasks.length !== 1 ? 's' : ''}
                      {formData.estimatedDuration && (
                        <span className="block">
                          Est. {Math.round(formData.estimatedDuration / 60)}h duration
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => navigate('/inventory/job-scheduling')}
                className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.customerId || !formData.title}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Job...
                  </div>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2 inline" />
                    Create Job
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}