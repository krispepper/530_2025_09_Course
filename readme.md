# Sprint Launch Guide

This repo hosts the task board plus the new course feedback workflow. Follow the steps below to run and verify everything delivered in this sprint.

---

## Prerequisites
1. Install Node.js 18+.
2. Configure MongoDB:
   - Set `MONGO_URI` (and `MONGO_URI_DEV` for tests) in `.env`.
   - The app automatically seeds starter tasks and feedback data on first run.

---

## Start the App
```bash
npm install
npm start
```
You should see `Server up on http://localhost:3000` and `MongoDB connected (...)`.

### Verify Task Board
1. Visit `http://localhost:3000/`.
2. The badge shows total tasks (seeded items appear immediately).
3. Add a task via the form, change its status, edit its title, and delete it. Each action should show a confirmation toast and refresh the list.

### Verify Course Feedback Admin Portal
1. From the main board header, click **Feedback admin** (or browse directly to `http://localhost:3000/admin/feedback`).
2. Confirm that:
   - The course filter drop-down populates with any course present in feedback data.
   - Summary cards list each course with average rating, distribution counts, and latest comments.
   - The table shows recent submissions ordered newest-first. Switching the filter narrows the list.
3. Click **Refresh** to reload the summary + table on demand.

### Submit Feedback via API
Use any HTTP client (curl/Postman) against `http://localhost:3000/api`:
1. `POST /api/feedback` with JSON body:
   ```json
   {
     "courseId": "CS303",
     "studentId": "s-123",
     "rating": 5,
     "comments": "Excellent course"
   }
   ```
2. `GET /api/feedback?courseId=CS303` should now include the new submission.
3. `GET /api/feedback/summary` shows the updated averages and distribution for `CS303`.

---

## Run Unit Tests
All service + API tests are executed with Jest.
```bash
npm test
```
Expected: both `tasks.dev.test.js` and `courseFeedback.service.test.js` pass.

---

## API Reference
See `API.md` for full request/response details covering task routes and feedback endpoints (including the summary output). Use that document while testing or wiring clients.
