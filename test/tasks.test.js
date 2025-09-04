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
});
