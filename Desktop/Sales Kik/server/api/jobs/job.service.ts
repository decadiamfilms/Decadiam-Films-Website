import { PrismaClient } from '@prisma/client';
import { prisma } from '../../index';

export class JobService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Job Management
  async getJobs(companyId: string, filters: any, page: number, limit: number) {
    const where: any = {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { jobNumber: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    if (filters.startDate || filters.endDate) {
      where.scheduledStartDate = {};
      if (filters.startDate) {
        where.scheduledStartDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.scheduledStartDate.lte = new Date(filters.endDate);
      }
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              total: true
            }
          },
          scheduleEvents: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              assignedCrewIds: true
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              estimatedMinutes: true,
              actualMinutes: true
            }
          },
          _count: {
            select: {
              tasks: true,
              timeEntries: true,
              messages: true
            }
          }
        },
        orderBy: {
          scheduledStartDate: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.job.count({ where })
    ]);

    return {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getJobById(id: string, companyId: string) {
    return this.prisma.job.findFirst({
      where: { id, companyId },
      include: {
        customer: {
          include: {
            contacts: true
          }
        },
        quote: {
          include: {
            lineItems: true
          }
        },
        tasks: {
          include: {
            timeEntries: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        scheduleEvents: {
          include: {
            statusHistory: true
          },
          orderBy: {
            startTime: 'asc'
          }
        },
        timeEntries: {
          include: {
            crewMember: {
              select: {
                id: true,
                name: true
              }
            },
            task: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc'
          }
        },
        dependencies: {
          include: {
            prerequisiteJob: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        dependsOn: {
          include: {
            dependentJob: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        serviceWindows: true
      }
    });
  }

  async createJob(jobData: any) {
    const jobNumber = await this.generateJobNumber(jobData.companyId);
    
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          ...jobData,
          jobNumber,
          status: 'PLANNED'
        },
        include: {
          customer: true,
          quote: true
        }
      });

      // Create initial status log
      await tx.jobStatusLog.create({
        data: {
          jobId: job.id,
          newStatus: 'PLANNED',
          reason: 'Job created',
          changedBy: jobData.createdBy
        }
      });

      // If created from quote, create tasks from quote line items
      if (jobData.quoteId) {
        await this.createTasksFromQuote(tx, job.id, jobData.quoteId);
      }

      return job;
    });
  }

  async updateJob(id: string, companyId: string, updates: any) {
    return this.prisma.job.update({
      where: { id, companyId },
      data: updates,
      include: {
        customer: true,
        quote: true
      }
    });
  }

  async deleteJob(id: string, companyId: string) {
    try {
      await this.prisma.job.delete({
        where: { id, companyId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Job Status Management
  async updateJobStatus(id: string, companyId: string, status: string, logData: any) {
    return this.prisma.$transaction(async (tx) => {
      const currentJob = await tx.job.findFirst({
        where: { id, companyId },
        select: { status: true }
      });

      if (!currentJob) {
        throw new Error('Job not found');
      }

      const updatedJob = await tx.job.update({
        where: { id, companyId },
        data: { status },
        include: {
          customer: true,
          quote: true
        }
      });

      // Log status change
      await tx.jobStatusLog.create({
        data: {
          jobId: id,
          previousStatus: currentJob.status,
          newStatus: status,
          reason: logData.reason,
          notes: logData.notes,
          changedBy: logData.changedBy
        }
      });

      // Trigger automation if status change warrants it
      await this.triggerAutomation(tx, id, 'STATUS_CHANGE', {
        previousStatus: currentJob.status,
        newStatus: status
      });

      return updatedJob;
    });
  }

  async getJobStatusHistory(id: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobStatusLog.findMany({
      where: { jobId: id },
      orderBy: { changedAt: 'desc' }
    });
  }

  // Job Tasks
  async getJobTasks(jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTask.findMany({
      where: { jobId },
      include: {
        timeEntries: {
          include: {
            crewMember: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async createJobTask(jobId: string, companyId: string, taskData: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTask.create({
      data: {
        jobId,
        ...taskData
      }
    });
  }

  async updateJobTask(taskId: string, jobId: string, companyId: string, updates: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTask.update({
      where: { id: taskId, jobId },
      data: updates
    });
  }

  async deleteJobTask(taskId: string, jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      return false;
    }

    try {
      await this.prisma.jobTask.delete({
        where: { id: taskId, jobId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Schedule Events
  async getJobEvents(jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.scheduleEvent.findMany({
      where: { jobId },
      include: {
        statusHistory: true
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async createScheduleEvent(jobId: string, companyId: string, eventData: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check for scheduling conflicts
    const conflicts = await this.checkSchedulingConflicts(
      eventData.assignedCrewIds,
      eventData.startTime,
      eventData.endTime
    );

    if (conflicts.length > 0) {
      throw new Error('Scheduling conflict detected');
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.scheduleEvent.create({
        data: {
          jobId,
          ...eventData,
          status: 'PLANNED'
        }
      });

      // Log initial status
      await tx.eventStatusLog.create({
        data: {
          eventId: event.id,
          newStatus: 'PLANNED',
          reason: 'Event created'
        }
      });

      return event;
    });
  }

  async updateScheduleEvent(eventId: string, jobId: string, companyId: string, updates: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.scheduleEvent.update({
      where: { id: eventId, jobId },
      data: updates
    });
  }

  async deleteScheduleEvent(eventId: string, jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      return false;
    }

    try {
      await this.prisma.scheduleEvent.delete({
        where: { id: eventId, jobId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Time Tracking
  async getJobTimeEntries(jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTimeEntry.findMany({
      where: { jobId },
      include: {
        crewMember: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  }

  async createTimeEntry(jobId: string, companyId: string, entryData: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTimeEntry.create({
      data: {
        jobId,
        ...entryData
      },
      include: {
        crewMember: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  async updateTimeEntry(entryId: string, jobId: string, companyId: string, updates: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobTimeEntry.update({
      where: { id: entryId, jobId },
      data: updates
    });
  }

  async deleteTimeEntry(entryId: string, jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      return false;
    }

    try {
      await this.prisma.jobTimeEntry.delete({
        where: { id: entryId, jobId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Quote to Job Conversion
  async createJobFromQuote(quoteId: string, companyId: string, userId: string, jobData: any = {}) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, companyId },
      include: {
        customer: true,
        lineItems: true
      }
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error('Only accepted quotes can be converted to jobs');
    }

    const jobNumber = await this.generateJobNumber(companyId);

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          companyId,
          customerId: quote.customerId,
          quoteId: quote.id,
          jobNumber,
          title: jobData.title || `Job for Quote ${quote.quoteNumber}`,
          description: jobData.description || quote.notes,
          address: jobData.address || quote.customer.shippingAddress,
          priority: jobData.priority || 'NORMAL',
          status: 'PLANNED',
          estimatedDuration: jobData.estimatedDuration,
          skillsRequired: jobData.skillsRequired || [],
          equipmentRequired: jobData.equipmentRequired || [],
          notes: jobData.notes,
          internalNotes: jobData.internalNotes,
          createdBy: userId
        }
      });

      // Create initial status log
      await tx.jobStatusLog.create({
        data: {
          jobId: job.id,
          newStatus: 'PLANNED',
          reason: `Job created from quote ${quote.quoteNumber}`,
          changedBy: userId
        }
      });

      // Create tasks from quote line items
      await this.createTasksFromQuote(tx, job.id, quote.id);

      // Create material holds in purchasing system if needed
      if (quote.lineItems.length > 0) {
        await this.createMaterialHolds(tx, job.id, quote.lineItems);
      }

      return job;
    });
  }

  // Crew Management
  async getCrewMembers(companyId: string, filters: any = {}) {
    const where: any = { companyId };
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.skills && filters.skills.length > 0) {
      where.skills = {
        hasSome: filters.skills
      };
    }

    return this.prisma.crewMember.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        availabilityRules: {
          where: {
            endDate: {
              gte: new Date()
            }
          }
        },
        _count: {
          select: {
            timeEntries: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCrewMember(crewData: any) {
    return this.prisma.crewMember.create({
      data: crewData,
      include: {
        employee: true
      }
    });
  }

  async updateCrewMember(id: string, companyId: string, updates: any) {
    return this.prisma.crewMember.update({
      where: { id, companyId },
      data: updates,
      include: {
        employee: true
      }
    });
  }

  async deleteCrewMember(id: string, companyId: string) {
    try {
      await this.prisma.crewMember.update({
        where: { id, companyId },
        data: { isActive: false }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCrewAvailability(crewMemberId: string, companyId: string, startDate?: string, endDate?: string) {
    // Verify crew member belongs to company
    const crewMember = await this.prisma.crewMember.findFirst({
      where: { id: crewMemberId, companyId },
      select: { id: true }
    });

    if (!crewMember) {
      throw new Error('Crew member not found');
    }

    const where: any = { crewMemberId };
    
    if (startDate || endDate) {
      where.OR = [
        {
          startDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        },
        {
          endDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        }
      ];
    }

    return this.prisma.crewAvailability.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });
  }

  async setCrewAvailability(crewMemberId: string, companyId: string, availabilityData: any) {
    // Verify crew member belongs to company
    const crewMember = await this.prisma.crewMember.findFirst({
      where: { id: crewMemberId, companyId },
      select: { id: true }
    });

    if (!crewMember) {
      throw new Error('Crew member not found');
    }

    return this.prisma.crewAvailability.create({
      data: {
        crewMemberId,
        ...availabilityData
      }
    });
  }

  // Scheduling
  async getScheduleOverview(companyId: string, startDate: string, endDate: string, view: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [jobs, events, crewMembers] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          companyId,
          OR: [
            {
              scheduledStartDate: {
                gte: start,
                lte: end
              }
            },
            {
              scheduledEndDate: {
                gte: start,
                lte: end
              }
            }
          ]
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          },
          scheduleEvents: {
            where: {
              startTime: {
                gte: start,
                lte: end
              }
            }
          }
        }
      }),
      this.prisma.scheduleEvent.findMany({
        where: {
          job: { companyId },
          startTime: {
            gte: start,
            lte: end
          }
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              priority: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      this.prisma.crewMember.findMany({
        where: {
          companyId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          skills: true,
          workingHours: true
        }
      })
    ]);

    return {
      jobs,
      events,
      crewMembers,
      summary: {
        totalJobs: jobs.length,
        totalEvents: events.length,
        activeCrewMembers: crewMembers.length
      }
    };
  }

  async getScheduleConflicts(companyId: string) {
    const conflicts = [];

    // Find overlapping events for same crew members
    const events = await this.prisma.scheduleEvent.findMany({
      where: {
        job: { companyId },
        status: { in: ['PLANNED', 'CONFIRMED'] },
        startTime: {
          gte: new Date()
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Check for conflicts (simplified logic)
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Check if they have overlapping crew members and times
        const hasCommonCrew = event1.assignedCrewIds.some(id => 
          event2.assignedCrewIds.includes(id)
        );

        if (hasCommonCrew) {
          const event1End = new Date(event1.endTime);
          const event2Start = new Date(event2.startTime);

          if (event1End > event2Start) {
            conflicts.push({
              type: 'CREW_DOUBLE_BOOKING',
              events: [event1, event2],
              conflictingCrewIds: event1.assignedCrewIds.filter(id =>
                event2.assignedCrewIds.includes(id)
              )
            });
          }
        }
      }
    }

    return conflicts;
  }

  async optimizeSchedule(companyId: string, startDate: string, endDate: string, constraints: any) {
    // This is a simplified optimization - in production, you'd use more sophisticated algorithms
    const jobs = await this.prisma.job.findMany({
      where: {
        companyId,
        status: 'PLANNED',
        scheduledStartDate: null
      },
      include: {
        customer: true,
        serviceWindows: true
      }
    });

    const crewMembers = await this.prisma.crewMember.findMany({
      where: {
        companyId,
        isActive: true
      }
    });

    // Simple optimization logic
    const optimizedSchedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const job of jobs) {
      // Find best crew member based on skills
      const bestCrew = crewMembers.find(crew => 
        job.skillsRequired.every(skill => crew.skills.includes(skill))
      ) || crewMembers[0];

      if (bestCrew) {
        // Find optimal time slot within service windows
        const timeSlot = this.findOptimalTimeSlot(job, bestCrew, start, end);
        
        if (timeSlot) {
          optimizedSchedule.push({
            jobId: job.id,
            crewMemberId: bestCrew.id,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            reason: 'Optimized based on crew skills and availability'
          });
        }
      }
    }

    return optimizedSchedule;
  }

  // Service Windows
  async getServiceWindows(companyId: string, filters: any = {}) {
    const where: any = {
      customer: { companyId },
      isActive: true
    };

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.jobId) {
      where.jobId = filters.jobId;
    }

    return this.prisma.serviceWindow.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createServiceWindow(companyId: string, windowData: any) {
    // Verify customer belongs to company
    const customer = await this.prisma.customer.findFirst({
      where: { id: windowData.customerId, companyId },
      select: { id: true }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.prisma.serviceWindow.create({
      data: windowData,
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  async updateServiceWindow(id: string, companyId: string, updates: any) {
    return this.prisma.serviceWindow.update({
      where: {
        id,
        customer: { companyId }
      },
      data: updates
    });
  }

  async deleteServiceWindow(id: string, companyId: string) {
    try {
      await this.prisma.serviceWindow.delete({
        where: {
          id,
          customer: { companyId }
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Communication
  async getJobMessages(jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobMessage.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async sendJobMessage(jobId: string, companyId: string, messageData: any) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const message = await this.prisma.jobMessage.create({
      data: {
        jobId,
        ...messageData,
        direction: 'OUTBOUND',
        deliveryStatus: 'PENDING'
      }
    });

    // TODO: Integrate with actual messaging service
    // await this.sendMessage(message);

    return message;
  }

  // Dependencies
  async getJobDependencies(jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.prisma.jobDependency.findMany({
      where: { dependentJobId: jobId },
      include: {
        prerequisiteJob: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStartDate: true,
            scheduledEndDate: true
          }
        }
      }
    });
  }

  async createJobDependency(dependentJobId: string, companyId: string, dependencyData: any) {
    // Verify both jobs belong to company
    const [dependentJob, prerequisiteJob] = await Promise.all([
      this.prisma.job.findFirst({
        where: { id: dependentJobId, companyId },
        select: { id: true }
      }),
      this.prisma.job.findFirst({
        where: { id: dependencyData.prerequisiteJobId, companyId },
        select: { id: true }
      })
    ]);

    if (!dependentJob || !prerequisiteJob) {
      throw new Error('One or both jobs not found');
    }

    return this.prisma.jobDependency.create({
      data: {
        dependentJobId,
        ...dependencyData
      },
      include: {
        prerequisiteJob: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
  }

  async deleteJobDependency(dependencyId: string, jobId: string, companyId: string) {
    // Verify job belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true }
    });

    if (!job) {
      return false;
    }

    try {
      await this.prisma.jobDependency.delete({
        where: { id: dependencyId, dependentJobId: jobId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Automation
  async getAutomationTriggers(companyId: string, filters: any = {}) {
    const where: any = { companyId };

    if (filters.jobId) {
      where.jobId = filters.jobId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.automationTrigger.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAutomationTrigger(triggerData: any) {
    return this.prisma.automationTrigger.create({
      data: triggerData
    });
  }

  async updateAutomationTrigger(id: string, companyId: string, updates: any) {
    return this.prisma.automationTrigger.update({
      where: { id, companyId },
      data: updates
    });
  }

  async deleteAutomationTrigger(id: string, companyId: string) {
    try {
      await this.prisma.automationTrigger.delete({
        where: { id, companyId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Reporting
  async getCrewUtilization(companyId: string, startDate: string, endDate: string, crewMemberId?: string) {
    const where: any = {
      job: { companyId },
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (crewMemberId) {
      where.crewMemberId = crewMemberId;
    }

    const timeEntries = await this.prisma.jobTimeEntry.findMany({
      where,
      include: {
        crewMember: {
          select: {
            id: true,
            name: true,
            maxHoursPerDay: true,
            maxHoursPerWeek: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Calculate utilization metrics
    const utilization = this.calculateUtilizationMetrics(timeEntries, startDate, endDate);
    
    return utilization;
  }

  async getJobCompletionMetrics(companyId: string, startDate: string, endDate: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        companyId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        tasks: true,
        timeEntries: true
      }
    });

    return this.calculateCompletionMetrics(jobs);
  }

  async getPerformanceMetrics(companyId: string, startDate: string, endDate: string, customerId?: string) {
    const where: any = {
      companyId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (customerId) {
      where.customerId = customerId;
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: true,
        timeEntries: true,
        scheduleEvents: true
      }
    });

    return this.calculatePerformanceMetrics(jobs);
  }

  // Helper Methods
  private async generateJobNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}`;
    
    const lastJob = await this.prisma.job.findFirst({
      where: {
        companyId,
        jobNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        jobNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.jobNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private async createTasksFromQuote(tx: any, jobId: string, quoteId: string) {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { lineItems: true }
    });

    if (!quote || !quote.lineItems.length) {
      return;
    }

    const tasks = quote.lineItems.map((item: any, index: number) => ({
      jobId,
      quoteLineItemId: item.id,
      title: item.description,
      description: `Quantity: ${item.quantity} @ $${item.unitPrice} each`,
      status: 'PENDING',
      estimatedMinutes: 60, // Default 1 hour per line item
      sortOrder: index
    }));

    await tx.jobTask.createMany({
      data: tasks
    });
  }

  private async createMaterialHolds(tx: any, jobId: string, lineItems: any[]) {
    // This would integrate with the purchasing system
    // For now, we'll just store the material requirements in the job
    const materialHolds = lineItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      description: item.description,
      reservedAt: new Date()
    }));

    await tx.job.update({
      where: { id: jobId },
      data: {
        materialHolds: materialHolds
      }
    });
  }

  private async checkSchedulingConflicts(crewIds: string[], startTime: Date, endTime: Date) {
    return this.prisma.scheduleEvent.findMany({
      where: {
        assignedCrewIds: {
          hasSome: crewIds
        },
        status: { in: ['PLANNED', 'CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            startTime: {
              lt: endTime,
              gte: startTime
            }
          },
          {
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    });
  }

  private async triggerAutomation(tx: any, jobId: string, triggerType: string, context: any) {
    const triggers = await tx.automationTrigger.findMany({
      where: {
        OR: [
          { jobId },
          { jobId: null } // Global triggers
        ],
        triggerType,
        isActive: true
      }
    });

    for (const trigger of triggers) {
      // Check if trigger conditions are met
      if (this.evaluateTriggerConditions(trigger.triggerConditions, context)) {
        await this.executeAutomationAction(tx, trigger, jobId, context);
        
        // Update trigger statistics
        await tx.automationTrigger.update({
          where: { id: trigger.id },
          data: {
            lastTriggered: new Date(),
            triggerCount: { increment: 1 }
          }
        });
      }
    }
  }

  private evaluateTriggerConditions(conditions: any, context: any): boolean {
    // Simple condition evaluation - in production, use a proper rules engine
    return true;
  }

  private async executeAutomationAction(tx: any, trigger: any, jobId: string, context: any) {
    const action = trigger.actionType;
    const config = trigger.actionConfig;

    switch (action) {
      case 'SEND_NOTIFICATION':
        // Send notification
        break;
      case 'UPDATE_STATUS':
        // Update job status
        break;
      case 'CREATE_TASK':
        // Create a new task
        break;
      case 'SCHEDULE_FOLLOWUP':
        // Schedule follow-up
        break;
      case 'GENERATE_INVOICE':
        // Generate invoice
        break;
      case 'ORDER_MATERIALS':
        // Order materials
        break;
      case 'ESCALATE_ISSUE':
        // Escalate issue
        break;
    }
  }

  private findOptimalTimeSlot(job: any, crewMember: any, start: Date, end: Date) {
    // Simplified time slot finding logic
    // In production, this would be much more sophisticated
    return {
      start: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
      end: new Date(start.getTime() + (job.estimatedDuration || 60) * 60000)
    };
  }

  private calculateUtilizationMetrics(timeEntries: any[], startDate: string, endDate: string) {
    // Calculate crew utilization metrics
    const metrics = {
      totalHours: 0,
      billableHours: 0,
      utilizationRate: 0,
      byCrewMember: {} as any
    };

    timeEntries.forEach(entry => {
      const hours = this.calculateHoursWorked(entry);
      metrics.totalHours += hours;
      
      if (entry.billable) {
        metrics.billableHours += hours;
      }

      if (!metrics.byCrewMember[entry.crewMemberId]) {
        metrics.byCrewMember[entry.crewMemberId] = {
          name: entry.crewMember.name,
          totalHours: 0,
          billableHours: 0
        };
      }

      metrics.byCrewMember[entry.crewMemberId].totalHours += hours;
      if (entry.billable) {
        metrics.byCrewMember[entry.crewMemberId].billableHours += hours;
      }
    });

    metrics.utilizationRate = metrics.totalHours > 0 ? 
      (metrics.billableHours / metrics.totalHours) * 100 : 0;

    return metrics;
  }

  private calculateCompletionMetrics(jobs: any[]) {
    const metrics = {
      totalJobs: jobs.length,
      completedJobs: 0,
      onTimeJobs: 0,
      averageCompletionTime: 0,
      taskCompletionRate: 0
    };

    jobs.forEach(job => {
      if (job.status === 'COMPLETED') {
        metrics.completedJobs++;
        
        // Check if completed on time
        if (job.scheduledEndDate && job.departureTime && 
            new Date(job.departureTime) <= new Date(job.scheduledEndDate)) {
          metrics.onTimeJobs++;
        }
      }
    });

    return metrics;
  }

  private calculatePerformanceMetrics(jobs: any[]) {
    const metrics = {
      averageJobDuration: 0,
      customerSatisfaction: 0,
      firstTimeFixRate: 0,
      repeatJobRate: 0
    };

    // Calculate performance metrics based on job data
    // This is simplified - in production, you'd have more sophisticated calculations

    return metrics;
  }

  private calculateHoursWorked(timeEntry: any): number {
    if (!timeEntry.endTime) return 0;
    
    const start = new Date(timeEntry.startTime);
    const end = new Date(timeEntry.endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    // Subtract break time if any
    const breakHours = timeEntry.breakDuration ? timeEntry.breakDuration / 60 : 0;
    
    return Math.max(0, hours - breakHours);
  }
}