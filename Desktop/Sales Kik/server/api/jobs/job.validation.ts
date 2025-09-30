import Joi from 'joi';

export const createJobSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).optional(),
  address: Joi.object().optional(),
  siteDetails: Joi.object().optional(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY').default('NORMAL'),
  scheduledStartDate: Joi.date().optional(),
  scheduledEndDate: Joi.date().greater(Joi.ref('scheduledStartDate')).optional(),
  estimatedDuration: Joi.number().integer().min(15).max(2880).optional(), // 15 minutes to 48 hours
  skillsRequired: Joi.array().items(Joi.string()).optional(),
  equipmentRequired: Joi.array().items(Joi.string()).optional(),
  accessRequirements: Joi.object().optional(),
  permitRequired: Joi.boolean().default(false),
  permitDetails: Joi.string().when('permitRequired', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  notes: Joi.string().max(2000).optional(),
  internalNotes: Joi.string().max(2000).optional(),
  riskAssessment: Joi.object().optional(),
  qualityChecklist: Joi.object().optional()
});

export const updateJobSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  address: Joi.object().optional(),
  siteDetails: Joi.object().optional(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY').optional(),
  scheduledStartDate: Joi.date().optional(),
  scheduledEndDate: Joi.date().optional(),
  estimatedDuration: Joi.number().integer().min(15).max(2880).optional(),
  skillsRequired: Joi.array().items(Joi.string()).optional(),
  equipmentRequired: Joi.array().items(Joi.string()).optional(),
  accessRequirements: Joi.object().optional(),
  permitRequired: Joi.boolean().optional(),
  permitDetails: Joi.string().optional(),
  notes: Joi.string().max(2000).optional(),
  internalNotes: Joi.string().max(2000).optional(),
  riskAssessment: Joi.object().optional(),
  qualityChecklist: Joi.object().optional(),
  completionPercentage: Joi.number().integer().min(0).max(100).optional()
});

export const scheduleEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  allDay: Joi.boolean().default(false),
  assignedCrewIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  leadCrewMemberId: Joi.string().uuid().optional(),
  travelTimeMinutes: Joi.number().integer().min(0).max(480).default(0),
  bufferTimeMinutes: Joi.number().integer().min(0).max(120).default(0),
  location: Joi.object().optional(),
  notes: Joi.string().max(1000).optional()
});

export const crewMemberSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  certifications: Joi.object().optional(),
  licenseNumber: Joi.string().max(50).optional(),
  licenseExpiry: Joi.date().optional(),
  workingHours: Joi.object().optional(),
  maxHoursPerDay: Joi.number().integer().min(1).max(24).default(8),
  maxHoursPerWeek: Joi.number().integer().min(1).max(168).default(40),
  vehicleType: Joi.string().max(50).optional(),
  vehicleCapacity: Joi.object().optional(),
  equipmentAccess: Joi.array().items(Joi.string()).optional(),
  hireDate: Joi.date().optional()
});

export const jobTaskSchema = Joi.object({
  quoteLineItemId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  estimatedMinutes: Joi.number().integer().min(5).max(1440).optional(),
  sortOrder: Joi.number().integer().min(0).default(0),
  assignedCrewIds: Joi.array().items(Joi.string().uuid()).optional(),
  requiredSkills: Joi.array().items(Joi.string()).optional()
});

export const timeEntrySchema = Joi.object({
  taskId: Joi.string().uuid().optional(),
  crewMemberId: Joi.string().uuid().required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).optional(),
  breakDuration: Joi.number().integer().min(0).max(480).optional(),
  travelTime: Joi.number().integer().min(0).max(480).optional(),
  startLocation: Joi.object().optional(),
  endLocation: Joi.object().optional(),
  workDescription: Joi.string().max(1000).optional(),
  notes: Joi.string().max(1000).optional(),
  photos: Joi.array().items(Joi.string().uri()).optional(),
  billable: Joi.boolean().default(true),
  hourlyRate: Joi.number().positive().optional()
});

export const serviceWindowSchema = Joi.object({
  jobId: Joi.string().uuid().optional(),
  customerId: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  dayOfWeek: Joi.number().integer().min(0).max(6).optional(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  timezone: Joi.string().default('Australia/Sydney'),
  validFrom: Joi.date().optional(),
  validTo: Joi.date().greater(Joi.ref('validFrom')).optional(),
  excludeDates: Joi.array().items(Joi.date()).optional(),
  accessInstructions: Joi.string().max(1000).optional(),
  contactRequired: Joi.boolean().default(false),
  gateCodes: Joi.object().optional(),
  parkingInstructions: Joi.string().max(500).optional()
});

export const jobDependencySchema = Joi.object({
  prerequisiteJobId: Joi.string().uuid().required(),
  dependencyType: Joi.string().valid(
    'SEQUENTIAL',
    'MATERIAL_DELIVERY',
    'SITE_PREPARATION',
    'PERMIT_APPROVAL',
    'QUALITY_INSPECTION'
  ).required(),
  description: Joi.string().max(500).optional()
});

export const automationTriggerSchema = Joi.object({
  jobId: Joi.string().uuid().optional(),
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  triggerType: Joi.string().valid(
    'STATUS_CHANGE',
    'TIME_BASED',
    'COMPLETION_PERCENTAGE',
    'CREW_ARRIVAL',
    'CUSTOMER_ACTION',
    'MATERIAL_DELIVERY',
    'EXTERNAL_EVENT'
  ).required(),
  triggerConditions: Joi.object().required(),
  actionType: Joi.string().valid(
    'SEND_NOTIFICATION',
    'UPDATE_STATUS',
    'CREATE_TASK',
    'SCHEDULE_FOLLOWUP',
    'GENERATE_INVOICE',
    'ORDER_MATERIALS',
    'ESCALATE_ISSUE'
  ).required(),
  actionConfig: Joi.object().required(),
  isActive: Joi.boolean().default(true)
});

export const jobMessageSchema = Joi.object({
  messageType: Joi.string().valid('EMAIL', 'SMS', 'PUSH_NOTIFICATION').required(),
  recipient: Joi.string().required(),
  subject: Joi.string().max(200).when('messageType', {
    is: 'EMAIL',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  content: Joi.string().min(10).max(5000).required(),
  templateUsed: Joi.string().optional()
});