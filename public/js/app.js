/**
 * Personal Task Manager Frontend Application
 */

class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.currentPriorityFilter = 'all';
    this.currentCategoryFilter = 'all';
    this.editingTaskId = null;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.bindEvents();
    this.loadTasks();
    this.loadStats();
    this.loadCategories();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleFilterChange(e));
    });

    // Edit modal
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editTaskForm = document.getElementById('editTaskForm');

    closeModal.addEventListener('click', () => this.closeEditModal());
    cancelEdit.addEventListener('click', () => this.closeEditModal());
    editModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeEditModal());
    editTaskForm.addEventListener('submit', (e) => this.handleEditTask(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    // Escape key closes modal
    if (e.key === 'Escape') {
      this.closeEditModal();
    }
    
    // Ctrl/Cmd + Enter submits forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const activeForm = document.activeElement.closest('form');
      if (activeForm) {
        activeForm.dispatchEvent(new Event('submit'));
      }
    }
  }

  /**
   * Load tasks from the API
   */
  async loadTasks() {
    try {
      this.showLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (this.currentFilter && this.currentFilter !== 'all') {
        params.append('status', this.currentFilter);
      }
      if (this.currentPriorityFilter && this.currentPriorityFilter !== 'all') {
        params.append('priority', this.currentPriorityFilter);
      }
      if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all') {
        params.append('category', this.currentCategoryFilter);
      }
      
      const queryString = params.toString();
      const url = `/api/tasks${queryString ? '?' + queryString : ''}`;
      
      const response = await this.apiRequest('GET', url);
      
      if (response.success) {
        this.tasks = this.applyClientSideFilters(response.data);
        this.renderTasks();
      } else {
        this.showToast('Failed to load tasks', 'error');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.showToast('Failed to load tasks', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Apply client-side filters for special status filters
   */
  applyClientSideFilters(tasks) {
    if (this.currentFilter === 'overdue') {
      const now = new Date();
      return tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      );
    }
    
    if (this.currentFilter === 'due-today') {
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
    
    return tasks;
  }

  /**
   * Load statistics from the API
   */
  async loadStats() {
    try {
      const response = await this.apiRequest('GET', '/api/tasks/stats');
      
      if (response.success) {
        this.updateStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Update statistics display
   */
  updateStats(stats) {
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('activeTasks').textContent = stats.active;
    document.getElementById('completedTasks').textContent = stats.completed;
  }

  /**
   * Load and populate category filters and inputs
   */
  async loadCategories() {
    try {
      const response = await this.apiRequest('GET', '/api/tasks/categories');
      
      if (response.success) {
        this.updateCategoryFilters(response.data);
        this.updateCategoryInputs(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  /**
   * Update category filter buttons
   */
  updateCategoryFilters(categories) {
    const categoryFilters = document.getElementById('categoryFilters');
    const allButton = categoryFilters.querySelector('[data-filter="all"]');
    
    // Remove existing category buttons
    categoryFilters.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach(btn => {
      btn.remove();
    });
    
    // Add category buttons
    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.dataset.filter = category;
      button.dataset.type = 'category';
      button.textContent = `🏷️ ${category}`;
      button.addEventListener('click', (e) => this.handleFilterChange(e));
      categoryFilters.appendChild(button);
    });
  }

  /**
   * Update category input datalists
   */
  updateCategoryInputs(categories) {
    const categoryList = document.getElementById('categoryList');
    const editCategoryList = document.getElementById('editCategoryList');
    
    [categoryList, editCategoryList].forEach(list => {
      list.innerHTML = '';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        list.appendChild(option);
      });
    });
  }

  /**
   * Handle add task form submission
   */
  async handleAddTask(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const priorityInput = document.getElementById('taskPriority');
    const categoryInput = document.getElementById('taskCategory');
    const dueDateInput = document.getElementById('taskDueDate');
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const priority = priorityInput.value;
    const category = categoryInput.value.trim() || 'general';
    const dueDate = dueDateInput.value || null;
    
    if (!title) {
      this.showToast('Please enter a task title', 'error');
      titleInput.focus();
      return;
    }

    try {
      const taskData = {
        title,
        description,
        priority,
        category,
        dueDate
      };

      const response = await this.apiRequest('POST', '/api/tasks', taskData);
      
      if (response.success) {
        this.showToast('Task created successfully! 🎉', 'success');
        
        // Reset form
        titleInput.value = '';
        descriptionInput.value = '';
        priorityInput.value = 'medium';
        categoryInput.value = '';
        dueDateInput.value = '';
        titleInput.focus();
        
        // Reload tasks and stats
        await this.loadTasks();
        await this.loadStats();
        await this.loadCategories();
      } else {
        this.showToast(response.message || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.showToast('Failed to create task', 'error');
    }
  }

  /**
   * Handle filter change
   */
  handleFilterChange(e) {
    const filterType = e.target.dataset.type;
    const filterValue = e.target.dataset.filter;
    
    // Remove active class from siblings in the same filter group
    const siblings = e.target.parentElement.querySelectorAll('.filter-btn');
    siblings.forEach(btn => btn.classList.remove('active'));
    
    e.target.classList.add('active');
    
    // Update the appropriate filter
    if (filterType === 'status') {
      this.currentFilter = filterValue;
    } else if (filterType === 'priority') {
      this.currentPriorityFilter = filterValue;
    } else if (filterType === 'category') {
      this.currentCategoryFilter = filterValue;
    }
    
    this.loadTasks();
  }

  /**
   * Toggle task completion
   */
  async toggleTaskCompletion(taskId, completed) {
    try {
      const response = await this.apiRequest('PUT', `/api/tasks/${taskId}`, {
        completed: !completed
      });
      
      if (response.success) {
        this.showToast(
          !completed ? 'Task completed! ✅' : 'Task marked as active',
          'success'
        );
        
        // Reload tasks and stats
        await Promise.all([this.loadTasks(), this.loadStats()]);
      } else {
        this.showToast(response.error || 'Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      this.showToast('Failed to update task', 'error');
    }
  }

  /**
   * Open edit modal
   */
  openEditModal(task) {
    this.editingTaskId = task.id;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority || 'medium';
    document.getElementById('editTaskCategory').value = task.category || '';
    document.getElementById('editTaskDueDate').value = task.dueDate ? 
      new Date(task.dueDate).toISOString().slice(0, 16) : '';
    document.getElementById('editTaskCompleted').checked = task.completed;
    
    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus on title input
    setTimeout(() => {
      document.getElementById('editTaskTitle').focus();
    }, 100);
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    this.editingTaskId = null;
  }

  /**
   * Handle edit task form submission
   */
  async handleEditTask(e) {
    e.preventDefault();
    
    if (!this.editingTaskId) return;
    
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const category = document.getElementById('editTaskCategory').value.trim() || 'general';
    const dueDate = document.getElementById('editTaskDueDate').value || null;
    const completed = document.getElementById('editTaskCompleted').checked;
    
    if (!title) {
      this.showToast('Please enter a task title', 'error');
      return;
    }

    try {
      const taskData = {
        title,
        description,
        priority,
        category,
        dueDate,
        completed
      };

      const response = await this.apiRequest('PUT', `/api/tasks/${this.editingTaskId}`, taskData);
      
      if (response.success) {
        this.showToast('Task updated successfully! ✨', 'success');
        this.closeEditModal();
        
        // Reload tasks and stats
        await Promise.all([this.loadTasks(), this.loadStats(), this.loadCategories()]);
      } else {
        this.showToast(response.error || 'Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      this.showToast('Failed to update task', 'error');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId, taskTitle) {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      return;
    }

    try {
      const response = await this.apiRequest('DELETE', `/api/tasks/${taskId}`);
      
      if (response.success) {
        this.showToast('Task deleted successfully', 'success');
        
        // Reload tasks and stats
        await Promise.all([this.loadTasks(), this.loadStats()]);
      } else {
        this.showToast(response.error || 'Failed to delete task', 'error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      this.showToast('Failed to delete task', 'error');
    }
  }

  /**
   * Render tasks in the UI
   */
  renderTasks() {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (this.tasks.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = this.tasks.map(task => this.renderTask(task)).join('');
    
    // Bind events for task items
    this.bindTaskEvents();
  }

  /**
   * Render a single task
   */
  renderTask(task) {
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    const updatedDate = new Date(task.updatedAt).toLocaleDateString();
    const isUpdated = task.createdAt !== task.updatedAt;
    
    // Priority class and icon
    const priorityClass = `priority-${task.priority || 'medium'}`;
    const priorityIcon = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }[task.priority || 'medium'];
    
    // Due date formatting and status
    let dueDateHtml = '';
    let dueDateClass = '';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (!task.completed && dueDate < now) {
        dueDateClass = 'overdue';
      } else if (!task.completed && dueDate >= today && dueDate < tomorrow) {
        dueDateClass = 'due-today';
      }
      
      const dueDateStr = dueDate.toLocaleDateString();
      const dueTimeStr = dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      dueDateHtml = `<div class="due-date ${dueDateClass}">📅 Due: ${dueDateStr} ${dueTimeStr}</div>`;
    }
    
    // Task item classes
    const taskClasses = [
      'task-item',
      task.completed ? 'completed' : '',
      priorityClass,
      dueDateClass
    ].filter(Boolean).join(' ');
    
    return `
      <div class="${taskClasses}" data-task-id="${task.id}">
        <div class="task-header">
          <div class="task-checkbox">
            <input 
              type="checkbox" 
              class="checkbox task-toggle" 
              ${task.completed ? 'checked' : ''}
              data-task-id="${task.id}"
            >
          </div>
          <div class="task-content">
            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
            ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
              <div class="task-info">
                <div class="task-badges">
                  <span class="priority-badge ${task.priority || 'medium'}">
                    ${priorityIcon} ${(task.priority || 'medium').toUpperCase()}
                  </span>
                  ${task.category && task.category !== 'general' ? 
                    `<span class="category-tag">🏷️ ${this.escapeHtml(task.category)}</span>` : ''}
                </div>
                ${dueDateHtml}
                <div class="task-date">
                  Created: ${createdDate}
                  ${isUpdated ? ` • Updated: ${updatedDate}` : ''}
                </div>
              </div>
              <div class="task-actions">
                <button class="task-action-btn edit-btn" data-task-id="${task.id}">
                  ✏️ Edit
                </button>
                <button class="task-action-btn delete-btn" data-task-id="${task.id}">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind events for task items
   */
  bindTaskEvents() {
    // Toggle completion
    const toggleButtons = document.querySelectorAll('.task-toggle');
    toggleButtons.forEach(btn => {
      btn.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          this.toggleTaskCompletion(taskId, task.completed);
        }
      });
    });

    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          this.openEditModal(task);
        }
      });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          this.deleteTask(taskId, task.title);
        }
      });
    });
  }

  /**
   * Show/hide loading state
   */
  showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tasksContainer = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
      loadingState.style.display = 'block';
      tasksContainer.style.display = 'none';
      emptyState.style.display = 'none';
    } else {
      loadingState.style.display = 'none';
      tasksContainer.style.display = 'block';
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || icons.success}</span>
        <span class="toast-message">${this.escapeHtml(message)}</span>
      </div>
      <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            container.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }

  /**
   * Make API request
   */
  async apiRequest(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.taskManager = new TaskManager();
});

// Add some helpful keyboard shortcuts info
console.log(`
🎯 Personal Task Manager - Keyboard Shortcuts:
• Escape: Close modal
• Ctrl/Cmd + Enter: Submit form
• Tab: Navigate between elements

Enjoy managing your tasks! ✨
`);
