import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export interface Form {
  id: string;
  title: string;
  content: string;
  theme?: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id?: number;
  form_id: string;
  content: string;
  project_id: string;
  created_at: string;
}

export interface FileRecord {
  id?: number;
  local_filename: string;
  original_filename: string;
  server_url: string;
  local_path: string;
  file_size?: number;
  mime_type?: string;
  form_id: string;
  submission_id?: number;
  project_id: string;
  is_synced: boolean;
  created_at: string;
}

export interface Zone {
  id?: number;
  zone_id: string;
  name: string;
  hash: string;
  content: string;
  project_id: string;
  downloaded_at: string;
  updated_at: string;
}

class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private currentProjectId: string | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const projectId = await AsyncStorage.getItem('project');
      if (!projectId) {
        throw new Error('No project ID found in AsyncStorage');
      }
      
      // Check if we need to switch to a different project
      if (this.currentProjectId && this.currentProjectId !== projectId) {
        console.log(`Project changed from ${this.currentProjectId} to ${projectId}, switching databases...`);
        await this.switchProject(projectId);
        return;
      }
      
      // If already initialized with the same project, return early
      if (this.initialized && this.db && this.currentProjectId === projectId) {
        return;
      }
      
      this.currentProjectId = projectId;
      const databaseName = `surveyr_${projectId}.db`;

      console.log('Initializing database:', databaseName, 'for project:', projectId);
      
      // Close existing connection if any
      if (this.db) {
        await this.db.closeAsync();
      }
      
      this.db = await SQLite.openDatabaseAsync(databaseName);
      await this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      this.initialized = false;
      throw error;
    }
  }

  private async getCurrentProjectId(): Promise<string> {
    // Always get the latest project ID from AsyncStorage to handle project switches
    const projectId = await AsyncStorage.getItem('project');
    if (!projectId) {
      throw new Error('No project ID found in AsyncStorage');
    }
    
    // Update cached project ID if it's different
    if (this.currentProjectId !== projectId) {
      console.log(`Project ID changed from ${this.currentProjectId} to ${projectId}`);
      this.currentProjectId = projectId;
    }
    
    return projectId;
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS forms (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          theme TEXT,
          project_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          form_id TEXT NOT NULL,
          content TEXT NOT NULL,
          project_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (form_id) REFERENCES forms (id)
        );

        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          local_filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          server_url TEXT NOT NULL,
          local_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          form_id TEXT NOT NULL,
          submission_id INTEGER,
          project_id TEXT NOT NULL,
          is_synced BOOLEAN DEFAULT FALSE,
          created_at TEXT NOT NULL,
          FOREIGN KEY (form_id) REFERENCES forms (id),
          FOREIGN KEY (submission_id) REFERENCES submissions (id)
        );

        CREATE TABLE IF NOT EXISTS zones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          zone_id TEXT NOT NULL,
          name TEXT NOT NULL,
          hash TEXT NOT NULL,
          content TEXT NOT NULL,
          project_id TEXT NOT NULL,
          downloaded_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(zone_id, project_id)
        );

        CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms (project_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions (form_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON submissions (project_id);
        CREATE INDEX IF NOT EXISTS idx_files_form_id ON files (form_id);
        CREATE INDEX IF NOT EXISTS idx_files_submission_id ON files (submission_id);
        CREATE INDEX IF NOT EXISTS idx_files_project_id ON files (project_id);
        CREATE INDEX IF NOT EXISTS idx_files_is_synced ON files (is_synced);
        CREATE INDEX IF NOT EXISTS idx_zones_zone_id ON zones (zone_id);
        CREATE INDEX IF NOT EXISTS idx_zones_project_id ON zones (project_id);
      `);
      
      // Migration: Add project_id to existing tables if they don't have it
      await this.migrateExistingData();
      
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async migrateExistingData(): Promise<void> {
    if (!this.db || !this.currentProjectId) return;

    try {
      // Check if project_id column exists in forms table
      const formsColumns = await this.db.getAllAsync("PRAGMA table_info(forms)");
      const hasFormsProjectId = formsColumns.some((col: any) => col.name === 'project_id');

      if (!hasFormsProjectId) {
        console.log('Migrating forms table to include project_id');
        await this.db.execAsync(`
          ALTER TABLE forms ADD COLUMN project_id TEXT;
          UPDATE forms SET project_id = '${this.currentProjectId}' WHERE project_id IS NULL;
        `);
      }

      // Check if project_id column exists in submissions table
      const submissionsColumns = await this.db.getAllAsync("PRAGMA table_info(submissions)");
      const hasSubmissionsProjectId = submissionsColumns.some((col: any) => col.name === 'project_id');

      if (!hasSubmissionsProjectId) {
        console.log('Migrating submissions table to include project_id');
        await this.db.execAsync(`
          ALTER TABLE submissions ADD COLUMN project_id TEXT;
          UPDATE submissions SET project_id = '${this.currentProjectId}' WHERE project_id IS NULL;
        `);
      }

      // Check if project_id column exists in files table
      const filesColumns = await this.db.getAllAsync("PRAGMA table_info(files)");
      const hasFilesProjectId = filesColumns.some((col: any) => col.name === 'project_id');

      if (!hasFilesProjectId) {
        // Add project_id column to files table
        await this.db.execAsync(`
          ALTER TABLE files ADD COLUMN project_id TEXT;
          UPDATE files SET project_id = '${this.currentProjectId}' WHERE project_id IS NULL;
        `);
        console.log('Added project_id column to files table');
      }

      // Migrate existing zone data from AsyncStorage to database (one-time migration)
      await this.migrateZonesFromAsyncStorage();

      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during data migration:', error);
      // Don't throw here, let the app continue with existing data
    }
  }

  private async migrateZonesFromAsyncStorage(): Promise<void> {
    try {
      const zonesString = await AsyncStorage.getItem('zones');
      if (!zonesString) return; // No zones to migrate

      const zones = JSON.parse(zonesString);
      const zonesToMigrate: Omit<Zone, 'id' | 'project_id'>[] = [];

      for (const [, zoneData] of Object.entries(zones)) {
        const zone = zoneData as any;
        if (zone.id && zone.name && zone.hash && zone.content) {
          zonesToMigrate.push({
            zone_id: zone.id,
            name: zone.name,
            hash: zone.hash,
            content: JSON.stringify(zone.content),
            downloaded_at: zone.downloaded_at || new Date().toISOString(),
            updated_at: zone.downloaded_at || new Date().toISOString()
          });
        }
      }

      if (zonesToMigrate.length > 0) {
        await this.addZones(zonesToMigrate);
        console.log(`Migrated ${zonesToMigrate.length} zones from AsyncStorage to database`);
        
        // Optionally remove from AsyncStorage after successful migration
        // await AsyncStorage.removeItem('zones');
      }
    } catch (error) {
      console.error('Error migrating zones from AsyncStorage:', error);
      // Don't throw, let the app continue
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }
  }

  // Forms methods
  public async addForms(forms: Form[]): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();

      await this.db.withTransactionAsync(async () => {
        for (const form of forms) {
          const now = new Date().toISOString();
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO forms (id, title, content, theme, project_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [form.id, form.title, form.content, form.theme || '', projectId, form.created_at || now, now]
          );
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding forms:', error);
      return false;
    }
  }

  public async getForms(): Promise<Form[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM forms WHERE project_id = ? ORDER BY updated_at DESC',
        [projectId]
      );
      return result as Form[];
    } catch (error) {
      console.error('Error fetching forms:', error);
      return [];
    }
  }

  public async getFormById(formId: string): Promise<Form | null> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(
        'SELECT * FROM forms WHERE id = ? AND project_id = ?',
        [formId, projectId]
      );
      return result as Form | null;
    } catch (error) {
      console.error('Error fetching form:', error);
      return null;
    }
  }

  public async deleteForm(formId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();

      await this.db.withTransactionAsync(async () => {
        // Delete associated files first
        await this.db!.runAsync(
          'DELETE FROM files WHERE form_id = ? AND project_id = ?',
          [formId, projectId]
        );
        // Delete associated submissions
        await this.db!.runAsync(
          'DELETE FROM submissions WHERE form_id = ? AND project_id = ?',
          [formId, projectId]
        );
        // Delete the form
        await this.db!.runAsync(
          'DELETE FROM forms WHERE id = ? AND project_id = ?',
          [formId, projectId]
        );
      });

      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      return false;
    }
  }

  // Submissions methods
  public async addSubmission(submission: Omit<Submission, 'id' | 'project_id'>): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const now = new Date().toISOString();
      const result = await this.db.runAsync(
        'INSERT INTO submissions (form_id, content, project_id, created_at) VALUES (?, ?, ?, ?)',
        [submission.form_id, submission.content, projectId, submission.created_at || now]
      );

      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  }

  public async getSubmissionsByFormId(formId: string): Promise<Submission[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM submissions WHERE form_id = ? AND project_id = ? ORDER BY created_at DESC',
        [formId, projectId]
      );
      return result as Submission[];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }

  public async clearSubmissionsByFormId(formId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      await this.db.runAsync(
        'DELETE FROM submissions WHERE form_id = ? AND project_id = ?',
        [formId, projectId]
      );
      return true;
    } catch (error) {
      console.error('Error clearing submissions:', error);
      return false;
    }
  }

  public async countSubmissions(): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM submissions WHERE project_id = ?',
        [projectId]
      );
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error counting submissions:', error);
      return 0;
    }
  }

  public async countSubmissionsByFormId(formId: string): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM submissions WHERE form_id = ? AND project_id = ?',
        [formId, projectId]
      );
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error counting submissions:', error);
      return 0;
    }
  }

  public async getFormsWithRecentSubmissions(limit: number = 5): Promise<Form[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(`
        SELECT DISTINCT f.* 
        FROM forms f 
        INNER JOIN submissions s ON f.id = s.form_id 
        WHERE f.project_id = ? AND s.project_id = ?
        ORDER BY s.created_at DESC 
        LIMIT ?
      `, [projectId, projectId, limit]);
      
      return result as Form[];
    } catch (error) {
      console.error('Error fetching forms with recent submissions:', error);
      return [];
    }
  }

  // Files methods
  public async addFile(file: Omit<FileRecord, 'id' | 'project_id'>): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.runAsync(
        `INSERT INTO files (local_filename, original_filename, server_url, local_path, file_size, mime_type, form_id, submission_id, project_id, is_synced, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file.local_filename,
          file.original_filename,
          file.server_url,
          file.local_path,
          file.file_size || null,
          file.mime_type || null,
          file.form_id,
          file.submission_id || null,
          projectId,
          file.is_synced ? 1 : 0,
          file.created_at
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  }

  public async getFilesByFormId(formId: string): Promise<FileRecord[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM files WHERE form_id = ? AND project_id = ? ORDER BY created_at DESC',
        [formId, projectId]
      );
      return result.map(row => ({
        ...(row as any),
        is_synced: Boolean((row as any).is_synced)
      }));
    } catch (error) {
      console.error('Error getting files by form ID:', error);
      return [];
    }
  }

  public async getFilesBySubmissionId(submissionId: number): Promise<FileRecord[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM files WHERE submission_id = ? AND project_id = ? ORDER BY created_at DESC',
        [submissionId, projectId]
      );
      return result.map(row => ({
        ...(row as any),
        is_synced: Boolean((row as any).is_synced)
      }));
    } catch (error) {
      console.error('Error getting files by submission ID:', error);
      return [];
    }
  }

  public async getUnsyncedFiles(): Promise<FileRecord[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM files WHERE is_synced = 0 AND project_id = ? ORDER BY created_at ASC',
        [projectId]
      );
      return result.map(row => ({
        ...(row as any),
        is_synced: Boolean((row as any).is_synced)
      }));
    } catch (error) {
      console.error('Error getting unsynced files:', error);
      return [];
    }
  }

  public async markFileAsSynced(fileId: number): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      await this.db.runAsync(
        'UPDATE files SET is_synced = 1 WHERE id = ? AND project_id = ?',
        [fileId, projectId]
      );
    } catch (error) {
      console.error('Error marking file as synced:', error);
      throw error;
    }
  }

  public async updateFileSubmissionId(fileId: number, submissionId: number): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      await this.db.runAsync(
        'UPDATE files SET submission_id = ? WHERE id = ? AND project_id = ?',
        [submissionId, fileId, projectId]
      );
    } catch (error) {
      console.error('Error updating file submission ID:', error);
      throw error;
    }
  }

  public async deleteFile(fileId: number): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      await this.db.runAsync(
        'DELETE FROM files WHERE id = ? AND project_id = ?',
        [fileId, projectId]
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  public async getFileStorageStats(): Promise<{ totalFiles: number; totalSize: number; unsyncedFiles: number }> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(`
        SELECT 
          COUNT(*) as totalFiles,
          COALESCE(SUM(file_size), 0) as totalSize,
          SUM(CASE WHEN is_synced = 0 THEN 1 ELSE 0 END) as unsyncedFiles
        FROM files
        WHERE project_id = ?
      `, [projectId]);
      
      return {
        totalFiles: (result as any)?.totalFiles || 0,
        totalSize: (result as any)?.totalSize || 0,
        unsyncedFiles: (result as any)?.unsyncedFiles || 0
      };
    } catch (error) {
      console.error('Error getting file storage stats:', error);
      return { totalFiles: 0, totalSize: 0, unsyncedFiles: 0 };
    }
  }

  // Zones methods
  public async addZones(zones: Omit<Zone, 'id' | 'project_id'>[]): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();

      await this.db.withTransactionAsync(async () => {
        for (const zone of zones) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO zones (zone_id, name, hash, content, project_id, downloaded_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              zone.zone_id,
              zone.name,
              zone.hash,
              zone.content,
              projectId,
              zone.downloaded_at,
              zone.updated_at
            ]
          );
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding zones:', error);
      return false;
    }
  }

  public async getZones(): Promise<Zone[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getAllAsync(
        'SELECT * FROM zones WHERE project_id = ? ORDER BY updated_at DESC',
        [projectId]
      );
      return result as Zone[];
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  }

  public async getZoneById(zoneId: string): Promise<Zone | null> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(
        'SELECT * FROM zones WHERE zone_id = ? AND project_id = ?',
        [zoneId, projectId]
      );
      return result as Zone | null;
    } catch (error) {
      console.error('Error fetching zone:', error);
      return null;
    }
  }

  public async deleteZone(zoneId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      await this.db.runAsync(
        'DELETE FROM zones WHERE zone_id = ? AND project_id = ?',
        [zoneId, projectId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting zone:', error);
      return false;
    }
  }

  public async getZoneContent(zoneId: string): Promise<any | null> {
    try {
      const zone = await this.getZoneById(zoneId);
      if (!zone) return null;
      
      return JSON.parse(zone.content);
    } catch (error) {
      console.error('Error parsing zone content:', error);
      return null;
    }
  }

  public async countZones(): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const projectId = await this.getCurrentProjectId();
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM zones WHERE project_id = ?',
        [projectId]
      );
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error counting zones:', error);
      return 0;
    }
  }

  // Project management methods
  public async switchProject(newProjectId: string): Promise<void> {
    try {
      console.log(`Switching from project ${this.currentProjectId || 'none'} to ${newProjectId}`);
      
      // Close current database connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      
      // Reset state
      this.initialized = false;
      this.currentProjectId = null;

      // Update AsyncStorage
      await AsyncStorage.setItem('project', newProjectId);

      // Set new project ID and initialize
      this.currentProjectId = newProjectId;
      const databaseName = `surveyr_${newProjectId}.db`;

      console.log('Opening new database:', databaseName);
      this.db = await SQLite.openDatabaseAsync(databaseName);
      await this.createTables();
      this.initialized = true;

      console.log('Successfully switched to project:', newProjectId);
    } catch (error) {
      console.error('Error switching project:', error);
      this.initialized = false;
      this.currentProjectId = null;
      throw error;
    }
  }

  public async getCurrentProject(): Promise<string | null> {
    try {
      return await this.getCurrentProjectId();
    } catch {
      return null;
    }
  }

  public async cleanupOnLogout(): Promise<void> {
    try {
      console.log('Starting database cleanup on logout...');
      
      // Close database connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      
      // Reset state completely
      this.initialized = false;
      this.currentProjectId = null;
      
      // Clear project information from AsyncStorage
      await AsyncStorage.multiRemove(['project', 'projectUrl', 'token', 'user']);

      console.log('Database cleanup completed on logout');
    } catch (error) {
      console.error('Error during database cleanup:', error);
      throw error;
    }
  }

  public async forceReinitialize(): Promise<void> {
    try {
      console.log('Forcing database reinitialization...');
      
      // Close existing connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      
      // Reset state
      this.initialized = false;
      this.currentProjectId = null;
      
      // Reinitialize
      await this.initialize();
      
      console.log('Database reinitialization completed');
    } catch (error) {
      console.error('Error during forced reinitialization:', error);
      throw error;
    }
  }

  public getDebugInfo(): { initialized: boolean; currentProjectId: string | null; hasDb: boolean } {
    return {
      initialized: this.initialized,
      currentProjectId: this.currentProjectId,
      hasDb: !!this.db
    };
  }

  // Utility method to close database (optional, for cleanup)
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }

  // Delete a submission by id
  public async deleteSubmission(submissionId: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    const projectId = await this.getCurrentProjectId();
    await this.db.runAsync(
      'DELETE FROM submissions WHERE id = ? AND project_id = ?',
      [submissionId, projectId]
    );
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export individual functions for backward compatibility
export const addForms = (forms: Form[]) => database.addForms(forms);
export const getForms = () => database.getForms();
export const getFormById = (formId: string) => database.getFormById(formId);
export const deleteForm = (formId: string) => database.deleteForm(formId);
export const addSubmission = (submission: Omit<Submission, 'id' | 'project_id'>) => database.addSubmission(submission);
export const getSubmissionsByFormId = (formId: string) => database.getSubmissionsByFormId(formId);
export const clearSubmissionsByFormId = (formId: string) => database.clearSubmissionsByFormId(formId);
export const countSubmissions = () => database.countSubmissions();
export const countSubmissionsByFormId = (formId: string) => database.countSubmissionsByFormId(formId);
export const getFormsWithRecentSubmissions = (limit?: number) => database.getFormsWithRecentSubmissions(limit);

// Zone exports
export const addZones = (zones: Omit<Zone, 'id' | 'project_id'>[]) => database.addZones(zones);
export const getZones = () => database.getZones();
export const getZoneById = (zoneId: string) => database.getZoneById(zoneId);
export const deleteZone = (zoneId: string) => database.deleteZone(zoneId);
export const getZoneContent = (zoneId: string) => database.getZoneContent(zoneId);
export const countZones = () => database.countZones();
