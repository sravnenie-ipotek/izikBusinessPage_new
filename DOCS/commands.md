Run the Application

  # Start the server (serves both main site and admin)
  npm run dev
  # or
  node server.js

  Access URLs:
  - Main site: http://localhost:7001
  - Admin panel: http://localhost:7001/admin

  Kill Running Processes

  # Kill all Node.js server processes
  pkill -f "node server.js"

  # Or kill by port if needed
  lsof -ti:7001 | xargs kill -9

  Background Management

  # Run in background
  node server.js &

  # Check running background processes
  jobs

  # Kill specific background job
  kill %1  # (replace 1 with job number from 'jobs' command)

  Current Status: The server is already running in the background. You can:
  1. Visit http://localhost:7001/admin to access the vanilla JS admin panel
  2. Use pkill -f "node server.js" to stop all running instances
  3. Use npm run dev or node server.js to start fresh