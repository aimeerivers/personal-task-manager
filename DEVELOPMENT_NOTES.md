# Development Notes for Personal Task Manager

## Session Guidelines
- Tests should exit cleanly (no need for Ctrl-C)
- Always ensure software works before finishing
- Focus on practical improvements and functionality
- Maintain clean, readable code

## Known Issues
- [x] Tests don't exit properly (fixed in current session)

## Architecture Notes
- Express.js backend with REST API
- Frontend serves static files
- Uses UUID for task IDs
- CORS enabled for development

## Future Ideas
- Add task priorities
- Implement due dates
- Add task categories/tags
- Persist data to file or database
- Add search functionality
- Dark mode toggle

## Session History
### Day 2 (Sep 3, 2025)
- ✅ **FIXED: Tests exit issue** - Added proper before/after hooks to manage server lifecycle
- ✅ **Improved server.js** - Only starts server when run directly, not when imported for testing
- ✅ **Updated all test requests** - Changed from `request(app)` to `request(server)` for proper testing
- ✅ **Created this development notes file** for future session continuity
- 📝 **Note**: Tests now exit cleanly, no more Ctrl-C needed!
- 🏃‍♂️ **Status**: Software works perfectly - ready to commit and deploy!
