import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export interface Form {
  id: string;
  title: string;
  content: string;
  theme?: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id?: number;
  form_id: string;
  content: string;
  created_at: string;
}

class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return; // Already initialized
    }

    try {
      const projectId = await AsyncStorage.getItem('project');
      const databaseName = projectId ? `surveyr_${projectId}.db` : 'surveyr_default.db';

      console.log('Initializing database:', databaseName);
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
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          form_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions (form_id);
      `);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
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

      await this.db.withTransactionAsync(async () => {
        for (const form of forms) {
          const now = new Date().toISOString();
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO forms (id, title, content, theme, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [form.id, form.title, form.content, form.theme || '', form.created_at || now, now]
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

      const result = await this.db.getAllAsync('SELECT * FROM forms ORDER BY updated_at DESC');
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

      const result = await this.db.getFirstAsync('SELECT * FROM forms WHERE id = ?', [formId]);
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

      await this.db.withTransactionAsync(async () => {
        // Delete associated submissions first
        await this.db!.runAsync('DELETE FROM submissions WHERE form_id = ?', [formId]);
        // Delete the form
        await this.db!.runAsync('DELETE FROM forms WHERE id = ?', [formId]);
      });

      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      return false;
    }
  }

  // Submissions methods
  public async addSubmission(submission: Omit<Submission, 'id'>): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      await this.db.runAsync(
        'INSERT INTO submissions (form_id, content, created_at) VALUES (?, ?, ?)',
        [submission.form_id, submission.content, submission.created_at || now]
      );

      return true;
    } catch (error) {
      console.error('Error adding submission:', error);
      return false;
    }
  }

  public async getSubmissionsByFormId(formId: string): Promise<Submission[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      const result = await this.db.getAllAsync(
        'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC',
        [formId]
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

      await this.db.runAsync('DELETE FROM submissions WHERE form_id = ?', [formId]);
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

      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM submissions');
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

      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM submissions WHERE form_id = ?',
        [formId]
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

      const result = await this.db.getAllAsync(`
        SELECT DISTINCT f.* 
        FROM forms f 
        INNER JOIN submissions s ON f.id = s.form_id 
        ORDER BY s.created_at DESC 
        LIMIT ?
      `, [limit]);
      
      return result as Form[];
    } catch (error) {
      console.error('Error fetching forms with recent submissions:', error);
      return [];
    }
  }

  // Utility method to close database (optional, for cleanup)
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export individual functions for backward compatibility
export const addForms = (forms: Form[]) => database.addForms(forms);
export const getForms = () => database.getForms();
export const getFormById = (formId: string) => database.getFormById(formId);
export const deleteForm = (formId: string) => database.deleteForm(formId);
export const addSubmission = (submission: Omit<Submission, 'id'>) => database.addSubmission(submission);
export const getSubmissionsByFormId = (formId: string) => database.getSubmissionsByFormId(formId);
export const clearSubmissionsByFormId = (formId: string) => database.clearSubmissionsByFormId(formId);
export const countSubmissions = () => database.countSubmissions();
export const countSubmissionsByFormId = (formId: string) => database.countSubmissionsByFormId(formId);
export const getFormsWithRecentSubmissions = (limit?: number) => database.getFormsWithRecentSubmissions(limit);
