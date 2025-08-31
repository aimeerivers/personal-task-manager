# Personal Task Manager 📝

A beautiful and functional personal task manager built with Node.js and vanilla JavaScript.

## Features ✨

- ✅ Create, edit, and delete tasks
- 🎯 Mark tasks as complete/incomplete
- 🔍 Filter tasks by status (all, active, completed)
- 💾 Data persistence using JSON files
- 🎨 Beautiful, responsive web interface
- 🚀 RESTful API backend
- 🧪 Comprehensive test coverage

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
