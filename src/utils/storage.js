import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import config from '../config/config.js';

const DATA_DIR = config.DATA_DIR;
const TASKS_FILE = config.TASKS_FILE;

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads tasks from JSON file
 * @returns {Promise<Array>} Array of tasks
 */
export async function readTasks() {
  try {
    await ensureDataDirectory();
    
    if (!existsSync(TASKS_FILE)) {
      await writeTasks([]);
      return [];
    }
    
    const data = await readFile(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tasks:', error);
    return [];
  }
}

/**
 * Writes tasks to JSON file
 * @param {Array} tasks - Array of tasks to write
 */
export async function writeTasks(tasks) {
  try {
    await ensureDataDirectory();
    await writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('Error writing tasks:', error);
    throw error;
  }
}

/**
 * Backs up the current tasks file
 */
export async function backupTasks() {
  // Skip backup in test environment
  if (!config.BACKUP_ENABLED) {
    return;
  }
  
  try {
    if (existsSync(TASKS_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(DATA_DIR, `tasks-backup-${timestamp}.json`);
      const data = await readFile(TASKS_FILE, 'utf-8');
      await writeFile(backupFile, data);
      console.log(`Tasks backed up to: ${backupFile}`);
    }
  } catch (error) {
    console.error('Error backing up tasks:', error);
  }
}
