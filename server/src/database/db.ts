import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'campusnexus.sqlite');
const SCHEMA_FILE = path.resolve(__dirname, 'schema.sql');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database | null = null;
let isSaving = false;

export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Load and apply schema
  if (fs.existsSync(SCHEMA_FILE)) {
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    dbInstance.run(schemaSql);
    saveDatabase();
  }

  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized! Call initDatabase() first.');
  }
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance || isSaving) return;
  try {
    isSaving = true;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving database to disk:', err);
  } finally {
    isSaving = false;
  }
}

// Type-safe helper functions for query execution
export function dbGet<T = any>(sql: string, params: any[] = []): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params as SqlValue[]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as T;
      return row;
    }
    return undefined;
  } finally {
    stmt.free();
  }
}

export function dbAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  const rows: T[] = [];
  try {
    stmt.bind(params as SqlValue[]);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export function dbRun(sql: string, params: any[] = []): { changes: number } {
  const db = getDb();
  db.run(sql, params as SqlValue[]);
  saveDatabase();
  return { changes: 1 };
}

export function dbExec(sql: string): void {
  const db = getDb();
  db.run(sql);
  saveDatabase();
}
