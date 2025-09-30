// Video Training Service for Purchase Order System
// Screen recordings, role-specific training, interactive tutorials, and progress tracking

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  category: 'WORKFLOW' | 'TROUBLESHOOTING' | 'FEATURE_DEMO' | 'ROLE_SPECIFIC' | 'ONBOARDING';
  targetRole: 'ALL' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'WAREHOUSE_STAFF' | 'ACCOUNTING';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number; // seconds
  videoUrl: string;
  thumbnailUrl: string;
  transcriptUrl?: string;
  subtitleLanguages: string[];
  chapters: VideoChapter[];
  prerequisites: string[]; // IDs of prerequisite videos
  learningObjectives: string[];
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  description: string;
  keyPoints: string[];
  interactiveElements?: Array<{
    type: 'QUIZ' | 'PAUSE_POINT' | 'CLICK_DEMO' | 'FORM_PRACTICE';
    timestamp: number;
    content: any;
  }>;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  category: 'COMPLETE_WORKFLOW' | 'SPECIFIC_FEATURE' | 'TROUBLESHOOTING' | 'BEST_PRACTICES';
  estimatedDuration: number; // minutes
  videos: string[]; // Video IDs in sequence
  assessments: TrainingAssessment[];
  completionCriteria: {
    watchAllVideos: boolean;
    passAssessments: boolean;
    minimumScore: number;
    practiceExercises: boolean;
  };
  certificateTemplate?: string;
  isActive: boolean;
}

export interface TrainingAssessment {
  id: string;
  title: string;
  type: 'QUIZ' | 'PRACTICAL' | 'SCENARIO';
  questions: AssessmentQuestion[];
  passingScore: number;
  timeLimit?: number; // minutes
  allowRetakes: boolean;
  maxAttempts: number;
}

export interface AssessmentQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'PRACTICAL_DEMO';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  mediaUrl?: string; // Image or video for question
}

export interface UserTrainingProgress {
  userId: string;
  moduleProgress: Map<string, ModuleProgress>;
  videoProgress: Map<string, VideoProgress>;
  assessmentResults: Map<string, AssessmentResult>;
  certificates: Certificate[];
  totalHoursWatched: number;
  overallCompletionRate: number;
  lastActivityAt: Date;
}

export interface ModuleProgress {
  moduleId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CERTIFIED';
  completedVideos: string[];
  currentVideoId?: string;
  completedAssessments: string[];
  overallScore?: number;
  startedAt: Date;
  completedAt?: Date;
  certificateId?: string;
}

export interface VideoProgress {
  videoId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  watchedTime: number; // seconds
  totalTime: number; // seconds
  completionPercentage: number;
  lastWatchedAt: Date;
  interactionsCompleted: string[];
  bookmarks: Array<{
    timestamp: number;
    note: string;
    createdAt: Date;
  }>;
}

export interface AssessmentResult {
  assessmentId: string;
  attempt: number;
  score: number;
  maxScore: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    userAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }>;
  startedAt: Date;
  completedAt: Date;
  duration: number; // seconds
}

export interface Certificate {
  id: string;
  moduleId: string;
  moduleName: string;
  userId: string;
  userName: string;
  issuedAt: Date;
  expiresAt?: Date;
  certificateUrl: string;
  verificationCode: string;
}

class VideoTrainingService {
  private static instance: VideoTrainingService;
  private trainingVideos: Map<string, TrainingVideo> = new Map();
  private trainingModules: Map<string, TrainingModule> = new Map();
  private userProgress: Map<string, UserTrainingProgress> = new Map();

  private constructor() {
    this.initializeTrainingContent();
    this.loadUserProgress();
  }

  public static getInstance(): VideoTrainingService {
    if (!VideoTrainingService.instance) {
      VideoTrainingService.instance = new VideoTrainingService();
    }
    return VideoTrainingService.instance;
  }

  private initializeTrainingContent(): void {
    // Create comprehensive training videos for purchase order system
    const trainingVideos: TrainingVideo[] = [
      {
        id: 'po-overview',
        title: 'Purchase Order System Overview',
        description: 'Complete introduction to the SalesKik Purchase Order System',
        category: 'ONBOARDING',
        targetRole: 'ALL',
        difficulty: 'BEGINNER',
        duration: 480, // 8 minutes
        videoUrl: '/training/videos/po-overview.mp4',
        thumbnailUrl: '/training/thumbnails/po-overview.jpg',
        transcriptUrl: '/training/transcripts/po-overview.txt',
        subtitleLanguages: ['en', 'zh', 'es'],
        chapters: [
          {
            id: 'intro',
            title: 'Introduction to Purchase Orders',
            startTime: 0,
            endTime: 120,
            description: 'Understanding purchase orders and their importance',
            keyPoints: ['What is a purchase order', 'Benefits of digital procurement', 'System overview']
          },
          {
            id: 'navigation',
            title: 'System Navigation',
            startTime: 120,
            endTime: 240,
            description: 'How to navigate the purchase order interface',
            keyPoints: ['Dashboard overview', 'Menu structure', 'Search and filters']
          },
          {
            id: 'basic-workflow',
            title: 'Basic Workflow',
            startTime: 240,
            endTime: 480,
            description: 'End-to-end purchase order workflow',
            keyPoints: ['Creating orders', 'Approval process', 'Supplier communication']
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'Understand the purpose and benefits of the purchase order system',
          'Navigate the system interface confidently',
          'Complete a basic purchase order workflow'
        ],
        tags: ['overview', 'getting-started', 'navigation'],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'po-creation-workflow',
        title: 'Creating Purchase Orders - Complete Workflow',
        description: 'Step-by-step guide to creating purchase orders with best practices',
        category: 'WORKFLOW',
        targetRole: 'EMPLOYEE',
        difficulty: 'INTERMEDIATE',
        duration: 720, // 12 minutes
        videoUrl: '/training/videos/po-creation.mp4',
        thumbnailUrl: '/training/thumbnails/po-creation.jpg',
        transcriptUrl: '/training/transcripts/po-creation.txt',
        subtitleLanguages: ['en', 'zh', 'es'],
        chapters: [
          {
            id: 'supplier-selection',
            title: 'Supplier Selection',
            startTime: 0,
            endTime: 180,
            description: 'How to choose the right supplier',
            keyPoints: ['Supplier search', 'Performance ratings', 'Glass specialist routing']
          },
          {
            id: 'product-selection',
            title: 'Product Selection and Categories',
            startTime: 180,
            endTime: 420,
            description: 'Adding products and using category filters',
            keyPoints: ['Category navigation', 'Custom glass integration', 'Inventory levels']
          },
          {
            id: 'attachments-notes',
            title: 'Attachments and Documentation',
            startTime: 420,
            endTime: 600,
            description: 'Adding technical documentation and notes',
            keyPoints: ['File upload', 'Attachment bundling', 'Technical drawings']
          },
          {
            id: 'submission',
            title: 'Order Submission and Approval',
            startTime: 600,
            endTime: 720,
            description: 'Submitting orders and understanding approval workflows',
            keyPoints: ['Business rules', 'Approval requirements', 'Status tracking']
          }
        ],
        prerequisites: ['po-overview'],
        learningObjectives: [
          'Create purchase orders efficiently and accurately',
          'Select appropriate suppliers and products',
          'Understand approval workflows and business rules'
        ],
        tags: ['creation', 'workflow', 'best-practices'],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'manager-approvals',
        title: 'Manager Approval Workflows',
        description: 'Manager guide to purchase order approvals and oversight',
        category: 'ROLE_SPECIFIC',
        targetRole: 'MANAGER',
        difficulty: 'INTERMEDIATE',
        duration: 600, // 10 minutes
        videoUrl: '/training/videos/manager-approvals.mp4',
        thumbnailUrl: '/training/thumbnails/manager-approvals.jpg',
        chapters: [
          {
            id: 'approval-dashboard',
            title: 'Approval Dashboard',
            startTime: 0,
            endTime: 180,
            description: 'Understanding the approval interface',
            keyPoints: ['Pending approvals', 'Business rules', 'Financial impact']
          },
          {
            id: 'approval-decisions',
            title: 'Making Approval Decisions',
            startTime: 180,
            endTime: 420,
            description: 'How to review and approve orders',
            keyPoints: ['Review criteria', 'Risk assessment', 'Approval comments']
          },
          {
            id: 'escalations',
            title: 'Escalations and Exceptions',
            startTime: 420,
            endTime: 600,
            description: 'Handling special cases and escalations',
            keyPoints: ['Emergency approvals', 'Business rule overrides', 'Audit compliance']
          }
        ],
        prerequisites: ['po-overview'],
        learningObjectives: [
          'Efficiently review and approve purchase orders',
          'Understand business rules and compliance requirements',
          'Handle escalations and special cases appropriately'
        ],
        tags: ['manager', 'approvals', 'oversight'],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mobile-receipts',
        title: 'Mobile Receipt Documentation',
        description: 'Using mobile devices for goods receipt documentation',
        category: 'FEATURE_DEMO',
        targetRole: 'WAREHOUSE_STAFF',
        difficulty: 'BEGINNER',
        duration: 360, // 6 minutes
        videoUrl: '/training/videos/mobile-receipts.mp4',
        thumbnailUrl: '/training/thumbnails/mobile-receipts.jpg',
        chapters: [
          {
            id: 'camera-setup',
            title: 'Camera Setup and Best Practices',
            startTime: 0,
            endTime: 120,
            description: 'Setting up camera for optimal documentation',
            keyPoints: ['Camera permissions', 'Lighting tips', 'Photo quality']
          },
          {
            id: 'documentation-process',
            title: 'Receipt Documentation Process',
            startTime: 120,
            endTime: 300,
            description: 'Step-by-step receipt documentation',
            keyPoints: ['Photo capture', 'GPS tagging', 'Quality verification']
          },
          {
            id: 'integration',
            title: 'Integration with Purchase Orders',
            startTime: 300,
            endTime: 360,
            description: 'How photos integrate with purchase order records',
            keyPoints: ['Automatic linking', 'Audit trail', 'Compliance']
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'Document goods receipts using mobile camera',
          'Ensure photo quality and compliance',
          'Understand integration with purchase order system'
        ],
        tags: ['mobile', 'receipts', 'documentation'],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'troubleshooting-guide',
        title: 'Troubleshooting Common Issues',
        description: 'Solutions for common purchase order system problems',
        category: 'TROUBLESHOOTING',
        targetRole: 'ALL',
        difficulty: 'INTERMEDIATE',
        duration: 900, // 15 minutes
        videoUrl: '/training/videos/troubleshooting.mp4',
        thumbnailUrl: '/training/thumbnails/troubleshooting.jpg',
        chapters: [
          {
            id: 'approval-issues',
            title: 'Approval Workflow Problems',
            startTime: 0,
            endTime: 300,
            description: 'Resolving approval delays and issues',
            keyPoints: ['Stuck approvals', 'Business rule conflicts', 'Permission issues']
          },
          {
            id: 'supplier-communication',
            title: 'Supplier Communication Issues',
            startTime: 300,
            endTime: 600,
            description: 'Handling supplier confirmation problems',
            keyPoints: ['Email delivery', 'Confirmation timeouts', 'Contact escalation']
          },
          {
            id: 'technical-issues',
            title: 'Technical Problems and Solutions',
            startTime: 600,
            endTime: 900,
            description: 'Common technical issues and fixes',
            keyPoints: ['File upload problems', 'Search issues', 'Performance problems']
          }
        ],
        prerequisites: ['po-overview'],
        learningObjectives: [
          'Identify and resolve common system issues',
          'Know when to escalate technical problems',
          'Maintain system efficiency and user productivity'
        ],
        tags: ['troubleshooting', 'support', 'technical'],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    trainingVideos.forEach(video => {
      this.trainingVideos.set(video.id, video);
    });

    // Create training modules
    this.createTrainingModules();
  }

  private createTrainingModules(): void {
    const modules: TrainingModule[] = [
      {
        id: 'complete-user-training',
        name: 'Complete Purchase Order User Training',
        description: 'Comprehensive training for all purchase order users',
        category: 'COMPLETE_WORKFLOW',
        estimatedDuration: 45,
        videos: ['po-overview', 'po-creation-workflow', 'troubleshooting-guide'],
        assessments: [
          {
            id: 'basic-knowledge-quiz',
            title: 'Basic Purchase Order Knowledge',
            type: 'QUIZ',
            questions: [
              {
                id: 'q1',
                type: 'MULTIPLE_CHOICE',
                question: 'What happens when a purchase order exceeds the approval threshold?',
                options: [
                  'It is automatically approved',
                  'It requires manager approval',
                  'It is automatically rejected',
                  'It is sent directly to supplier'
                ],
                correctAnswer: 'It requires manager approval',
                explanation: 'Orders exceeding the configured threshold require manager approval before proceeding.',
                points: 10
              },
              {
                id: 'q2',
                type: 'TRUE_FALSE',
                question: 'Custom glass orders automatically suggest glass specialist suppliers.',
                correctAnswer: 'true',
                explanation: 'The system automatically detects custom glass products and suggests glass specialist suppliers for better pricing and expertise.',
                points: 5
              }
            ],
            passingScore: 80,
            allowRetakes: true,
            maxAttempts: 3
          }
        ],
        completionCriteria: {
          watchAllVideos: true,
          passAssessments: true,
          minimumScore: 80,
          practiceExercises: false
        },
        isActive: true
      },
      {
        id: 'manager-certification',
        name: 'Purchase Order Manager Certification',
        description: 'Advanced training and certification for managers',
        category: 'SPECIFIC_FEATURE',
        estimatedDuration: 30,
        videos: ['po-overview', 'manager-approvals'],
        assessments: [
          {
            id: 'manager-assessment',
            title: 'Manager Certification Assessment',
            type: 'SCENARIO',
            questions: [
              {
                id: 'scenario1',
                type: 'PRACTICAL_DEMO',
                question: 'A $25,000 urgent order from a new supplier requires approval. What factors should you consider?',
                correctAnswer: 'Supplier verification, urgency justification, budget impact, risk assessment',
                explanation: 'High-value orders from new suppliers require comprehensive evaluation of supplier credibility, project urgency, budget implications, and risk mitigation.',
                points: 20
              }
            ],
            passingScore: 85,
            timeLimit: 60,
            allowRetakes: true,
            maxAttempts: 2
          }
        ],
        completionCriteria: {
          watchAllVideos: true,
          passAssessments: true,
          minimumScore: 85,
          practiceExercises: true
        },
        certificateTemplate: 'manager-certificate-template',
        isActive: true
      }
    ];

    modules.forEach(module => {
      this.trainingModules.set(module.id, module);
    });
  }

  private loadUserProgress(): void {
    const saved = localStorage.getItem('saleskik-training-progress');
    if (saved) {
      try {
        const progressData = JSON.parse(saved);
        Object.entries(progressData).forEach(([userId, progress]: [string, any]) => {
          this.userProgress.set(userId, {
            userId,
            moduleProgress: new Map(Object.entries(progress.moduleProgress || {})),
            videoProgress: new Map(Object.entries(progress.videoProgress || {})),
            assessmentResults: new Map(Object.entries(progress.assessmentResults || {})),
            certificates: progress.certificates || [],
            totalHoursWatched: progress.totalHoursWatched || 0,
            overallCompletionRate: progress.overallCompletionRate || 0,
            lastActivityAt: new Date(progress.lastActivityAt || Date.now())
          });
        });
      } catch (error) {
        console.error('Error loading training progress:', error);
      }
    }
  }

  // Video progress tracking
  public updateVideoProgress(userId: string, videoId: string, watchedTime: number): void {
    const video = this.trainingVideos.get(videoId);
    if (!video) return;

    let userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      userProgress = this.createEmptyUserProgress(userId);
      this.userProgress.set(userId, userProgress);
    }

    const videoProgress: VideoProgress = userProgress.videoProgress.get(videoId) || {
      videoId,
      status: 'NOT_STARTED',
      watchedTime: 0,
      totalTime: video.duration,
      completionPercentage: 0,
      lastWatchedAt: new Date(),
      interactionsCompleted: [],
      bookmarks: []
    };

    videoProgress.watchedTime = Math.max(videoProgress.watchedTime, watchedTime);
    videoProgress.completionPercentage = (videoProgress.watchedTime / video.duration) * 100;
    videoProgress.lastWatchedAt = new Date();

    if (videoProgress.completionPercentage >= 90) {
      videoProgress.status = 'COMPLETED';
    } else if (videoProgress.watchedTime > 0) {
      videoProgress.status = 'IN_PROGRESS';
    }

    userProgress.videoProgress.set(videoId, videoProgress);
    userProgress.lastActivityAt = new Date();
    
    this.updateOverallProgress(userId);
    this.saveUserProgress();
  }

  // Assessment handling
  public submitAssessment(
    userId: string, 
    assessmentId: string, 
    answers: Array<{ questionId: string; answer: string | string[] }>
  ): AssessmentResult {
    const assessment = this.findAssessmentById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    let userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      userProgress = this.createEmptyUserProgress(userId);
      this.userProgress.set(userId, userProgress);
    }

    // Get previous attempts
    const previousResults = Array.from(userProgress.assessmentResults.values())
      .filter(result => result.assessmentId === assessmentId);
    
    const attemptNumber = previousResults.length + 1;

    if (attemptNumber > assessment.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    // Score assessment
    const scoredAnswers = answers.map(userAnswer => {
      const question = assessment.questions.find(q => q.id === userAnswer.questionId)!;
      const isCorrect = this.checkAnswer(question, userAnswer.answer);
      
      return {
        questionId: userAnswer.questionId,
        userAnswer: userAnswer.answer,
        isCorrect,
        points: isCorrect ? question.points : 0
      };
    });

    const totalScore = scoredAnswers.reduce((sum, answer) => sum + answer.points, 0);
    const maxScore = assessment.questions.reduce((sum, question) => sum + question.points, 0);
    const passed = totalScore >= (assessment.passingScore / 100) * maxScore;

    const result: AssessmentResult = {
      assessmentId,
      attempt: attemptNumber,
      score: totalScore,
      maxScore,
      passed,
      answers: scoredAnswers,
      startedAt: new Date(), // Would be tracked from when assessment started
      completedAt: new Date(),
      duration: 0 // Would be calculated from start time
    };

    userProgress.assessmentResults.set(`${assessmentId}-${attemptNumber}`, result);
    userProgress.lastActivityAt = new Date();

    this.updateOverallProgress(userId);
    this.saveUserProgress();

    // Check for module completion and certification
    this.checkModuleCompletion(userId);

    return result;
  }

  private checkAnswer(question: AssessmentQuestion, userAnswer: string | string[]): boolean {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
      case 'SHORT_ANSWER':
        return String(userAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
      
      case 'PRACTICAL_DEMO':
        // More flexible matching for practical demonstrations
        const userAnswerStr = String(userAnswer).toLowerCase();
        const correctAnswerStr = String(question.correctAnswer).toLowerCase();
        const keywords = correctAnswerStr.split(/[,\s]+/);
        const matchedKeywords = keywords.filter(keyword => 
          userAnswerStr.includes(keyword.trim())
        );
        return matchedKeywords.length >= keywords.length * 0.7; // 70% keyword match
      
      default:
        return false;
    }
  }

  private checkModuleCompletion(userId: string): void {
    const userProgress = this.userProgress.get(userId);
    if (!userProgress) return;

    this.trainingModules.forEach((module, moduleId) => {
      const moduleProgress = userProgress.moduleProgress.get(moduleId);
      if (!moduleProgress || moduleProgress.status === 'COMPLETED') return;

      // Check if all requirements are met
      const allVideosWatched = module.videos.every(videoId => {
        const videoProgress = userProgress.videoProgress.get(videoId);
        return videoProgress && videoProgress.status === 'COMPLETED';
      });

      const allAssessmentsPassed = module.assessments.every(assessment => {
        const results = Array.from(userProgress.assessmentResults.values())
          .filter(result => result.assessmentId === assessment.id);
        return results.some(result => result.passed);
      });

      if (allVideosWatched && allAssessmentsPassed) {
        moduleProgress.status = 'COMPLETED';
        moduleProgress.completedAt = new Date();

        // Generate certificate if applicable
        if (module.certificateTemplate) {
          this.generateCertificate(userId, moduleId);
          moduleProgress.status = 'CERTIFIED';
        }

        userProgress.moduleProgress.set(moduleId, moduleProgress);
        this.saveUserProgress();

        console.log(`Module completed: ${module.name} for user ${userId}`);
      }
    });
  }

  private generateCertificate(userId: string, moduleId: string): void {
    const module = this.trainingModules.get(moduleId);
    const userProgress = this.userProgress.get(userId);
    
    if (!module || !userProgress) return;

    const certificate: Certificate = {
      id: Date.now().toString(),
      moduleId,
      moduleName: module.name,
      userId,
      userName: this.getUserName(userId),
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      certificateUrl: `/certificates/${userId}/${moduleId}`,
      verificationCode: this.generateVerificationCode()
    };

    userProgress.certificates.push(certificate);
    console.log(`Certificate generated: ${module.name} for ${certificate.userName}`);
  }

  private generateVerificationCode(): string {
    return 'CERT-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private createEmptyUserProgress(userId: string): UserTrainingProgress {
    return {
      userId,
      moduleProgress: new Map(),
      videoProgress: new Map(),
      assessmentResults: new Map(),
      certificates: [],
      totalHoursWatched: 0,
      overallCompletionRate: 0,
      lastActivityAt: new Date()
    };
  }

  private updateOverallProgress(userId: string): void {
    const userProgress = this.userProgress.get(userId);
    if (!userProgress) return;

    // Calculate total hours watched
    const totalSeconds = Array.from(userProgress.videoProgress.values())
      .reduce((sum, progress) => sum + progress.watchedTime, 0);
    userProgress.totalHoursWatched = totalSeconds / 3600;

    // Calculate overall completion rate
    const totalVideos = this.trainingVideos.size;
    const completedVideos = Array.from(userProgress.videoProgress.values())
      .filter(progress => progress.status === 'COMPLETED').length;
    
    userProgress.overallCompletionRate = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
  }

  private findAssessmentById(assessmentId: string): TrainingAssessment | null {
    for (const module of this.trainingModules.values()) {
      const assessment = module.assessments.find(a => a.id === assessmentId);
      if (assessment) return assessment;
    }
    return null;
  }

  private getUserName(userId: string): string {
    // In production, get from user database
    return 'Training User';
  }

  // Public API methods
  public getTrainingVideos(targetRole?: string): TrainingVideo[] {
    const videos = Array.from(this.trainingVideos.values())
      .filter(video => video.isPublished);

    if (targetRole) {
      return videos.filter(video => 
        video.targetRole === 'ALL' || video.targetRole === targetRole
      );
    }

    return videos;
  }

  public getTrainingModules(): TrainingModule[] {
    return Array.from(this.trainingModules.values())
      .filter(module => module.isActive);
  }

  public getUserProgress(userId: string): UserTrainingProgress | null {
    return this.userProgress.get(userId) || null;
  }

  public getTrainingStatistics(): {
    totalVideos: number;
    totalModules: number;
    totalUsers: number;
    averageCompletionRate: number;
    certificatesIssued: number;
    mostPopularVideo: string;
    trainingHours: number;
  } {
    const totalUsers = this.userProgress.size;
    const averageCompletionRate = totalUsers > 0
      ? Array.from(this.userProgress.values())
          .reduce((sum, progress) => sum + progress.overallCompletionRate, 0) / totalUsers
      : 0;

    const certificatesIssued = Array.from(this.userProgress.values())
      .reduce((sum, progress) => sum + progress.certificates.length, 0);

    const totalTrainingHours = Array.from(this.userProgress.values())
      .reduce((sum, progress) => sum + progress.totalHoursWatched, 0);

    // Find most popular video
    const videoViews = new Map<string, number>();
    this.userProgress.forEach(progress => {
      progress.videoProgress.forEach((videoProgress, videoId) => {
        if (videoProgress.watchedTime > 0) {
          videoViews.set(videoId, (videoViews.get(videoId) || 0) + 1);
        }
      });
    });

    const mostPopularVideoId = Array.from(videoViews.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    const mostPopularVideo = mostPopularVideoId 
      ? this.trainingVideos.get(mostPopularVideoId)?.title || 'Unknown'
      : 'None';

    return {
      totalVideos: this.trainingVideos.size,
      totalModules: this.trainingModules.size,
      totalUsers,
      averageCompletionRate,
      certificatesIssued,
      mostPopularVideo,
      trainingHours: totalTrainingHours
    };
  }

  public addVideoBookmark(userId: string, videoId: string, timestamp: number, note: string): void {
    let userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      userProgress = this.createEmptyUserProgress(userId);
      this.userProgress.set(userId, userProgress);
    }

    let videoProgress = userProgress.videoProgress.get(videoId);
    if (!videoProgress) {
      const video = this.trainingVideos.get(videoId);
      if (!video) return;
      
      videoProgress = {
        videoId,
        status: 'NOT_STARTED',
        watchedTime: 0,
        totalTime: video.duration,
        completionPercentage: 0,
        lastWatchedAt: new Date(),
        interactionsCompleted: [],
        bookmarks: []
      };
    }

    videoProgress.bookmarks.push({
      timestamp,
      note,
      createdAt: new Date()
    });

    userProgress.videoProgress.set(videoId, videoProgress);
    this.saveUserProgress();
  }

  private saveUserProgress(): void {
    const progressData: any = {};
    
    this.userProgress.forEach((progress, userId) => {
      progressData[userId] = {
        userId: progress.userId,
        moduleProgress: Object.fromEntries(progress.moduleProgress),
        videoProgress: Object.fromEntries(progress.videoProgress),
        assessmentResults: Object.fromEntries(progress.assessmentResults),
        certificates: progress.certificates,
        totalHoursWatched: progress.totalHoursWatched,
        overallCompletionRate: progress.overallCompletionRate,
        lastActivityAt: progress.lastActivityAt
      };
    });

    localStorage.setItem('saleskik-training-progress', JSON.stringify(progressData));
  }

  // Interactive tutorials
  public startInteractiveTutorial(tutorialId: string): {
    success: boolean;
    tutorial?: any;
    error?: string;
  } {
    const tutorials = {
      'first-purchase-order': {
        id: 'first-purchase-order',
        title: 'Create Your First Purchase Order',
        steps: [
          {
            target: '[data-tutorial="supplier-select"]',
            title: 'Select a Supplier',
            content: 'Choose an approved supplier from the dropdown. Glass specialists are prioritized for custom glass orders.',
            placement: 'bottom'
          },
          {
            target: '[data-tutorial="category-filter"]',
            title: 'Choose Product Category', 
            content: 'Select a category to filter available products. Use Custom Glass for specialized glass products.',
            placement: 'right'
          },
          {
            target: '[data-tutorial="add-product"]',
            title: 'Add Products',
            content: 'Add products to your order. Adjust quantities and pricing as needed.',
            placement: 'left'
          },
          {
            target: '[data-tutorial="attachments"]',
            title: 'Upload Documentation',
            content: 'Add technical drawings, specifications, or other documentation that suppliers need.',
            placement: 'top'
          },
          {
            target: '[data-tutorial="submit-order"]',
            title: 'Submit Order',
            content: 'Review your order and submit. High-value orders will require manager approval.',
            placement: 'top'
          }
        ]
      }
    };

    const tutorial = tutorials[tutorialId as keyof typeof tutorials];
    if (tutorial) {
      return { success: true, tutorial };
    } else {
      return { success: false, error: 'Tutorial not found' };
    }
  }

  // Video hosting and delivery optimization
  public getOptimizedVideoUrl(videoId: string, quality: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): string {
    const video = this.trainingVideos.get(videoId);
    if (!video) return '';

    // In production, return CDN URLs optimized for different qualities
    const qualityMap = {
      'LOW': '480p',
      'MEDIUM': '720p', 
      'HIGH': '1080p'
    };

    return `${video.videoUrl}?quality=${qualityMap[quality]}`;
  }

  public getVideoAnalytics(videoId: string): {
    totalViews: number;
    averageWatchTime: number;
    completionRate: number;
    dropOffPoints: Array<{ timestamp: number; dropOffRate: number }>;
    userEngagement: number;
  } {
    const allProgress = Array.from(this.userProgress.values());
    const videoProgressList = allProgress
      .map(progress => progress.videoProgress.get(videoId))
      .filter(progress => progress && progress.watchedTime > 0);

    const totalViews = videoProgressList.length;
    const averageWatchTime = videoProgressList.length > 0
      ? videoProgressList.reduce((sum, progress) => sum + progress!.watchedTime, 0) / videoProgressList.length
      : 0;

    const completedViews = videoProgressList.filter(progress => progress!.status === 'COMPLETED').length;
    const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

    return {
      totalViews,
      averageWatchTime,
      completionRate,
      dropOffPoints: [], // Would be calculated from detailed viewing data
      userEngagement: completionRate / 100
    };
  }
}

export default VideoTrainingService;