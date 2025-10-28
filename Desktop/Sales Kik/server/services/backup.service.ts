import fs from 'fs/promises';
import path from 'path';

interface BackupData {
  timestamp: Date;
  company_id: string;
  categories: any[];
  products: any[];
  version: string;
}

export class BackupService {
  private static instance: BackupService;
  private backupDir: string;

  private constructor() {
    this.backupDir = path.join(process.cwd(), 'data-backups');
    this.ensureBackupDir();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async saveCompanyData(companyId: string, categories: any[], products: any[]): Promise<void> {
    try {
      const filename = `company-${companyId}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      // Load existing backup to merge data
      let existingData: BackupData = {
        timestamp: new Date(),
        company_id: companyId,
        categories: [],
        products: [],
        version: '1.0'
      };
      
      try {
        const existing = await fs.readFile(filepath, 'utf-8');
        existingData = JSON.parse(existing);
      } catch {
        // No existing backup, use defaults
      }
      
      // Merge new data with existing
      const backupData: BackupData = {
        timestamp: new Date(),
        company_id: companyId,
        categories: categories.length > 0 ? categories : existingData.categories,
        products: products.length > 0 ? products : existingData.products,
        version: '1.0'
      };

      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
      console.log(`💾 Backup saved for company ${companyId}: ${backupData.categories.length} categories, ${backupData.products.length} products`);
      
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  }

  async loadCompanyData(companyId: string): Promise<{categories: any[], products: any[]} | null> {
    try {
      const filename = `company-${companyId}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      const data = await fs.readFile(filepath, 'utf-8');
      const backupData: BackupData = JSON.parse(data);
      
      // Check if backup is recent (within 7 days)
      const daysSinceBackup = (Date.now() - new Date(backupData.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceBackup > 7) {
        console.warn(`⚠️ Backup for company ${companyId} is ${daysSinceBackup.toFixed(1)} days old`);
        return null;
      }

      console.log(`🚀 Loaded backup for company ${companyId}: ${backupData.categories.length} categories, ${backupData.products.length} products (${daysSinceBackup.toFixed(1)} days old)`);
      
      return {
        categories: backupData.categories,
        products: backupData.products
      };
      
    } catch (error) {
      console.log(`ℹ️ No backup found for company ${companyId}`);
      return null;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter(file => file.startsWith('company-') && file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }
}

export default BackupService.getInstance();