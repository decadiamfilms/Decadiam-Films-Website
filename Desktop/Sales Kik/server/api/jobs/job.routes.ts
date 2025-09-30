import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { JobController } from './job.controller';

const router = Router();
const jobController = new JobController();

// Apply authentication to all routes
router.use(authenticate);

// Job Management Routes
router.get('/', jobController.getJobs.bind(jobController));
router.get('/:id', jobController.getJobById.bind(jobController));
router.post('/', jobController.createJob.bind(jobController));
router.put('/:id', jobController.updateJob.bind(jobController));
router.delete('/:id', jobController.deleteJob.bind(jobController));

// Job Status Management
router.patch('/:id/status', jobController.updateJobStatus.bind(jobController));
router.get('/:id/status-history', jobController.getJobStatusHistory.bind(jobController));

// Job Tasks
router.get('/:id/tasks', jobController.getJobTasks.bind(jobController));
router.post('/:id/tasks', jobController.createJobTask.bind(jobController));
router.put('/:id/tasks/:taskId', jobController.updateJobTask.bind(jobController));
router.delete('/:id/tasks/:taskId', jobController.deleteJobTask.bind(jobController));

// Schedule Events
router.get('/:id/events', jobController.getJobEvents.bind(jobController));
router.post('/:id/events', jobController.createScheduleEvent.bind(jobController));
router.put('/:id/events/:eventId', jobController.updateScheduleEvent.bind(jobController));
router.delete('/:id/events/:eventId', jobController.deleteScheduleEvent.bind(jobController));

// Time Tracking
router.get('/:id/time-entries', jobController.getJobTimeEntries.bind(jobController));
router.post('/:id/time-entries', jobController.createTimeEntry.bind(jobController));
router.put('/:id/time-entries/:entryId', jobController.updateTimeEntry.bind(jobController));
router.delete('/:id/time-entries/:entryId', jobController.deleteTimeEntry.bind(jobController));

// Quote to Job Conversion
router.post('/from-quote/:quoteId', jobController.createJobFromQuote.bind(jobController));

// Crew Management Routes
router.get('/crew/members', jobController.getCrewMembers.bind(jobController));
router.post('/crew/members', jobController.createCrewMember.bind(jobController));
router.put('/crew/members/:id', jobController.updateCrewMember.bind(jobController));
router.delete('/crew/members/:id', jobController.deleteCrewMember.bind(jobController));
router.get('/crew/members/:id/availability', jobController.getCrewAvailability.bind(jobController));
router.post('/crew/members/:id/availability', jobController.setCrewAvailability.bind(jobController));

// Scheduling Routes
router.get('/schedule/overview', jobController.getScheduleOverview.bind(jobController));
router.get('/schedule/conflicts', jobController.getScheduleConflicts.bind(jobController));
router.post('/schedule/optimize', jobController.optimizeSchedule.bind(jobController));

// Service Windows
router.get('/service-windows', jobController.getServiceWindows.bind(jobController));
router.post('/service-windows', jobController.createServiceWindow.bind(jobController));
router.put('/service-windows/:id', jobController.updateServiceWindow.bind(jobController));
router.delete('/service-windows/:id', jobController.deleteServiceWindow.bind(jobController));

// Communication
router.get('/:id/messages', jobController.getJobMessages.bind(jobController));
router.post('/:id/messages', jobController.sendJobMessage.bind(jobController));

// Dependencies
router.get('/:id/dependencies', jobController.getJobDependencies.bind(jobController));
router.post('/:id/dependencies', jobController.createJobDependency.bind(jobController));
router.delete('/:id/dependencies/:dependencyId', jobController.deleteJobDependency.bind(jobController));

// Automation
router.get('/automation/triggers', jobController.getAutomationTriggers.bind(jobController));
router.post('/automation/triggers', jobController.createAutomationTrigger.bind(jobController));
router.put('/automation/triggers/:id', jobController.updateAutomationTrigger.bind(jobController));
router.delete('/automation/triggers/:id', jobController.deleteAutomationTrigger.bind(jobController));

// Reporting
router.get('/reports/utilization', jobController.getCrewUtilization.bind(jobController));
router.get('/reports/completion', jobController.getJobCompletionMetrics.bind(jobController));
router.get('/reports/performance', jobController.getPerformanceMetrics.bind(jobController));

export default router;