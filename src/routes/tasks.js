import express from 'express';
import { Task } from '../models/Task.js';

const router = express.Router();

/**
 * Get all tasks with optional filtering
 * Query params:
 * - status: 'active', 'completed', or 'all' (default: 'all')
 * - priority: 'high', 'medium', 'low', or 'all' (default: 'all')
 * - category: category name or 'all' (default: 'all')
 * - search: search query for title, description, or category
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'all', priority = 'all', category = 'all', search } = req.query;
    let tasks;

    // Start with all tasks or filter by completion status
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

    // Apply search filter first if provided
    if (search && search.trim()) {
      const searchQuery = search.toLowerCase().trim();
      tasks = tasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = task.description && task.description.toLowerCase().includes(searchQuery);
        const categoryMatch = task.category && task.category.toLowerCase().includes(searchQuery);
        
        return titleMatch || descriptionMatch || categoryMatch;
      });
    }

    // Apply priority filter
    if (priority !== 'all') {
      tasks = tasks.filter(task => task.priority === priority);
    }

    // Apply category filter
    if (category !== 'all') {
      tasks = tasks.filter(task => task.category === category);
    }

    // Sort tasks by priority first, then creation date
    tasks.sort((a, b) => {
      // Priority sorting (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // If same priority, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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
 * Get all unique categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Task.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
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
    const { title, description, priority, category, dueDate } = req.body;
    
    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      dueDate
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
    const { title, description, completed, priority, category, dueDate } = req.body;
    
    // Only include defined values in updateData
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    
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

// ============================================================================
// TIME TRACKING ROUTES
// ============================================================================

/**
 * Start time tracking for a task
 * POST /api/tasks/:id/timer/start
 */
router.post('/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await task.startTimeTracking();

    res.json({
      success: true,
      message: 'Time tracking started',
      task: task.toJSON()
    });
  } catch (error) {
    console.error('Error starting time tracking:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start time tracking'
    });
  }
});

/**
 * Stop time tracking for a task
 * POST /api/tasks/:id/timer/stop
 */
router.post('/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await task.stopTimeTracking();

    res.json({
      success: true,
      message: 'Time tracking stopped',
      task: task.toJSON()
    });
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to stop time tracking'
    });
  }
});

/**
 * Get current active timer
 * GET /api/tasks/timer/active
 */
router.get('/timer/active', async (req, res) => {
  try {
    const activeTask = await Task.getActiveTimerTask();
    
    if (!activeTask) {
      return res.json({
        success: true,
        activeTimer: null
      });
    }

    res.json({
      success: true,
      activeTimer: {
        taskId: activeTask.id,
        title: activeTask.title,
        startTime: activeTask.timeTracking.activeSessionStart,
        currentDuration: activeTask.getCurrentSessionTime(),
        formattedDuration: activeTask.getFormattedCurrentTime()
      }
    });
  } catch (error) {
    console.error('Error getting active timer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active timer'
    });
  }
});

/**
 * Stop all active timers
 * POST /api/tasks/timer/stop-all
 */
router.post('/timer/stop-all', async (req, res) => {
  try {
    const stoppedTasks = await Task.stopAllActiveTimers();
    
    res.json({
      success: true,
      message: `Stopped ${stoppedTasks.length} active timer(s)`,
      stoppedTasks: stoppedTasks.map(task => ({
        id: task.id,
        title: task.title
      }))
    });
  } catch (error) {
    console.error('Error stopping all timers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop all timers'
    });
  }
});

/**
 * Get time tracking statistics
 * GET /api/tasks/timer/stats
 */
router.get('/timer/stats', async (req, res) => {
  try {
    const stats = await Task.getTimeTrackingStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting time tracking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get time tracking statistics'
    });
  }
});

export default router;
