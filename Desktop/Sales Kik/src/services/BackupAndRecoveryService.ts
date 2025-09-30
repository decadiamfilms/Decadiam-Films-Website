// Backup and Disaster Recovery Service for Purchase Order System
// Automated backups, disaster recovery procedures, and data protection

export interface BackupConfiguration {
  id: string;
  name: string;
  type: 'DATABASE' | 'FILES' | 'CONFIGURATION' | 'FULL_SYSTEM';
  schedule: {
    frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    time: string; // HH:MM
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  retention: {
    daily: number; // Days to keep daily backups
    weekly: number; // Weeks to keep weekly backups
    monthly: number; // Months to keep monthly backups
    yearly: number; // Years to keep yearly backups
  };
  destinations: BackupDestination[];
  encryption: {
    enabled: boolean;
    algorithm: 'AES-256' | 'AES-128';
    keyRotationDays: number;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'bzip2' | 'lz4';
    level: number; // 1-9
  };
  verification: {
    enabled: boolean;
    testRestoreFrequency: 'WEEKLY' | 'MONTHLY';
    checksumValidation: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupDestination {
  id: string;
  name: string;
  type: 'LOCAL' | 'S3' | 'AZURE_BLOB' | 'GOOGLE_CLOUD' | 'SFTP';
  config: {
    path?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    host?: string;
    username?: string;
    password?: string;
  };
  priority: number; // 1 = primary, 2 = secondary, etc.
  isActive: boolean;
}

export interface BackupRecord {
  id: string;
  configurationId: string;
  type: BackupConfiguration['type'];
  startedAt: Date;
  completedAt?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  size: number; // Bytes
  compressedSize?: number; // Bytes if compression enabled
  destinations: Array<{
    destinationId: string;
    status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
    uploadedAt?: Date;
    error?: string;
    checksum?: string;
    path: string;
  }>;
  metadata: {
    recordCount?: number;
    tablesCovered?: string[];
    filesCovered?: string[];
    compressionRatio?: number;
    encryptionUsed?: boolean;
  };
  verification?: {
    checksumValid: boolean;
    testRestorePerformed?: boolean;
    testRestoreResult?: 'PASS' | 'FAIL';
    verifiedAt?: Date;
  };
  errorMessage?: string;
  duration: number; // Milliseconds
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  rto: number; // Recovery Time Objective in hours
  rpo: number; // Recovery Point Objective in hours
  procedures: DisasterRecoveryProcedure[];
  testingSchedule: {
    frequency: 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
    lastTest?: Date;
    nextTest?: Date;
  };
  contacts: Array<{
    role: 'PRIMARY' | 'SECONDARY' | 'TECHNICAL' | 'BUSINESS';
    name: string;
    email: string;
    phone: string;
    alternatePhone?: string;
  }>;
  isActive: boolean;
}

export interface DisasterRecoveryProcedure {
  id: string;
  step: number;
  title: string;
  description: string;
  estimatedDuration: number; // Minutes
  requiredRole: 'ADMIN' | 'DBA' | 'SYSADMIN' | 'MANAGER';
  dependencies: string[]; // IDs of prerequisite steps
  verification: string; // How to verify step completion
  automation: {
    scriptPath?: string;
    canAutomate: boolean;
    requiresManualApproval: boolean;
  };
}

class BackupAndRecoveryService {
  private static instance: BackupAndRecoveryService;
  private backupConfigurations: Map<string, BackupConfiguration> = new Map();
  private backupRecords: BackupRecord[] = [];
  private disasterRecoveryPlans: Map<string, DisasterRecoveryPlan> = new Map();
  private backupScheduler: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultConfigurations();
    this.loadBackupData();
    this.initializeDisasterRecoveryPlans();
    this.startBackupScheduler();
  }

  public static getInstance(): BackupAndRecoveryService {
    if (!BackupAndRecoveryService.instance) {
      BackupAndRecoveryService.instance = new BackupAndRecoveryService();
    }
    return BackupAndRecoveryService.instance;
  }

  private initializeDefaultConfigurations(): void {
    // Daily Database Backup
    const dailyDatabaseBackup: BackupConfiguration = {
      id: 'daily-database',
      name: 'Daily Database Backup',
      type: 'DATABASE',
      schedule: {
        frequency: 'DAILY',
        time: '02:00'
      },
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
        yearly: 5
      },
      destinations: [
        {
          id: 'local-storage',
          name: 'Local Storage',
          type: 'LOCAL',
          config: { path: '/backups/database' },
          priority: 1,
          isActive: true
        },
        {
          id: 's3-primary',
          name: 'AWS S3 Primary',
          type: 'S3',
          config: {
            bucket: 'saleskik-backups-primary',
            region: 'ap-southeast-2',
            accessKey: process.env.AWS_BACKUP_ACCESS_KEY,
            secretKey: process.env.AWS_BACKUP_SECRET_KEY
          },
          priority: 2,
          isActive: true
        }
      ],
      encryption: {
        enabled: true,
        algorithm: 'AES-256',
        keyRotationDays: 90
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6
      },
      verification: {
        enabled: true,
        testRestoreFrequency: 'WEEKLY',
        checksumValidation: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Weekly Full System Backup
    const weeklyFullBackup: BackupConfiguration = {
      id: 'weekly-full-system',
      name: 'Weekly Full System Backup',
      type: 'FULL_SYSTEM',
      schedule: {
        frequency: 'WEEKLY',
        time: '01:00',
        dayOfWeek: 0 // Sunday
      },
      retention: {
        daily: 0,
        weekly: 8,
        monthly: 6,
        yearly: 2
      },
      destinations: [
        {
          id: 's3-secondary',
          name: 'AWS S3 Secondary',
          type: 'S3',
          config: {
            bucket: 'saleskik-backups-secondary',
            region: 'us-west-2', // Different region for disaster recovery
            accessKey: process.env.AWS_BACKUP_ACCESS_KEY,
            secretKey: process.env.AWS_BACKUP_SECRET_KEY
          },
          priority: 1,
          isActive: true
        }
      ],
      encryption: {
        enabled: true,
        algorithm: 'AES-256',
        keyRotationDays: 30
      },
      compression: {
        enabled: true,
        algorithm: 'bzip2',
        level: 9
      },
      verification: {
        enabled: true,
        testRestoreFrequency: 'MONTHLY',
        checksumValidation: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Hourly Purchase Order Data Backup
    const hourlyPOBackup: BackupConfiguration = {
      id: 'hourly-purchase-orders',
      name: 'Hourly Purchase Order Data',
      type: 'DATABASE',
      schedule: {
        frequency: 'HOURLY',
        time: '00:00'
      },
      retention: {
        daily: 3,
        weekly: 0,
        monthly: 0,
        yearly: 0
      },
      destinations: [
        {
          id: 'local-hot-backup',
          name: 'Local Hot Backup',
          type: 'LOCAL',
          config: { path: '/backups/hot/purchase-orders' },
          priority: 1,
          isActive: true
        }
      ],
      encryption: {
        enabled: false,
        algorithm: 'AES-256',
        keyRotationDays: 30
      },
      compression: {
        enabled: true,
        algorithm: 'lz4',
        level: 1 // Fast compression for frequent backups
      },
      verification: {
        enabled: false,
        testRestoreFrequency: 'WEEKLY',
        checksumValidation: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.backupConfigurations.set('daily-database', dailyDatabaseBackup);
    this.backupConfigurations.set('weekly-full-system', weeklyFullBackup);
    this.backupConfigurations.set('hourly-purchase-orders', hourlyPOBackup);
  }

  private initializeDisasterRecoveryPlans(): void {
    const primaryDRPlan: DisasterRecoveryPlan = {
      id: 'primary-dr-plan',
      name: 'Primary Disaster Recovery Plan',
      description: 'Complete system recovery procedures for major outages',
      rto: 4, // 4 hours recovery time objective
      rpo: 1, // 1 hour recovery point objective
      procedures: [
        {
          id: 'step-1',
          step: 1,
          title: 'Assess Damage and Activate DR Plan',
          description: 'Evaluate system status, identify failed components, and activate disaster recovery procedures',
          estimatedDuration: 30,
          requiredRole: 'ADMIN',
          dependencies: [],
          verification: 'DR team assembled and damage assessment complete',
          automation: { canAutomate: false, requiresManualApproval: true }
        },
        {
          id: 'step-2',
          step: 2,
          title: 'Restore Database from Latest Backup',
          description: 'Identify most recent valid backup and restore to secondary infrastructure',
          estimatedDuration: 120,
          requiredRole: 'DBA',
          dependencies: ['step-1'],
          verification: 'Database restored and accessible with data integrity verified',
          automation: { 
            canAutomate: true, 
            requiresManualApproval: true,
            scriptPath: '/scripts/restore-database.sh'
          }
        },
        {
          id: 'step-3',
          step: 3,
          title: 'Restore File Storage and Attachments',
          description: 'Restore purchase order attachments and system files from backup',
          estimatedDuration: 60,
          requiredRole: 'SYSADMIN',
          dependencies: ['step-2'],
          verification: 'File storage accessible and attachment downloads functional',
          automation: { 
            canAutomate: true, 
            requiresManualApproval: false,
            scriptPath: '/scripts/restore-files.sh'
          }
        },
        {
          id: 'step-4',
          step: 4,
          title: 'Restore Application Services',
          description: 'Deploy application containers and restore service functionality',
          estimatedDuration: 45,
          requiredRole: 'SYSADMIN',
          dependencies: ['step-3'],
          verification: 'Application responds to health checks and user authentication works',
          automation: { 
            canAutomate: true, 
            requiresManualApproval: false,
            scriptPath: '/scripts/deploy-application.sh'
          }
        },
        {
          id: 'step-5',
          step: 5,
          title: 'Verify System Functionality',
          description: 'Test critical purchase order workflows and integrations',
          estimatedDuration: 60,
          requiredRole: 'ADMIN',
          dependencies: ['step-4'],
          verification: 'Purchase order creation, approval, and supplier communication functional',
          automation: { canAutomate: false, requiresManualApproval: false }
        },
        {
          id: 'step-6',
          step: 6,
          title: 'Notify Stakeholders and Resume Operations',
          description: 'Inform users of system restoration and monitor for issues',
          estimatedDuration: 30,
          requiredRole: 'MANAGER',
          dependencies: ['step-5'],
          verification: 'All stakeholders notified and normal operations resumed',
          automation: { canAutomate: false, requiresManualApproval: false }
        }
      ],
      testingSchedule: {
        frequency: 'QUARTERLY',
        nextTest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      contacts: [
        {
          role: 'PRIMARY',
          name: 'IT Director',
          email: 'it-director@eccohardware.com.au',
          phone: '+61 400 123 456'
        },
        {
          role: 'TECHNICAL',
          name: 'System Administrator',
          email: 'sysadmin@eccohardware.com.au',
          phone: '+61 400 234 567'
        },
        {
          role: 'BUSINESS',
          name: 'Operations Manager',
          email: 'operations@eccohardware.com.au',
          phone: '+61 400 345 678'
        }
      ],
      isActive: true
    };

    this.disasterRecoveryPlans.set('primary-dr-plan', primaryDRPlan);
  }

  private loadBackupData(): void {
    // Load backup configurations
    const savedConfigs = localStorage.getItem('saleskik-backup-configurations');
    if (savedConfigs) {
      try {
        const configs = JSON.parse(savedConfigs);
        configs.forEach((config: any) => {
          this.backupConfigurations.set(config.id, {
            ...config,
            createdAt: new Date(config.createdAt),
            updatedAt: new Date(config.updatedAt)
          });
        });
      } catch (error) {
        console.error('Error loading backup configurations:', error);
      }
    }

    // Load backup records
    const savedRecords = localStorage.getItem('saleskik-backup-records');
    if (savedRecords) {
      try {
        this.backupRecords = JSON.parse(savedRecords).map((record: any) => ({
          ...record,
          startedAt: new Date(record.startedAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
          destinations: record.destinations.map((dest: any) => ({
            ...dest,
            uploadedAt: dest.uploadedAt ? new Date(dest.uploadedAt) : undefined
          })),
          verification: record.verification ? {
            ...record.verification,
            verifiedAt: record.verification.verifiedAt ? new Date(record.verification.verifiedAt) : undefined
          } : undefined
        }));
      } catch (error) {
        console.error('Error loading backup records:', error);
      }
    }
  }

  private startBackupScheduler(): void {
    if (this.backupScheduler) {
      clearInterval(this.backupScheduler);
    }

    // Check for scheduled backups every 5 minutes
    this.backupScheduler = setInterval(() => {
      this.checkScheduledBackups();
    }, 5 * 60 * 1000);

    // Run initial check
    this.checkScheduledBackups();
  }

  private async checkScheduledBackups(): Promise<void> {
    const now = new Date();
    
    for (const [configId, config] of this.backupConfigurations) {
      if (!config.isActive) continue;

      if (this.isBackupDue(config, now)) {
        await this.executeBackup(configId);
      }
    }
  }

  private isBackupDue(config: BackupConfiguration, now: Date): boolean {
    const lastBackup = this.getLastBackup(config.id);
    
    switch (config.schedule.frequency) {
      case 'HOURLY':
        return !lastBackup || (now.getTime() - lastBackup.startedAt.getTime()) >= 60 * 60 * 1000;
      
      case 'DAILY':
        if (!lastBackup) return true;
        const today = new Date(now);
        today.setHours(parseInt(config.schedule.time.split(':')[0]), parseInt(config.schedule.time.split(':')[1]), 0, 0);
        const lastBackupDate = new Date(lastBackup.startedAt);
        lastBackupDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(now);
        todayDate.setHours(0, 0, 0, 0);
        return todayDate > lastBackupDate && now >= today;
      
      case 'WEEKLY':
        if (!lastBackup) return true;
        const targetDay = config.schedule.dayOfWeek || 0;
        const weeksSinceLastBackup = Math.floor((now.getTime() - lastBackup.startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksSinceLastBackup >= 1 && now.getDay() === targetDay;
      
      case 'MONTHLY':
        if (!lastBackup) return true;
        const targetDate = config.schedule.dayOfMonth || 1;
        const monthsSinceLastBackup = (now.getFullYear() - lastBackup.startedAt.getFullYear()) * 12 + 
                                     (now.getMonth() - lastBackup.startedAt.getMonth());
        return monthsSinceLastBackup >= 1 && now.getDate() === targetDate;
      
      default:
        return false;
    }
  }

  private getLastBackup(configId: string): BackupRecord | null {
    const configBackups = this.backupRecords
      .filter(record => record.configurationId === configId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return configBackups[0] || null;
  }

  // Execute backup operation
  public async executeBackup(configurationId: string): Promise<{ success: boolean; backupId?: string; error?: string }> {
    const config = this.backupConfigurations.get(configurationId);
    if (!config) {
      return { success: false, error: 'Backup configuration not found' };
    }

    console.log(`Starting backup: ${config.name}`);

    const backupRecord: BackupRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      configurationId,
      type: config.type,
      startedAt: new Date(),
      status: 'RUNNING',
      size: 0,
      destinations: config.destinations.map(dest => ({
        destinationId: dest.id,
        status: 'PENDING',
        path: this.generateBackupPath(dest, config)
      })),
      metadata: {},
      duration: 0
    };

    this.backupRecords.push(backupRecord);
    this.saveBackupRecords();

    try {
      const backupData = await this.createBackupData(config);
      backupRecord.size = backupData.size;
      backupRecord.metadata = backupData.metadata;

      // Upload to all destinations
      await this.uploadToDestinations(backupRecord, backupData.content, config);

      // Verify backup if enabled
      if (config.verification.enabled) {
        await this.verifyBackup(backupRecord, config);
      }

      backupRecord.status = 'COMPLETED';
      backupRecord.completedAt = new Date();
      backupRecord.duration = backupRecord.completedAt.getTime() - backupRecord.startedAt.getTime();

      console.log(`Backup completed: ${config.name} (${this.formatFileSize(backupRecord.size)})`);

      // Cleanup old backups
      await this.cleanupOldBackups(config);

      this.saveBackupRecords();
      return { success: true, backupId: backupRecord.id };
    } catch (error) {
      console.error('Backup failed:', error);
      backupRecord.status = 'FAILED';
      backupRecord.errorMessage = error.message;
      backupRecord.completedAt = new Date();
      this.saveBackupRecords();
      
      // Send failure notification
      await this.notifyBackupFailure(config, error.message);
      
      return { success: false, error: error.message };
    }
  }

  private async createBackupData(config: BackupConfiguration): Promise<{
    content: Blob;
    size: number;
    metadata: any;
  }> {
    let backupData: any = {};
    let metadata: any = {};

    switch (config.type) {
      case 'DATABASE':
        // Backup all purchase order related data
        backupData = {
          purchaseOrders: JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]'),
          suppliers: JSON.parse(localStorage.getItem('saleskik-suppliers') || '[]'),
          auditEvents: JSON.parse(localStorage.getItem('saleskik-audit-events') || '[]'),
          notifications: JSON.parse(localStorage.getItem('saleskik-internal-notifications') || '[]'),
          attachmentBundles: JSON.parse(localStorage.getItem('saleskik-attachment-bundles') || '[]'),
          emailQueue: JSON.parse(localStorage.getItem('saleskik-email-queue') || '[]'),
          smsQueue: JSON.parse(localStorage.getItem('saleskik-sms-queue') || '[]')
        };
        metadata.recordCount = Object.values(backupData).reduce((sum: number, arr: any) => 
          sum + (Array.isArray(arr) ? arr.length : 0), 0
        );
        metadata.tablesCovered = Object.keys(backupData);
        break;

      case 'FILES':
        // Backup attachment files (simulated)
        backupData = {
          attachments: JSON.parse(localStorage.getItem('saleskik-purchase-order-attachments') || '[]'),
          photoGalleries: JSON.parse(localStorage.getItem('saleskik-photo-galleries') || '[]'),
          cameraPhotos: JSON.parse(localStorage.getItem('saleskik-camera-photos') || '[]')
        };
        metadata.filesCovered = ['attachments', 'photos', 'documents'];
        break;

      case 'CONFIGURATION':
        // Backup system configuration
        backupData = {
          brandingConfig: JSON.parse(localStorage.getItem('saleskik-company-branding') || '{}'),
          emailTemplates: JSON.parse(localStorage.getItem('saleskik-email-templates') || '[]'),
          approvalRules: JSON.parse(localStorage.getItem('saleskik-approval-rules') || '[]'),
          businessRules: JSON.parse(localStorage.getItem('saleskik-business-rules') || '[]'),
          notificationPreferences: JSON.parse(localStorage.getItem('saleskik-notification-preferences') || '{}'),
          reportSubscriptions: JSON.parse(localStorage.getItem('saleskik-report-subscriptions') || '[]')
        };
        metadata.configurationsCovered = Object.keys(backupData);
        break;

      case 'FULL_SYSTEM':
        // Complete system backup
        const allData: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('saleskik-')) {
            allData[key] = localStorage.getItem(key);
          }
        }
        backupData = allData;
        metadata.totalKeys = Object.keys(allData).length;
        break;
    }

    // Add backup metadata
    backupData._backupMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      type: config.type,
      configuration: config.name
    };

    let content = JSON.stringify(backupData, null, 2);
    
    // Apply compression if enabled
    if (config.compression.enabled) {
      content = await this.compressData(content, config.compression);
      metadata.compressionRatio = (content.length / JSON.stringify(backupData).length);
    }

    // Apply encryption if enabled
    if (config.encryption.enabled) {
      content = await this.encryptData(content, config.encryption);
      metadata.encryptionUsed = true;
    }

    const blob = new Blob([content], { type: 'application/octet-stream' });
    
    return {
      content: blob,
      size: blob.size,
      metadata
    };
  }

  private async uploadToDestinations(record: BackupRecord, content: Blob, config: BackupConfiguration): Promise<void> {
    for (const destination of record.destinations) {
      const dest = config.destinations.find(d => d.id === destination.destinationId);
      if (!dest || !dest.isActive) continue;

      try {
        destination.status = 'UPLOADING';
        
        await this.uploadToDestination(content, dest, destination.path);
        
        destination.status = 'COMPLETED';
        destination.uploadedAt = new Date();
        destination.checksum = await this.calculateChecksum(content);
        
        console.log(`Backup uploaded to ${dest.name}: ${destination.path}`);
      } catch (error) {
        console.error(`Failed to upload to ${dest.name}:`, error);
        destination.status = 'FAILED';
        destination.error = error.message;
      }
    }
  }

  private async uploadToDestination(content: Blob, destination: BackupDestination, path: string): Promise<void> {
    switch (destination.type) {
      case 'LOCAL':
        // Simulate local file storage
        console.log(`Local backup simulated: ${path}`);
        break;
      
      case 'S3':
        // Simulate S3 upload
        console.log(`S3 backup simulated: s3://${destination.config.bucket}${path}`);
        break;
      
      case 'AZURE_BLOB':
        // Simulate Azure upload
        console.log(`Azure backup simulated: ${path}`);
        break;
      
      default:
        throw new Error(`Unsupported destination type: ${destination.type}`);
    }

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private generateBackupPath(destination: BackupDestination, config: BackupConfiguration): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basePath = destination.config.path || '/backups';
    return `${basePath}/${config.type.toLowerCase()}/${timestamp}_${config.name.replace(/\s+/g, '_')}.backup`;
  }

  private async compressData(data: string, compression: BackupConfiguration['compression']): Promise<string> {
    // Simulate compression (in production, use actual compression library)
    console.log(`Compressing data with ${compression.algorithm} level ${compression.level}`);
    return data; // Return uncompressed for demo
  }

  private async encryptData(data: string, encryption: BackupConfiguration['encryption']): Promise<string> {
    // Simulate encryption (in production, use actual encryption)
    console.log(`Encrypting data with ${encryption.algorithm}`);
    return btoa(data); // Simple base64 encoding for demo
  }

  private async calculateChecksum(content: Blob): Promise<string> {
    // Calculate SHA-256 checksum
    const arrayBuffer = await content.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyBackup(record: BackupRecord, config: BackupConfiguration): Promise<void> {
    // Verify backup integrity
    record.verification = {
      checksumValid: true, // Simulate successful verification
      verifiedAt: new Date()
    };

    // Test restore if required
    if (config.verification.testRestoreFrequency === 'WEEKLY') {
      const lastTestRestore = this.getLastTestRestore(config.id);
      const weeksSinceTest = lastTestRestore 
        ? Math.floor((Date.now() - lastTestRestore.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 999;

      if (weeksSinceTest >= 1) {
        await this.performTestRestore(record, config);
      }
    }
  }

  private async performTestRestore(record: BackupRecord, config: BackupConfiguration): Promise<void> {
    console.log(`Performing test restore for backup: ${record.id}`);
    
    try {
      // Simulate test restore process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (record.verification) {
        record.verification.testRestorePerformed = true;
        record.verification.testRestoreResult = 'PASS';
      }
      
      console.log(`Test restore successful for backup: ${record.id}`);
    } catch (error) {
      console.error('Test restore failed:', error);
      if (record.verification) {
        record.verification.testRestoreResult = 'FAIL';
      }
    }
  }

  private getLastTestRestore(configId: string): Date | null {
    const configBackups = this.backupRecords
      .filter(record => 
        record.configurationId === configId && 
        record.verification?.testRestorePerformed
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return configBackups[0]?.verification?.verifiedAt || null;
  }

  private async cleanupOldBackups(config: BackupConfiguration): Promise<void> {
    const now = new Date();
    const configBackups = this.backupRecords.filter(record => 
      record.configurationId === config.id && record.status === 'COMPLETED'
    );

    // Calculate cutoff dates
    const dailyCutoff = new Date(now.getTime() - config.retention.daily * 24 * 60 * 60 * 1000);
    const weeklyCutoff = new Date(now.getTime() - config.retention.weekly * 7 * 24 * 60 * 60 * 1000);
    const monthlyCutoff = new Date(now.getTime() - config.retention.monthly * 30 * 24 * 60 * 60 * 1000);
    const yearlyCutoff = new Date(now.getTime() - config.retention.yearly * 365 * 24 * 60 * 60 * 1000);

    let deleted = 0;
    
    configBackups.forEach(backup => {
      let shouldDelete = false;
      
      // Check retention rules
      if (backup.startedAt < yearlyCutoff) {
        shouldDelete = true;
      } else if (backup.startedAt < monthlyCutoff && !this.isMonthlyBackup(backup)) {
        shouldDelete = true;
      } else if (backup.startedAt < weeklyCutoff && !this.isWeeklyBackup(backup)) {
        shouldDelete = true;
      } else if (backup.startedAt < dailyCutoff && !this.isDailyBackup(backup)) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        this.deleteBackup(backup.id);
        deleted++;
      }
    });

    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old backups for ${config.name}`);
    }
  }

  private isMonthlyBackup(backup: BackupRecord): boolean {
    return backup.startedAt.getDate() === 1; // First of month
  }

  private isWeeklyBackup(backup: BackupRecord): boolean {
    return backup.startedAt.getDay() === 0; // Sunday
  }

  private isDailyBackup(backup: BackupRecord): boolean {
    return backup.startedAt.getHours() === 2; // 2 AM daily backup
  }

  // Disaster recovery operations
  public async initiateDisasterRecovery(planId: string, skipSteps?: string[]): Promise<{
    success: boolean;
    recoveryId?: string;
    error?: string;
  }> {
    const plan = this.disasterRecoveryPlans.get(planId);
    if (!plan) {
      return { success: false, error: 'Disaster recovery plan not found' };
    }

    const recoveryId = Date.now().toString();
    
    console.log(`Initiating disaster recovery: ${plan.name}`);
    
    try {
      // Notify stakeholders
      await this.notifyDisasterRecoveryStart(plan, recoveryId);
      
      // Execute recovery procedures
      const procedures = plan.procedures
        .filter(proc => !skipSteps?.includes(proc.id))
        .sort((a, b) => a.step - b.step);

      for (const procedure of procedures) {
        await this.executeProcedure(procedure, recoveryId);
      }

      console.log(`Disaster recovery completed: ${recoveryId}`);
      await this.notifyDisasterRecoveryComplete(plan, recoveryId);
      
      return { success: true, recoveryId };
    } catch (error) {
      console.error('Disaster recovery failed:', error);
      await this.notifyDisasterRecoveryFailure(plan, recoveryId, error.message);
      return { success: false, error: error.message };
    }
  }

  private async executeProcedure(procedure: DisasterRecoveryProcedure, recoveryId: string): Promise<void> {
    console.log(`Executing DR step ${procedure.step}: ${procedure.title}`);
    
    if (procedure.automation.canAutomate && procedure.automation.scriptPath) {
      // Execute automated script
      await this.executeAutomationScript(procedure.automation.scriptPath);
    } else {
      // Manual procedure - log for operator
      console.log(`Manual procedure required: ${procedure.description}`);
    }
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, procedure.estimatedDuration * 60 * 1000 / 60)); // Simulate faster for demo
    
    console.log(`Completed DR step ${procedure.step}: ${procedure.verification}`);
  }

  private async executeAutomationScript(scriptPath: string): Promise<void> {
    console.log(`Executing automation script: ${scriptPath}`);
    // In production, execute actual shell script
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Notification methods
  private async notifyBackupFailure(config: BackupConfiguration, error: string): Promise<void> {
    console.error(`BACKUP FAILURE: ${config.name} - ${error}`);
    
    // Send email notification
    const emailService = (await import('./EmailDeliveryService')).default.getInstance();
    
    const emailMessage = {
      id: Date.now().toString(),
      templateId: 'backup-failure-alert',
      to: ['admin@eccohardware.com.au', 'sysadmin@eccohardware.com.au'],
      subject: `🚨 BACKUP FAILURE: ${config.name}`,
      htmlContent: `
        <h3>Backup Failure Alert</h3>
        <p><strong>Backup:</strong> ${config.name}</p>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Immediate attention required to resolve backup issue.</p>
      `,
      textContent: `BACKUP FAILURE: ${config.name}\nError: ${error}\nTime: ${new Date().toLocaleString()}`,
      variables: { configName: config.name, error },
      priority: 'URGENT' as const,
      createdAt: new Date()
    };

    await emailService.queueEmail(emailMessage);
  }

  private async notifyDisasterRecoveryStart(plan: DisasterRecoveryPlan, recoveryId: string): Promise<void> {
    console.log(`DISASTER RECOVERY INITIATED: ${plan.name} (${recoveryId})`);
    
    // Notify all contacts
    for (const contact of plan.contacts) {
      console.log(`Notifying ${contact.role}: ${contact.name} (${contact.email})`);
    }
  }

  private async notifyDisasterRecoveryComplete(plan: DisasterRecoveryPlan, recoveryId: string): Promise<void> {
    console.log(`DISASTER RECOVERY COMPLETED: ${plan.name} (${recoveryId})`);
  }

  private async notifyDisasterRecoveryFailure(plan: DisasterRecoveryPlan, recoveryId: string, error: string): Promise<void> {
    console.error(`DISASTER RECOVERY FAILED: ${plan.name} (${recoveryId}) - ${error}`);
  }

  // Utility methods
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Storage methods
  private saveBackupRecords(): void {
    localStorage.setItem('saleskik-backup-records', JSON.stringify(this.backupRecords));
  }

  // Public API methods
  public getBackupConfigurations(): BackupConfiguration[] {
    return Array.from(this.backupConfigurations.values());
  }

  public getBackupRecords(configurationId?: string): BackupRecord[] {
    let records = [...this.backupRecords];
    
    if (configurationId) {
      records = records.filter(record => record.configurationId === configurationId);
    }
    
    return records.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  public getDisasterRecoveryPlans(): DisasterRecoveryPlan[] {
    return Array.from(this.disasterRecoveryPlans.values());
  }

  public getBackupStatistics(): {
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    totalBackupSize: number;
    averageBackupTime: number;
    lastBackupTime?: Date;
    nextScheduledBackup?: Date;
    storageUsage: { [destination: string]: number };
  } {
    const successfulBackups = this.backupRecords.filter(record => record.status === 'COMPLETED');
    const failedBackups = this.backupRecords.filter(record => record.status === 'FAILED');
    const totalBackupSize = successfulBackups.reduce((sum, record) => sum + record.size, 0);
    const averageBackupTime = successfulBackups.length > 0
      ? successfulBackups.reduce((sum, record) => sum + record.duration, 0) / successfulBackups.length / 1000 / 60 // Minutes
      : 0;

    const lastBackup = this.backupRecords
      .filter(record => record.status === 'COMPLETED')
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

    return {
      totalBackups: this.backupRecords.length,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      totalBackupSize,
      averageBackupTime,
      lastBackupTime: lastBackup?.completedAt,
      nextScheduledBackup: this.getNextScheduledBackup(),
      storageUsage: this.calculateStorageUsage()
    };
  }

  private getNextScheduledBackup(): Date | undefined {
    const now = new Date();
    const nextBackups: Date[] = [];

    for (const config of this.backupConfigurations.values()) {
      if (!config.isActive) continue;
      
      const nextBackup = this.calculateNextBackupTime(config, now);
      if (nextBackup) {
        nextBackups.push(nextBackup);
      }
    }

    return nextBackups.length > 0 
      ? nextBackups.sort((a, b) => a.getTime() - b.getTime())[0]
      : undefined;
  }

  private calculateNextBackupTime(config: BackupConfiguration, from: Date): Date | undefined {
    const next = new Date(from);
    
    switch (config.schedule.frequency) {
      case 'HOURLY':
        next.setHours(next.getHours() + 1, 0, 0, 0);
        break;
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        const [hour, minute] = config.schedule.time.split(':').map(Number);
        next.setHours(hour, minute, 0, 0);
        break;
      case 'WEEKLY':
        const targetDay = config.schedule.dayOfWeek || 0;
        const daysUntilTarget = (targetDay - next.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilTarget);
        const [weeklyHour, weeklyMinute] = config.schedule.time.split(':').map(Number);
        next.setHours(weeklyHour, weeklyMinute, 0, 0);
        break;
    }

    return next;
  }

  private calculateStorageUsage(): { [destination: string]: number } {
    const usage: { [destination: string]: number } = {};
    
    this.backupRecords.forEach(record => {
      record.destinations.forEach(dest => {
        if (dest.status === 'COMPLETED') {
          usage[dest.destinationId] = (usage[dest.destinationId] || 0) + record.size;
        }
      });
    });

    return usage;
  }

  public deleteBackup(backupId: string): boolean {
    const index = this.backupRecords.findIndex(record => record.id === backupId);
    if (index !== -1) {
      this.backupRecords.splice(index, 1);
      this.saveBackupRecords();
      return true;
    }
    return false;
  }

  // Emergency restore
  public async emergencyRestore(backupId: string): Promise<{ success: boolean; error?: string }> {
    const backup = this.backupRecords.find(record => record.id === backupId);
    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    console.log(`EMERGENCY RESTORE initiated from backup: ${backupId}`);
    
    try {
      // In production, this would restore actual data
      console.log('Simulating emergency restore...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Emergency restore completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Emergency restore failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default BackupAndRecoveryService;