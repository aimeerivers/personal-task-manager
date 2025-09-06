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
    this.priority = data.priority || 'medium'; // 'high', 'medium', 'low'
    this.category = data.category || 'general'; // User-defined categories
    this.dueDate = data.dueDate || null; // ISO string or null
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validates task data
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validate() {
    const errors = [];
    const validPriorities = ['high', 'medium', 'low'];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (this.priority && !validPriorities.includes(this.priority)) {
      errors.push('Priority must be high, medium, or low');
    }

    if (this.category && this.category.length > 50) {
      errors.push('Category must be less than 50 characters');
    }

    if (this.dueDate) {
      const dueDate = new Date(this.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push('Due date must be a valid date');
      }
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
      priority: this.priority || 'medium',
      category: this.category || 'general',
      dueDate: this.dueDate,
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
   * Gets tasks filtered by priority
   * @param {string} priority - Priority level (high, medium, low)
   * @returns {Promise<Array>} Filtered tasks
   */
  static async findByPriority(priority) {
    const tasks = await Task.findAll();
    return tasks.filter(task => task.priority === priority);
  }

  /**
   * Gets tasks filtered by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Filtered tasks
   */
  static async findByCategory(category) {
    const tasks = await Task.findAll();
    return tasks.filter(task => task.category === category);
  }

  /**
   * Gets all unique categories from existing tasks
   * @returns {Promise<Array>} Array of unique categories
   */
  static async getCategories() {
    const tasks = await Task.findAll();
    const categories = [...new Set(tasks.map(task => task.category))];
    return categories.filter(cat => cat && cat.trim().length > 0);
  }

  /**
   * Gets overdue tasks
   * @returns {Promise<Array>} Overdue tasks
   */
  static async getOverdue() {
    const tasks = await Task.findAll();
    const now = new Date();
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < now
    );
  }

  /**
   * Gets tasks due today
   * @returns {Promise<Array>} Tasks due today
   */
  static async getDueToday() {
    const tasks = await Task.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) >= today && 
      new Date(task.dueDate) < tomorrow
    );
  }

  /**
   * Checks if task is overdue
   * @returns {boolean} True if task is overdue
   */
  isOverdue() {
    if (!this.dueDate || this.completed) return false;
    return new Date(this.dueDate) < new Date();
  }

  /**
   * Checks if task is due today
   * @returns {boolean} True if task is due today
   */
  isDueToday() {
    if (!this.dueDate || this.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(this.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  }

  /**
   * Gets priority weight for sorting (higher number = higher priority)
   * @returns {number} Priority weight
   */
  getPriorityWeight() {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[this.priority] || 2;
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
