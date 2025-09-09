# Personal Task Manager 📝

A powerful and beautiful personal task manager built with Node.js and vanilla JavaScript. Transform your productivity with advanced task organization, priority management, and smart filtering!

## Features ✨

### 🎯 **Task Management**
- ✅ Create, edit, and delete tasks with rich details
- 🔄 Mark tasks as complete/incomplete with smooth animations
- � Add detailed descriptions to provide context
- 💾 Automatic data persistence using JSON files

### 🚨 **Priority System**
- 🔴 **High Priority** - Urgent tasks that need immediate attention
- 🟡 **Medium Priority** - Important tasks for regular workflow
- 🟢 **Low Priority** - Tasks you can do when time permits
- 🎨 Color-coded visual indicators and smart priority-based sorting

### 🏷️ **Dynamic Categories**
- 📂 Create custom categories (Work, Personal, Shopping, Health, etc.)
- 🏷️ Auto-suggestions from existing categories
- 🔍 Filter tasks by category for focused work sessions
- ✨ Automatic category management and organization

### 📅 **Due Date Management**
- ⏰ Set due dates and times with native datetime picker
- 🚨 **Overdue alerts** - Tasks past due get special red highlighting
- � **Due today indicators** - Tasks due today get amber highlighting
- 🔔 Visual deadline tracking to stay on top of commitments

### ⏱️ **Time Tracking System**
- ▶️ **Start/Stop Timers** - One-click timer control for any task
- 📊 **Session Recording** - Track multiple work sessions per task
- ⏰ **Total Time Display** - See exact time spent on each task
- 🔴 **Live Active Timer** - Header displays current task being timed
- 📈 **Productivity Analytics** - Global time tracking statistics
- 🎯 **Focus Mode** - Only one timer active at a time for better focus

### 🔍 **Advanced Filtering & Organization**
- 📊 Multi-dimensional filtering (Status + Priority + Category)
- 🔍 Filter by: All Tasks, Active, Completed, Overdue, Due Today
- 🎯 Priority-based filtering (High, Medium, Low)
- 📂 Category-based filtering with dynamic filter generation
- 🗂️ Smart sorting by priority and creation date

### 🎨 **Beautiful Interface**
- 🌟 Modern, clean design with smooth animations
- 📱 Fully responsive - works perfectly on desktop, tablet, and mobile
- 🎭 Visual priority indicators with left-border color coding
- 🏷️ Elegant category tags and priority badges
- ⚡ Intuitive keyboard shortcuts and touch-friendly controls

### 🚀 **Technical Excellence**
- � RESTful API backend with Express.js
- 🧪 Comprehensive test coverage (84+ tests, 100% pass rate)
- 🔄 Real-time updates and smooth user experience
- 📊 Task statistics and productivity analytics
- ⏱️ Professional time tracking with session management
- 🛡️ Robust error handling and validation

## Getting Started 🚀

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Clone this repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at: http://localhost:3000

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints 🔌

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Task Object Structure

```json
{
  "id": "unique-uuid",
  "title": "Task title",
  "description": "Optional task description",
  "completed": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Project Structure 📁

```
personal-task-manager/
├── src/
│   ├── server.js          # Express server setup
│   ├── routes/
│   │   └── tasks.js       # Task API routes
│   ├── models/
│   │   └── Task.js        # Task model and data operations
│   └── utils/
│       └── storage.js     # JSON file storage utilities
├── public/
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── styles.css     # Application styles
│   └── js/
│       └── app.js         # Frontend JavaScript
├── test/
│   ├── tasks.test.js      # API tests
│   └── storage.test.js    # Storage tests
├── data/
│   └── tasks.json         # Task data storage
└── README.md
```

## Technology Stack 🛠️

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Data Storage**: JSON files
- **Testing**: Node.js built-in test runner
- **Package Management**: npm

## Contributing 🤝

This project is designed to be educational and easy to understand. Feel free to explore the code and make improvements!

## License 📄

This project is licensed under the MIT License - see the package.json file for details.
