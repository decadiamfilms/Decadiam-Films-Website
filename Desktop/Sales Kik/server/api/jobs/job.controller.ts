import { Request, Response } from 'express';
import { JobService } from './job.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  // Job Management
  async getJobs(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { 
        status, 
        customerId, 
        assignedCrewId, 
        priority,
        startDate, 
        endDate, 
        page = 1, 
        limit = 20,
        search 
      } = req.query;

      const filters = {
        status: status as string,
        customerId: customerId as string,
        assignedCrewId: assignedCrewId as string,
        priority: priority as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string
      };

      const jobs = await this.jobService.getJobs(
        companyId, 
        filters, 
        parseInt(page as string), 
        parseInt(limit as string)
      );

      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  async getJobById(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const job = await this.jobService.getJobById(id, companyId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  async createJob(req: AuthRequest, res: Response) {
    try {
      const { companyId, id: userId } = req.user!;
      const jobData = req.body;

      const job = await this.jobService.createJob({
        ...jobData,
        companyId,
        createdBy: userId
      });

      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  async updateJob(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const updates = req.body;

      const job = await this.jobService.updateJob(id, companyId, updates);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  }

  async deleteJob(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const success = await this.jobService.deleteJob(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  // Job Status Management
  async updateJobStatus(req: AuthRequest, res: Response) {
    try {
      const { companyId, id: userId } = req.user!;
      const { id } = req.params;
      const { status, reason, notes } = req.body;

      const job = await this.jobService.updateJobStatus(id, companyId, status, {
        changedBy: userId,
        reason,
        notes
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  }

  async getJobStatusHistory(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const history = await this.jobService.getJobStatusHistory(id, companyId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching job status history:', error);
      res.status(500).json({ error: 'Failed to fetch job status history' });
    }
  }

  // Job Tasks
  async getJobTasks(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const tasks = await this.jobService.getJobTasks(id, companyId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching job tasks:', error);
      res.status(500).json({ error: 'Failed to fetch job tasks' });
    }
  }

  async createJobTask(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const taskData = req.body;

      const task = await this.jobService.createJobTask(id, companyId, taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating job task:', error);
      res.status(500).json({ error: 'Failed to create job task' });
    }
  }

  async updateJobTask(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, taskId } = req.params;
      const updates = req.body;

      const task = await this.jobService.updateJobTask(taskId, id, companyId, updates);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error updating job task:', error);
      res.status(500).json({ error: 'Failed to update job task' });
    }
  }

  async deleteJobTask(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, taskId } = req.params;

      const success = await this.jobService.deleteJobTask(taskId, id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting job task:', error);
      res.status(500).json({ error: 'Failed to delete job task' });
    }
  }

  // Schedule Events
  async getJobEvents(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const events = await this.jobService.getJobEvents(id, companyId);
      res.json(events);
    } catch (error) {
      console.error('Error fetching job events:', error);
      res.status(500).json({ error: 'Failed to fetch job events' });
    }
  }

  async createScheduleEvent(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const eventData = req.body;

      const event = await this.jobService.createScheduleEvent(id, companyId, eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating schedule event:', error);
      res.status(500).json({ error: 'Failed to create schedule event' });
    }
  }

  async updateScheduleEvent(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, eventId } = req.params;
      const updates = req.body;

      const event = await this.jobService.updateScheduleEvent(eventId, id, companyId, updates);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error updating schedule event:', error);
      res.status(500).json({ error: 'Failed to update schedule event' });
    }
  }

  async deleteScheduleEvent(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, eventId } = req.params;

      const success = await this.jobService.deleteScheduleEvent(eventId, id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting schedule event:', error);
      res.status(500).json({ error: 'Failed to delete schedule event' });
    }
  }

  // Time Tracking
  async getJobTimeEntries(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const timeEntries = await this.jobService.getJobTimeEntries(id, companyId);
      res.json(timeEntries);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      res.status(500).json({ error: 'Failed to fetch time entries' });
    }
  }

  async createTimeEntry(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const entryData = req.body;

      const timeEntry = await this.jobService.createTimeEntry(id, companyId, entryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      console.error('Error creating time entry:', error);
      res.status(500).json({ error: 'Failed to create time entry' });
    }
  }

  async updateTimeEntry(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, entryId } = req.params;
      const updates = req.body;

      const timeEntry = await this.jobService.updateTimeEntry(entryId, id, companyId, updates);
      
      if (!timeEntry) {
        return res.status(404).json({ error: 'Time entry not found' });
      }

      res.json(timeEntry);
    } catch (error) {
      console.error('Error updating time entry:', error);
      res.status(500).json({ error: 'Failed to update time entry' });
    }
  }

  async deleteTimeEntry(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, entryId } = req.params;

      const success = await this.jobService.deleteTimeEntry(entryId, id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Time entry not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      res.status(500).json({ error: 'Failed to delete time entry' });
    }
  }

  // Quote to Job Conversion
  async createJobFromQuote(req: AuthRequest, res: Response) {
    try {
      const { companyId, id: userId } = req.user!;
      const { quoteId } = req.params;
      const { jobData } = req.body;

      const job = await this.jobService.createJobFromQuote(quoteId, companyId, userId, jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job from quote:', error);
      res.status(500).json({ error: 'Failed to create job from quote' });
    }
  }

  // Crew Management
  async getCrewMembers(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { isActive, skills } = req.query;

      const crewMembers = await this.jobService.getCrewMembers(companyId, {
        isActive: isActive === 'true',
        skills: skills as string[]
      });

      res.json(crewMembers);
    } catch (error) {
      console.error('Error fetching crew members:', error);
      res.status(500).json({ error: 'Failed to fetch crew members' });
    }
  }

  async createCrewMember(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const crewData = req.body;

      const crewMember = await this.jobService.createCrewMember({
        ...crewData,
        companyId
      });

      res.status(201).json(crewMember);
    } catch (error) {
      console.error('Error creating crew member:', error);
      res.status(500).json({ error: 'Failed to create crew member' });
    }
  }

  async updateCrewMember(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const updates = req.body;

      const crewMember = await this.jobService.updateCrewMember(id, companyId, updates);
      
      if (!crewMember) {
        return res.status(404).json({ error: 'Crew member not found' });
      }

      res.json(crewMember);
    } catch (error) {
      console.error('Error updating crew member:', error);
      res.status(500).json({ error: 'Failed to update crew member' });
    }
  }

  async deleteCrewMember(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const success = await this.jobService.deleteCrewMember(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Crew member not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting crew member:', error);
      res.status(500).json({ error: 'Failed to delete crew member' });
    }
  }

  async getCrewAvailability(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const availability = await this.jobService.getCrewAvailability(
        id, 
        companyId,
        startDate as string,
        endDate as string
      );

      res.json(availability);
    } catch (error) {
      console.error('Error fetching crew availability:', error);
      res.status(500).json({ error: 'Failed to fetch crew availability' });
    }
  }

  async setCrewAvailability(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const availabilityData = req.body;

      const availability = await this.jobService.setCrewAvailability(id, companyId, availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      console.error('Error setting crew availability:', error);
      res.status(500).json({ error: 'Failed to set crew availability' });
    }
  }

  // Scheduling
  async getScheduleOverview(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { startDate, endDate, view = 'week' } = req.query;

      const overview = await this.jobService.getScheduleOverview(
        companyId,
        startDate as string,
        endDate as string,
        view as string
      );

      res.json(overview);
    } catch (error) {
      console.error('Error fetching schedule overview:', error);
      res.status(500).json({ error: 'Failed to fetch schedule overview' });
    }
  }

  async getScheduleConflicts(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;

      const conflicts = await this.jobService.getScheduleConflicts(companyId);
      res.json(conflicts);
    } catch (error) {
      console.error('Error fetching schedule conflicts:', error);
      res.status(500).json({ error: 'Failed to fetch schedule conflicts' });
    }
  }

  async optimizeSchedule(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { startDate, endDate, constraints } = req.body;

      const optimizedSchedule = await this.jobService.optimizeSchedule(
        companyId,
        startDate,
        endDate,
        constraints
      );

      res.json(optimizedSchedule);
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      res.status(500).json({ error: 'Failed to optimize schedule' });
    }
  }

  // Service Windows
  async getServiceWindows(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { customerId, jobId } = req.query;

      const serviceWindows = await this.jobService.getServiceWindows(companyId, {
        customerId: customerId as string,
        jobId: jobId as string
      });

      res.json(serviceWindows);
    } catch (error) {
      console.error('Error fetching service windows:', error);
      res.status(500).json({ error: 'Failed to fetch service windows' });
    }
  }

  async createServiceWindow(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const windowData = req.body;

      const serviceWindow = await this.jobService.createServiceWindow(companyId, windowData);
      res.status(201).json(serviceWindow);
    } catch (error) {
      console.error('Error creating service window:', error);
      res.status(500).json({ error: 'Failed to create service window' });
    }
  }

  async updateServiceWindow(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const updates = req.body;

      const serviceWindow = await this.jobService.updateServiceWindow(id, companyId, updates);
      
      if (!serviceWindow) {
        return res.status(404).json({ error: 'Service window not found' });
      }

      res.json(serviceWindow);
    } catch (error) {
      console.error('Error updating service window:', error);
      res.status(500).json({ error: 'Failed to update service window' });
    }
  }

  async deleteServiceWindow(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const success = await this.jobService.deleteServiceWindow(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Service window not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting service window:', error);
      res.status(500).json({ error: 'Failed to delete service window' });
    }
  }

  // Communication
  async getJobMessages(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const messages = await this.jobService.getJobMessages(id, companyId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching job messages:', error);
      res.status(500).json({ error: 'Failed to fetch job messages' });
    }
  }

  async sendJobMessage(req: AuthRequest, res: Response) {
    try {
      const { companyId, id: userId } = req.user!;
      const { id } = req.params;
      const messageData = req.body;

      const message = await this.jobService.sendJobMessage(id, companyId, {
        ...messageData,
        createdBy: userId
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending job message:', error);
      res.status(500).json({ error: 'Failed to send job message' });
    }
  }

  // Dependencies
  async getJobDependencies(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const dependencies = await this.jobService.getJobDependencies(id, companyId);
      res.json(dependencies);
    } catch (error) {
      console.error('Error fetching job dependencies:', error);
      res.status(500).json({ error: 'Failed to fetch job dependencies' });
    }
  }

  async createJobDependency(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const dependencyData = req.body;

      const dependency = await this.jobService.createJobDependency(id, companyId, dependencyData);
      res.status(201).json(dependency);
    } catch (error) {
      console.error('Error creating job dependency:', error);
      res.status(500).json({ error: 'Failed to create job dependency' });
    }
  }

  async deleteJobDependency(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id, dependencyId } = req.params;

      const success = await this.jobService.deleteJobDependency(dependencyId, id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Dependency not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting job dependency:', error);
      res.status(500).json({ error: 'Failed to delete job dependency' });
    }
  }

  // Automation
  async getAutomationTriggers(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { jobId, isActive } = req.query;

      const triggers = await this.jobService.getAutomationTriggers(companyId, {
        jobId: jobId as string,
        isActive: isActive === 'true'
      });

      res.json(triggers);
    } catch (error) {
      console.error('Error fetching automation triggers:', error);
      res.status(500).json({ error: 'Failed to fetch automation triggers' });
    }
  }

  async createAutomationTrigger(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const triggerData = req.body;

      const trigger = await this.jobService.createAutomationTrigger({
        ...triggerData,
        companyId
      });

      res.status(201).json(trigger);
    } catch (error) {
      console.error('Error creating automation trigger:', error);
      res.status(500).json({ error: 'Failed to create automation trigger' });
    }
  }

  async updateAutomationTrigger(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const updates = req.body;

      const trigger = await this.jobService.updateAutomationTrigger(id, companyId, updates);
      
      if (!trigger) {
        return res.status(404).json({ error: 'Automation trigger not found' });
      }

      res.json(trigger);
    } catch (error) {
      console.error('Error updating automation trigger:', error);
      res.status(500).json({ error: 'Failed to update automation trigger' });
    }
  }

  async deleteAutomationTrigger(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const success = await this.jobService.deleteAutomationTrigger(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Automation trigger not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting automation trigger:', error);
      res.status(500).json({ error: 'Failed to delete automation trigger' });
    }
  }

  // Reporting
  async getCrewUtilization(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { startDate, endDate, crewMemberId } = req.query;

      const utilization = await this.jobService.getCrewUtilization(
        companyId,
        startDate as string,
        endDate as string,
        crewMemberId as string
      );

      res.json(utilization);
    } catch (error) {
      console.error('Error fetching crew utilization:', error);
      res.status(500).json({ error: 'Failed to fetch crew utilization' });
    }
  }

  async getJobCompletionMetrics(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { startDate, endDate } = req.query;

      const metrics = await this.jobService.getJobCompletionMetrics(
        companyId,
        startDate as string,
        endDate as string
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching completion metrics:', error);
      res.status(500).json({ error: 'Failed to fetch completion metrics' });
    }
  }

  async getPerformanceMetrics(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { startDate, endDate, customerId } = req.query;

      const metrics = await this.jobService.getPerformanceMetrics(
        companyId,
        startDate as string,
        endDate as string,
        customerId as string
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  }
}