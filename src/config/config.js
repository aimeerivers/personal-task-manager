import path from 'path';

/**
 * Configuration settings for the application
 */
const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server settings
  PORT: process.env.PORT || 3000,
  
  // Data storage paths
  DATA_DIR: process.env.NODE_ENV === 'test' 
    ? path.join(process.cwd(), 'test-data')
    : path.join(process.cwd(), 'data'),
  
  // Get tasks file path
  get TASKS_FILE() {
    return path.join(this.DATA_DIR, 'tasks.json');
  },
  
  // Backup settings
  BACKUP_ENABLED: process.env.NODE_ENV !== 'test',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default config;
