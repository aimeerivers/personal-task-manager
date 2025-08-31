import { v4 as uuidv4 } from 'uuid';
import { readTasks, writeTasks } from '../utils/storage.js';

/**
 * Task model class for managing task operations
 */
export class Task {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.description = data.description || '';
    this.completed = Boolean(data.completed);
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validates task data
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Updates the task's updatedAt timestamp
   */
  touch() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Returns a plain object representation of the task
   */
  toJSON() {
    return {
      id: this.id,
      title: (this.title || '').trim(),
      description: (this.description || '').trim(),
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Gets all tasks
   * @returns {Promise<Array>} Array of tasks
   */
  static async findAll() {
    const tasksData = await readTasks();
    return tasksData.map(taskData => new Task(taskData));
  }

  /**
   * Finds a task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Task|null>} Task instance or null if not found
   */
  static async findById(id) {
    const tasks = await Task.findAll();
    return tasks.find(task => task.id === id) || null;
  }

  /**
   * Creates a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task instance
   */
  static async create(taskData) {
    const task = new Task(taskData);
    const validation = task.validate();
    
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.errors = validation.errors;
      throw error;
    }

    const tasks = await Task.findAll();
    tasks.push(task);
    await writeTasks(tasks.map(t => t.toJSON()));
    
    return task;
  }

  /**
   * Updates an existing task
   * @param {string} id - Task ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Task|null>} Updated task instance or null if not found
   */
  static async update(id, updateData) {
    const tasks = await Task.findAll();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return null;
    }

    // Update the task with new data, only updating provided fields
    const task = tasks[taskIndex];
    if (updateData.title !== undefined) {
      task.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      task.description = updateData.description;
    }
    if (updateData.completed !== undefined) {
      task.completed = updateData.completed;
    }
    task.touch();

    const validation = task.validate();
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.errors = validation.errors;
      throw error;
    }

    await writeTasks(tasks.map(t => t.toJSON()));
    return task;
  }

  /**
   * Deletes a task by ID
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const tasks = await Task.findAll();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return false;
    }

    tasks.splice(taskIndex, 1);
    await writeTasks(tasks.map(t => t.toJSON()));
    return true;
  }

  /**
   * Gets tasks filtered by completion status
   * @param {boolean} completed - Filter by completion status
   * @returns {Promise<Array>} Filtered tasks
   */
  static async findByStatus(completed) {
    const tasks = await Task.findAll();
    return tasks.filter(task => task.completed === completed);
  }

  /**
   * Gets statistics about tasks
   * @returns {Promise<Object>} Task statistics
   */
  static async getStatistics() {
    const tasks = await Task.findAll();
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;

    return {
      total: tasks.length,
      completed,
      active,
      completionRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0
    };
  }
}
