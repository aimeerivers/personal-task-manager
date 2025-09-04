import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { readTasks, writeTasks, backupTasks } from '../src/utils/storage.js';
import { cleanupTestData, setupTestEnvironment, createTestTasks } from './test-utils.js';
import config from '../src/config/config.js';

// Ensure we're running in test mode
process.env.NODE_ENV = 'test';

beforeEach(async () => {
  await setupTestEnvironment();
});

afterEach(async () => {
  await cleanupTestData();
});

describe('Storage Utils', () => {
  describe('readTasks', () => {
    it('should return empty array when tasks file does not exist', async () => {
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, []);
    });

    it('should return tasks from existing file', async () => {
      const testTasks = createTestTasks();
      
      // Create test directory and file
      await writeTasks(testTasks);
      
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, testTasks);
    });

    it('should return empty array when file contains invalid JSON', async () => {
      // Create data directory manually
      const { mkdir } = await import('fs/promises');
      await mkdir(config.DATA_DIR, { recursive: true });
      
      // Write invalid JSON
      await writeFile(config.TASKS_FILE, 'invalid json');
      
      const tasks = await readTasks();
      assert.deepStrictEqual(tasks, []);
    });
  });

  describe('writeTasks', () => {
    it('should write tasks to file', async () => {
      const testTasks = createTestTasks();

      await writeTasks(testTasks);
      
      const fileContent = await readFile(config.TASKS_FILE, 'utf-8');
      const savedTasks = JSON.parse(fileContent);
      
      assert.deepStrictEqual(savedTasks, testTasks);
    });

    it('should create data directory if it does not exist', async () => {
      const testTasks = createTestTasks();
      
      await writeTasks(testTasks);
      
      assert.ok(existsSync(config.DATA_DIR));
      assert.ok(existsSync(config.TASKS_FILE));
    });

    it('should format JSON with proper indentation', async () => {
      const testTasks = [{ id: '1', title: 'Test Task' }];
      
      await writeTasks(testTasks);
      
      const fileContent = await readFile(config.TASKS_FILE, 'utf-8');
      
      // Check that the JSON is properly formatted (contains newlines and spaces)
      assert.ok(fileContent.includes('\n'));
      assert.ok(fileContent.includes('  '));
    });
  });

  describe('backupTasks', () => {
    it('should not create backup file in test environment', async () => {
      const testTasks = createTestTasks();
      
      // Create original tasks file
      await writeTasks(testTasks);
      
      // Try to create backup (should be skipped in test environment)
      await backupTasks();
      
      // Check that original file still exists
      assert.ok(existsSync(config.TASKS_FILE));
      
      // Check that no backup files were created in test directory
      const { readdir } = await import('fs/promises');
      try {
        const files = await readdir(config.DATA_DIR);
        const backupFiles = files.filter(file => file.startsWith('tasks-backup-'));
        assert.strictEqual(backupFiles.length, 0, 'No backup files should be created in test mode');
      } catch (error) {
        // Directory might not exist, which is fine
      }
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
      const originalTasks = createTestTasks();

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
