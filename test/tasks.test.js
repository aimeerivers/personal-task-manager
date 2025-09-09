import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import { cleanupTestData, setupTestEnvironment, createTestTasks } from './test-utils.js';

// Ensure we're running in test mode
process.env.NODE_ENV = 'test';

let server;

// Set up server for testing
before(async () => {
  server = app.listen(0); // Use port 0 to get any available port
});

// Clean up server after testing
after(async () => {
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

// Clean up test data before and after each test
beforeEach(async () => {
  await setupTestEnvironment();
});

afterEach(async () => {
  await cleanupTestData();
});

describe('Task API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(server)
        .get('/api/health')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.message);
      assert.ok(response.body.timestamp);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return empty array when no tasks exist', async () => {
      const response = await request(server)
        .get('/api/tasks')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.deepStrictEqual(response.body.data, []);
    });

    it('should return all tasks', async () => {
      // Create a task first
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description'
        })
        .expect(201);

      // Get all tasks
      const response = await request(server)
        .get('/api/tasks')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Test Task');
      assert.strictEqual(response.body.data[0].description, 'Test Description');
      assert.strictEqual(response.body.data[0].completed, false);
    });

    it('should filter tasks by status - active', async () => {
      // Create completed and active tasks
      await request(server)
        .post('/api/tasks')
        .send({ title: 'Active Task' })
        .expect(201);

      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Completed Task' })
        .expect(201);

      // Mark second task as completed
      await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ completed: true })
        .expect(200);

      // Get active tasks only
      const response = await request(server)
        .get('/api/tasks?status=active')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Active Task');
      assert.strictEqual(response.body.data[0].completed, false);
    });

    it('should filter tasks by status - completed', async () => {
      // Create completed and active tasks
      await request(server)
        .post('/api/tasks')
        .send({ title: 'Active Task' })
        .expect(201);

      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Completed Task' })
        .expect(201);

      // Mark second task as completed
      await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ completed: true })
        .expect(200);

      // Get completed tasks only
      const response = await request(server)
        .get('/api/tasks?status=completed')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Completed Task');
      assert.strictEqual(response.body.data[0].completed, true);
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should return statistics for empty task list', async () => {
      const response = await request(server)
        .get('/api/tasks/stats')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.deepStrictEqual(response.body.data, {
        total: 0,
        completed: 0,
        active: 0,
        completionRate: 0
      });
    });

    it('should return correct statistics', async () => {
      // Create tasks
      const task1 = await request(server)
        .post('/api/tasks')
        .send({ title: 'Task 1' })
        .expect(201);

      const task2 = await request(server)
        .post('/api/tasks')
        .send({ title: 'Task 2' })
        .expect(201);

      const task3 = await request(server)
        .post('/api/tasks')
        .send({ title: 'Task 3' })
        .expect(201);

      // Mark one as completed
      await request(server)
        .put(`/api/tasks/${task2.body.data.id}`)
        .send({ completed: true })
        .expect(200);

      // Get stats
      const response = await request(server)
        .get('/api/tasks/stats')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.total, 3);
      assert.strictEqual(response.body.data.completed, 1);
      assert.strictEqual(response.body.data.active, 2);
      assert.strictEqual(Math.round(response.body.data.completionRate), 33);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .get('/api/tasks/non-existent-id')
        .expect(404);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Task not found');
    });

    it('should return specific task', async () => {
      // Create a task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Specific Task',
          description: 'Specific Description'
        })
        .expect(201);

      // Get the specific task
      const response = await request(server)
        .get(`/api/tasks/${createResponse.body.data.id}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'Specific Task');
      assert.strictEqual(response.body.data.description, 'Specific Description');
      assert.strictEqual(response.body.data.id, createResponse.body.data.id);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with title only', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({ title: 'New Task' })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'New Task');
      assert.strictEqual(response.body.data.description, '');
      assert.strictEqual(response.body.data.completed, false);
      assert.ok(response.body.data.id);
      assert.ok(response.body.data.createdAt);
      assert.ok(response.body.data.updatedAt);
      assert.strictEqual(response.body.message, 'Task created successfully');
    });

    it('should create a new task with title and description', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'New Task',
          description: 'Task description'
        })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'New Task');
      assert.strictEqual(response.body.data.description, 'Task description');
      assert.strictEqual(response.body.data.completed, false);
    });

    it('should return 400 for empty title', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({ title: '' })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
      assert.ok(Array.isArray(response.body.details));
    });

    it('should return 400 for missing title', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({ description: 'No title' })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should return 400 for title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const response = await request(server)
        .post('/api/tasks')
        .send({ title: longTitle })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should return 400 for description too long', async () => {
      const longDescription = 'a'.repeat(1001);
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Valid title',
          description: longDescription
        })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should trim whitespace from title and description', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: '  Trimmed Title  ',
          description: '  Trimmed Description  '
        })
        .expect(201);

      assert.strictEqual(response.body.data.title, 'Trimmed Title');
      assert.strictEqual(response.body.data.description, 'Trimmed Description');
    });

    // New feature tests for priority, category, and due date
    it('should create a task with priority', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'High Priority Task',
          priority: 'high'
        })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'High Priority Task');
      assert.strictEqual(response.body.data.priority, 'high');
    });

    it('should create a task with category', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Work Task',
          category: 'Work'
        })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'Work Task');
      assert.strictEqual(response.body.data.category, 'Work');
    });

    it('should create a task with due date', async () => {
      const dueDate = '2025-09-10T14:00:00.000Z';
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Scheduled Task',
          dueDate: dueDate
        })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'Scheduled Task');
      assert.strictEqual(response.body.data.dueDate, dueDate);
    });

    it('should create a task with all new fields', async () => {
      const dueDate = '2025-09-10T14:00:00.000Z';
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Complete Task',
          description: 'Task with all fields',
          priority: 'high',
          category: 'Work',
          dueDate: dueDate
        })
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'Complete Task');
      assert.strictEqual(response.body.data.description, 'Task with all fields');
      assert.strictEqual(response.body.data.priority, 'high');
      assert.strictEqual(response.body.data.category, 'Work');
      assert.strictEqual(response.body.data.dueDate, dueDate);
    });

    it('should default to medium priority if not specified', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Default Priority Task'
        })
        .expect(201);

      assert.strictEqual(response.body.data.priority, 'medium');
    });

    it('should default to general category if not specified', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Default Category Task'
        })
        .expect(201);

      assert.strictEqual(response.body.data.category, 'general');
    });

    it('should validate priority values', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Invalid Priority Task',
          priority: 'invalid'
        })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should validate due date format', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Invalid Date Task',
          dueDate: 'invalid-date'
        })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should validate category length', async () => {
      const longCategory = 'a'.repeat(51);
      const response = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Long Category Task',
          category: longCategory
        })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });
  });

  // New filtering tests
  describe('GET /api/tasks - Advanced Filtering', () => {
    beforeEach(async () => {
      // Create test tasks with different priorities, categories, and due dates
      await request(server)
        .post('/api/tasks')
        .send({
          title: 'High Priority Work Task',
          priority: 'high',
          category: 'Work',
          dueDate: '2025-09-10T14:00:00.000Z'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Medium Priority Personal Task',
          priority: 'medium',
          category: 'Personal',
          dueDate: '2025-09-12T10:00:00.000Z'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Low Priority General Task',
          priority: 'low',
          category: 'general'
        });
    });

    it('should filter tasks by priority', async () => {
      const response = await request(server)
        .get('/api/tasks?priority=high')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'High Priority Work Task');
      assert.strictEqual(response.body.data[0].priority, 'high');
    });

    it('should filter tasks by category', async () => {
      const response = await request(server)
        .get('/api/tasks?category=Work')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'High Priority Work Task');
      assert.strictEqual(response.body.data[0].category, 'Work');
    });

    it('should filter tasks by multiple criteria', async () => {
      const response = await request(server)
        .get('/api/tasks?priority=medium&category=Personal')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Medium Priority Personal Task');
      assert.strictEqual(response.body.data[0].priority, 'medium');
      assert.strictEqual(response.body.data[0].category, 'Personal');
    });

    it('should sort tasks by priority then creation date', async () => {
      const response = await request(server)
        .get('/api/tasks')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 3);
      
      // Should be sorted: high priority first, then medium, then low
      assert.strictEqual(response.body.data[0].priority, 'high');
      assert.strictEqual(response.body.data[1].priority, 'medium');
      assert.strictEqual(response.body.data[2].priority, 'low');
    });
  });

  // Search functionality tests
  describe('GET /api/tasks - Search Functionality', () => {
    beforeEach(async () => {
      // Create diverse test tasks for search testing
      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Buy groceries',
          description: 'Need to buy milk, eggs, and bread',
          category: 'Shopping'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Finish project report',
          description: 'Complete the quarterly report for management',
          category: 'Work'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Call mom',
          description: 'Weekly check-in call with family',
          category: 'Personal'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Exercise routine',
          description: 'Go for a run in the park',
          category: 'Health'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Book vacation',
          description: 'Research and book summer vacation',
          category: 'Travel'
        });
    });

    it('should search tasks by title', async () => {
      const response = await request(server)
        .get('/api/tasks?search=groceries')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Buy groceries');
    });

    it('should search tasks by description', async () => {
      const response = await request(server)
        .get('/api/tasks?search=quarterly')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Finish project report');
    });

    it('should search tasks by category', async () => {
      const response = await request(server)
        .get('/api/tasks?search=work')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].category, 'Work');
    });

    it('should be case insensitive', async () => {
      const response = await request(server)
        .get('/api/tasks?search=VACATION')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Book vacation');
    });

    it('should handle partial matches', async () => {
      const response = await request(server)
        .get('/api/tasks?search=call')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Call mom');
    });

    it('should return multiple results when multiple tasks match', async () => {
      const response = await request(server)
        .get('/api/tasks?search=the')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.data.length >= 2); // Should match "the quarterly report" and "the park"
    });

    it('should return empty array for no matches', async () => {
      const response = await request(server)
        .get('/api/tasks?search=nonexistent')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 0);
    });

    it('should handle empty search query', async () => {
      const response = await request(server)
        .get('/api/tasks?search=')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 5); // Should return all tasks
    });

    it('should handle whitespace-only search query', async () => {
      const response = await request(server)
        .get('/api/tasks?search=   ')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 5); // Should return all tasks
    });

    it('should combine search with other filters', async () => {
      // First create a task that matches both search and category filter
      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Work meeting',
          description: 'Weekly team meeting',
          category: 'Work'
        });

      const response = await request(server)
        .get('/api/tasks?search=meeting&category=Work')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].title, 'Work meeting');
      assert.strictEqual(response.body.data[0].category, 'Work');
    });

    it('should maintain task sorting with search results', async () => {
      // Create tasks with different priorities that match search
      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Important meeting',
          priority: 'high',
          category: 'Work'
        });

      await request(server)
        .post('/api/tasks')
        .send({
          title: 'Casual meeting',
          priority: 'low',
          category: 'Work'
        });

      const response = await request(server)
        .get('/api/tasks?search=meeting')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 2); // 2 meeting tasks we just created
      
      // Should be sorted by priority (high first, then low)
      const priorities = response.body.data.map(task => task.priority);
      assert.strictEqual(priorities[0], 'high');
      assert.strictEqual(priorities[1], 'low');
    });
  });

  // Categories endpoint tests
  describe('GET /api/tasks/categories', () => {
    it('should return empty array when no tasks exist', async () => {
      const response = await request(server)
        .get('/api/tasks/categories')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.deepStrictEqual(response.body.data, []);
    });

    it('should return unique categories', async () => {
      // Create tasks with different categories
      await request(server)
        .post('/api/tasks')
        .send({ title: 'Work Task 1', category: 'Work' });

      await request(server)
        .post('/api/tasks')
        .send({ title: 'Work Task 2', category: 'Work' });

      await request(server)
        .post('/api/tasks')
        .send({ title: 'Personal Task', category: 'Personal' });

      await request(server)
        .post('/api/tasks')
        .send({ title: 'General Task', category: 'general' });

      const response = await request(server)
        .get('/api/tasks/categories')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.length, 3);
      assert.ok(response.body.data.includes('Work'));
      assert.ok(response.body.data.includes('Personal'));
      assert.ok(response.body.data.includes('general'));
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      // Create a task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Original Title',
          description: 'Original Description'
        })
        .expect(201);

      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the task
      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          completed: true
        })
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.title, 'Updated Title');
      assert.strictEqual(response.body.data.description, 'Updated Description');
      assert.strictEqual(response.body.data.completed, true);
      assert.strictEqual(response.body.message, 'Task updated successfully');
      
      // updatedAt should be different from createdAt
      assert.notStrictEqual(response.body.data.updatedAt, response.body.data.createdAt);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .put('/api/tasks/non-existent-id')
        .send({ title: 'Updated Title' })
        .expect(404);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Task not found');
    });

    it('should validate updated data', async () => {
      // Create a task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Original Title' })
        .expect(201);

      // Try to update with invalid data
      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ title: '' })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should update only specified fields', async () => {
      // Create a task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Original Title',
          description: 'Original Description'
        })
        .expect(201);

      // Update only completion status
      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ completed: true })
        .expect(200);

      assert.strictEqual(response.body.data.title, 'Original Title');
      assert.strictEqual(response.body.data.description, 'Original Description');
      assert.strictEqual(response.body.data.completed, true);
    });

    // New field update tests
    it('should update task priority', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Priority Update Task',
          priority: 'low'
        })
        .expect(201);

      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ priority: 'high' })
        .expect(200);

      assert.strictEqual(response.body.data.priority, 'high');
      assert.strictEqual(response.body.data.title, 'Priority Update Task'); // Other fields unchanged
    });

    it('should update task category', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Category Update Task',
          category: 'Personal'
        })
        .expect(201);

      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ category: 'Work' })
        .expect(200);

      assert.strictEqual(response.body.data.category, 'Work');
      assert.strictEqual(response.body.data.title, 'Category Update Task');
    });

    it('should update task due date', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Due Date Update Task'
        })
        .expect(201);

      const newDueDate = '2025-09-15T16:00:00.000Z';
      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ dueDate: newDueDate })
        .expect(200);

      assert.strictEqual(response.body.data.dueDate, newDueDate);
      assert.strictEqual(response.body.data.title, 'Due Date Update Task');
    });

    it('should update multiple new fields at once', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Multi Update Task',
          priority: 'low',
          category: 'Personal'
        })
        .expect(201);

      const newDueDate = '2025-09-20T10:00:00.000Z';
      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({
          priority: 'high',
          category: 'Work',
          dueDate: newDueDate,
          title: 'Updated Multi Task'
        })
        .expect(200);

      assert.strictEqual(response.body.data.title, 'Updated Multi Task');
      assert.strictEqual(response.body.data.priority, 'high');
      assert.strictEqual(response.body.data.category, 'Work');
      assert.strictEqual(response.body.data.dueDate, newDueDate);
    });

    it('should validate priority on update', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Valid Task' })
        .expect(201);

      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ priority: 'invalid' })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should validate due date on update', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Valid Task' })
        .expect(201);

      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ dueDate: 'invalid-date' })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Validation failed');
    });

    it('should remove due date when set to null', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Task with Due Date',
          dueDate: '2025-09-15T16:00:00.000Z'
        })
        .expect(201);

      const response = await request(server)
        .put(`/api/tasks/${createResponse.body.data.id}`)
        .send({ dueDate: null })
        .expect(200);

      assert.strictEqual(response.body.data.dueDate, null);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      // Create a task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({ title: 'Task to Delete' })
        .expect(201);

      // Delete the task
      const response = await request(server)
        .delete(`/api/tasks/${createResponse.body.data.id}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.message, 'Task deleted successfully');

      // Verify task is gone
      await request(server)
        .get(`/api/tasks/${createResponse.body.data.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .delete('/api/tasks/non-existent-id')
        .expect(404);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'Task not found');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete task lifecycle', async () => {
      // Create task
      const createResponse = await request(server)
        .post('/api/tasks')
        .send({
          title: 'Lifecycle Task',
          description: 'Testing complete lifecycle'
        })
        .expect(201);

      const taskId = createResponse.body.data.id;

      // Get task
      const getResponse = await request(server)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      assert.strictEqual(getResponse.body.data.title, 'Lifecycle Task');

      // Update task
      const updateResponse = await request(server)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Lifecycle Task',
          completed: true
        })
        .expect(200);

      assert.strictEqual(updateResponse.body.data.title, 'Updated Lifecycle Task');
      assert.strictEqual(updateResponse.body.data.completed, true);

      // Delete task
      await request(server)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      // Verify deletion
      await request(server)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });

    it('should handle multiple tasks correctly', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 1; i <= 5; i++) {
        const response = await request(server)
          .post('/api/tasks')
          .send({ title: `Task ${i}` })
          .expect(201);
        tasks.push(response.body.data);
      }

      // Mark some as completed
      await request(server)
        .put(`/api/tasks/${tasks[1].id}`)
        .send({ completed: true })
        .expect(200);

      await request(server)
        .put(`/api/tasks/${tasks[3].id}`)
        .send({ completed: true })
        .expect(200);

      // Check statistics
      const statsResponse = await request(server)
        .get('/api/tasks/stats')
        .expect(200);

      assert.strictEqual(statsResponse.body.data.total, 5);
      assert.strictEqual(statsResponse.body.data.completed, 2);
      assert.strictEqual(statsResponse.body.data.active, 3);

      // Check filtering
      const activeResponse = await request(server)
        .get('/api/tasks?status=active')
        .expect(200);

      assert.strictEqual(activeResponse.body.data.length, 3);

      const completedResponse = await request(server)
        .get('/api/tasks?status=completed')
        .expect(200);

      assert.strictEqual(completedResponse.body.data.length, 2);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-API routes that do not exist', async () => {
      const response = await request(server)
        .get('/api/nonexistent')
        .expect(404);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.error, 'API endpoint not found');
    });
  });

  describe('Time Tracking Features', () => {
    describe('POST /api/tasks/:id/timer/start', () => {
      it('should start time tracking for a task', async () => {
        // Create a test task
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Test Task for Time Tracking' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Start time tracking
        const startResponse = await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        assert.strictEqual(startResponse.body.success, true);
        assert.strictEqual(startResponse.body.message, 'Time tracking started');
        assert.strictEqual(startResponse.body.task.timeTracking.isActive, true);
        assert.ok(startResponse.body.task.timeTracking.activeSessionStart);
      });

      it('should return 404 for non-existent task', async () => {
        const response = await request(server)
          .post('/api/tasks/nonexistent/timer/start')
          .expect(404);

        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'Task not found');
      });

      it('should fail if timer is already active', async () => {
        // Create a test task
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Test Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Start timer first time
        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        // Try to start again
        const response = await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(400);

        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'Time tracking is already active for this task');
      });

      it('should stop other active timers when starting new one', async () => {
        // Create two test tasks
        const task1Response = await request(server)
          .post('/api/tasks')
          .send({ title: 'Task 1' })
          .expect(201);

        const task2Response = await request(server)
          .post('/api/tasks')
          .send({ title: 'Task 2' })
          .expect(201);

        const task1Id = task1Response.body.data.id;
        const task2Id = task2Response.body.data.id;

        // Start timer on task 1
        await request(server)
          .post(`/api/tasks/${task1Id}/timer/start`)
          .expect(200);

        // Start timer on task 2 (should stop task 1)
        await request(server)
          .post(`/api/tasks/${task2Id}/timer/start`)
          .expect(200);

        // Check that task 1 is no longer active
        const task1Check = await request(server)
          .get(`/api/tasks/${task1Id}`)
          .expect(200);

        assert.strictEqual(task1Check.body.data.timeTracking.isActive, false);
        assert.strictEqual(task1Check.body.data.timeTracking.sessions.length, 1);
      });
    });

    describe('POST /api/tasks/:id/timer/stop', () => {
      it('should stop time tracking for a task', async () => {
        // Create and start timer
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Test Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        // Small delay to ensure measurable time
        await new Promise(resolve => setTimeout(resolve, 10));

        // Stop timer
        const stopResponse = await request(server)
          .post(`/api/tasks/${taskId}/timer/stop`)
          .expect(200);

        assert.strictEqual(stopResponse.body.success, true);
        assert.strictEqual(stopResponse.body.message, 'Time tracking stopped');
        assert.strictEqual(stopResponse.body.task.timeTracking.isActive, false);
        assert.strictEqual(stopResponse.body.task.timeTracking.activeSessionStart, null);
        assert.strictEqual(stopResponse.body.task.timeTracking.sessions.length, 1);
        assert.ok(stopResponse.body.task.timeTracking.totalTime > 0);
      });

      it('should return 404 for non-existent task', async () => {
        const response = await request(server)
          .post('/api/tasks/nonexistent/timer/stop')
          .expect(404);

        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'Task not found');
      });

      it('should fail if no active timer', async () => {
        // Create a test task
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Test Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Try to stop timer without starting it
        const response = await request(server)
          .post(`/api/tasks/${taskId}/timer/stop`)
          .expect(400);

        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'No active time tracking session for this task');
      });
    });

    describe('GET /api/tasks/timer/active', () => {
      it('should return null when no active timer', async () => {
        const response = await request(server)
          .get('/api/tasks/timer/active')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.activeTimer, null);
      });

      it('should return active timer information', async () => {
        // Create and start timer
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Active Timer Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        // Get active timer
        const response = await request(server)
          .get('/api/tasks/timer/active')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.activeTimer.taskId, taskId);
        assert.strictEqual(response.body.activeTimer.title, 'Active Timer Task');
        assert.ok(response.body.activeTimer.startTime);
        assert.ok(response.body.activeTimer.currentDuration >= 0);
        assert.ok(response.body.activeTimer.formattedDuration);
      });
    });

    describe('POST /api/tasks/timer/stop-all', () => {
      it('should stop all active timers', async () => {
        // Create multiple tasks with active timers
        const task1Response = await request(server)
          .post('/api/tasks')
          .send({ title: 'Task 1' })
          .expect(201);

        const task2Response = await request(server)
          .post('/api/tasks')
          .send({ title: 'Task 2' })
          .expect(201);

        const task1Id = task1Response.body.data.id;
        const task2Id = task2Response.body.data.id;

        // Start both timers (second will stop first, but both will have sessions)
        await request(server)
          .post(`/api/tasks/${task1Id}/timer/start`)
          .expect(200);

        await request(server)
          .post(`/api/tasks/${task2Id}/timer/start`)
          .expect(200);

        // Stop all active timers
        const response = await request(server)
          .post('/api/tasks/timer/stop-all')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.ok(response.body.message.includes('Stopped'));
        assert.ok(Array.isArray(response.body.stoppedTasks));
      });

      it('should handle case with no active timers', async () => {
        const response = await request(server)
          .post('/api/tasks/timer/stop-all')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.message, 'Stopped 0 active timer(s)');
        assert.strictEqual(response.body.stoppedTasks.length, 0);
      });
    });

    describe('GET /api/tasks/timer/stats', () => {
      it('should return time tracking statistics', async () => {
        const response = await request(server)
          .get('/api/tasks/timer/stats')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.ok('stats' in response.body);
        assert.ok('totalTimeTracked' in response.body.stats);
        assert.ok('formattedTotalTime' in response.body.stats);
        assert.ok('tasksWithTimeCount' in response.body.stats);
        assert.ok('totalSessions' in response.body.stats);
      });

      it('should return correct stats with time tracked', async () => {
        // Create a task and track some time
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Timed Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Start and stop timer
        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        // Small delay to get measurable time
        await new Promise(resolve => setTimeout(resolve, 10));

        await request(server)
          .post(`/api/tasks/${taskId}/timer/stop`)
          .expect(200);

        // Get stats
        const response = await request(server)
          .get('/api/tasks/timer/stats')
          .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.ok(response.body.stats.totalTimeTracked > 0);
        assert.strictEqual(response.body.stats.tasksWithTimeCount, 1);
        assert.strictEqual(response.body.stats.totalSessions, 1);
        assert.ok(response.body.stats.averageSessionDuration > 0);
      });
    });

    describe('Time Tracking Integration', () => {
      it('should preserve time tracking data when updating task', async () => {
        // Create task and track time
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Original Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Track some time
        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        await new Promise(resolve => setTimeout(resolve, 10));

        await request(server)
          .post(`/api/tasks/${taskId}/timer/stop`)
          .expect(200);

        // Update task
        const updateResponse = await request(server)
          .put(`/api/tasks/${taskId}`)
          .send({ title: 'Updated Task' })
          .expect(200);

        // Time tracking data should be preserved
        assert.ok(updateResponse.body.data.timeTracking.totalTime > 0);
        assert.strictEqual(updateResponse.body.data.timeTracking.sessions.length, 1);
      });

      it('should include time tracking in task list', async () => {
        // Create task with time tracking
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Tracked Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        await request(server)
          .post(`/api/tasks/${taskId}/timer/start`)
          .expect(200);

        // Small delay to ensure measurable time
        await new Promise(resolve => setTimeout(resolve, 10));

        await request(server)
          .post(`/api/tasks/${taskId}/timer/stop`)
          .expect(200);

        // Get all tasks
        const response = await request(server)
          .get('/api/tasks')
          .expect(200);

        const task = response.body.data.find(t => t.id === taskId);
        assert.ok(task);
        assert.ok('timeTracking' in task);
        assert.ok(task.timeTracking.totalTime > 0);
      });
    });

    describe('Time Formatting', () => {
      it('should handle various time durations', async () => {
        // Create task and check formatting through API
        const createResponse = await request(server)
          .post('/api/tasks')
          .send({ title: 'Format Test Task' })
          .expect(201);

        const taskId = createResponse.body.data.id;

        // Get task to verify default formatting
        const response = await request(server)
          .get(`/api/tasks/${taskId}`)
          .expect(200);

        assert.ok('timeTracking' in response.body.data);
        assert.strictEqual(response.body.data.timeTracking.totalTime, 0);
        assert.ok(Array.isArray(response.body.data.timeTracking.sessions));
      });
    });
  });
});
