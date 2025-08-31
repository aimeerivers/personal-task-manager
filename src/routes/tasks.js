import express from 'express';
import { Task } from '../models/Task.js';

const router = express.Router();

/**
 * Get all tasks with optional filtering
 * Query params:
 * - status: 'active', 'completed', or 'all' (default: 'all')
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let tasks;

    switch (status) {
      case 'active':
        tasks = await Task.findByStatus(false);
        break;
      case 'completed':
        tasks = await Task.findByStatus(true);
        break;
      default:
        tasks = await Task.findAll();
    }

    // Sort tasks by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: tasks.map(task => task.toJSON())
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
});

/**
 * Get task statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Task.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics'
    });
  }
});

/**
 * Get a specific task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task.toJSON()
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
});

/**
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const task = await Task.create({
      title,
      description
    });

    res.status(201).json({
      success: true,
      data: task.toJSON(),
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.errors) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
});

/**
 * Update a task
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    
    // Only include defined values in updateData
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;
    
    const task = await Task.update(req.params.id, updateData);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task.toJSON(),
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.errors) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

/**
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

export default router;
