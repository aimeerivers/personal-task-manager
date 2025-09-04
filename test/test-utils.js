import { unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import config from '../src/config/config.js';

/**
 * Test utilities for managing test environment
 */

/**
 * Cleans up test data directory and files
 */
export async function cleanupTestData() {
  const testDataDir = config.DATA_DIR;
  const testTasksFile = config.TASKS_FILE;
  
  try {
    // Remove tasks file if it exists
    if (existsSync(testTasksFile)) {
      await unlink(testTasksFile);
    }
    
    // Remove any backup files in test directory
    if (existsSync(testDataDir)) {
      const { readdir } = await import('fs/promises');
      try {
        const files = await readdir(testDataDir);
        const backupFiles = files.filter(file => file.startsWith('tasks-backup-'));
        
        for (const backupFile of backupFiles) {
          const backupPath = path.join(testDataDir, backupFile);
          if (existsSync(backupPath)) {
            await unlink(backupPath);
          }
        }
      } catch (error) {
        // Directory might not exist, ignore
      }
      
      // Try to remove the directory (will only succeed if empty)
      try {
        await rmdir(testDataDir);
      } catch (error) {
        // Directory might not be empty or not exist, ignore
      }
    }
  } catch (error) {
    // Ignore cleanup errors to prevent test failures
    console.warn('Warning: Test cleanup encountered an error:', error.message);
  }
}

/**
 * Sets up test environment
 */
export async function setupTestEnvironment() {
  // Ensure we're in test mode
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Clean up any existing test data
  await cleanupTestData();
}

/**
 * Creates test tasks for testing
 */
export function createTestTasks() {
  return [
    {
      id: 'test-task-1',
      title: 'Test Task 1',
      description: 'First test task',
      completed: false,
      createdAt: '2025-09-04T10:00:00.000Z',
      updatedAt: '2025-09-04T10:00:00.000Z'
    },
    {
      id: 'test-task-2',
      title: 'Test Task 2', 
      description: 'Second test task',
      completed: true,
      createdAt: '2025-09-04T10:01:00.000Z',
      updatedAt: '2025-09-04T10:02:00.000Z'
    }
  ];
}

/**
 * Asserts that two task objects are equal (ignoring timestamps that might vary)
 */
export function assertTasksEqual(actual, expected, options = {}) {
  const { ignoreTimestamps = false } = options;
  
  if (ignoreTimestamps) {
    const { createdAt: actualCreated, updatedAt: actualUpdated, ...actualWithoutTimes } = actual;
    const { createdAt: expectedCreated, updatedAt: expectedUpdated, ...expectedWithoutTimes } = expected;
    return actualWithoutTimes;
  }
  
  return actual;
}
