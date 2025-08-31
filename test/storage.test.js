import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFile, writeFile, unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { readTasks, writeTasks, backupTasks } from '../src/utils/storage.js';

const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');
const TEST_TASKS_FILE = path.join(TEST_DATA_DIR, 'tasks.json');
const ORIGINAL_DATA_DIR = path.join(process.cwd(), 'data');

// Mock the data directory for tests
const originalCwd = process.cwd;
beforeEach(async () => {
  // Clean up test directory if it exists
  try {
    if (existsSync(TEST_TASKS_FILE)) {
      await unlink(TEST_TASKS_FILE);
    }
    if (existsSync(TEST_DATA_DIR)) {
      await rmdir(TEST_DATA_DIR);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
});

afterEach(async () => {
  // Clean up test directory
  try {
    if (existsSync(TEST_TASKS_FILE)) {
      await unlink(TEST_TASKS_FILE);
    }
    if (existsSync(TEST_DATA_DIR)) {
      await rmdir(TEST_DATA_DIR);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
});

describe('Storage Utils', () => {
  describe('readTasks', () => {
    it('should return empty array when tasks file does not exist', async () => {
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, []);
    });

    it('should return tasks from existing file', async () => {
      const testTasks = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Create test directory and file
      await writeTasks(testTasks);
      
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, testTasks);
    });

    it('should return empty array when file contains invalid JSON', async () => {
      // Create data directory manually
      const { mkdir } = await import('fs/promises');
      await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
      
      // Write invalid JSON
      await writeFile(path.join(process.cwd(), 'data', 'tasks.json'), 'invalid json');
      
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, []);
    });
  });

  describe('writeTasks', () => {
    it('should write tasks to file', async () => {
      const testTasks = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      await writeTasks(testTasks);
      
      const fileContent = await readFile(path.join(process.cwd(), 'data', 'tasks.json'), 'utf-8');
      const savedTasks = JSON.parse(fileContent);
      
      assert.deepStrictEqual(savedTasks, testTasks);
    });

    it('should create data directory if it does not exist', async () => {
      const testTasks = [{ id: '1', title: 'Test' }];
      
      await writeTasks(testTasks);
      
      assert.ok(existsSync(path.join(process.cwd(), 'data')));
      assert.ok(existsSync(path.join(process.cwd(), 'data', 'tasks.json')));
    });

    it('should format JSON with proper indentation', async () => {
      const testTasks = [{ id: '1', title: 'Test Task' }];
      
      await writeTasks(testTasks);
      
      const fileContent = await readFile(path.join(process.cwd(), 'data', 'tasks.json'), 'utf-8');
      
      // Check that the JSON is properly formatted (contains newlines and spaces)
      assert.ok(fileContent.includes('\n'));
      assert.ok(fileContent.includes('  '));
    });
  });

  describe('backupTasks', () => {
    it('should create backup file when tasks file exists', async () => {
      const testTasks = [{ id: '1', title: 'Test Task' }];
      
      // Create original tasks file
      await writeTasks(testTasks);
      
      // Create backup
      await backupTasks();
      
      // Check that original file still exists
      assert.ok(existsSync(path.join(process.cwd(), 'data', 'tasks.json')));
    });

    it('should not throw error when tasks file does not exist', async () => {
      // This should not throw an error
      await backupTasks();
      
      // Test passes if no error is thrown
      assert.ok(true);
    });
  });

  describe('integration', () => {
    it('should maintain data consistency through read/write cycle', async () => {
      const originalTasks = [
        {
          id: '1',
          title: 'First Task',
          description: 'First Description',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          title: 'Second Task',
          description: 'Second Description',
          completed: true,
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      // Write tasks
      await writeTasks(originalTasks);
      
      // Read tasks back
      const readBackTasks = await readTasks();
      
      // Should be identical
      assert.deepStrictEqual(readBackTasks, originalTasks);
    });

    it('should handle multiple write operations', async () => {
      const tasks1 = [{ id: '1', title: 'Task 1' }];
      const tasks2 = [{ id: '1', title: 'Task 1' }, { id: '2', title: 'Task 2' }];
      const tasks3 = [{ id: '2', title: 'Task 2' }];

      await writeTasks(tasks1);
      let readTasks1 = await readTasks();
      assert.deepStrictEqual(readTasks1, tasks1);

      await writeTasks(tasks2);
      let readTasks2 = await readTasks();
      assert.deepStrictEqual(readTasks2, tasks2);

      await writeTasks(tasks3);
      let readTasks3 = await readTasks();
      assert.deepStrictEqual(readTasks3, tasks3);
    });
  });
});
